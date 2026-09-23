$ErrorActionPreference = "Stop"

$taskName = "SKARMRO Junior Launcher"
$launcherPolicy = "C:\ProgramData\SkarmroPublic\launcher-policy.json"

Write-Host ""
Write-Host "=== SKARMRO Junior Launcher Health ===" -ForegroundColor Cyan

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    $info = Get-ScheduledTaskInfo -TaskName $taskName
    [pscustomobject]@{
        TaskPresent = $true
        State = $task.State
        LastRunTime = $info.LastRunTime
        LastTaskResult = $info.LastTaskResult
        NextRunTime = $info.NextRunTime
    } | Format-List
} else {
    [pscustomobject]@{ TaskPresent = $false } | Format-List
}

Write-Host "Launcher policy:"
if (Test-Path $launcherPolicy) {
    $policy = Get-Content $launcherPolicy -Raw | ConvertFrom-Json
    [pscustomobject]@{
        Path = $launcherPolicy
        Version = $policy.version
        UpdatedAtUtc = $policy.updatedAtUtc
        Apps = @($policy.apps).Count
    } | Format-List
    @($policy.apps) | ForEach-Object { Write-Host ("  - {0} ({1})" -f $_.displayName, $_.processName) }
} else {
    Write-Host "  launcher-policy.json missing." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Launcher process for SkarmroChild:"
$processes = Get-CimInstance Win32_Process -Filter "Name='Skarmro.JuniorLauncher.exe'" -ErrorAction SilentlyContinue
if (-not $processes) {
    Write-Host "  Not running."
} else {
    foreach ($process in $processes) {
        $owner = Invoke-CimMethod -InputObject $process -MethodName GetOwner -ErrorAction SilentlyContinue
        [pscustomobject]@{
            ProcessId = $process.ProcessId
            User = if ($owner) { "$($owner.Domain)\$($owner.User)" } else { "Unknown" }
        } | Format-List
    }
}
