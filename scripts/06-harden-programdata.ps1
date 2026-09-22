$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$path = "C:\ProgramData\Skarmro"
New-Item -ItemType Directory -Path $path -Force | Out-Null

icacls $path /inheritance:r | Out-Host
icacls $path /grant:r `
    "SYSTEM:(OI)(CI)F" `
    "Administrators:(OI)(CI)F" | Out-Host

Write-Host ""
Write-Host "Hardened $path" -ForegroundColor Green
icacls $path
