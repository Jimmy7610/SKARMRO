$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$project = Join-Path $repo "src\Skarmro.GuardService\Skarmro.GuardService.csproj"
$out = Join-Path $repo "out\guard-service"

Write-Host "Publishing SKARMRO Guard Service..." -ForegroundColor Cyan

if (Test-Path $out) {
    Remove-Item $out -Recurse -Force
}

dotnet restore $project
dotnet publish $project `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -o $out

Write-Host ""
Write-Host "Published to: $out" -ForegroundColor Green
