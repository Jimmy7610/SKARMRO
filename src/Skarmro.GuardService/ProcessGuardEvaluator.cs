namespace Skarmro.GuardService;

public enum ProcessGuardDecisionReason
{
    PolicyMissing,
    PolicyDisabled,
    MissingChildSid,
    MissingOwnerSid,
    DifferentUser,
    BlockedByName,
    BlockedByHash,
    Allowed
}

public sealed record ProcessGuardDecision(
    bool ShouldTerminate,
    ProcessGuardDecisionReason Reason);

public static class ProcessGuardEvaluator
{
    public static ProcessGuardDecision Evaluate(
        ProcessGuardPolicy? policy,
        string? ownerSid,
        string? processName,
        string? sha256 = null)
    {
        if (policy is null)
        {
            return new(false, ProcessGuardDecisionReason.PolicyMissing);
        }

        if (!policy.Enabled)
        {
            return new(false, ProcessGuardDecisionReason.PolicyDisabled);
        }

        if (string.IsNullOrWhiteSpace(policy.ChildSid))
        {
            return new(false, ProcessGuardDecisionReason.MissingChildSid);
        }

        if (string.IsNullOrWhiteSpace(ownerSid))
        {
            return new(false, ProcessGuardDecisionReason.MissingOwnerSid);
        }

        if (!string.Equals(
                ownerSid,
                policy.ChildSid,
                StringComparison.OrdinalIgnoreCase))
        {
            return new(false, ProcessGuardDecisionReason.DifferentUser);
        }

        var nameBlocked =
            !string.IsNullOrWhiteSpace(processName) &&
            policy.BlockedProcessNames.Contains(
                processName,
                StringComparer.OrdinalIgnoreCase);

        if (nameBlocked)
        {
            return new(true, ProcessGuardDecisionReason.BlockedByName);
        }

        var hashBlocked =
            !string.IsNullOrWhiteSpace(sha256) &&
            policy.BlockedSha256.Contains(
                NormalizeHash(sha256),
                StringComparer.OrdinalIgnoreCase);

        if (hashBlocked)
        {
            return new(true, ProcessGuardDecisionReason.BlockedByHash);
        }

        return new(false, ProcessGuardDecisionReason.Allowed);
    }

    public static bool ShouldTerminate(
        ProcessGuardPolicy? policy,
        string? ownerSid,
        string? processName,
        string? sha256 = null) =>
        Evaluate(policy, ownerSid, processName, sha256).ShouldTerminate;

    private static string NormalizeHash(string hash) =>
        hash.Replace(" ", "", StringComparison.Ordinal).Trim();
}
