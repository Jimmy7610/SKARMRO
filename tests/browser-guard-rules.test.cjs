const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/Skarmro.BrowserGuard/lexicon.js");
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

test("accepts @handle input", () => {
  assert.deepEqual(
    rules.normalizeBlockedChannelInput("@BlockedCreator"),
    { ok: true, key: "handle:blockedcreator" }
  );
});

test("accepts full channel URL input", () => {
  assert.deepEqual(
    rules.normalizeBlockedChannelInput("https://www.youtube.com/channel/UC123456"),
    { ok: true, key: "channel:uc123456" }
  );
});

test("rejects watch video URL as channel input", () => {
  assert.deepEqual(
    rules.normalizeBlockedChannelInput("https://www.youtube.com/watch?v=abc123"),
    { ok: false, reason: "video-url" }
  );
});

test("rejects Shorts URL as channel input", () => {
  assert.deepEqual(
    rules.normalizeBlockedChannelInput("https://www.youtube.com/shorts/abc123"),
    { ok: false, reason: "video-url" }
  );
});


test("Auto Protect blocks adult content in English", () => {
  const result = rules.classifyText("XXX porn compilation", { autoProtect: true });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "adult");
});

test("Auto Protect blocks adult content in Swedish", () => {
  const result = rules.classifyText("porr och nakenbilder", { autoProtect: true });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "adult");
});

test("Auto Protect blocks drug content", () => {
  const result = rules.classifyText("How vaping and cannabis works", { autoProtect: true });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "drugs");
});

test("Auto Protect blocks gambling content", () => {
  const result = rules.classifyText("Best online casino slots", { autoProtect: true });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "gambling");
});

test("Auto Protect blocks self-harm content", () => {
  const result = rules.classifyText("self harm tutorial", { autoProtect: true });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "selfHarm");
});

test("Auto Protect blocks strong profanity", () => {
  const result = rules.classifyText("this is fucking insane", { autoProtect: true });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "profanity");
});

test("Auto Protect avoids substring false positive", () => {
  const result = rules.classifyText("Essex travel guide", { autoProtect: true });
  assert.equal(result.action, "allow");
});

test("manual custom blocked word works with Auto Protect disabled", () => {
  const result = rules.classifyText("Minecraft scary mod", {
    autoProtect: false,
    customBlockedWords: ["scary mod"]
  });
  assert.equal(result.action, "hide-content");
  assert.equal(result.category, "custom");
});

test("ordinary child-friendly title is allowed", () => {
  const result = rules.classifyText("Funny cats playing with bubbles", { autoProtect: true });
  assert.equal(result.action, "allow");
});
