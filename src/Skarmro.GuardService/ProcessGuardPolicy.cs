namespace Skarmro.GuardService;

public sealed class ProcessGuardPolicy
{
    public int PolicyVersion { get; set; } = 1;
    public string UpdatedAtUtc { get; set; } = "";
    public bool Enabled { get; set; }
    public string ChildSid { get; set; } = "";
    public string[] BlockedProcessNames { get; set; } = Array.Empty<string>();
    public string[] BlockedSha256 { get; set; } = Array.Empty<string>();
    public string[] AllowedProcessNames { get; set; } = Array.Empty<string>();
}
