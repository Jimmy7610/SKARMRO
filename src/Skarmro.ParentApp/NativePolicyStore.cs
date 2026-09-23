using System.Security.Principal;
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
        var account = new NTAccount(Environment.MachineName, childAccountName);
        var sid = (SecurityIdentifier)account.Translate(typeof(SecurityIdentifier));

        return new NativeAppPolicy
        {
            UpdatedAtUtc = DateTimeOffset.UtcNow.ToString("O"),
            Enabled = true,
            ChildSid = sid.Value,
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
}
