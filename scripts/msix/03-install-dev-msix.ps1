$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$package = Join-Path $repoRoot "artifacts\msix-dev\SKARMRO-0.1.0-dev-x64.msix"

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw "Run PowerShell as Administrator." }
}

Assert-Administrator
if (-not (Test-Path $package)) { throw "Signed MSIX not found. Run scripts\msix\01 and 02 first." }

Write-Host ""
Write-Host "=== INSTALL SKARMRO DEV MSIX ===" -ForegroundColor Cyan
Add-AppxPackage -Path $package -ForceApplicationShutdown

Write-Host ""
Get-AppxPackage -Name "SKARMRO.Dev" | Select-Object Name, PackageFullName, Status
Write-Host ""
$service = Get-Service -Name "SkarmroGuardServiceMsix" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Guard service registered: $($service.Status)" -ForegroundColor Green
} else {
    Write-Warning "MSIX installed, but SkarmroGuardServiceMsix was not found."
}
Write-Host ""
Write-Host "Do not modify Smart App Control. This is a locally trusted development MSIX."
