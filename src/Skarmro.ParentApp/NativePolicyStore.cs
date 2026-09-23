using System.IO;
using System.Management;
using System.Text.Json;

namespace Skarmro.ParentApp;

public sealed class NativeAppPolicy
{
    public int PolicyVersion { get; set; } = 1;
    public string UpdatedAtUtc { get; set; } = "";
    public bool Enabled { get; set; } = true;
    public string ChildSid { get; set; } = "";
    public string[] BlockedProcessNames { get; set; } = Array.Empty<string>();
    public string[] BlockedSha256 { get; set; } = Array.Empty<string>();
    public string[] AllowedProcessNames { get; set; } = Array.Empty<string>();
}

public static class NativePolicyStore
{
    public static readonly string ProgramDataRoot =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Skarmro");

    public static readonly string PolicyPath =
        Path.Combine(ProgramDataRoot, "process-guard-policy.json");

    public static NativeAppPolicy CreateBaseline(string childAccountName)
    {
        var sid = FindLocalUserSid(childAccountName)
            ?? throw new InvalidOperationException($"Could not resolve SID for local user '{childAccountName}'.");

        return new NativeAppPolicy
        {
            UpdatedAtUtc = DateTimeOffset.UtcNow.ToString("O"),
            Enabled = true,
            ChildSid = sid,
            BlockedProcessNames =
            [
                "powershell.exe",
                "pwsh.exe",
                "cmd.exe",
                "regedit.exe",
                "msedge.exe",
                "firefox.exe",
                "brave.exe",
                "opera.exe",
                "opera_gx.exe"
            ],
            AllowedProcessNames =
            [
                "chrome.exe",
                "calc.exe",
                "mspaint.exe"
            ]
        };
    }

    public static NativeAppPolicy ReadOrCreate(string childAccountName)
    {
        try
        {
            if (File.Exists(PolicyPath))
            {
                var json = File.ReadAllText(PolicyPath);
                var existing = JsonSerializer.Deserialize<NativeAppPolicy>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (existing is not null && !string.IsNullOrWhiteSpace(existing.ChildSid))
                {
                    existing.BlockedProcessNames = existing.BlockedProcessNames
                        .Select(NormalizeProcessName)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                        .ToArray();

                    existing.AllowedProcessNames = existing.AllowedProcessNames
                        .Select(NormalizeProcessName)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                        .ToArray();

                    return existing;
                }
            }
        }
        catch
        {
            // Fall back to a safe baseline if an old policy cannot be read.
        }

        return CreateBaseline(childAccountName);
    }

    public static string NormalizeProcessName(string? value)
    {
        var name = Path.GetFileName((value ?? "").Trim());
        if (string.IsNullOrWhiteSpace(name))
            return "";

        return name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
            ? name
            : name + ".exe";
    }

    public static void Write(NativeAppPolicy policy)
    {
        Directory.CreateDirectory(ProgramDataRoot);

        policy.UpdatedAtUtc = DateTimeOffset.UtcNow.ToString("O");
        policy.BlockedProcessNames = policy.BlockedProcessNames
            .Select(NormalizeProcessName)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        policy.AllowedProcessNames = policy.AllowedProcessNames
            .Select(NormalizeProcessName)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var json = JsonSerializer.Serialize(
            policy,
            new JsonSerializerOptions { WriteIndented = true });

        var temp = PolicyPath + ".tmp";
        File.WriteAllText(temp, json);
        File.Move(temp, PolicyPath, true);
    }

    private static string? FindLocalUserSid(string accountName)
    {
        var escaped = accountName.Replace("'", "''", StringComparison.Ordinal);
        using var searcher = new ManagementObjectSearcher(
            $"SELECT SID, Name, LocalAccount FROM Win32_UserAccount WHERE Name = '{escaped}' AND LocalAccount = TRUE");

        foreach (ManagementObject user in searcher.Get())
        {
            using (user)
            {
                var sid = user["SID"]?.ToString();
                if (!string.IsNullOrWhiteSpace(sid))
                    return sid;
            }
        }

        return null;
    }
}
