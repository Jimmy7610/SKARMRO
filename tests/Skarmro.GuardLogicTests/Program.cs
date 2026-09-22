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

var tests = new (string Name, bool Expected, ProcessGuardPolicy? Policy, string? OwnerSid, string? ProcessName, string? Sha256)[]
{
    ("child + blocked exact", true, enabledPolicy, childSid, "Skarmro.BlockedProbe.exe", null),
    ("child + blocked case-insensitive", true, enabledPolicy, childSid.ToLowerInvariant(), "SKARMRO.BLOCKEDPROBE.EXE", null),
    ("child + renamed blocked hash", true, enabledPolicy, childSid, "totally-renamed.exe", blockedHash),
    ("child + renamed blocked hash case-insensitive", true, enabledPolicy, childSid, "another-name.exe", blockedHash.ToLowerInvariant()),
    ("child + allowed app", false, enabledPolicy, childSid, "notepad.exe", "AAAAAAAA"),
    ("parent + blocked app", false, enabledPolicy, parentSid, "Skarmro.BlockedProbe.exe", blockedHash),
    ("missing owner SID", false, enabledPolicy, null, "Skarmro.BlockedProbe.exe", blockedHash),
    ("missing process name but blocked hash", true, enabledPolicy, childSid, null, blockedHash),
    ("missing process name and hash", false, enabledPolicy, childSid, null, null),
    ("disabled policy", false, new ProcessGuardPolicy
    {
        Enabled = false,
        ChildSid = childSid,
        BlockedProcessNames = ["Skarmro.BlockedProbe.exe"],
        BlockedSha256 = [blockedHash]
    }, childSid, "Skarmro.BlockedProbe.exe", blockedHash),
    ("empty child SID", false, new ProcessGuardPolicy
    {
        Enabled = true,
        ChildSid = "",
        BlockedProcessNames = ["Skarmro.BlockedProbe.exe"],
        BlockedSha256 = [blockedHash]
    }, childSid, "Skarmro.BlockedProbe.exe", blockedHash),
    ("null policy", false, null, childSid, "Skarmro.BlockedProbe.exe", blockedHash)
};

var failed = 0;

Console.WriteLine("SKARMRO Guard logic tests");
Console.WriteLine("=========================");
Console.WriteLine();

foreach (var test in tests)
{
    var actual = ProcessGuardEvaluator.ShouldTerminate(
        test.Policy,
        test.OwnerSid,
        test.ProcessName,
        test.Sha256);

    var passed = actual == test.Expected;

    Console.WriteLine(
        $"{(passed ? "PASS" : "FAIL")}  {test.Name}  expected={test.Expected} actual={actual}");

    if (!passed)
    {
        failed++;
    }
}

Console.WriteLine();
Console.WriteLine($"{tests.Length - failed}/{tests.Length} tests passed.");

return failed == 0 ? 0 : 1;
