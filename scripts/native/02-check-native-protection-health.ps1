$ErrorActionPreference = "Stop"

$root = "C:\ProgramData\Skarmro"
$statusPath = Join-Path $root "guard-status.json"
$policyPath = Join-Path $root "process-guard-policy.json"
$receiptsPath = Join-Path $root "native-policy-receipts.jsonl"

Write-Host ""
Write-Host "=== SKARMRO Native Protection Health ===" -ForegroundColor Cyan

$service = Get-CimInstance Win32_Service -Filter "Name='SkarmroGuardService'" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Windows Service:"
    [pscustomobject]@{
        Name = $service.Name
        State = $service.State
        StartMode = $service.StartMode
        StartName = $service.StartName
        ProcessId = $service.ProcessId
    } | Format-List
} else {
    Write-Host "Windows Service: NOT INSTALLED" -ForegroundColor Yellow
}

Write-Host "Policy:"
if (Test-Path $policyPath) {
    $policy = Get-Content $policyPath -Raw | ConvertFrom-Json
    [pscustomobject]@{
        PolicyVersion = $policy.policyVersion
        UpdatedAtUtc = $policy.updatedAtUtc
        Enabled = $policy.enabled
        ChildSid = $policy.childSid
        BlockedProcesses = @($policy.blockedProcessNames).Count
        BlockedHashes = @($policy.blockedSha256).Count
        AllowedBaseline = @($policy.allowedProcessNames).Count
    } | Format-List
    Write-Host "Blocked process names:"
    @($policy.blockedProcessNames) | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "  Policy file missing: $policyPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Guard heartbeat:"
if (Test-Path $statusPath) {
    $status = Get-Content $statusPath -Raw | ConvertFrom-Json
    $timestamp = [DateTimeOffset]::Parse($status.timestampUtc)
    $age = ([DateTimeOffset]::UtcNow - $timestamp).TotalSeconds
    $hasModernHealth = $null -ne $status.processGuard.policyValid

    [pscustomobject]@{
        State = $status.state
        Version = $status.version
        Identity = $status.identity
        TimestampUtc = $status.timestampUtc
        AgeSeconds = [Math]::Round($age, 1)
        WatcherActive = $status.processGuard.watcherActive
        PolicyPresent = $status.processGuard.policyPresent
        PolicyValid = if ($hasModernHealth) { $status.processGuard.policyValid } else { "N/A (legacy runtime)" }
        PolicyReason = if ($hasModernHealth) { $status.processGuard.policyReason } else { "Upgrade requires trusted signing" }
        EnforcementEnabled = if ($hasModernHealth) { $status.processGuard.enforcementEnabled } else { "Legacy runtime: test empirically" }
    } | Format-List
} else {
    Write-Host "  No guard-status.json available." -ForegroundColor Yellow
}

Write-Host "Native Policy Receipts:"
if (Test-Path $receiptsPath) {
    Get-Content $receiptsPath -Tail 10 | ForEach-Object {
        try {
            $receipt = $_ | ConvertFrom-Json
            "{0:u}  {1}  {2}" -f ([DateTimeOffset]::Parse($receipt.timestampUtc)), $receipt.kind, $receipt.detail
        } catch {
            $_
        }
    }
} else {
    Write-Host "  No native receipts yet."
}
