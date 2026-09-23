$ErrorActionPreference = "Stop"
$taskName = "SKARMRO Junior Launcher"

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed scheduled task: $taskName" -ForegroundColor Green
} else {
    Write-Host "Scheduled task is not installed."
}
