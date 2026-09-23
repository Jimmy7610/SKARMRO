importScripts("routine-engine.js");

(() => {
  const DEFAULT_ROUTINES = [
    { id:"school", name:"Skola", description:"Skärpt webbskydd", enabled:false, start:"08:00", end:"14:00", mode:"focus" },
    { id:"homework", name:"Läxor", description:"Fokus utan Shorts", enabled:false, start:"16:00", end:"17:30", mode:"focus" },
    { id:"dinner", name:"Middag", description:"Pausa YouTube", enabled:false, start:"18:00", end:"19:00", mode:"pause" },
    { id:"free", name:"Fritid", description:"Normal skyddsnivå", enabled:true, start:"19:00", end:"20:00", mode:"free" },
    { id:"bedtime", name:"Läggdags", description:"YouTube blockeras", enabled:true, start:"20:00", end:"07:00", mode:"pause" }
  ];

  async function appendReceipt(kind, detail) {
    const stored = await chrome.storage.local.get("policyReceipts");
    const receipts = Array.isArray(stored.policyReceipts) ? [...stored.policyReceipts] : [];
    receipts.unshift({
      id: crypto.randomUUID(),
      timestamp:new Date().toISOString(),
      kind,
      detail
    });
    await chrome.storage.local.set({ policyReceipts:receipts.slice(0,100) });
  }

  async function recalculate() {
    const stored = await chrome.storage.local.get(["parentConfig","manualOverride","runtimeState"]);
    const routines = Array.isArray(stored.parentConfig?.routines)
      ? stored.parentConfig.routines
      : DEFAULT_ROUTINES;

    const now = new Date();
    const nowMs = now.getTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const activeRoutine = globalThis.SkarmroRoutineEngine.findActive(routines, currentMinutes);

    let manualOverride = stored.manualOverride || null;
    if (manualOverride?.until && new Date(manualOverride.until).getTime() <= nowMs) {
      manualOverride = null;
      await chrome.storage.local.remove("manualOverride");
      await appendReceipt("override-ended", "Tillfällig ändring återställd automatiskt");
    }

    const routineOverrides = globalThis.SkarmroRoutineEngine.overridesFor(activeRoutine);
    const overrides = { ...routineOverrides };

    if (manualOverride?.type === "pause") {
      overrides.blockYouTube = true;
    } else if (manualOverride?.type === "access") {
      overrides.blockYouTube = false;
    }

    const runtimeState = {
      updatedAt:now.toISOString(),
      activeRoutine,
      manualOverride,
      overrides
    };

    const previous = stored.runtimeState || null;
    await chrome.storage.local.set({ runtimeState });

    const previousId = previous?.activeRoutine?.id || null;
    const nextId = activeRoutine?.id || null;
    if (previousId !== nextId) {
      if (activeRoutine) {
        await appendReceipt("routine-started", activeRoutine.name + " aktiverades");
      } else if (previousId) {
        await appendReceipt("routine-ended", "Aktiv rutin avslutades");
      }
    }

    chrome.action.setBadgeText({ text: overrides.blockYouTube ? "PAUS" : activeRoutine ? "ON" : "" });
    chrome.action.setBadgeBackgroundColor({ color:overrides.blockYouTube ? "#a96b55" : "#4e9f79" });
  }

  chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("skarmro-routine-tick", { periodInMinutes:1 });
    void recalculate();
  });

  chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create("skarmro-routine-tick", { periodInMinutes:1 });
    void recalculate();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "skarmro-routine-tick") void recalculate();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.parentConfig || changes.manualOverride) void recalculate();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "skarmro:receipt") {
      void appendReceipt(message.kind || "browser-event", message.detail || "Skyddshändelse");
      sendResponse({ ok:true });
      return;
    }

    if (message?.type === "skarmro:recalculate") {
      void recalculate();
      sendResponse({ ok:true });
    }
  });

  void recalculate();
})();
