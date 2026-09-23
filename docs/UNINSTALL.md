# Uninstalling SKÄRMRO

SKÄRMRO is currently in development. Public signed installers are not yet released.

The final installer must provide a normal uninstall/repair path. Until then, development installations should be removed only by a parent or Windows administrator.

## Current development rollback

On a development/test machine:

1. Sign in with an administrator account.
2. Remove Junior Launcher autostart if it was configured:

```powershell
cd C:\SKARMRO
.\scripts\native\06-remove-junior-launcher-autostart.ps1
```

3. Stop and remove development-only SKÄRMRO services using the matching rollback script documented for the build that was installed.
4. Remove SKÄRMRO Browser Guard from Chrome if it was loaded as an unpacked development extension.
5. Remove development policy/state only after the native service has been removed.

Do not disable Smart App Control as part of uninstalling SKÄRMRO.

## Release requirement

Before a public signed SKÄRMRO release, the project must provide and test:

- an installer-visible uninstall entry;
- removal of SKÄRMRO scheduled tasks;
- removal of SKÄRMRO Windows services;
- safe handling of local policy/state;
- browser-extension cleanup guidance;
- repair/reinstall behavior.
