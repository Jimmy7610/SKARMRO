$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKARMRO signing readiness ===" -ForegroundColor Cyan

$targets = @(
    "C:\SKARMRO\out\guard-service\Skarmro.GuardService.exe",
    "C:\SKARMRO\out\week2-probe\Skarmro.BlockedProbe.exe"
)

Write-Host ""
Write-Host "Current Authenticode status:" -ForegroundColor Yellow
foreach ($target in $targets) {
    if (Test-Path $target) {
        $sig = Get-AuthenticodeSignature $target
        [pscustomobject]@{
            Path = $target
            Status = $sig.Status
            Signer = if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { "<none>" }
        } | Format-List
    } else {
        Write-Host ("Missing: " + $target) -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Code-signing certificates with private keys:" -ForegroundColor Yellow
$certs = @()
foreach ($store in @("Cert:\CurrentUser\My", "Cert:\LocalMachine\My")) {
    if (Test-Path $store) {
        $certs += Get-ChildItem $store -CodeSigningCert -ErrorAction SilentlyContinue |
            Where-Object { $_.HasPrivateKey } |
            Select-Object @{N="Store";E={$store}}, Subject, Thumbprint, NotAfter
    }
}

if ($certs.Count -eq 0) {
    Write-Host "No usable code-signing certificate is installed." -ForegroundColor Yellow
} else {
    $certs | Format-Table -AutoSize
}

Write-Host ""
Write-Host "WILMA already confirmed Code Integrity events 3077/3033 for the unsigned Guard build." -ForegroundColor Yellow
Write-Host "Do not disable Smart App Control just to pass this check." -ForegroundColor Cyan
