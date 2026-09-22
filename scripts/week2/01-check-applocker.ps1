$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO Week 2 - AppLocker capability check ===" -ForegroundColor Cyan
Write-Host ""

$child = Get-LocalUser -Name "SkarmroChild" -ErrorAction Stop

Write-Host "Child account:" -ForegroundColor Yellow
$child | Select-Object Name, Enabled, SID | Format-List

Write-Host "AppLocker PowerShell commands:" -ForegroundColor Yellow
$commands = @("Get-AppLockerPolicy","Set-AppLockerPolicy","New-AppLockerPolicy","Get-AppLockerFileInformation","Test-AppLockerPolicy")
foreach ($command in $commands) {
    $found = Get-Command $command -ErrorAction SilentlyContinue
    if ($found) { Write-Host ("[OK]   " + $command) -ForegroundColor Green }
    else { Write-Host ("[MISS] " + $command) -ForegroundColor Red }
}

Write-Host ""
Write-Host "Application Identity service:" -ForegroundColor Yellow
Get-CimInstance Win32_Service -Filter "Name='AppIDSvc'" | Select-Object Name, DisplayName, State, StartMode, StartName | Format-List

Write-Host ""
Write-Host "Current local AppLocker policy:" -ForegroundColor Yellow
try { Get-AppLockerPolicy -Local | Format-List Version, RuleCollectionTypes }
catch { Write-Host ("Could not read local AppLocker policy: " + $_.Exception.Message) -ForegroundColor Red }

Write-Host ""
Write-Host "Current effective AppLocker policy:" -ForegroundColor Yellow
try { Get-AppLockerPolicy -Effective | Format-List Version, RuleCollectionTypes }
catch { Write-Host ("Could not read effective AppLocker policy: " + $_.Exception.Message) -ForegroundColor Red }

Write-Host ""
Write-Host "IMPORTANT: This script changes nothing." -ForegroundColor Cyan
