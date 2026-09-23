using System.IO.Pipes;
using System.Management;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.Json;

namespace Skarmro.GuardService;

public sealed class PolicyIpcServer : BackgroundService
{
    public const string PipeName = "SKARMRO.Policy.v1";

    private static readonly string ProgramDataRoot =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Skarmro");

    private static readonly string PolicyPath =
        Path.Combine(ProgramDataRoot, "process-guard-policy.json");

    private static readonly string PublicRoot =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "SkarmroPublic");

    private static readonly string ProjectionPath =
        Path.Combine(PublicRoot, "launcher-policy.json");

    private static readonly string ReceiptPath =
        Path.Combine(ProgramDataRoot, "native-policy-receipts.jsonl");

    private readonly ILogger<PolicyIpcServer> _logger;

    public PolicyIpcServer(ILogger<PolicyIpcServer> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await using var pipe = CreatePipe();

            try
            {
                await pipe.WaitForConnectionAsync(stoppingToken);
                await HandleClientAsync(pipe, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SKARMRO policy IPC server failed.");
            }
        }
    }

    private static NamedPipeServerStream CreatePipe()
    {
        var security = new PipeSecurity();

        security.AddAccessRule(new PipeAccessRule(
            new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null),
            PipeAccessRights.FullControl,
            AccessControlType.Allow));

        security.AddAccessRule(new PipeAccessRule(
            new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null),
            PipeAccessRights.FullControl,
            AccessControlType.Allow));

        // Parent App runs unelevated. Allow authenticated local clients to connect,
        // then verify that the caller account is actually a local administrator.
        security.AddAccessRule(new PipeAccessRule(
            new SecurityIdentifier(WellKnownSidType.AuthenticatedUserSid, null),
            PipeAccessRights.ReadWrite,
            AccessControlType.Allow));

        return NamedPipeServerStreamAcl.Create(
            PipeName,
            PipeDirection.InOut,
            1,
            PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous,
            0,
            0,
            security);
    }

    private async Task HandleClientAsync(NamedPipeServerStream pipe, CancellationToken cancellationToken)
    {
        string? callerSid = null;

        try
        {
            pipe.RunAsClient(() =>
            {
                using var identity = WindowsIdentity.GetCurrent();
                callerSid = identity.User?.Value;
            });
        }
        catch (Exception ex)
        {
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, "CallerIdentityError: " + ex.GetType().Name), cancellationToken);
            return;
        }

        if (string.IsNullOrWhiteSpace(callerSid) || !IsLocalAdministrator(callerSid))
        {
            WriteReceipt("policy-write-denied", $"Denied policy write from SID {callerSid ?? "unknown"}.");
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, "AdministratorRequired"), cancellationToken);
            return;
        }

        using var reader = new StreamReader(pipe, Encoding.UTF8, false, 4096, leaveOpen: true);
        var requestLine = await reader.ReadLineAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(requestLine))
        {
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, "EmptyRequest"), cancellationToken);
            return;
        }

        PolicyIpcRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<PolicyIpcRequest>(
                requestLine,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException)
        {
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, "InvalidJson"), cancellationToken);
            return;
        }

        if (request?.Action != "save-policy" || request.Policy is null)
        {
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, "UnsupportedRequest"), cancellationToken);
            return;
        }

        NormalizePolicy(request.Policy);
        var validation = ProcessGuardPolicyValidator.Validate(request.Policy);

        if (!validation.IsValid)
        {
            WriteReceipt("policy-write-rejected", $"Rejected invalid policy from {callerSid}: {validation.Reason}.");
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, validation.Reason), cancellationToken);
            return;
        }

        try
        {
            Directory.CreateDirectory(ProgramDataRoot);
            request.Policy.UpdatedAtUtc = DateTimeOffset.UtcNow.ToString("O");

            var json = JsonSerializer.Serialize(request.Policy, new JsonSerializerOptions { WriteIndented = true });
            var temp = PolicyPath + ".tmp";
            await File.WriteAllTextAsync(temp, json, cancellationToken);
            File.Move(temp, PolicyPath, true);

            WriteLauncherProjection(request.Policy);

            WriteReceipt(
                "policy-updated",
                $"Policy updated by administrator SID {callerSid}; blocked={request.Policy.BlockedProcessNames.Length}; allowed={request.Policy.AllowedProcessNames.Length}.");

            await WriteResponseAsync(pipe, new PolicyIpcResponse(true, "Saved"), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save policy through IPC.");
            await WriteResponseAsync(pipe, new PolicyIpcResponse(false, "WriteFailed: " + ex.GetType().Name), cancellationToken);
        }
    }

    private static void NormalizePolicy(ProcessGuardPolicy policy)
    {
        policy.Enabled = true;
        policy.BlockedProcessNames = policy.BlockedProcessNames
            .Select(NormalizeProcessName)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        policy.AllowedProcessNames = policy.AllowedProcessNames
            .Select(NormalizeProcessName)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Where(name => !policy.BlockedProcessNames.Contains(name, StringComparer.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        policy.BlockedSha256 ??= Array.Empty<string>();
    }

    private static string NormalizeProcessName(string? value)
    {
        var name = Path.GetFileName((value ?? "").Trim());
        if (string.IsNullOrWhiteSpace(name))
            return "";

        return name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) ? name : name + ".exe";
    }

    private static bool IsLocalAdministrator(string sid)
    {
        try
        {
            var escapedSid = sid.Replace("'", "''", StringComparison.Ordinal);
            using var userSearcher = new ManagementObjectSearcher(
                $"SELECT Domain, Name FROM Win32_UserAccount WHERE SID = '{escapedSid}' AND LocalAccount = TRUE");

            foreach (ManagementObject user in userSearcher.Get())
            {
                using (user)
                {
                    var domain = user["Domain"]?.ToString()?.Replace("'", "''", StringComparison.Ordinal);
                    var name = user["Name"]?.ToString()?.Replace("'", "''", StringComparison.Ordinal);
                    if (string.IsNullOrWhiteSpace(domain) || string.IsNullOrWhiteSpace(name))
                        continue;

                    using var groupSearcher = new ManagementObjectSearcher(
                        $"ASSOCIATORS OF {{Win32_UserAccount.Domain='{domain}',Name='{name}'}} " +
                        "WHERE AssocClass=Win32_GroupUser ResultClass=Win32_Group");

                    foreach (ManagementObject group in groupSearcher.Get())
                    {
                        using (group)
                        {
                            if (string.Equals(group["SID"]?.ToString(), "S-1-5-32-544", StringComparison.OrdinalIgnoreCase))
                                return true;
                        }
                    }
                }
            }
        }
        catch
        {
            // Treat any lookup failure as not authorized.
        }

        return false;
    }

    private static void WriteLauncherProjection(ProcessGuardPolicy policy)
    {
        Directory.CreateDirectory(PublicRoot);

        var apps = policy.AllowedProcessNames
            .Select(name => name.ToLowerInvariant() switch
            {
                "calc.exe" => new LauncherAppProjection(name, "Miniräknare", "＋", null),
                "mspaint.exe" => new LauncherAppProjection(name, "Rita", "✎", null),
                "chrome.exe" => new LauncherAppProjection(name, "Internet", "◎", "SKÄRMRO Browser Guard"),
                _ => new LauncherAppProjection(name, Path.GetFileNameWithoutExtension(name), "▣", null)
            })
            .OrderBy(app => app.DisplayName, StringComparer.CurrentCultureIgnoreCase)
            .ToArray();

        var projection = new
        {
            version = 1,
            updatedAtUtc = DateTimeOffset.UtcNow.ToString("O"),
            apps
        };

        var json = JsonSerializer.Serialize(projection, new JsonSerializerOptions { WriteIndented = true });
        var temp = ProjectionPath + ".tmp";
        File.WriteAllText(temp, json);
        File.Move(temp, ProjectionPath, true);
    }

    private static async Task WriteResponseAsync(
        NamedPipeServerStream pipe,
        PolicyIpcResponse response,
        CancellationToken cancellationToken)
    {
        using var writer = new StreamWriter(pipe, Encoding.UTF8, 4096, leaveOpen: true)
        {
            AutoFlush = true
        };

        await writer.WriteLineAsync(JsonSerializer.Serialize(response).AsMemory(), cancellationToken);
    }

    private static void WriteReceipt(string kind, string detail)
    {
        try
        {
            Directory.CreateDirectory(ProgramDataRoot);
            var line = JsonSerializer.Serialize(new
            {
                timestampUtc = DateTimeOffset.UtcNow,
                kind,
                detail
            });
            File.AppendAllText(ReceiptPath, line + Environment.NewLine);
        }
        catch
        {
            // Receipt logging must never break policy enforcement.
        }
    }

    private sealed record LauncherAppProjection(
        string ProcessName,
        string DisplayName,
        string Icon,
        string? Subtitle);
}

public sealed class PolicyIpcRequest
{
    public string Action { get; set; } = "";
    public ProcessGuardPolicy? Policy { get; set; }
}

public sealed record PolicyIpcResponse(bool Success, string Message);
