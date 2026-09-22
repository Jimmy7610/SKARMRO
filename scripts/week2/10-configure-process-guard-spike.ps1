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

$policy = @{
    enabled = $true
    childSid = $child.SID.Value
    blockedProcessNames = @("Skarmro.BlockedProbe.exe")
}

New-Item -ItemType Directory -Path $programData -Force | Out-Null
$policy | ConvertTo-Json -Depth 4 | Set-Content -Path $policyPath -Encoding UTF8
Copy-Item $probe $publicProbe -Force

Write-Host ""
Write-Host "Process Guard spike configured." -ForegroundColor Green
Write-Host ("Child SID: " + $child.SID.Value)
Write-Host ("Policy: " + $policyPath)
Write-Host ("Probe: " + $publicProbe)
Write-Host ""
Write-Host "Only Skarmro.BlockedProbe.exe is blocked, and only for SkarmroChild." -ForegroundColor Yellow
