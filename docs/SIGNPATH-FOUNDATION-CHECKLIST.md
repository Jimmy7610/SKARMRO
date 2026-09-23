# SignPath Foundation readiness

This checklist tracks preparation for a SignPath Foundation open-source code-signing application.

## Repository

- [x] Public GitHub repository
- [x] OSI-approved license: GPL-3.0-only
- [x] No intentionally proprietary SKÄRMRO component in this repository
- [x] Code signing policy published in repository
- [x] Privacy policy published in repository
- [x] Uninstallation documentation published
- [x] Windows builds run on GitHub-hosted runners
- [x] Automated native build validation
- [x] Public alpha release workflow on GitHub-hosted Windows runner
- [x] SHA-256 checksum file published with release assets
- [x] Public release exists in the same form intended for signing (`v0.1.0-alpha`)
- [x] Release artifacts are built and uploaded by GitHub Actions before signing submission
- [ ] SignPath Foundation application accepted
- [ ] SignPath GitHub App installed and repository access granted
- [ ] SignPath organization/project/policy identifiers configured
- [ ] SIGNPATH_API_TOKEN stored as GitHub Actions secret
- [ ] Origin verification enabled
- [ ] Manual approval required for release signing
- [ ] Signed release artifact verified on Windows with Smart App Control enabled

## Maintainer requirements

- [ ] GitHub MFA confirmed for every maintainer involved in signing
- [ ] SignPath MFA confirmed for every SignPath user
- [x] Current author/committer/reviewer/approver roles documented

## Release requirements

A SignPath release workflow must not be enabled until SignPath has assigned the actual organization ID, project slug and signing policy slug. Placeholder IDs must never be used for a real signing request.
