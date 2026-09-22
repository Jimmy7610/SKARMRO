$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$project = Join-Path $repo "src\Skarmro.BlockedProbe\Skarmro.BlockedProbe.csproj"
$out = Join-Path $repo "out\week2-probe"

if (Test-Path $out) { Remove-Item $out -Recurse -Force }

Write-Host "Building SKARMRO AppLocker probe..." -ForegroundColor Cyan

dotnet publish $project -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o $out

$exe = Join-Path $out "Skarmro.BlockedProbe.exe"
if (-not (Test-Path $exe)) { throw "Probe executable was not produced." }

Write-Host ""
Write-Host "Probe built:" -ForegroundColor Green
Write-Host $exe
Get-FileHash $exe -Algorithm SHA256 | Format-List
