$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO Gate 0 - Prerequisite Check ===" -ForegroundColor Cyan
Write-Host ""

$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
$adminSid = New-Object System.Security.Principal.SecurityIdentifier("S-1-5-32-544")

Write-Host ("Computer: " + $env:COMPUTERNAME)
Write-Host ("Windows: " + $os.Caption + " " + $os.Version)
Write-Host ("Edition/Build: " + $os.BuildNumber)
Write-Host ("Current user: " + [System.Security.Principal.WindowsIdentity]::GetCurrent().Name)
Write-Host ("Domain/workgroup: " + $cs.Domain)

Write-Host ""
Write-Host "dotnet:" -ForegroundColor Yellow
try { dotnet --info } catch { Write-Host "dotnet was not found." -ForegroundColor Red }

Write-Host ""
Write-Host "Existing SKARMRO service:" -ForegroundColor Yellow
Get-Service -Name "SkarmroGuardService" -ErrorAction SilentlyContinue | Format-List *

Write-Host ""
Write-Host "Local users:" -ForegroundColor Yellow
Get-LocalUser | Select-Object Name, Enabled, LastLogon | Format-Table -AutoSize

Write-Host ""
Write-Host "Local Administrators:" -ForegroundColor Yellow
Get-LocalGroupMember -SID $adminSid | Select-Object Name, ObjectClass | Format-Table -AutoSize
