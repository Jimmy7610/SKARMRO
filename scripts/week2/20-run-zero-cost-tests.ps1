$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$testProject = Join-Path $repo "tests\Skarmro.GuardLogicTests\Skarmro.GuardLogicTests.csproj"

Write-Host ""
Write-Host "=== SKARMRO zero-cost Guard tests ===" -ForegroundColor Cyan
Write-Host "These tests do not install or start the Windows service." -ForegroundColor Yellow
Write-Host "Smart App Control can remain enabled." -ForegroundColor Yellow
Write-Host ""

dotnet run --project $testProject -c Release

if ($LASTEXITCODE -ne 0) {
    throw "SKARMRO Guard logic tests failed."
}

Write-Host ""
Write-Host "PASS: Process Guard decision logic is green." -ForegroundColor Green
