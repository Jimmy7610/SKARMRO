$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$probe = Join-Path $repo "out\week2-probe\Skarmro.BlockedProbe.exe"
$policyDir = Join-Path $repo "out\week2-policy"
$policyPath = Join-Path $policyDir "probe-deny-test.xml"

if (-not (Test-Path $probe)) { throw "Probe executable missing. Run 02-build-blocked-probe.ps1 first." }

$child = Get-LocalUser -Name "SkarmroChild" -ErrorAction Stop
New-Item -ItemType Directory -Path $policyDir -Force | Out-Null

$fileInfo = Get-AppLockerFileInformation -Path $probe
$xmlText = $fileInfo | New-AppLockerPolicy -RuleType Hash -User $child.SID.Value -Xml

[xml]$xml = $xmlText
$rule = $xml.AppLockerPolicy.RuleCollection.FileHashRule
if (-not $rule) { throw "Could not generate a file-hash rule." }

$rule.Action = "Deny"
$rule.Name = "SKARMRO Gate0 - Deny BlockedProbe"
$xml.Save($policyPath)

Write-Host ""
Write-Host "Generated NON-ENFORCED AppLocker test policy:" -ForegroundColor Green
Write-Host $policyPath
Write-Host ""
Write-Host "This file is for Test-AppLockerPolicy only. It is NOT applied to Windows." -ForegroundColor Yellow
