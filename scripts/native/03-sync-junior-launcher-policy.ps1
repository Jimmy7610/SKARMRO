$ErrorActionPreference = "Stop"

$nativeRoot = "C:\ProgramData\Skarmro"
$nativePolicyPath = Join-Path $nativeRoot "process-guard-policy.json"
$publicRoot = "C:\ProgramData\SkarmroPublic"
$launcherPolicyPath = Join-Path $publicRoot "launcher-policy.json"

if (-not (Test-Path $nativePolicyPath)) {
    throw "Native policy not found: $nativePolicyPath"
}

$policy = Get-Content $nativePolicyPath -Raw | ConvertFrom-Json
$blocked = @{}
@($policy.blockedProcessNames) | ForEach-Object { $blocked[$_.ToLowerInvariant()] = $true }

function Convert-ToLauncherApp([string]$processName) {
    switch ($processName.ToLowerInvariant()) {
        "calc.exe" { return [ordered]@{ processName=$processName; displayName="Calculator"; icon="+"; subtitle=$null } }
        "mspaint.exe" { return [ordered]@{ processName=$processName; displayName="Paint"; icon="P"; subtitle=$null } }
        "chrome.exe" { return [ordered]@{ processName=$processName; displayName="Internet"; icon="O"; subtitle="SKARMRO Browser Guard" } }
        default {
            $name = [IO.Path]::GetFileNameWithoutExtension($processName)
            return [ordered]@{ processName=$processName; displayName=$name; icon="[]"; subtitle=$null }
        }
    }
}

$apps = @(
    @($policy.allowedProcessNames) |
        Where-Object { $_ -and -not $blocked.ContainsKey($_.ToLowerInvariant()) } |
        Sort-Object -Unique |
        ForEach-Object { Convert-ToLauncherApp $_ }
)

$projection = [ordered]@{
    version = 1
    updatedAtUtc = [DateTimeOffset]::UtcNow.ToString("O")
    apps = $apps
}

New-Item -ItemType Directory -Path $publicRoot -Force | Out-Null

# SYSTEM/Admins can modify; standard Users can only read/execute.
& icacls $publicRoot /inheritance:r | Out-Null
& icacls $publicRoot /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" "*S-1-5-32-545:(OI)(CI)RX" | Out-Null

$json = $projection | ConvertTo-Json -Depth 6
$temp = "$launcherPolicyPath.tmp"
[IO.File]::WriteAllText($temp, $json, [Text.UTF8Encoding]::new($false))
Move-Item $temp $launcherPolicyPath -Force

Write-Host ""
Write-Host "=== SKARMRO Junior Launcher Policy ===" -ForegroundColor Cyan
Write-Host "Path : $launcherPolicyPath"
Write-Host "Apps : $($apps.Count)"
Write-Host ""
$apps | ForEach-Object { Write-Host ("  - {0} ({1})" -f $_.displayName, $_.processName) }
Write-Host ""
Write-Host "ACL: Administrators/SYSTEM = Full, standard Users = Read/Execute." -ForegroundColor Green
Write-Host "The protected Guard policy was not exposed or modified." -ForegroundColor Green
