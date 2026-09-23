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
