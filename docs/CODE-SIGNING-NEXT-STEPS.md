# SKÄRMRO — Code signing next steps

## Verified on WILMA

The current development binaries are unsigned:

- `Skarmro.GuardService.exe` — `NotSigned`
- `Skarmro.BlockedProbe.exe` — `NotSigned`

No usable code-signing certificate with a private key is installed.

Windows 11 Home with Smart App Control enabled blocks the unsigned Guard service before startup. Code Integrity logged events 3077 and 3033.

## Supported production paths

### Path A — Azure Artifact Signing (organization)

Use this if SKÄRMRO will be published under a registered organization/company.

Microsoft currently supports Public Trust organization validation in the European Union.

Basic pricing is currently USD 9.99/month and includes up to 5,000 signatures/month.

This is the preferred managed signing route if the organization qualifies.

### Path B — Public OV code-signing certificate

Use this if publishing as an individual developer in Sweden.

Microsoft currently limits Azure Artifact Signing Public Trust for individual developers to the USA and Canada, so an individual developer in Sweden should use a traditional public OV code-signing certificate from a supported CA.

Examples named by Microsoft include DigiCert, Sectigo and GlobalSign.

## SKÄRMRO rule

Do not disable Smart App Control on WILMA just to run unsigned development builds.

Production flow remains:

```text
publish
  -> sign
  -> verify signature
  -> install
  -> harden
  -> verify service
```

## Repository support

Already implemented:

- `scripts/signing/01-check-signing-readiness.ps1`
- `scripts/signing/02-sign-from-certificate-store.ps1`
- `scripts/signing/03-verify-signatures.ps1`
- `scripts/week2/11c-redeploy-signed-guard.ps1`

No certificate private keys, passwords or signing secrets may be committed to Git.
