# SKÄRMRO MSIX / Microsoft Store proof of concept

Branch: `feature/msix-store-poc`

Goal: determine whether the current SKÄRMRO Windows architecture can be packaged as MSIX without disabling Smart App Control or buying a public code-signing certificate during development.

## What this POC packages

- Parent App as the primary full-trust desktop application
- Junior Launcher as a packaged startup task
- Guard Service as a packaged Windows service running as LocalSystem

The MSIX declares the restricted capabilities `runFullTrust`, `packagedServices`, and `localSystemServices`.

## Important Store risk

Microsoft supports packaged Windows services in MSIX, including LocalSystem services, but `packagedServices` and `localSystemServices` are restricted capabilities.

Microsoft Store documentation says these capabilities receive additional review and that they are not recommended for normal Store submissions; in most cases use is not approved.

Therefore this POC proves local MSIX packaging/deployment only. It does not prove that Microsoft Store certification will approve SKÄRMRO’s current LocalSystem-service architecture.

## Local test sequence on WILMA

Open PowerShell as Administrator:

```powershell
cd C:\SKARMRO
git fetch origin
git switch feature/msix-store-poc
git pull
Set-ExecutionPolicy -Scope Process Bypass

.\scripts\msix\01-build-dev-msix.ps1
.\scripts\msix\02-create-and-sign-dev-msix.ps1
.\scripts\msix\03-install-dev-msix.ps1
```

Do not disable Smart App Control.

Rollback:

```powershell
.\scripts\msix\04-remove-dev-msix.ps1
```

## Success criteria

1. MakeAppx accepts the manifest.
2. The local development MSIX can be signed.
3. Windows installs the package.
4. Parent App launches.
5. Guard service is registered.
6. Guard service runs as LocalSystem.
7. Junior Launcher startup registration exists.
8. Existing child-policy behavior can still be validated.

## WILMA validation result — 2026-09-24

The proof of concept now has two distinct results:

### PASS — packaging and deployment mechanics

- MakeAppx accepts the manifest.
- The development MSIX builds successfully.
- The package can be signed with the local WILMA development certificate.
- Windows installs and upgrades the MSIX package.
- Parent App launches from the installed package.
- A packaged Guard service can be registered as LocalSystem.
- Earlier MSIX Guard builds were verified running after reboot and enforcing the child policy against Edge.

### BLOCKED — newest Guard runtime under Smart App Control

After adding the Parent App -> Guard Service named-pipe IPC implementation, package version 0.1.0.2 installed successfully, but Windows Security reported that part of the app was blocked because it could not verify the publisher of Skarmro.GuardService.exe.

Observed state:

```text
Package: SKARMRO.Dev_0.1.0.2_x64__atztf72pq5652
Package status: Ok
SkarmroGuardServiceMsix: Stopped
```

This means package installation success is not sufficient. The Guard service must also be Running before a development MSIX test is considered successful.

The install script now treats a missing or stopped Guard service as a failed runtime validation.

Do not disable Smart App Control to make this test pass.

## IPC status

The branch contains the new architecture:

```text
Parent App
  -> named pipe: SKARMRO.Policy.v1
  -> Guard Service (LocalSystem)
  -> validates caller + policy
  -> writes protected process-guard-policy.json
  -> updates the child-safe launcher projection
```

The code builds, but the end-to-end policy-write test is still pending because the newest Guard executable is currently blocked on WILMA.

Therefore the authenticated Parent App policy-write path is implemented but not yet runtime-verified.

## Decision point

The local MSIX POC has proven that the architecture can be packaged and that packaged LocalSystem service registration is technically possible on WILMA.

The remaining external deployment question is trusted distribution/signing. A Microsoft Store route remains worth evaluating, but Store certification of the current restricted-capability / LocalSystem-service design is not assumed or guaranteed.
