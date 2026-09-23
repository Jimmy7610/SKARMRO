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


## Zero-budget development mode

Gate 0 development budget target: **0 SEK**.

Smart App Control remains enabled on WILMA. Until trusted release signing is available, SKÄRMRO continues development through logic tests and non-installing validation.

Run:

```powershell
cd C:\SKARMRO
git pull
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\week2\20-run-zero-cost-tests.ps1
```

This does not install or start the Windows service.


## Morning Build v0.8.0

The current testable browser-layer build includes:

- SKÄRMRO Parent App dashboard inside Browser Guard
- Auto Protect (Swedish + English)
- Shorts blocking
- manual channel blocking
- custom blocked words
- routines
- Pause Now
- temporary access + auto restore
- child access requests with parent approve/deny
- Protection Health runtime heartbeat
- Policy Receipts
- anonymous per-session filter counters
- packaged Browser Guard artifact from CI
- native WPF Parent App source
- native WPF Junior Launcher source
- native Guard / Parent App / Junior Launcher build successfully in Windows CI

Morning test:

```powershell
cd C:\SKARMRO
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\99-morning-test.ps1
```

Important: Native Windows enforcement remains blocked on WILMA until trusted code signing is available. Do not disable Smart App Control to hide that release blocker.


## Zero-cost native completion

The current zero-budget Windows stack now includes:

- child-SID-aware Guard enforcement
- verified block enforcement on Windows 11 Home
- verified allow-path for Chrome, Calculator and Paint
- native app-policy editor in Parent App source
- native Protection Health reader
- native enforcement receipts / legacy event compatibility
- dynamic Junior Launcher app tiles
- separate child-readable launcher projection
- single-instance Junior Launcher
- launcher foreground return after child app exits
- secure parent handoff via Windows lock/switch-user
- signed-only Junior Launcher autostart installer
- scheduled-task restart-on-failure configuration
- launcher health and rollback scripts
- PowerShell parser checks in Windows CI
- zero-cost native validation suite

Run the current WILMA-safe validation:

```powershell
cd C:\SKARMRO
git pull
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\native\07-run-zero-cost-native-validation.ps1
```

This validation does not install or start unsigned native binaries and does not modify Smart App Control.

### Current external blocker

The newest native Guard, Parent App and Junior Launcher cannot be deployed on WILMA until the binaries are Authenticode-signed with a trusted code-signing identity. The repository contains the signing and deployment pipeline, but the actual trusted certificate is still an external prerequisite.

Do not disable Smart App Control to bypass this.
