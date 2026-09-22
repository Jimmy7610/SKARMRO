$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "Publishing updated SKARMRO Guard..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\03-publish-service.ps1")

Write-Host ""
Write-Host "Reinstalling SKARMRO Guard..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\04-install-service.ps1")

Write-Host ""
Write-Host "Re-applying ProgramData hardening..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\06-harden-programdata.ps1")

Write-Host ""
Write-Host "Process Guard service redeployed." -ForegroundColor Green
