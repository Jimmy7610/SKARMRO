$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$policyPath = "C:\ProgramData\Skarmro\process-guard-policy.json"
$publicProbe = "C:\Users\Public\Desktop\Skarmro.BlockedProbe.exe"

if (Test-Path $policyPath) {
    $policy = Get-Content $policyPath -Raw | ConvertFrom-Json
    $policy.enabled = $false
    $policy | ConvertTo-Json -Depth 4 | Set-Content -Path $policyPath -Encoding UTF8
}

Remove-Item $publicProbe -Force -ErrorAction SilentlyContinue

Write-Host "Process Guard spike disabled. SKARMRO service remains installed." -ForegroundColor Green
