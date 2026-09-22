# Decision 002 — Windows Home application enforcement

## Status
Accepted for Gate 0 experimentation.

## Finding on WILMA
Windows 11 Home exposed the Application Identity service, but did not include:
- AppLocker PowerShell module
- Local Security Policy snap-in
- Local Group Policy Editor

Therefore SKÄRMRO will not rely on undocumented AppLocker registry manipulation on Home.

## Rejected as Home core
### AppLocker
Per-user semantics are ideal, but local administration is not viable on the tested Home machine.

### App Control for Business
Policies are effective on Home and can be deployed with CiTool on modern Windows 11, but App Control is device-wide rather than per-user. That conflicts with SKÄRMRO's shared-family-PC model.

## Gate 0 Home experiment
Build a user-aware Process Guard inside `SkarmroGuardService`.

It must:
- run as SYSTEM
- subscribe to process-start events
- resolve the launching user's SID
- compare the SID with the protected child SID
- stop only configured blocked executables for that child
- leave parent/admin launches untouched
- record a Policy Receipt / local event entry

## Kill criterion
Process Guard is not accepted as MVP enforcement if:
- blocked applications can perform meaningful actions before termination
- reliable owner-SID resolution fails
- trivial rename/copy/path bypasses remain after rule design
- CPU/memory overhead is material
- service instability occurs

If the Home adapter fails, SKÄRMRO v1 must either require Windows 11 Pro+ for hardened app enforcement or reduce the promise made on Home.
