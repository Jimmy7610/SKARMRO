using System.IO;
using System.Text.Json;

namespace Skarmro.ParentApp;

public sealed record NativeHealthSnapshot(
    bool StatusPresent,
    bool HeartbeatFresh,
    string State,
    string Version,
    bool WatcherActive,
    bool PolicyPresent,
    bool PolicyValid,
    bool EnforcementEnabled,
    string PolicyReason,
    DateTimeOffset? TimestampUtc);

public static class NativeHealthReader
{
    private static readonly string StatusPath =
        Path.Combine(NativePolicyStore.ProgramDataRoot, "guard-status.json");

    private static readonly string ReceiptsPath =
        Path.Combine(NativePolicyStore.ProgramDataRoot, "native-policy-receipts.jsonl");

    public static NativeHealthSnapshot Read()
    {
        if (!File.Exists(StatusPath))
        {
            return new(false, false, "missing", "", false, false, false, false, "NoHeartbeat", null);
        }

        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(StatusPath));
            var root = document.RootElement;
            var processGuard = root.GetProperty("processGuard");

            var timestamp = root.GetProperty("timestampUtc").GetDateTimeOffset();
            var fresh = DateTimeOffset.UtcNow - timestamp < TimeSpan.FromSeconds(20);

            return new(
                true,
                fresh,
                root.GetProperty("state").GetString() ?? "unknown",
                root.GetProperty("version").GetString() ?? "",
                processGuard.GetProperty("watcherActive").GetBoolean(),
                processGuard.GetProperty("policyPresent").GetBoolean(),
                processGuard.TryGetProperty("policyValid", out var valid) && valid.GetBoolean(),
                processGuard.TryGetProperty("enforcementEnabled", out var enabled) && enabled.GetBoolean(),
                processGuard.TryGetProperty("policyReason", out var reason) ? reason.GetString() ?? "" : "",
                timestamp);
        }
        catch
        {
            return new(true, false, "invalid-status", "", false, false, false, false, "StatusReadError", null);
        }
    }

    public static string[] ReadRecentReceipts(int count = 10)
    {
        if (!File.Exists(ReceiptsPath))
            return [];

        try
        {
            return File.ReadLines(ReceiptsPath).TakeLast(Math.Max(1, count)).ToArray();
        }
        catch
        {
            return [];
        }
    }
}
