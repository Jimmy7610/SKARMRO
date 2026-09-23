# SKÄRMRO Windows — Gate 0 roadmap

## Week 1 — Windows enforcement foundation — PASS
- Standard child account
- SYSTEM Windows Service
- Automatic startup
- Protected local state
- Reboot persistence
- Child cannot stop/modify service
- Verified on Windows 11 Home (WILMA)

## Week 2 — App enforcement — DECISION ENGINE PASS / RUNTIME PENDING SIGNING
### AppLocker finding
- Application Identity engine exists on WILMA
- AppLocker PowerShell module missing
- Local Security Policy missing
- Local Group Policy Editor missing
- No undocumented registry hacks allowed
- AppLocker retained as future hardened adapter for editions where administration is viable

### Windows Home experiment
- User-aware Process Guard inside SKÄRMRO SYSTEM service
- Match child SID + blocked process name
- Kill only blocked child process
- Parent/admin launches must remain unaffected
- Record local enforcement events
- Measure latency and bypasses
- Maintain tested rollback

### Kill criteria
- meaningful actions possible before termination
- unreliable owner SID resolution
- trivial rename/path bypass remains unsolved
- unacceptable overhead
- service instability

### Zero-budget development
- Gate 0 budget target: 0 SEK
- No code-signing purchase required during early development
- Keep Smart App Control enabled on WILMA
- Test enforcement decision logic independently from service startup
- Added zero-dependency Guard logic test harness
- 12/12 decision tests green in GitHub Actions on Windows
- Local WILMA test DLLs are blocked by Smart App Control, so CI is the canonical logic-test path
- Blocked-app recognition now covers process name + SHA-256 rename resistance
- Structured decision reasons added for future Policy Receipts

### Smart App Control finding
- WILMA has Smart App Control enabled
- Code Integrity events 3077 and 3033 block the unsigned Week 2 Guard build
- Production binaries must be trusted Authenticode signed
- Signing pipeline added
- Do not disable Smart App Control on the primary Home validation machine

## Week 3 — Managed Chrome — BROWSER MVP PASS / DISTRIBUTION PENDING
- Chrome installation/detection
- Chrome Windows policy baseline
- Browser Guard Manifest V3 prototype — BUILT
- Shorts URL classification — BUILT
- Shorts link/shelf hiding prototype — BUILT
- Browser Guard CI — PASS
- Parent App dashboard — BUILT
- Auto Protect Swedish + English — PASS
- Search blocking — PASS
- Recommendation filtering — BUILT
- Anonymous session counters — BUILT
- Protection Health heartbeat — BUILT
- Policy Receipts — BUILT
- Chrome Web Store distribution path
- Force-install / anti-disable validation
- Block unsupported alternate browsers for child account

## Week 4 — YouTube experiment
- Hide Shorts UI
- Block `/shorts/` navigation
- SPA navigation tests
- Channel shadow-filter prototype
- Automated regression test concept

## Week 5 — Routines — BROWSER LAYER BUILT
- School — BUILT
- Homework — BUILT
- Dinner — BUILT
- Free Time — BUILT
- Bedtime — BUILT
- Pause Now — BUILT for YouTube
- Temporary access — BUILT
- Auto restore — BUILT
- Routine engine CI tests — PASS
- Windows/app-level routine enforcement — pending signed Native Guard

## Week 6 — Anti-bypass
- Task Manager
- PowerShell / CMD / Regedit
- Alternate browsers
- VPN / proxy
- Safe Mode / recovery assumptions

## Week 7 — Parent UX lab
- 10 external parents
- First routine in < 5 minutes

## Week 8 — Pilot
- 20 families
- Windows 11 Home + Pro
- Multiple OEMs
- Reliability / support / willingness-to-pay


### Validation update
- Temporary Access + Auto Restore — PASS
- Parent cancel override — PASS
- 1-minute test override — PASS


### Native integration update
- Native policy contract v1 — BUILT
- Native policy validation — PASS
- Guard Health policy state — BUILT
- Native Policy Receipts — BUILT
- Parent App native policy writer — BUILT
- Parent App native health reader — BUILT
- WILMA configuration script — BUILT
- WILMA native health diagnostics — BUILT
- Native policy + Protection Health integration — BUILD PASS


### WILMA native enforcement validation
- Native App Blocking on WILMA — PASS
- Child SID targeting — PASS
- Blocked process terminated — PASS
- Legacy enforcement event persisted — PASS


### Junior Launcher integration
- Junior Launcher dynamic app projection — BUILD PASS
- Parent App publishes allowed apps to launcher projection — BUILD PASS
- Launcher fallback apps — BUILT
- Separate child-readable launcher policy — BUILT
- Native Guard policy remains private — PASS by design
- WILMA projection sync script — BUILT
