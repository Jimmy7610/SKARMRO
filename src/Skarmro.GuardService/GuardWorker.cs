using System.Diagnostics;
using System.Management;
using System.Security.Cryptography;
using System.Text.Json;

namespace Skarmro.GuardService;

public sealed class GuardWorker : BackgroundService
{
    private readonly ILogger<GuardWorker> _logger;
    private ManagementEventWatcher? _processWatcher;

    private static readonly string ProgramDataRoot =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Skarmro");

    private static readonly string StatusPath =
        Path.Combine(ProgramDataRoot, "guard-status.json");

    private static readonly string ProcessGuardPolicyPath =
        Path.Combine(ProgramDataRoot, "process-guard-policy.json");

    private static readonly string ProcessGuardEventsPath =
        Path.Combine(ProgramDataRoot, "process-guard-events.jsonl");

    private static readonly string NativeReceiptsPath =
        Path.Combine(ProgramDataRoot, "native-policy-receipts.jsonl");

    public GuardWorker(ILogger<GuardWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Directory.CreateDirectory(ProgramDataRoot);

        _logger.LogInformation("SKARMRO Guard started at {Time}", DateTimeOffset.Now);

        StartProcessWatcher();

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var policy = LoadProcessGuardPolicy(out var policyReason);
                var validation = ProcessGuardPolicyValidator.Validate(policy);

                var status = new
                {
                    service = "SkarmroGuardService",
                    state = "running",
                    machine = Environment.MachineName,
                    identity = System.Security.Principal.WindowsIdentity.GetCurrent().Name,
                    pid = Environment.ProcessId,
                    timestampUtc = DateTimeOffset.UtcNow,
                    version = "gate0-native-health-v1",
                    processGuard = new
                    {
                        watcherActive = _processWatcher is not null,
                        policyPath = ProcessGuardPolicyPath,
                        policyPresent = File.Exists(ProcessGuardPolicyPath),
                        policyValid = validation.IsValid,
                        policyReason = validation.IsValid ? validation.Reason : policyReason ?? validation.Reason,
                        policyVersion = policy?.PolicyVersion,
                        policyUpdatedAtUtc = policy?.UpdatedAtUtc,
                        enforcementEnabled = validation.IsValid && policy?.Enabled == true,
                        blockedProcessCount = policy?.BlockedProcessNames?.Length ?? 0,
                        blockedHashCount = policy?.BlockedSha256?.Length ?? 0
                    }
                };

                var temp = StatusPath + ".tmp";
                var json = JsonSerializer.Serialize(status, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await File.WriteAllTextAsync(temp, json, stoppingToken);
                File.Move(temp, StatusPath, true);

                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
        finally
        {
            StopProcessWatcher();
        }
    }

    private void StartProcessWatcher()
    {
        try
        {
            var query = new WqlEventQuery("SELECT * FROM Win32_ProcessStartTrace");
            _processWatcher = new ManagementEventWatcher(query);
            _processWatcher.EventArrived += OnProcessStarted;
            _processWatcher.Start();

            _logger.LogInformation("SKARMRO Process Guard watcher started.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start SKARMRO Process Guard watcher.");
            _processWatcher?.Dispose();
            _processWatcher = null;
        }
    }

    private void StopProcessWatcher()
    {
        if (_processWatcher is null)
        {
            return;
        }

        try
        {
            _processWatcher.Stop();
        }
        catch
        {
            // Ignore shutdown races.
        }

        _processWatcher.EventArrived -= OnProcessStarted;
        _processWatcher.Dispose();
        _processWatcher = null;
    }

    private void OnProcessStarted(object sender, EventArrivedEventArgs e)
    {
        try
        {
            var processIdValue = e.NewEvent.Properties["ProcessID"]?.Value;
            var processName = e.NewEvent.Properties["ProcessName"]?.Value?.ToString();

            if (processIdValue is null || string.IsNullOrWhiteSpace(processName))
            {
                return;
            }

            var processId = Convert.ToInt32(processIdValue);
            var policy = LoadProcessGuardPolicy(out _);

            var ownerSid = TryGetProcessOwnerSid(processId);
            var executablePath = TryGetExecutablePath(processId);
            var sha256 = TryGetSha256(executablePath);

            var decision = ProcessGuardEvaluator.Evaluate(policy, ownerSid, processName, sha256);

            if (!decision.ShouldTerminate)
            {
                return;
            }

            var startedAt = DateTimeOffset.UtcNow;
            var killed = false;
            string? error = null;

            try
            {
                using var process = Process.GetProcessById(processId);
                process.Kill(entireProcessTree: true);
                killed = true;
            }
            catch (Exception ex)
            {
                error = ex.Message;
            }

            WriteProcessGuardEvent(new
            {
                timestampUtc = startedAt,
                processId,
                processName,
                ownerSid,
                executablePath,
                sha256,
                decisionReason = decision.Reason.ToString(),
                action = killed ? "terminated" : "termination_failed",
                error
            });

            WriteNativeReceipt(
                killed ? "app-blocked" : "app-block-failed",
                killed
                    ? $"Blocked {processName} for protected child account."
                    : $"Failed to block {processName}: {error ?? "unknown error"}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Process Guard event handler failed.");
        }
    }

    private static ProcessGuardPolicy? LoadProcessGuardPolicy(out string? reason)
    {
        try
        {
            if (!File.Exists(ProcessGuardPolicyPath))
            {
                reason = "PolicyFileMissing";
                return null;
            }

            var json = File.ReadAllText(ProcessGuardPolicyPath);
            var policy = JsonSerializer.Deserialize<ProcessGuardPolicy>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var validation = ProcessGuardPolicyValidator.Validate(policy);
            reason = validation.Reason;
            return validation.IsValid ? policy : null;
        }
        catch (Exception ex)
        {
            reason = "PolicyReadError: " + ex.GetType().Name;
            return null;
        }
    }

    private static string? TryGetProcessOwnerSid(int processId)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                $"SELECT * FROM Win32_Process WHERE ProcessId = {processId}");

            foreach (ManagementObject process in searcher.Get())
            {
                using (process)
                {
                    var result = process.InvokeMethod("GetOwnerSid", null, null);
                    if (result is null)
                    {
                        return null;
                    }

                    var returnValue = Convert.ToUInt32(result["ReturnValue"]);
                    if (returnValue != 0)
                    {
                        return null;
                    }

                    return result["Sid"]?.ToString();
                }
            }
        }
        catch
        {
            // The process may already have exited before owner lookup.
        }

        return null;
    }

    private static string? TryGetExecutablePath(int processId)
    {
        try
        {
            using var process = Process.GetProcessById(processId);
            return process.MainModule?.FileName;
        }
        catch
        {
            return null;
        }
    }

    private static string? TryGetSha256(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        try
        {
            using var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            var hash = SHA256.HashData(stream);
            return Convert.ToHexString(hash);
        }
        catch
        {
            return null;
        }
    }

    private static void WriteNativeReceipt(string kind, string detail)
    {
        try
        {
            var receipt = new
            {
                timestampUtc = DateTimeOffset.UtcNow,
                kind,
                detail
            };

            File.AppendAllText(
                NativeReceiptsPath,
                JsonSerializer.Serialize(receipt) + Environment.NewLine);
        }
        catch
        {
            // Receipts must never break enforcement.
        }
    }

    private static void WriteProcessGuardEvent(object evt)
    {
        try
        {
            var line = JsonSerializer.Serialize(evt);
            File.AppendAllText(ProcessGuardEventsPath, line + Environment.NewLine);
        }
        catch
        {
            // Event logging must never crash enforcement.
        }
    }

}
