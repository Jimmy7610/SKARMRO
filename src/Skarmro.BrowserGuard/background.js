(() => {
  const DEFAULT_ROUTINES = [
    { id:"school", name:"Skola", description:"Skärpt webbskydd", enabled:false, start:"08:00", end:"14:00", mode:"focus" },
    { id:"homework", name:"Läxor", description:"Fokus utan Shorts", enabled:false, start:"16:00", end:"17:30", mode:"focus" },
    { id:"dinner", name:"Middag", description:"Pausa YouTube", enabled:false, start:"18:00", end:"19:00", mode:"pause" },
    { id:"free", name:"Fritid", description:"Normal skyddsnivå", enabled:true, start:"19:00", end:"20:00", mode:"free" },
    { id:"bedtime", name:"Läggdags", description:"YouTube blockeras", enabled:true, start:"20:00", end:"07:00", mode:"pause" }
  ];

  function minutes(value) {
    const [h,m] = String(value || "00:00").split(":").map(Number);
    return h * 60 + m;
  }

  function isActive(routine, now = new Date()) {
    if (!routine?.enabled) return false;
    const current = now.getHours() * 60 + now.getMinutes();
    const start = minutes(routine.start);
    const end = minutes(routine.end);
    if (start === end) return true;
    if (start < end) return current >= start && current < end;
    return current >= start || current < end;
  }

  async function recalculate() {
    const stored = await chrome.storage.local.get("parentConfig");
    const routines = Array.isArray(stored.parentConfig?.routines)
      ? stored.parentConfig.routines
      : DEFAULT_ROUTINES;

    const activeRoutine = routines.find((r) => isActive(r)) || null;
    const runtimeState = {
      updatedAt:new Date().toISOString(),
      activeRoutine,
      overrides:{
        forceAutoProtect:activeRoutine?.mode === "focus",
        forceBlockShorts:activeRoutine?.mode === "focus",
        blockYouTube:activeRoutine?.mode === "pause"
      }
    };

    await chrome.storage.local.set({ runtimeState });
    chrome.action.setBadgeText({ text: activeRoutine ? "ON" : "" });
    chrome.action.setBadgeBackgroundColor({ color:"#4e9f79" });
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
    if (areaName === "local" && changes.parentConfig) void recalculate();
  });

  void recalculate();
})();
