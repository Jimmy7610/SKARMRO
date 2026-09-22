param(
    [Parameter(Mandatory = $true)]
    [string[]]$Files
)

$ErrorActionPreference = "Stop"
$failed = $false

Write-Host ""
Write-Host "=== SKARMRO signature verification ===" -ForegroundColor Cyan

foreach ($file in $Files) {
    $resolved = Resolve-Path $file -ErrorAction Stop
    $sig = Get-AuthenticodeSignature $resolved.Path

    [pscustomobject]@{
        File = $resolved.Path
        Status = $sig.Status
        Subject = if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { "<none>" }
        Thumbprint = if ($sig.SignerCertificate) { $sig.SignerCertificate.Thumbprint } else { "<none>" }
        Timestamp = if ($sig.TimeStamperCertificate) { $sig.TimeStamperCertificate.Subject } else { "<none>" }
    } | Format-List

    if ($sig.Status -ne "Valid") {
        $failed = $true
    }
}

if ($failed) {
    throw "One or more files do not have a valid Authenticode signature."
}

Write-Host "PASS: all signatures are valid." -ForegroundColor Green
