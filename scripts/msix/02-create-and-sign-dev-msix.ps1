$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$outRoot = Join-Path $repoRoot "artifacts\msix-dev"
$package = Join-Path $outRoot "SKARMRO-0.1.0-dev-x64.msix"
$certPath = Join-Path $outRoot "SKARMRO-Dev.cer"
$pfxPath = Join-Path $outRoot "SKARMRO-Dev.pfx"

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw "Run PowerShell as Administrator." }
}

Assert-Administrator
if (-not (Test-Path $package)) { throw "MSIX package not found. Run 01-build-dev-msix.ps1 first." }

$passwordText = "SKARMRO-DEV-ONLY"
$password = ConvertTo-SecureString $passwordText -AsPlainText -Force
$certParams = @{
    Type = "Custom"
    Subject = "CN=SKARMRO Development"
    KeyUsage = "DigitalSignature"
    CertStoreLocation = "Cert:\CurrentUser\My"
    TextExtension = @("2.5.29.37={text}1.3.6.1.5.5.7.3.3","2.5.29.19={text}")
    FriendlyName = "SKARMRO Development MSIX"
}
$cert = New-SelfSignedCertificate @certParams
Export-Certificate -Cert $cert -FilePath $certPath -Force | Out-Null
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password -Force | Out-Null
Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\LocalMachine\TrustedPeople" | Out-Null

$signtool = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\x64\\signtool.exe$" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1
if (-not $signtool) { throw "SignTool.exe not found. Install the Windows 10/11 SDK first." }

& $signtool.FullName sign /fd SHA256 /a /f $pfxPath /p $passwordText $package
if ($LASTEXITCODE -ne 0) { throw "SignTool failed." }
& $signtool.FullName verify /pa /v $package
if ($LASTEXITCODE -ne 0) { throw "MSIX signature verification failed." }

Write-Host ""
Write-Host "Development MSIX signed and local test certificate trusted." -ForegroundColor Green
Write-Host "Package: $package"
Write-Host ""
Write-Host "IMPORTANT: This certificate is ONLY for WILMA/local development."
Write-Host "It is not a public code-signing identity."
