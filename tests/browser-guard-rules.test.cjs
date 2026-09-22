const test = require("node:test");
const assert = require("node:assert/strict");

const rules = require("../src/Skarmro.BrowserGuard/rules.js");

test("blocks /shorts root", () => {
  assert.equal(rules.isShortsPath("/shorts"), true);
});

test("blocks /shorts/video", () => {
  assert.equal(rules.isShortsPath("/shorts/abc123"), true);
});

test("is case-insensitive", () => {
  assert.equal(rules.isShortsPath("/SHORTS/abc123"), true);
});

test("allows normal watch URL", () => {
  assert.equal(rules.isShortsPath("/watch"), false);
});

test("classifies shorts URL as blocked", () => {
  assert.deepEqual(
    rules.classifyUrl("https://www.youtube.com/shorts/abc123"),
    { action: "block-shorts", reason: "youtube-shorts-path" }
  );
});

test("classifies normal YouTube URL as allowed", () => {
  assert.deepEqual(
    rules.classifyUrl("https://www.youtube.com/watch?v=abc123"),
    { action: "allow", reason: "no-match" }
  );
});

test("recognizes relative shorts href", () => {
  assert.equal(rules.shouldHideAnchor("/shorts/abc123"), true);
});

test("does not hide normal relative watch href", () => {
  assert.equal(rules.shouldHideAnchor("/watch?v=abc123"), false);
});
