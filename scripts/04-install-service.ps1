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

$installRoot = "C:\Program Files\Skarmro"
$installExe = Join-Path $installRoot "Skarmro.GuardService.exe"
$programData = "C:\ProgramData\Skarmro"

New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
New-Item -ItemType Directory -Path $programData -Force | Out-Null

Copy-Item $sourceExe $installExe -Force

if (Get-Service -Name "SkarmroGuardService" -ErrorAction SilentlyContinue) {
    Write-Host "Existing service found. Stopping/removing it first..." -ForegroundColor Yellow
    Stop-Service "SkarmroGuardService" -Force -ErrorAction SilentlyContinue
    sc.exe delete SkarmroGuardService | Out-Host
    Start-Sleep -Seconds 2
}

sc.exe create SkarmroGuardService `
    binPath= "`"$installExe`"" `
    start= auto `
    obj= LocalSystem `
    DisplayName= "SKARMRO Guard Service" | Out-Host

sc.exe description SkarmroGuardService "SKARMRO Gate 0 local policy enforcement service." | Out-Host
sc.exe failure SkarmroGuardService reset= 86400 actions= restart/3000/restart/5000/restart/10000 | Out-Host
sc.exe failureflag SkarmroGuardService 1 | Out-Host

Start-Service SkarmroGuardService

Write-Host ""
Write-Host "Installed and started SKARMRO Guard Service." -ForegroundColor Green
Get-CimInstance Win32_Service -Filter "Name='SkarmroGuardService'" |
    Select-Object Name, State, StartMode, StartName, ProcessId |
    Format-List
