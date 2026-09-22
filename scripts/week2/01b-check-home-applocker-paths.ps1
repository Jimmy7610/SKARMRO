$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO Week 2 - Windows Home AppLocker admin-path diagnostics ===" -ForegroundColor Cyan
Write-Host ""

$modulePath = "C:\Windows\System32\WindowsPowerShell\v1.0\Modules\AppLocker\AppLocker.psd1"
$secpol = "C:\Windows\System32\secpol.msc"
$gpedit = "C:\Windows\System32\gpedit.msc"

Write-Host "AppLocker PowerShell module:" -ForegroundColor Yellow
Write-Host ("  Path: " + $modulePath)
Write-Host ("  Exists: " + (Test-Path $modulePath))

Write-Host ""
Write-Host "Local Security Policy snap-in:" -ForegroundColor Yellow
Write-Host ("  Path: " + $secpol)
Write-Host ("  Exists: " + (Test-Path $secpol))

Write-Host ""
Write-Host "Local Group Policy Editor:" -ForegroundColor Yellow
Write-Host ("  Path: " + $gpedit)
Write-Host ("  Exists: " + (Test-Path $gpedit))

Write-Host ""
Write-Host "AppLocker service/driver state:" -ForegroundColor Yellow
Get-CimInstance Win32_Service -Filter "Name='AppIDSvc'" | Select-Object Name, State, StartMode, StartName | Format-List

Write-Host ""
Write-Host "SKARMRO decision aid:" -ForegroundColor Cyan
if ((Test-Path $modulePath) -or (Test-Path $secpol) -or (Test-Path $gpedit)) {
    Write-Host "At least one supported local administration path exists. Continue investigation." -ForegroundColor Green
} else {
    Write-Host "No supported local AppLocker administration path was found on this Windows Home PC." -ForegroundColor Red
    Write-Host "Do NOT attempt registry hacks. SKARMRO should pivot its Home enforcement adapter." -ForegroundColor Yellow
}
