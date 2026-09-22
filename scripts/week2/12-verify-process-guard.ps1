$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO Process Guard verification ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Service:" -ForegroundColor Yellow
Get-CimInstance Win32_Service -Filter "Name='SkarmroGuardService'" |
    Select-Object Name, State, StartMode, StartName, ProcessId |
    Format-List

Write-Host ""
Write-Host "Guard status:" -ForegroundColor Yellow
$status = "C:\ProgramData\Skarmro\guard-status.json"
if (Test-Path $status) {
    Get-Content $status
} else {
    Write-Host "guard-status.json missing." -ForegroundColor Red
}

Write-Host ""
Write-Host "Process Guard policy:" -ForegroundColor Yellow
$policy = "C:\ProgramData\Skarmro\process-guard-policy.json"
if (Test-Path $policy) {
    Get-Content $policy
} else {
    Write-Host "process-guard-policy.json missing." -ForegroundColor Red
}

Write-Host ""
Write-Host "Recent Process Guard events:" -ForegroundColor Yellow
$events = "C:\ProgramData\Skarmro\process-guard-events.jsonl"
if (Test-Path $events) {
    Get-Content $events | Select-Object -Last 10
} else {
    Write-Host "No Process Guard events yet." -ForegroundColor DarkGray
}
