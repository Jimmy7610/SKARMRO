const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../src/Skarmro.BrowserGuard/routine-engine.js");

test("day routine is active inside range", () => {
  const r = { enabled:true, start:"08:00", end:"14:00", mode:"focus" };
  assert.equal(engine.isActive(r, 9 * 60), true);
  assert.equal(engine.isActive(r, 15 * 60), false);
});

test("overnight routine spans midnight", () => {
  const r = { enabled:true, start:"20:00", end:"07:00", mode:"pause" };
  assert.equal(engine.isActive(r, 23 * 60), true);
  assert.equal(engine.isActive(r, 2 * 60), true);
  assert.equal(engine.isActive(r, 12 * 60), false);
});

test("disabled routine is never active", () => {
  const r = { enabled:false, start:"00:00", end:"00:00", mode:"pause" };
  assert.equal(engine.isActive(r, 100), false);
});

test("focus routine forces browser protection", () => {
  assert.deepEqual(engine.overridesFor({ mode:"focus" }), {
    forceAutoProtect:true,
    forceBlockShorts:true,
    blockYouTube:false
  });
});

test("pause routine blocks YouTube", () => {
  assert.equal(engine.overridesFor({ mode:"pause" }).blockYouTube, true);
});

test("first active routine wins", () => {
  const routines = [
    { id:"a", enabled:true, start:"08:00", end:"12:00", mode:"focus" },
    { id:"b", enabled:true, start:"09:00", end:"11:00", mode:"pause" }
  ];
  assert.equal(engine.findActive(routines, 10 * 60).id, "a");
});
