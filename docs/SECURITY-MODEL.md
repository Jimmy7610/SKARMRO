# SKÄRMRO — Security model

## Trust boundaries

### Parent account
Windows Administrator.

### Child account
Standard Windows user. Must never be local Administrator.

### Native Guard
Windows Service running as LocalSystem.

### Browser Guard
Chrome Manifest V3 extension. Content filtering layer, not the sole Windows security boundary.

## Principles

- No security-through-obscurity as the primary control.
- UI is never the only enforcement barrier.
- Fail visibly when protection is degraded.
- Never ask families to disable Smart App Control as a normal install step.
- No undocumented Windows registry hacks.
- No TLS interception.
- No keylogging or screen recording.

## Current validated controls

- child account is non-admin
- Guard Service ProgramData ACL protects state from child writes/deletes
- child cannot stop or kill the LocalSystem service in validated Week 1 build
- Process Guard decision engine is user-aware
- SHA-256 matching prevents the simplest executable rename bypass in the decision layer
- Browser Guard blocks Shorts navigation and filters Shorts UI
- Auto Protect blocks tested unsafe search categories
- runtime heartbeat drives browser Protection Health

## Known production blockers

- unsigned native binaries are blocked by Smart App Control on WILMA
- Browser Guard can be removed/disabled until Native Guard can verify extension health externally
- alternate browsers are not yet Windows-enforced
- Junior Launcher is not a hardened shell until Native Guard runtime enforcement is active
- Safe Mode/recovery threat model is not complete

## Security release rule

Do not market SKÄRMRO as tamper-resistant until the external Native Guard can verify and restore critical child-side protection.
