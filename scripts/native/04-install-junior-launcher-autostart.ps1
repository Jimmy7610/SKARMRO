$ErrorActionPreference = "Stop"

$taskName = "SKARMRO Junior Launcher"
$childName = "SkarmroChild"
$defaultLauncher = "C:\Program Files\Skarmro\Skarmro.JuniorLauncher.exe"
$launcherPath = if ($args.Count -gt 0) { $args[0] } else { $defaultLauncher }

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run PowerShell as Administrator."
    }
}

Assert-Administrator

if (-not (Test-Path $launcherPath)) {
    throw "Launcher not found: $launcherPath"
}

$signature = Get-AuthenticodeSignature -FilePath $launcherPath
if ($signature.Status -ne "Valid") {
    throw "Refusing to register unsigned/untrusted Junior Launcher. Signature status: $($signature.Status)"
}

$child = Get-LocalUser -Name $childName -ErrorAction Stop
$childSid = $child.SID.Value

$action = New-ScheduledTaskAction -Execute $launcherPath
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $childName
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

$principal = New-ScheduledTaskPrincipal `
    -UserId $childSid `
    -LogonType Interactive `
    -RunLevel Limited

$task = New-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal

Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null

Write-Host ""
Write-Host "=== SKARMRO Junior Launcher Autostart ===" -ForegroundColor Cyan
Write-Host "Task        : $taskName"
Write-Host "Child       : $childName"
Write-Host "Child SID   : $childSid"
Write-Host "Launcher    : $launcherPath"
Write-Host "Signature   : Valid"
Write-Host "Restart     : up to 999 times, 1 minute interval"
Write-Host ""
Write-Host "Autostart registered." -ForegroundColor Green
