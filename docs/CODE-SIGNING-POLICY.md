# SKÄRMRO Code signing policy

SKÄRMRO is an open-source Windows parental-control project licensed under GPL-3.0-only.

## Code signing policy

Free code signing provided by SignPath.io, certificate by SignPath Foundation.

This policy applies to release binaries produced from the public SKÄRMRO source repository.

Repository: https://github.com/Jimmy7610/SKARMRO

## Team roles

Current project roles:

- Authors / committers: [Jimmy7610](https://github.com/Jimmy7610)
- Reviewers: [Jimmy7610](https://github.com/Jimmy7610)
- Release approvers: [Jimmy7610](https://github.com/Jimmy7610)

External contributions must be reviewed before they are merged. Release-signing requests must be manually approved by an authorized release approver.

As the project gains additional maintainers, these roles must be updated before those maintainers participate in release signing.

## Build provenance

Release binaries intended for SignPath signing must:

1. originate from this repository;
2. be built by GitHub Actions on GitHub-hosted Windows runners;
3. be uploaded as GitHub Actions artifacts before a signing request is submitted;
4. use a fixed release version consistently across the signed artifacts;
5. pass the project's automated tests and Windows build validation;
6. be submitted through SignPath's GitHub trusted-build integration;
7. receive manual approval before release signing.

Local developer builds are not eligible for release signing.

## Release artifacts

The intended signed Windows artifacts are:

- SKARMRO Guard Service
- SKARMRO Parent App
- SKARMRO Junior Launcher
- future SKARMRO installer/update packages

Third-party binaries must not be signed as if they were SKARMRO-produced binaries.

## Privacy

See [Privacy policy](PRIVACY.md).

SKÄRMRO is designed around the principle **Boundary, not surveillance**. It does not intentionally collect keystrokes, screen recordings, private messages, passwords, camera content, or microphone content.

## System changes

SKÄRMRO modifies Windows protection configuration only through explicit installation or parent/admin actions. Installation and policy changes must be described to the person installing or operating the software.

## Uninstallation

See [Uninstallation](UNINSTALL.md).

## Security

Release signing must not be used to bypass Smart App Control, Windows security boundaries, or the project's own release checks. If origin verification or signing-policy validation fails, the artifact must not be release-signed.
