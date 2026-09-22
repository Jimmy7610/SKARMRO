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

### Gate 0 / Week 2 — APP ENFORCEMENT PIVOT

AppLocker enforcement exists in Windows, but the tested Windows 11 Home machine does not expose a supported local administration path for SKÄRMRO.

Current Home experiment:

- user-aware Process Guard inside `SkarmroGuardService`
- match child SID
- block only configured child processes
- preserve parent/admin access
- log enforcement events
- measure latency and bypass resistance

If this experiment is too weak, SKÄRMRO will not pretend otherwise: hardened app enforcement may require Windows 11 Pro+.

## Browser decision

**Google Chrome is the only browser supported in the MVP.**

SKÄRMRO Browser Guard will target Chrome first. Other browsers can be added later if validated demand justifies the extra QA and policy complexity.

## Process Guard spike

Run as Administrator:

```powershell
cd C:\SKARMRO
git pull
Set-ExecutionPolicy -Scope Process Bypass

.\scripts\week2\02-build-blocked-probe.ps1
.\scripts\week2\10-configure-process-guard-spike.ps1
.\scripts\week2\11-redeploy-process-guard.ps1
.\scripts\week2\12-verify-process-guard.ps1
```

Then sign in as `SkarmroChild` and run the public desktop probe.

Rollback:

```powershell
.\scripts\week2\13-disable-process-guard-spike.ps1
```


## Code signing requirement

WILMA has Smart App Control enabled and Code Integrity has confirmed that the current unsigned Guard build is blocked before service startup.

Production SKÄRMRO will therefore require trusted Authenticode signing. Do not disable Smart App Control on WILMA just to run development builds.

Signing support now exists in:

```text
scripts/signing/01-check-signing-readiness.ps1
scripts/signing/02-sign-from-certificate-store.ps1
scripts/signing/03-verify-signatures.ps1
scripts/week2/11c-redeploy-signed-guard.ps1
```

A signed redeploy follows:

```text
publish -> sign -> verify -> install -> harden
```
