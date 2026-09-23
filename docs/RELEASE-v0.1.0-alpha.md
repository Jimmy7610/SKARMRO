# SKÄRMRO v0.1.0-alpha

First public alpha release of the SKÄRMRO Windows parental-control project.

## Included

- SKÄRMRO Guard Service
- SKÄRMRO Parent App
- SKÄRMRO Junior Launcher
- SKÄRMRO Browser Guard 0.8.2
- SHA-256 checksums for downloadable artifacts
- GPL-3.0-only license and source-location information

## Verified before this release

On the WILMA Windows 11 Home test computer, the existing Guard foundation passed the zero-cost native validation suite with **15 PASS / 0 FAIL**, including:

- Guard service running as LocalSystem
- automatic service startup
- child SID targeting
- observed native app blocking
- allowed-app path validation
- heartbeat/process watcher
- launcher policy projection
- read-only launcher projection for standard users

## Important alpha limitation

The native binaries in this release are **not Authenticode-signed yet**.

Do not disable Smart App Control to run them. On systems where Smart App Control or Windows Code Integrity requires trusted signatures, the native binaries may be blocked.

This release exists in part to establish the public, reproducible release process needed for the SignPath Foundation open-source signing application.

## Browser Guard

Browser Guard is currently scoped to Google Chrome for the MVP.

## Privacy

SKÄRMRO follows the principle **Boundary, not surveillance**. See `docs/PRIVACY.md`.

## Source and license

SKÄRMRO is licensed under **GPL-3.0-only**.

The complete corresponding source for this release is available from this release tag and its automatically generated GitHub source archives.
