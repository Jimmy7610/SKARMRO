$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO Guard Verification ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Windows Service:" -ForegroundColor Yellow
Get-CimInstance Win32_Service -Filter "Name='SkarmroGuardService'" |
    Select-Object Name, DisplayName, State, StartMode, StartName, ProcessId |
    Format-List

Write-Host ""
Write-Host "Service ACL:" -ForegroundColor Yellow
sc.exe sdshow SkarmroGuardService

Write-Host ""
Write-Host "Heartbeat:" -ForegroundColor Yellow
$status = "C:\ProgramData\Skarmro\guard-status.json"
if (Test-Path $status) {
    Get-Content $status
} else {
    Write-Host "Heartbeat file missing." -ForegroundColor Red
}

Write-Host ""
Write-Host "ProgramData permissions:" -ForegroundColor Yellow
icacls "C:\ProgramData\Skarmro"
