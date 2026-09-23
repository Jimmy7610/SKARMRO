$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$outRoot = Join-Path $repoRoot "artifacts\msix-dev"
$layout = Join-Path $outRoot "layout"
$package = Join-Path $outRoot "SKARMRO-0.1.0-dev-x64.msix"
$manifestTemplate = Join-Path $repoRoot "packaging\msix\AppxManifest.xml"

Write-Host ""
Write-Host "=== SKARMRO MSIX DEV BUILD ===" -ForegroundColor Cyan

if (Test-Path $outRoot) { Remove-Item $outRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $layout | Out-Null

$projects = @(
    @{ Name = "GuardService"; Path = "src\Skarmro.GuardService\Skarmro.GuardService.csproj" },
    @{ Name = "ParentApp"; Path = "src\Skarmro.ParentApp\Skarmro.ParentApp.csproj" },
    @{ Name = "JuniorLauncher"; Path = "src\Skarmro.JuniorLauncher\Skarmro.JuniorLauncher.csproj" }
)

foreach ($project in $projects) {
    $target = Join-Path $layout $project.Name
    dotnet publish (Join-Path $repoRoot $project.Path) -c Release -r win-x64 --self-contained false -p:UseSharedCompilation=false -p:BuildInParallel=false -o $target
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed for $($project.Name)." }
}

Copy-Item $manifestTemplate (Join-Path $layout "AppxManifest.xml")

$assets = Join-Path $layout "Assets"
New-Item -ItemType Directory -Force -Path $assets | Out-Null
Add-Type -AssemblyName System.Drawing

function New-SkarmroPng([string]$Path, [int]$Width, [int]$Height) {
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(20, 24, 33))
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 240, 240))
        try {
            $fontSize = [Math]::Max(10, [Math]::Min($Width, $Height) / 4)
            $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
            try {
                $format = New-Object System.Drawing.StringFormat
                $format.Alignment = [System.Drawing.StringAlignment]::Center
                $format.LineAlignment = [System.Drawing.StringAlignment]::Center
                $graphics.DrawString("S", $font, $brush, (New-Object System.Drawing.RectangleF(0,0,$Width,$Height)), $format)
                $format.Dispose()
            } finally { $font.Dispose() }
        } finally { $brush.Dispose() }
        $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bmp.Dispose()
    }
}

New-SkarmroPng (Join-Path $assets "StoreLogo.png") 50 50
New-SkarmroPng (Join-Path $assets "Square44x44Logo.png") 44 44
New-SkarmroPng (Join-Path $assets "Square150x150Logo.png") 150 150
New-SkarmroPng (Join-Path $assets "Wide310x150Logo.png") 310 150

$makeAppx = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Recurse -Filter makeappx.exe -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\x64\\makeappx.exe$" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

if (-not $makeAppx) { throw "MakeAppx.exe not found. Install the Windows 10/11 SDK first." }

& $makeAppx.FullName pack /d $layout /p $package /o
if ($LASTEXITCODE -ne 0) { throw "MakeAppx failed." }

Write-Host ""
Write-Host "MSIX created:" -ForegroundColor Green
Write-Host $package
Write-Host ""
Write-Host "This package is UNSIGNED and is only the packaging proof-of-concept."
Write-Host "Run 02-create-and-sign-dev-msix.ps1 next for local WILMA testing."
