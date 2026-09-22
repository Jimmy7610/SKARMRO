# Decision 003 — Chrome consumer mode

## Status
Accepted.

## Finding

Chrome's enterprise policy documentation warns that using enterprise policies outside an organization in a publicly distributed program can be treated as unwanted or malware-like behavior.

SKÄRMRO is a consumer parental-control product, not an enterprise management product.

## Decision

The MVP will **not** silently write Chrome Enterprise policy registry keys on family PCs.

Chrome remains the MVP browser, but SKÄRMRO Browser Guard is delivered as a normal Chrome extension.

## Consequence

A normal extension can be disabled or removed by the browser user. Therefore SKÄRMRO must not claim that Browser Guard alone is an unbreakable security boundary.

Protection is split into:

1. Browser Guard — content filtering and YouTube-specific behavior.
2. SKÄRMRO Guard Service — Windows-level policy/enforcement.
3. Protection Health — detect whether Browser Guard is present/healthy.
4. Parent notification / policy receipt — report protection degradation.

## Future options

- Chrome Web Store distribution.
- Native Messaging bridge between extension and Guard Service.
- A dedicated SKÄRMRO browser shell if Chrome tamper resistance is insufficient.
- Enterprise policy support only for explicitly managed organizational deployments.

## Product rule

Never lower or bypass Windows/Chrome security silently to make SKÄRMRO work.
