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

    public static void Write(NativeAppPolicy policy)
    {
        Directory.CreateDirectory(ProgramDataRoot);

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
