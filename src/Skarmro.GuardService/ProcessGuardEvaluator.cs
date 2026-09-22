namespace Skarmro.GuardService;

public static class ProcessGuardEvaluator
{
    public static bool ShouldTerminate(
        ProcessGuardPolicy? policy,
        string? ownerSid,
        string? processName)
    {
        if (policy is null || !policy.Enabled)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(policy.ChildSid) ||
            string.IsNullOrWhiteSpace(ownerSid) ||
            string.IsNullOrWhiteSpace(processName))
        {
            return false;
        }

        if (!string.Equals(
                ownerSid,
                policy.ChildSid,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return policy.BlockedProcessNames.Contains(
            processName,
            StringComparer.OrdinalIgnoreCase);
    }
}
