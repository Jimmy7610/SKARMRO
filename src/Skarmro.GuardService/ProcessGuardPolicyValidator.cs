using System.Text.RegularExpressions;

namespace Skarmro.GuardService;

public sealed record ProcessGuardPolicyValidationResult(
    bool IsValid,
    string Reason);

public static class ProcessGuardPolicyValidator
{
    private static readonly Regex SidPattern =
        new("^S-1-5-21-(?:\d+-){3}\d+$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static ProcessGuardPolicyValidationResult Validate(ProcessGuardPolicy? policy)
    {
        if (policy is null)
            return new(false, "PolicyMissing");

        if (policy.PolicyVersion != 1)
            return new(false, "UnsupportedPolicyVersion");

        if (string.IsNullOrWhiteSpace(policy.ChildSid))
            return new(false, "MissingChildSid");

        if (!SidPattern.IsMatch(policy.ChildSid.Trim()))
            return new(false, "InvalidChildSid");

        if (policy.BlockedProcessNames.Any(string.IsNullOrWhiteSpace))
            return new(false, "InvalidBlockedProcessName");

        if (policy.BlockedSha256.Any(hash =>
                string.IsNullOrWhiteSpace(hash) ||
                hash.Replace(" ", "", StringComparison.Ordinal).Trim().Length != 64))
            return new(false, "InvalidBlockedSha256");

        return new(true, "Valid");
    }
}
