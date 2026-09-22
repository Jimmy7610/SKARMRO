using Skarmro.GuardService;

var childSid = "S-1-5-21-TEST-1002";
var parentSid = "S-1-5-21-TEST-1001";

var enabledPolicy = new ProcessGuardPolicy
{
    Enabled = true,
    ChildSid = childSid,
    BlockedProcessNames =
    [
        "Skarmro.BlockedProbe.exe",
        "powershell.exe"
    ]
};

var tests = new (string Name, bool Expected, ProcessGuardPolicy? Policy, string? OwnerSid, string? ProcessName)[]
{
    ("child + blocked exact", true, enabledPolicy, childSid, "Skarmro.BlockedProbe.exe"),
    ("child + blocked case-insensitive", true, enabledPolicy, childSid.ToLowerInvariant(), "SKARMRO.BLOCKEDPROBE.EXE"),
    ("child + allowed app", false, enabledPolicy, childSid, "notepad.exe"),
    ("parent + blocked app", false, enabledPolicy, parentSid, "Skarmro.BlockedProbe.exe"),
    ("missing owner SID", false, enabledPolicy, null, "Skarmro.BlockedProbe.exe"),
    ("missing process name", false, enabledPolicy, childSid, null),
    ("disabled policy", false, new ProcessGuardPolicy
    {
        Enabled = false,
        ChildSid = childSid,
        BlockedProcessNames = ["Skarmro.BlockedProbe.exe"]
    }, childSid, "Skarmro.BlockedProbe.exe"),
    ("empty child SID", false, new ProcessGuardPolicy
    {
        Enabled = true,
        ChildSid = "",
        BlockedProcessNames = ["Skarmro.BlockedProbe.exe"]
    }, childSid, "Skarmro.BlockedProbe.exe"),
    ("null policy", false, null, childSid, "Skarmro.BlockedProbe.exe")
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
        test.ProcessName);

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
