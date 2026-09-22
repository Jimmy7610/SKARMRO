$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$probe = Join-Path $repo "out\week2-probe\Skarmro.BlockedProbe.exe"
$policy = Join-Path $repo "out\week2-policy\probe-deny-test.xml"
$child = Get-LocalUser -Name "SkarmroChild" -ErrorAction Stop

if (-not (Test-Path $probe)) { throw "Probe executable missing." }
if (-not (Test-Path $policy)) { throw "Test policy missing. Run 03-generate-test-policy.ps1 first." }

Write-Host ""
Write-Host "=== SKARMRO Week 2 - Policy simulation ===" -ForegroundColor Cyan
Write-Host "No policy will be applied to Windows." -ForegroundColor Yellow
Write-Host ""

$result = Test-AppLockerPolicy -XmlPolicy $policy -Path $probe -User $child.SID.Value
$result | Format-Table -AutoSize

$decision = $result.PolicyDecision.ToString()
Write-Host ""
if ($decision -match "Denied") {
    Write-Host "PASS: AppLocker simulation identifies BlockedProbe as denied for SkarmroChild." -ForegroundColor Green
} else {
    Write-Host ("FAIL: Unexpected decision: " + $decision) -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "NEXT STEP: build a complete child-safe allow policy and rollback before enabling enforcement." -ForegroundColor Cyan
