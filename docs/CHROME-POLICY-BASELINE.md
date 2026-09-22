# SKÄRMRO — Chrome policy baseline

## Status

Design only. Do not apply this policy baseline to WILMA until the per-child registry path has been validated.

## MVP goals

Chrome is the only supported browser for the child account.

The eventual managed child profile should prevent obvious Browser Guard bypass routes while leaving the parent/admin browser experience unaffected.

## Candidate child policies

### Disable Incognito
Policy: `IncognitoModeAvailability = 1`

Reason: Browser Guard must not be bypassed by opening an unmanaged incognito session.

### Disable Guest mode
Policy: `BrowserGuestModeEnabled = 0`

Reason: Guest profiles are effectively separate browser sessions and should not provide an unmanaged escape route.

### Browser Guard force-install
Policy family: `ExtensionInstallForcelist`

Status: wait for Chrome Web Store extension ID before enforcement testing.

### URL policy
Policy family: `URLBlocklist` / `URLAllowlist`

Use for stable browser-level site rules where appropriate. Do not use these as a substitute for DOM-level YouTube filtering.

## Per-child requirement

Policies that are meant only for the child must not unintentionally change the parent Chrome experience.

Gate 0 must prove the exact Windows per-user registry behavior for the `SkarmroChild` SID before applying policies.

## Non-goals

- no TLS interception
- no reading passwords
- no keylogging
- no private-message inspection
- no browsing-history surveillance beyond minimal policy receipts
