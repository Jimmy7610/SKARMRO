# SKÄRMRO

SKÄRMRO is a Windows-first parental-control and child-computer project.

The product goal is to turn a normal Windows 11 PC into a child-appropriate, parent-controlled environment without requiring the parent to understand Windows administration.

> Boundary, not surveillance.

## Current status

### Gate 0 / Week 1 — PASS

Verified on a real Windows 11 Home PC:

- protected Windows standard child account
- `SkarmroGuardService` Windows Service
- automatic boot startup
- LocalSystem service identity
- protected state in `C:\ProgramData\Skarmro`
- heartbeat after reboot
- child cannot stop service
- child cannot kill service process
- child cannot write/delete protected SKÄRMRO state

### Gate 0 / Week 2 — IN PROGRESS

Current work:

- AppLocker capability validation on Windows 11 Home
- harmless blocked-probe executable
- non-enforced AppLocker policy simulation
- safe rollback before real enforcement

## Browser decision

**Google Chrome is the only browser supported in the MVP.**

SKÄRMRO Browser Guard will target Chrome first. Other browsers can be added later if validated demand justifies the extra QA and policy complexity.

## Week 2 quick start

On the Windows test PC, open PowerShell as Administrator:

```powershell
cd C:\SKARMRO
git pull
Set-ExecutionPolicy -Scope Process Bypass

.\scripts\week2\01-check-applocker.ps1
.\scripts\week2\02-build-blocked-probe.ps1
.\scripts\week2\03-generate-test-policy.ps1
.\scripts\week2\04-validate-test-policy.ps1
```

These first Week 2 steps are designed to inspect and simulate AppLocker behavior without intentionally turning on enforcement.

## Gate 0 service uninstall

```powershell
.\scripts\07-uninstall-service.ps1
```
