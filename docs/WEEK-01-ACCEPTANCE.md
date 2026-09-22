# Gate 0 — Week 1 acceptance

Week 1 passes only if all of these are true on a real Windows 11 PC:

1. Child account is a standard user, never local Administrator.
2. `SkarmroGuardService` is installed as an automatic Windows service.
3. Service runs as `LocalSystem`.
4. Service starts after a full Windows reboot.
5. Child user cannot stop the service without administrator credentials.
6. Child user cannot replace the service executable under `C:\Program Files\Skarmro`.
7. Child user cannot modify SKARMRO state under `C:\ProgramData\Skarmro`.
8. `guard-status.json` updates every ~5 seconds.
9. Service failure recovery restarts the service.
10. Uninstall requires administrator elevation.

Do NOT move on to AppLocker until the above is repeatable.
