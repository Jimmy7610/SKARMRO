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


### WILMA manual validation — Shorts UI filtering

Verified on Chrome 153 with Browser Guard v0.2.0:

- Direct Shorts navigation remains blocked.
- Shorts section in YouTube search results is hidden.
- Normal long-form video results remain visible.

Status: **Shorts search/UI filtering PASS**.

Next manual validation:
- blocked-channel shadow filtering
- channel page redirect
- verify normal channels remain unaffected


## Browser Guard v0.4.0 — Auto Protect

Automatic protection is enabled by default and does not require the parent to configure a blocklist first.

Initial local categories:
- adult content
- drugs and vaping
- gambling
- graphic violence
- self-harm
- strong profanity

Languages in the initial lexicon:
- Swedish
- English

The filter uses token/phrase matching rather than naive substring matching to reduce obvious false positives.

Manual controls remain available:
- blocked channels
- custom blocked words/phrases
- Shorts on/off

Custom blocked words continue to work even if Auto Protect is disabled.

### Product limitation

Auto Protect is fully automatic in operation, but keyword/text classification cannot guarantee perfect detection of all unsuitable content. False positives/negatives must be measured during pilot and improved with fixtures, allowlists and additional classifiers.


### WILMA manual validation — Auto Protect v0.4.2

Verified on Chrome 153:

- automatic gambling search blocking works
- blocked-search notice renders correctly
- category is reported as `gambling`
- safe navigation back to normal YouTube remains available
- Auto Protect and Shorts protection can coexist

Status: **Auto Protect search blocking PASS**.

Next:
- automatic filtering of individual recommended videos/cards on otherwise safe pages
- false-positive checks with safe queries
- blocked-channel interaction with Auto Protect
