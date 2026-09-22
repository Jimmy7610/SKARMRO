# SKÄRMRO — Code signing

## Why this is required

The Windows 11 Home test PC WILMA has Smart App Control enabled.

The current unsigned SKÄRMRO Guard build is blocked by Code Integrity with events 3077 and 3033 before the Windows service can start.

SKÄRMRO must not require families to disable Windows security. Production binaries therefore need trusted Authenticode signatures.

## Production rule

Sign every executable component that can be loaded or launched:

- SKÄRMRO installer
- SKÄRMRO Guard Service
- parent UI
- child launcher
- updater
- helper executables
- uninstall helper
- application DLLs where applicable

Use SHA-256 and timestamp every production signature.

## Signing choices

### Azure Artifact Signing

Microsoft's recommended service for non-Store Windows distribution. Public-trust availability depends on developer identity type and geography.

### Public OV code-signing certificate

A traditional OV code-signing certificate from a CA in the Microsoft Trusted Root Program is the fallback when Azure Artifact Signing is not available.

### Microsoft Store / MSIX

The Store can sign MSIX packages submitted through the Store. Whether the finished SKÄRMRO architecture should use this route is a later packaging decision.

## Development policy

Do not disable Smart App Control on WILMA merely to make local unsigned builds work.

Development can continue through:
- unit/integration tests that do not require loading the blocked service binary
- a separate disposable VM/test PC where Smart App Control is not enforcing
- trusted signed builds once signing is configured

Self-signed certificates are not considered a production solution for Smart App Control.

## Repository signing scripts

- `scripts/signing/01-check-signing-readiness.ps1`
- `scripts/signing/02-sign-from-certificate-store.ps1`
- `scripts/signing/03-verify-signatures.ps1`

No private certificate material or passwords belong in Git.
