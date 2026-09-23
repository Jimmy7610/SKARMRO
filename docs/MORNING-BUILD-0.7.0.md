# SKÄRMRO Morning Build — v0.7.0

## Testable now on WILMA

Open Chrome -> Extensions -> SKÄRMRO Browser Guard -> Extension options.

The options page is now the SKÄRMRO Parent App.

### Parent App
- polished dashboard
- Overview
- Web Protection
- Routines
- App rule planning
- Protection Health
- live Browser Guard runtime heartbeat
- anonymous per-session filter statistics
- Policy Receipts

### Browser Guard
- YouTube Shorts blocked
- Shorts UI hidden
- automatic Swedish + English Auto Protect
- adult content
- drugs / vaping
- gambling
- graphic violence
- self-harm
- strong profanity
- custom blocked words / phrases
- manual channel blocking
- safe-search blocking notice
- individual unsafe recommendation filtering

### Routines
- School
- Homework
- Dinner
- Free Time
- Bedtime
- focus mode forces Auto Protect + Shorts blocking
- pause mode blocks YouTube
- overnight ranges supported
- automatic minute-by-minute recalculation

### Temporary controls
- Pause YouTube for 30 minutes
- Give 15 minutes temporary access
- Clear override immediately
- automatic restore at expiry
- Policy Receipt generated

### Privacy model
Browser Guard does not store:
- watched video titles
- browsing history
- passwords
- private messages
- keystrokes
- screen recordings
- camera or microphone data

It stores protection settings, parent-defined rules, routines, anonymous counters and Policy Receipts.

## Still not production-ready

The Native Windows Guard cannot currently run its newest unsigned development build on WILMA because Smart App Control correctly blocks unsigned binaries.

Therefore these features are configured or tested in logic, but are not yet production-enforced on WILMA:
- app blocking at Windows runtime
- blocking alternate browsers at Windows runtime
- Native Guard tamper monitoring
- Junior Launcher replacing the Windows shell
- installer/updater
- public code signing

Do not disable Smart App Control to hide this limitation.

## Morning smoke test

1. `git pull`
2. Update the unpacked Chrome extension
3. Confirm version `0.7.0`
4. Open Extension options
5. Verify the Parent App dashboard
6. Test Auto Protect with `online casino slots`
7. Test `funny cats`
8. Enable Dinner or Bedtime around the current time and verify YouTube pauses
9. Try “Give 15 min extra time” and verify temporary access
10. Open Protection Health and inspect Policy Receipts
