$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$probe = Join-Path $repo "out\week2-probe\Skarmro.BlockedProbe.exe"
$programData = "C:\ProgramData\Skarmro"
$policyPath = Join-Path $programData "process-guard-policy.json"
$publicProbe = "C:\Users\Public\Desktop\Skarmro.BlockedProbe.exe"

if (-not (Test-Path $probe)) {
    throw "Probe executable missing. Run .\scripts\week2\02-build-blocked-probe.ps1 first."
}

$child = Get-LocalUser -Name "SkarmroChild" -ErrorAction Stop
$probeHash = (Get-FileHash $probe -Algorithm SHA256).Hash

$policy = @{
    enabled = $true
    childSid = $child.SID.Value
    blockedProcessNames = @("Skarmro.BlockedProbe.exe")
    blockedSha256 = @($probeHash)
}

New-Item -ItemType Directory -Path $programData -Force | Out-Null
$policy | ConvertTo-Json -Depth 4 | Set-Content -Path $policyPath -Encoding UTF8
Copy-Item $probe $publicProbe -Force

Write-Host ""
Write-Host "Process Guard spike configured." -ForegroundColor Green
Write-Host ("Child SID: " + $child.SID.Value)
Write-Host ("Policy: " + $policyPath)
Write-Host ("Probe: " + $publicProbe)
Write-Host ("Probe SHA256: " + $probeHash)
Write-Host ""
Write-Host "The probe is blocked for SkarmroChild by both process name and SHA256." -ForegroundColor Yellow
Write-Host "Renaming the probe should not bypass the hash rule." -ForegroundColor Yellow
