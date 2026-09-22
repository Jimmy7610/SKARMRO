# Gate 0 — Week 2: App enforcement

## Goal

Prove whether SKÄRMRO can use AppLocker as the first application-enforcement adapter on the real Windows 11 Home test PC.

Microsoft currently documents that Windows 10 2004+ and all Windows 11 editions can configure and enforce AppLocker after KB5024351. We still validate this on real hardware before making it a product dependency.

## Safety rule

We do **not** apply a half-built AppLocker policy.

Week 2 starts with:

1. capability detection
2. a dedicated harmless probe executable
3. generation of a non-enforced hash-rule test policy
4. simulation with `Test-AppLockerPolicy`
5. only after simulation is understood do we build a complete enforceable child policy
6. rollback must exist before enforcement

## Run order

As Administrator:

    git pull
    Set-ExecutionPolicy -Scope Process Bypass
    .\scripts\week2\01-check-applocker.ps1
    .\scripts\week2\02-build-blocked-probe.ps1
    .\scripts\week2\03-generate-test-policy.ps1
    .\scripts\week2\04-validate-test-policy.ps1

The first four steps do not intentionally enable AppLocker enforcement.
