# SKÄRMRO — Release blockers

A public paid release is **NO-GO** until every critical item below is green.

## Critical

- [ ] trusted code signing for all native binaries
- [ ] signed installer
- [ ] signed updater or explicit update strategy
- [ ] Native Guard starts under Smart App Control
- [x] Native Guard survives reboot
- [x] child cannot stop/modify Native Guard
- [ ] browser protection health verified externally by Native Guard
- [x] alternate-browser baseline policy implemented for the tested Home path; broader browser QA remains
- [ ] app enforcement tested on Windows 11 Home and Pro
- [ ] routines enforce at both browser and app layers
- [x] temporary access auto-restores reliably
- [ ] Parent App changes are authenticated/authorized
- [ ] Junior Launcher tamper tests completed (build hardening done; signed runtime test pending)
- [ ] uninstall/repair flow tested
- [ ] no local privilege escalation introduced
- [ ] privacy policy matches actual telemetry/storage
- [ ] pilot across multiple OEM Windows PCs

## Browser quality

- [x] direct Shorts blocking
- [x] Shorts search/UI filtering
- [x] automatic unsafe-search blocking
- [x] Swedish + English Auto Protect baseline
- [x] manual channel blocking
- [x] custom blocked words
- [x] routine engine
- [x] temporary browser access
- [x] Policy Receipts
- [x] runtime heartbeat
- [ ] broad false-positive / false-negative benchmark
- [ ] YouTube DOM regression fixture suite
- [ ] Chrome Web Store distribution decision

## Product quality

- [ ] onboarding < 5 minutes with external parents
- [ ] recovery if extension/service is damaged
- [ ] accessibility review
- [ ] localization review
- [ ] 20-family pilot
- [ ] support workflow
- [ ] final pricing validation


## Zero-budget completion status

Completed without disabling Smart App Control:

- [x] Windows Home Guard service foundation verified on WILMA
- [x] child SID-targeted native block enforcement verified
- [x] allow-path verified with Chrome, Calculator and Paint
- [x] native enforcement event persistence verified
- [x] Browser Guard routines and temporary access verified
- [x] child extra-time request / parent approval flow verified
- [x] dynamic Parent App app-policy editor built
- [x] dynamic Junior Launcher app projection built
- [x] separate child-readable launcher projection with restricted ACL
- [x] single-instance Junior Launcher
- [x] launcher returns to foreground after child app exits
- [x] secure parent handoff uses Windows lock/switch-user path
- [x] signed-only launcher autostart installer built
- [x] scheduled-task restart-on-failure configuration built
- [x] rollback and health scripts built
- [x] native PowerShell scripts parsed in Windows CI
- [x] zero-cost validation suite built

Still blocked for real deployment by external prerequisites:

- [ ] trusted code-signing certificate
- [ ] signed native installer/package
- [ ] signed newest Guard/Parent App/Junior Launcher deployment on WILMA
- [ ] browser-extension tamper/disable health verified by native code
- [ ] Windows 11 Pro validation
- [ ] multi-PC/OEM pilot
- [ ] external parent usability pilot
- [ ] final privacy/legal review
