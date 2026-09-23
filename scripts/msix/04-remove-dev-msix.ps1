$ErrorActionPreference = "Stop"
$package = Get-AppxPackage -Name "SKARMRO.Dev" -ErrorAction SilentlyContinue
if ($package) {
    Remove-AppxPackage -Package $package.PackageFullName
    Write-Host "SKARMRO development MSIX removed." -ForegroundColor Green
} else {
    Write-Host "SKARMRO development MSIX is not installed."
}
Write-Host "The local development certificate is left in place for repeated POC builds."
