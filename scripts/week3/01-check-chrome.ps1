$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO Week 3 - Chrome diagnostics ===" -ForegroundColor Cyan
Write-Host "Read-only: this script changes nothing." -ForegroundColor Yellow
Write-Host ""

$candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

if ($candidates.Count -eq 0) {
    Write-Host "Chrome executable: NOT FOUND" -ForegroundColor Yellow
} else {
    foreach ($chrome in $candidates) {
        $item = Get-Item $chrome
        $sig = Get-AuthenticodeSignature $chrome

        [pscustomobject]@{
            Path = $chrome
            Version = $item.VersionInfo.FileVersion
            ProductVersion = $item.VersionInfo.ProductVersion
            SignatureStatus = $sig.Status
            Signer = if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { "<none>" }
        } | Format-List
    }
}

Write-Host ""
Write-Host "Machine Chrome policy root:" -ForegroundColor Yellow
$machinePolicy = "HKLM:\SOFTWARE\Policies\Google\Chrome"
if (Test-Path $machinePolicy) {
    Get-ItemProperty $machinePolicy | Format-List
} else {
    Write-Host "<not present>"
}

Write-Host ""
Write-Host "Current-user Chrome policy root:" -ForegroundColor Yellow
$userPolicy = "HKCU:\SOFTWARE\Policies\Google\Chrome"
if (Test-Path $userPolicy) {
    Get-ItemProperty $userPolicy | Format-List
} else {
    Write-Host "<not present>"
}

Write-Host ""
Write-Host "Child account:" -ForegroundColor Yellow
$child = Get-LocalUser -Name "SkarmroChild" -ErrorAction SilentlyContinue
if ($child) {
    $child | Select-Object Name, Enabled, SID | Format-List
} else {
    Write-Host "SkarmroChild not found." -ForegroundColor Red
}

Write-Host ""
Write-Host "No Chrome policy was changed." -ForegroundColor Cyan
