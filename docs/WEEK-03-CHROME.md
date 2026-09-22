# Gate 0 — Week 3: Managed Chrome

## MVP browser decision

Google Chrome is the only browser supported by the MVP.

Other browsers may be added later if demand justifies the additional enforcement and QA surface.

## Phase 1 — Browser Guard prototype

Current prototype:

- Manifest V3 Chrome extension
- YouTube-only host permissions
- detect `/shorts` navigation
- redirect direct Shorts navigation to YouTube home
- hide links that point to Shorts
- hide `ytd-reel-shelf-renderer` shelves
- watch YouTube SPA/DOM changes
- pure URL-rule tests in GitHub Actions

## Safety / product rules

- Do not inspect private messages.
- Do not record browsing history beyond the minimum events required for policy receipts.
- Do not inject remote code.
- Keep extension permissions minimal.
- DOM filtering is treated as a maintenance-sensitive adapter, not an unbreakable security boundary.

## Later in Week 3

1. detect installed Chrome version/path
2. design per-child Windows Chrome policy placement
3. validate Chrome policy registry behavior on Windows 11 Home
4. decide Chrome Web Store publication path
5. validate force-install / anti-disable behavior
6. define alternate-browser blocking relationship with Process Guard

## Kill criterion for Shorts DOM filtering

If YouTube changes cause the filter to fail frequently, SKÄRMRO must not market the feature as guaranteed. Automated regression fixtures should be added before pilot.


## WILMA manual validation

Verified manually on Windows 11 Home with Chrome 153:

- SKÄRMRO Browser Guard loaded as an unpacked extension.
- Options page rendered correctly.
- `Blockera YouTube Shorts` enabled and saved.
- Attempting to open YouTube Shorts redirects back to normal YouTube.

Status: **direct Shorts navigation PASS**.

Next manual validation:
- confirm Shorts shelves/cards are hidden on YouTube Home
- confirm Shorts results are hidden in search
- confirm blocked-channel shadow filtering
