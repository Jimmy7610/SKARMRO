$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$path = "C:\ProgramData\Skarmro"
New-Item -ItemType Directory -Path $path -Force | Out-Null

icacls $path /inheritance:r | Out-Host
icacls $path /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" | Out-Host

Write-Host ""
Write-Host "Hardened $path" -ForegroundColor Green
icacls $path
