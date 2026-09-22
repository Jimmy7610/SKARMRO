$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$repo = Split-Path -Parent $PSScriptRoot
$sourceExe = Join-Path $repo "out\guard-service\Skarmro.GuardService.exe"

if (-not (Test-Path $sourceExe)) {
    throw "Published executable not found. Run scripts\03-publish-service.ps1 first."
}

$serviceName = "SkarmroGuardService"
$installRoot = "C:\Program Files\Skarmro"
$installExe = Join-Path $installRoot "Skarmro.GuardService.exe"
$programData = "C:\ProgramData\Skarmro"

New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
New-Item -ItemType Directory -Path $programData -Force | Out-Null

if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Existing service found. Stopping/removing it before replacing the executable..." -ForegroundColor Yellow

    Stop-Service $serviceName -Force -ErrorAction SilentlyContinue

    $stopDeadline = (Get-Date).AddSeconds(10)
    do {
        Start-Sleep -Milliseconds 250
        $svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    } while ($svc -and $svc.Status -ne "Stopped" -and (Get-Date) -lt $stopDeadline)

    if ($svc -and $svc.Status -ne "Stopped") {
        throw "SKARMRO Guard did not stop in time."
    }

    sc.exe delete $serviceName | Out-Host

    $deleteDeadline = (Get-Date).AddSeconds(10)
    do {
        Start-Sleep -Milliseconds 250
        $stillExists = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    } while ($stillExists -and (Get-Date) -lt $deleteDeadline)

    if ($stillExists) {
        throw "SKARMRO Guard service is still pending deletion."
    }
}

Copy-Item $sourceExe $installExe -Force

sc.exe create $serviceName `
    binPath= "`"$installExe`"" `
    start= auto `
    obj= LocalSystem `
    DisplayName= "SKARMRO Guard Service" | Out-Host

sc.exe description $serviceName "SKARMRO Gate 0 local policy enforcement service." | Out-Host
sc.exe failure $serviceName reset= 86400 actions= restart/3000/restart/5000/restart/10000 | Out-Host
sc.exe failureflag $serviceName 1 | Out-Host

Start-Service $serviceName

Write-Host ""
Write-Host "Installed and started SKARMRO Guard Service." -ForegroundColor Green
Get-CimInstance Win32_Service -Filter "Name='$serviceName'" |
    Select-Object Name, State, StartMode, StartName, ProcessId |
    Format-List
