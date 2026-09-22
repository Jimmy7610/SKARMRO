param(
    [Parameter(Mandatory = $true)]
    [string]$Thumbprint,

    [Parameter(Mandatory = $true)]
    [string[]]$Files,

    [string]$TimestampServer = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

$normalized = $Thumbprint.Replace(" ", "").ToUpperInvariant()

$cert = Get-ChildItem Cert:\CurrentUser\My, Cert:\LocalMachine\My -CodeSigningCert -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Thumbprint.ToUpperInvariant() -eq $normalized -and $_.HasPrivateKey
    } |
    Select-Object -First 1

if (-not $cert) {
    throw "No code-signing certificate with thumbprint $Thumbprint and a private key was found."
}

if ($cert.NotAfter -le (Get-Date)) {
    throw "The selected certificate has expired."
}

Write-Host ""
Write-Host "Signing as:" -ForegroundColor Cyan
$cert | Select-Object Subject, Thumbprint, NotAfter | Format-List

foreach ($file in $Files) {
    $resolved = Resolve-Path $file -ErrorAction Stop
    Write-Host ("Signing " + $resolved.Path) -ForegroundColor Yellow

    $result = Set-AuthenticodeSignature `
        -FilePath $resolved.Path `
        -Certificate $cert `
        -HashAlgorithm SHA256 `
        -TimestampServer $TimestampServer

    if ($result.Status -ne "Valid") {
        throw "Signing failed for $($resolved.Path): $($result.Status) $($result.StatusMessage)"
    }
}

Write-Host ""
Write-Host "All requested files were signed successfully." -ForegroundColor Green
