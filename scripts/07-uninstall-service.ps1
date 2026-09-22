$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

Stop-Service "SkarmroGuardService" -Force -ErrorAction SilentlyContinue
sc.exe delete SkarmroGuardService | Out-Host
Start-Sleep -Seconds 2

Write-Host "Service removed. Data under C:\ProgramData\Skarmro was intentionally kept." -ForegroundColor Green
