namespace Skarmro.GuardService;

public sealed class ProcessGuardPolicy
{
    public bool Enabled { get; set; }
    public string ChildSid { get; set; } = "";
    public string[] BlockedProcessNames { get; set; } = Array.Empty<string>();
}
