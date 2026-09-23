$ErrorActionPreference = "Stop"

$childName = "SkarmroChild"
$programDataRoot = "C:\ProgramData\Skarmro"
$policyPath = Join-Path $programDataRoot "process-guard-policy.json"

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run PowerShell as Administrator."
    }
}

Assert-Administrator

$child = Get-LocalUser -Name $childName -ErrorAction Stop
$childSid = $child.SID.Value

$blocked = @(
    "powershell.exe",
    "pwsh.exe",
    "cmd.exe",
    "regedit.exe",
    "msedge.exe",
    "firefox.exe",
    "brave.exe",
    "opera.exe",
    "opera_gx.exe"
)

$allowed = @(
    "chrome.exe",
    "calc.exe",
    "mspaint.exe"
)

$policy = [ordered]@{
    policyVersion = 1
    updatedAtUtc = [DateTimeOffset]::UtcNow.ToString("O")
    enabled = $true
    childSid = $childSid
    blockedProcessNames = $blocked
    blockedSha256 = @()
    allowedProcessNames = $allowed
}

New-Item -ItemType Directory -Path $programDataRoot -Force | Out-Null

$json = $policy | ConvertTo-Json -Depth 5
$tempPath = "$policyPath.tmp"
[IO.File]::WriteAllText($tempPath, $json, [Text.UTF8Encoding]::new($false))
Move-Item -Path $tempPath -Destination $policyPath -Force

Write-Host ""
Write-Host "=== SKARMRO Native App Policy ===" -ForegroundColor Cyan
Write-Host "Child account : $childName"
Write-Host "Child SID     : $childSid"
Write-Host "Policy path   : $policyPath"
Write-Host "Enabled       : True"
Write-Host ""
Write-Host "Blocked for child account:" -ForegroundColor Yellow
$blocked | ForEach-Object { Write-Host "  - $_" }
Write-Host ""
Write-Host "Allowed baseline:" -ForegroundColor Green
$allowed | ForEach-Object { Write-Host "  - $_" }
Write-Host ""
Write-Host "Policy file written. No executable was started and Smart App Control was not changed." -ForegroundColor Green
