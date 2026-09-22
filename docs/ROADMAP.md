# SKÄRMRO Windows — Gate 0 roadmap

## Week 1 — Windows enforcement foundation — PASS
- Standard child account
- SYSTEM Windows Service
- Automatic startup
- Protected local state
- Reboot persistence
- Child cannot stop/modify service
- Verified on Windows 11 Home (WILMA)

## Week 2 — App enforcement
- AppLocker capability spike on Windows 11 Home
- Build dedicated SKÄRMRO blocked-probe executable
- Validate policy with Test-AppLockerPolicy before enforcement
- Allow/block application rules
- Test portable/renamed executables
- Maintain a tested rollback path

## Week 3 — Managed Chrome
- Chrome installation/detection
- Chrome Windows policy baseline
- Browser Guard extension prototype
- Chrome Web Store distribution path
- Force-install / anti-disable validation
- Block unsupported alternate browsers for child account

## Week 4 — YouTube experiment
- Hide Shorts UI
- Block `/shorts/` navigation
- SPA navigation tests
- Channel shadow-filter prototype
- Automated regression test concept

## Week 5 — Routines
- School
- Homework
- Dinner
- Free Time
- Bedtime
- Pause Now

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
