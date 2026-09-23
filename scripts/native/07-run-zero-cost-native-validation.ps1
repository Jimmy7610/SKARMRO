$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SKARMRO ZERO-COST NATIVE VALIDATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$root = "C:\ProgramData\Skarmro"
$publicRoot = "C:\ProgramData\SkarmroPublic"
$policyPath = Join-Path $root "process-guard-policy.json"
$statusPath = Join-Path $root "guard-status.json"
$eventsPath = Join-Path $root "process-guard-events.jsonl"
$launcherPolicyPath = Join-Path $publicRoot "launcher-policy.json"

$results = [ordered]@{}

$service = Get-CimInstance Win32_Service -Filter "Name='SkarmroGuardService'" -ErrorAction SilentlyContinue
$results["Guard service installed"] = $null -ne $service
$results["Guard service running"] = $service -and $service.State -eq "Running"
$results["Guard service LocalSystem"] = $service -and $service.StartName -eq "LocalSystem"
$results["Guard service auto start"] = $service -and $service.StartMode -eq "Auto"

$policy = $null
if (Test-Path $policyPath) {
    try { $policy = Get-Content $policyPath -Raw | ConvertFrom-Json } catch {}
}
$results["Native policy readable"] = $null -ne $policy
$results["Native policy enabled"] = $policy -and $policy.enabled -eq $true
$results["Child SID configured"] = $policy -and -not [string]::IsNullOrWhiteSpace($policy.childSid)
$results["Blocked app rules present"] = $policy -and @($policy.blockedProcessNames).Count -gt 0

$status = $null
if (Test-Path $statusPath) {
    try { $status = Get-Content $statusPath -Raw | ConvertFrom-Json } catch {}
}
$results["Guard heartbeat readable"] = $null -ne $status
if ($status) {
    try {
        $heartbeat = [DateTimeOffset]::Parse($status.timestampUtc)
        $results["Guard heartbeat fresh"] = (([DateTimeOffset]::UtcNow - $heartbeat).TotalSeconds -lt 20)
        $results["Process watcher active"] = $status.processGuard.watcherActive -eq $true
    } catch {
        $results["Guard heartbeat fresh"] = $false
        $results["Process watcher active"] = $false
    }
} else {
    $results["Guard heartbeat fresh"] = $false
    $results["Process watcher active"] = $false
}

$blockedEvent = $false
if (Test-Path $eventsPath) {
    Get-Content $eventsPath -Tail 100 | ForEach-Object {
        try {
            $evt = $_ | ConvertFrom-Json
            if ($evt.action -eq "terminated" -and $evt.ownerSid -eq $policy.childSid) {
                $blockedEvent = $true
            }
        } catch {}
    }
}
$results["Child app enforcement observed"] = $blockedEvent

$launcherPolicy = $null
if (Test-Path $launcherPolicyPath) {
    try { $launcherPolicy = Get-Content $launcherPolicyPath -Raw | ConvertFrom-Json } catch {}
}
$results["Launcher projection readable"] = $null -ne $launcherPolicy
$results["Launcher projection has apps"] = $launcherPolicy -and @($launcherPolicy.apps).Count -gt 0

$aclOk = $false
if (Test-Path $publicRoot) {
    try {
        $usersSid = [Security.Principal.SecurityIdentifier]::new("S-1-5-32-545")
        $acl = Get-Acl $publicRoot

        $userRules = @($acl.Access | Where-Object {
            try {
                $_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -eq $usersSid.Value
            } catch {
                $false
            }
        })

        $hasReadExecute = $false
        $hasWrite = $false

        foreach ($rule in $userRules) {
            if ($rule.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow) {
                continue
            }

            $rights = $rule.FileSystemRights

            if (($rights -band [Security.AccessControl.FileSystemRights]::ReadAndExecute) -eq
                [Security.AccessControl.FileSystemRights]::ReadAndExecute) {
                $hasReadExecute = $true
            }

            $writeMask =
                [Security.AccessControl.FileSystemRights]::Write -bor
                [Security.AccessControl.FileSystemRights]::Modify -bor
                [Security.AccessControl.FileSystemRights]::FullControl

            if (($rights -band $writeMask) -ne 0) {
                $hasWrite = $true
            }
        }

        $aclOk = $hasReadExecute -and -not $hasWrite
    } catch {}
}
$results["Launcher projection read-only for Users"] = $aclOk

$passed = 0
$failed = 0
foreach ($item in $results.GetEnumerator()) {
    if ($item.Value) {
        Write-Host ("PASS  {0}" -f $item.Key) -ForegroundColor Green
        $passed++
    } else {
        Write-Host ("FAIL  {0}" -f $item.Key) -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host ("Result: {0} PASS / {1} FAIL" -f $passed, $failed)
Write-Host ""
Write-Host "This validation does not install, replace, or start unsigned native binaries."
Write-Host "Smart App Control is not modified."

if ($failed -gt 0) { exit 1 }
