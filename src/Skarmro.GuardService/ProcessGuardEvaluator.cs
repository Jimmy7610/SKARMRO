namespace Skarmro.GuardService;

public static class ProcessGuardEvaluator
{
    public static bool ShouldTerminate(
        ProcessGuardPolicy? policy,
        string? ownerSid,
        string? processName,
        string? sha256 = null)
    {
        if (policy is null || !policy.Enabled)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(policy.ChildSid) ||
            string.IsNullOrWhiteSpace(ownerSid))
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

        var nameBlocked =
            !string.IsNullOrWhiteSpace(processName) &&
            policy.BlockedProcessNames.Contains(
                processName,
                StringComparer.OrdinalIgnoreCase);

        var hashBlocked =
            !string.IsNullOrWhiteSpace(sha256) &&
            policy.BlockedSha256.Contains(
                NormalizeHash(sha256),
                StringComparer.OrdinalIgnoreCase);

        return nameBlocked || hashBlocked;
    }

    private static string NormalizeHash(string hash) =>
        hash.Replace(" ", "", StringComparison.Ordinal).Trim();
}
