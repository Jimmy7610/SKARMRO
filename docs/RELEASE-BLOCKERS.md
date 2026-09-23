# SKÄRMRO — Release blockers

A public paid release is **NO-GO** until every critical item below is green.

## Critical

- [ ] trusted code signing for all native binaries
- [ ] signed installer
- [ ] signed updater or explicit update strategy
- [ ] Native Guard starts under Smart App Control
- [ ] Native Guard survives reboot
- [ ] child cannot stop/modify Native Guard
- [ ] browser protection health verified externally by Native Guard
- [ ] alternate-browser policy implemented or product scope clearly constrains it
- [ ] app enforcement tested on Windows 11 Home and Pro
- [ ] routines enforce at both browser and app layers
- [ ] temporary access auto-restores reliably
- [ ] Parent App changes are authenticated/authorized
- [ ] Junior Launcher tamper tests completed
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
