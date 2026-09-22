param(
    [Parameter(Mandatory = $true)]
    [string]$Thumbprint
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$guard = Join-Path $repo "out\guard-service\Skarmro.GuardService.exe"

Write-Host "Publishing SKARMRO Guard..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\03-publish-service.ps1")

Write-Host ""
Write-Host "Signing Guard..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\signing\02-sign-from-certificate-store.ps1") `
    -Thumbprint $Thumbprint `
    -Files @($guard)

Write-Host ""
Write-Host "Verifying Guard signature..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\signing\03-verify-signatures.ps1") -Files @($guard)

$signature = Get-AuthenticodeSignature $guard
if ($signature.Status -ne "Valid") {
    throw "Guard signature is not valid. Installation aborted."
}

Write-Host ""
Write-Host "Installing signed Guard..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\04-install-service.ps1")

Write-Host ""
Write-Host "Re-applying ProgramData hardening..." -ForegroundColor Cyan
& (Join-Path $repo "scripts\06-harden-programdata.ps1")

Write-Host ""
Write-Host "Signed Guard redeploy completed." -ForegroundColor Green
