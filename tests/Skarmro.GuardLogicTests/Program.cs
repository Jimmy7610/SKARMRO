using Skarmro.GuardService;

var childSid = "S-1-5-21-TEST-1002";
var parentSid = "S-1-5-21-TEST-1001";
var blockedHash = "66A66AD29563E7093525803958E5E8BE1B4DD70D80B0534560D1BA08839F9F7A";

var enabledPolicy = new ProcessGuardPolicy
{
    Enabled = true,
    ChildSid = childSid,
    BlockedProcessNames =
    [
        "Skarmro.BlockedProbe.exe",
        "powershell.exe"
    ],
    BlockedSha256 =
    [
        blockedHash
    ]
};

var tests = new (
    string Name,
    bool ExpectedTerminate,
    ProcessGuardDecisionReason ExpectedReason,
    ProcessGuardPolicy? Policy,
    string? OwnerSid,
    string? ProcessName,
    string? Sha256)[]
{
    ("child + blocked exact", true, ProcessGuardDecisionReason.BlockedByName, enabledPolicy, childSid, "Skarmro.BlockedProbe.exe", null),
    ("child + blocked case-insensitive", true, ProcessGuardDecisionReason.BlockedByName, enabledPolicy, childSid.ToLowerInvariant(), "SKARMRO.BLOCKEDPROBE.EXE", null),
    ("child + renamed blocked hash", true, ProcessGuardDecisionReason.BlockedByHash, enabledPolicy, childSid, "totally-renamed.exe", blockedHash),
    ("child + renamed blocked hash case-insensitive", true, ProcessGuardDecisionReason.BlockedByHash, enabledPolicy, childSid, "another-name.exe", blockedHash.ToLowerInvariant()),
    ("child + allowed app", false, ProcessGuardDecisionReason.Allowed, enabledPolicy, childSid, "notepad.exe", "AAAAAAAA"),
    ("parent + blocked app", false, ProcessGuardDecisionReason.DifferentUser, enabledPolicy, parentSid, "Skarmro.BlockedProbe.exe", blockedHash),
    ("missing owner SID", false, ProcessGuardDecisionReason.MissingOwnerSid, enabledPolicy, null, "Skarmro.BlockedProbe.exe", blockedHash),
    ("missing process name but blocked hash", true, ProcessGuardDecisionReason.BlockedByHash, enabledPolicy, childSid, null, blockedHash),
    ("missing process name and hash", false, ProcessGuardDecisionReason.Allowed, enabledPolicy, childSid, null, null),
    ("disabled policy", false, ProcessGuardDecisionReason.PolicyDisabled, new ProcessGuardPolicy
    {
        Enabled = false,
        ChildSid = childSid,
        BlockedProcessNames = ["Skarmro.BlockedProbe.exe"],
        BlockedSha256 = [blockedHash]
    }, childSid, "Skarmro.BlockedProbe.exe", blockedHash),
    ("empty child SID", false, ProcessGuardDecisionReason.MissingChildSid, new ProcessGuardPolicy
    {
        Enabled = true,
        ChildSid = "",
        BlockedProcessNames = ["Skarmro.BlockedProbe.exe"],
        BlockedSha256 = [blockedHash]
    }, childSid, "Skarmro.BlockedProbe.exe", blockedHash),
    ("null policy", false, ProcessGuardDecisionReason.PolicyMissing, null, childSid, "Skarmro.BlockedProbe.exe", blockedHash)
};

var failed = 0;

Console.WriteLine("SKARMRO Guard logic tests");
Console.WriteLine("=========================");
Console.WriteLine();

foreach (var test in tests)
{
    var actual = ProcessGuardEvaluator.Evaluate(
        test.Policy,
        test.OwnerSid,
        test.ProcessName,
        test.Sha256);

    var passed =
        actual.ShouldTerminate == test.ExpectedTerminate &&
        actual.Reason == test.ExpectedReason;

    Console.WriteLine(
        $"{(passed ? "PASS" : "FAIL")}  {test.Name}  terminate={actual.ShouldTerminate} reason={actual.Reason}");

    if (!passed)
    {
        failed++;
    }
}

Console.WriteLine();
Console.WriteLine($"{tests.Length - failed}/{tests.Length} tests passed.");

return failed == 0 ? 0 : 1;
