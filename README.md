# SKÄRMRO

SKÄRMRO is a Windows-first parental-control and child-computer project.

The product goal is to turn a normal Windows 11 PC into a child-appropriate, parent-controlled environment without requiring the parent to understand Windows administration.

> Boundary, not surveillance.

## Current status

**Gate 0 / Week 1 prototype**

The repository currently validates the enforcement foundation only:

- protected Windows standard child account
- `SkarmroGuardService` Windows Service
- automatic boot startup
- LocalSystem service identity for the prototype
- protected state in `C:\ProgramData\Skarmro`
- service heartbeat / verification
- failure recovery
- clean uninstall path

It does **not** yet implement the finished UI, AppLocker policies, Edge Browser Guard, YouTube filtering, routines, cloud sync, or the Junior launcher.

## Quick start

Use a disposable/test Windows 11 machine or VM first.

Open **Windows Terminal / PowerShell as Administrator** and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\01-check-prereqs.ps1
.\scripts\02-create-child-user.ps1
.\scripts\03-publish-service.ps1
.\scripts\04-install-service.ps1
.\scripts\06-harden-programdata.ps1
.\scripts\05-verify-service.ps1
```

Reboot Windows and verify again:

```powershell
.\scripts\05-verify-service.ps1
```

## Uninstall Gate 0 prototype

```powershell
.\scripts\07-uninstall-service.ps1
```

Optional full cleanup as Administrator:

```powershell
Remove-Item "C:\Program Files\Skarmro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\ProgramData\Skarmro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-LocalUser -Name "SkarmroChild" -ErrorAction SilentlyContinue
```
