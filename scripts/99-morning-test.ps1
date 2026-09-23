$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

Write-Host ""
Write-Host "=== SKARMRO Morning Build ===" -ForegroundColor Cyan

Write-Host "Updating repository..." -ForegroundColor Yellow
git pull --ff-only
if ($LASTEXITCODE -ne 0) {
    throw "git pull failed."
}

$manifestPath = Join-Path $repo "src\Skarmro.BrowserGuard\manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

Write-Host ""
Write-Host ("Browser Guard version: " + $manifest.version) -ForegroundColor Green
Write-Host "Expected morning build: 0.8.0" -ForegroundColor Green

$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) }

Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "1. Chrome Extensions opens now."
Write-Host "2. Click Update."
Write-Host "3. Verify SKARMRO Browser Guard version 0.8.0."
Write-Host "4. Open Details -> Extension options to launch SKARMRO Parent App."
Write-Host ""

if ($chromeCandidates.Count -gt 0) {
    Start-Process $chromeCandidates[0] "chrome://extensions/"
} else {
    Write-Host "Chrome was not found automatically. Open chrome://extensions manually." -ForegroundColor Yellow
}
