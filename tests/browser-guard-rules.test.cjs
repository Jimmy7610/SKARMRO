const test = require("node:test");
const assert = require("node:assert/strict");

const rules = require("../src/Skarmro.BrowserGuard/rules.js");

const policy = {
  blockShorts: true,
  blockedChannels: [
    "handle:blockedcreator",
    "channel:uc123456"
  ]
};

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
    rules.classifyUrl("https://www.youtube.com/shorts/abc123", policy),
    { action: "block-shorts", reason: "youtube-shorts-path" }
  );
});

test("allows shorts when policy disables Shorts blocking", () => {
  assert.deepEqual(
    rules.classifyUrl(
      "https://www.youtube.com/shorts/abc123",
      { ...policy, blockShorts: false }
    ),
    { action: "allow", reason: "no-match" }
  );
});

test("classifies normal YouTube URL as allowed", () => {
  assert.deepEqual(
    rules.classifyUrl("https://www.youtube.com/watch?v=abc123", policy),
    { action: "allow", reason: "no-match" }
  );
});

test("recognizes relative shorts href", () => {
  assert.equal(rules.shouldHideAnchor("/shorts/abc123"), true);
});

test("does not hide normal relative watch href", () => {
  assert.equal(rules.shouldHideAnchor("/watch?v=abc123"), false);
});

test("normalizes channel handle", () => {
  assert.equal(
    rules.normalizeChannelKey("https://www.youtube.com/@BlockedCreator"),
    "handle:blockedcreator"
  );
});

test("normalizes channel id", () => {
  assert.equal(
    rules.normalizeChannelKey("/channel/UC123456"),
    "channel:uc123456"
  );
});

test("blocks configured channel handle", () => {
  assert.deepEqual(
    rules.classifyUrl("https://www.youtube.com/@BlockedCreator", policy),
    {
      action: "hide-channel",
      reason: "blocked-channel",
      channelKey: "handle:blockedcreator"
    }
  );
});

test("blocks configured channel id", () => {
  assert.deepEqual(
    rules.classifyUrl("https://www.youtube.com/channel/UC123456", policy),
    {
      action: "hide-channel",
      reason: "blocked-channel",
      channelKey: "channel:uc123456"
    }
  );
});

test("allows non-blocked channel", () => {
  assert.deepEqual(
    rules.classifyUrl("https://www.youtube.com/@AllowedCreator", policy),
    { action: "allow", reason: "no-match" }
  );
});
