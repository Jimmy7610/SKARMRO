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
if (-not $service) {
    Write-Error "MSIX package installed, but SkarmroGuardServiceMsix was not registered."
    throw "SKARMRO MSIX runtime validation failed: Guard service missing."
}

if ($service.Status -ne "Running") {
    Write-Host "Guard service registered: $($service.Status)" -ForegroundColor Red
    Write-Host ""
    Write-Warning "The package is installed, but the Guard runtime is NOT healthy."
    Write-Warning "On WILMA this can occur when Windows security / Smart App Control blocks the changed Guard executable."
    Write-Host "Do not disable Smart App Control." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Diagnostic commands:" -ForegroundColor Cyan
    Write-Host '  Get-Service SkarmroGuardServiceMsix | Select-Object Name,Status,StartType'
    Write-Host '  Get-CimInstance Win32_Service -Filter "Name=''SkarmroGuardServiceMsix''" | Select-Object Name,State,StartMode,StartName,PathName'
    throw "SKARMRO MSIX runtime validation failed: Guard service is $($service.Status), expected Running."
}

Write-Host "Guard service registered: Running" -ForegroundColor Green
Write-Host ""
Write-Host "Do not modify Smart App Control. This is a locally trusted development MSIX."
