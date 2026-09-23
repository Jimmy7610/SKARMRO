(() => {
  const rules = globalThis.SkarmroBrowserRules;

  const DEFAULT_ROUTINES = [
    { id:"school", name:"Skola", description:"Skärpt webbskydd", enabled:false, start:"08:00", end:"14:00", mode:"focus" },
    { id:"homework", name:"Läxor", description:"Fokus utan Shorts", enabled:false, start:"16:00", end:"17:30", mode:"focus" },
    { id:"dinner", name:"Middag", description:"Pausa YouTube", enabled:false, start:"18:00", end:"19:00", mode:"pause" },
    { id:"free", name:"Fritid", description:"Normal skyddsnivå", enabled:true, start:"19:00", end:"20:00", mode:"free" },
    { id:"bedtime", name:"Läggdags", description:"YouTube blockeras", enabled:true, start:"20:00", end:"07:00", mode:"pause" }
  ];

  const defaultPolicy = {
    autoProtect:true,
    blockShorts:true,
    autoCategories:{
      adult:true, drugs:true, gambling:true, violence:true, selfHarm:true, profanity:true
    },
    customBlockedWords:[],
    blockedChannels:[]
  };

  const defaultParentConfig = {
    routines: DEFAULT_ROUTINES,
    allowedApps:["Calculator","Paint"],
    blockedApps:["PowerShell","Registry Editor"]
  };

  const $ = (id) => document.getElementById(id);
  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => [...document.querySelectorAll(selector)];

  const refs = {
    autoProtect:$("autoProtect"),
    blockShorts:$("blockShorts"),
    customBlockedWords:$("customBlockedWords"),
    blockedChannels:$("blockedChannels"),
    allowedApps:$("allowedApps"),
    blockedApps:$("blockedApps"),
    routineEditor:$("routineEditor"),
    saveAll:$("saveAll"),
    saveState:$("saveState"),
    toast:$("toast")
  };

  let state = {
    policy: structuredClone(defaultPolicy),
    parentConfig: structuredClone(defaultParentConfig),
    runtimeState:null,
    filterStats:{},
    receipts:[],
    manualOverride:null
  };

  const viewTitles = {
    overview:"Översikt",
    protection:"Webbskydd",
    routines:"Rutiner",
    apps:"Appar",
    health:"Protection Health"
  };

  function showToast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add("show");
    window.setTimeout(() => refs.toast.classList.remove("show"), 1800);
  }

  function markDirty() {
    refs.saveState.textContent = "Osparade ändringar";
    refs.saveState.style.color = "#f3c46b";
  }

  function splitLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function explainInvalidChannel(line, result) {
    if (result.reason === "video-url") {
      return `"${line}" är en videolänk. Blockera kanalen direkt från SKÄRMRO-popupen på videon i stället.`;
    }
    return `"${line}" känns inte igen som en YouTube-kanal.`;
  }

  function normalizeChannels() {
    const normalized = [];
    for (const line of splitLines(refs.blockedChannels.value)) {
      const result = rules?.normalizeBlockedChannelInput(line) ?? { ok:false, reason:"invalid" };
      if (!result.ok) throw new Error(explainInvalidChannel(line, result));
      normalized.push(result.key);
    }
    return [...new Set(normalized)];
  }

  function categoryMapFromUi() {
    return {
      adult:$("catAdult").checked,
      drugs:$("catDrugs").checked,
      gambling:$("catGambling").checked,
      violence:$("catViolence").checked,
      selfHarm:$("catSelfHarm").checked,
      profanity:$("catProfanity").checked
    };
  }

  function categoryMapToUi(categories) {
    $("catAdult").checked = categories.adult !== false;
    $("catDrugs").checked = categories.drugs !== false;
    $("catGambling").checked = categories.gambling !== false;
    $("catViolence").checked = categories.violence !== false;
    $("catSelfHarm").checked = categories.selfHarm !== false;
    $("catProfanity").checked = categories.profanity !== false;
  }

  function renderRoutines() {
    refs.routineEditor.innerHTML = "";
    for (const routine of state.parentConfig.routines) {
      const row = document.createElement("div");
      row.className = "routine-row";
      row.dataset.routineId = routine.id;
      row.innerHTML = `
        <input class="routine-toggle" type="checkbox" ${routine.enabled ? "checked" : ""} aria-label="Aktivera ${routine.name}">
        <div>
          <div class="routine-name">${routine.name}</div>
          <div class="routine-desc">${routine.description}</div>
        </div>
        <input class="routine-start" type="time" value="${routine.start}">
        <input class="routine-end" type="time" value="${routine.end}">
        <select class="routine-mode">
          <option value="focus" ${routine.mode==="focus"?"selected":""}>Fokus</option>
          <option value="free" ${routine.mode==="free"?"selected":""}>Normal</option>
          <option value="pause" ${routine.mode==="pause"?"selected":""}>Pausa YouTube</option>
        </select>
      `;
      refs.routineEditor.appendChild(row);
    }

    refs.routineEditor.querySelectorAll("input,select").forEach((el) => {
      el.addEventListener("change", markDirty);
    });
  }

  function readRoutinesFromUi() {
    return [...refs.routineEditor.querySelectorAll(".routine-row")].map((row) => {
      const original = state.parentConfig.routines.find((r) => r.id === row.dataset.routineId);
      return {
        ...original,
        enabled:row.querySelector(".routine-toggle").checked,
        start:row.querySelector(".routine-start").value,
        end:row.querySelector(".routine-end").value,
        mode:row.querySelector(".routine-mode").value
      };
    });
  }

  function formatMode(mode) {
    if (mode === "focus") return "Fokus";
    if (mode === "pause") return "YouTube pausat";
    return "Normal";
  }

  function formatUntil(value) {
    if (!value) return "";
    try {
      return new Date(value).toLocaleTimeString("sv-SE", { hour:"2-digit", minute:"2-digit" });
    } catch {
      return "";
    }
  }

  function renderReceipts() {
    const list = $("receiptList");
    if (!list) return;
    list.innerHTML = "";

    const receipts = state.receipts.slice(0,12);
    if (receipts.length === 0) {
      list.innerHTML = '<div class="receipt-empty">Inga Policy Receipts ännu.</div>';
      return;
    }

    for (const receipt of receipts) {
      const row = document.createElement("div");
      row.className = "receipt-row";
      const time = new Date(receipt.timestamp).toLocaleString("sv-SE", {
        month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"
      });
      row.innerHTML = `
        <div class="receipt-time">${time}</div>
        <div><div class="receipt-kind">${receipt.kind}</div><div class="receipt-detail">${receipt.detail}</div></div>
        <div class="health-badge good">KVITTO</div>
      `;
      list.appendChild(row);
    }
  }

  function renderOverride() {
    const el = $("overrideStatus");
    if (!el) return;

    const override = state.manualOverride;
    if (!override?.until) {
      el.textContent = "Ingen tillfällig ändring aktiv.";
      return;
    }

    const label = override.type === "pause" ? "YouTube pausat" : "Extra tid";
    el.textContent = `${label} till ${formatUntil(override.until)}. Återställs automatiskt.`;
  }

  function renderOverview() {
    $("overviewAutoProtect").textContent = state.policy.autoProtect !== false ? "På" : "Av";
    $("overviewShorts").textContent = state.policy.blockShorts !== false ? "Blockeras" : "Tillåts";
    $("healthAutoOverview").textContent = state.policy.autoProtect !== false ? "Aktiv" : "Av";
    $("healthShortsOverview").textContent = state.policy.blockShorts !== false ? "Aktiv" : "Av";

    const active = state.runtimeState?.activeRoutine;
    $("overviewRoutine").textContent = active?.name || "Ingen";
    $("overviewRoutineHint").textContent = active ? formatMode(active.mode) : "Normal skyddsnivå";

    const total = Number(state.filterStats.total || 0);
    $("overviewFiltered").textContent = String(total);
    renderOverride();
    renderReceipts();

    const heartbeatTime = state.runtimeState?.updatedAt ? new Date(state.runtimeState.updatedAt).getTime() : 0;
    const heartbeatAge = heartbeatTime ? Date.now() - heartbeatTime : Number.POSITIVE_INFINITY;
    const runtimeHealthy = heartbeatAge < 3 * 60 * 1000;

    $("overviewExtensionHealth").textContent = runtimeHealthy ? "Aktiv" : "Ingen färsk heartbeat";
    $("overviewExtensionHealth").className = runtimeHealthy ? "good-text" : "warn-text";
    $("overviewHealthBadge").textContent = runtimeHealthy ? "Browser Guard OK" : "Kontrollera extension";
    $("overviewHealthBadge").className = "health-badge " + (runtimeHealthy ? "good" : "warn");
    $("browserHealthText").textContent = runtimeHealthy
      ? "Background-runtime har lämnat en färsk heartbeat."
      : "Ingen färsk runtime-heartbeat hittades. Ladda om eller kontrollera extensionen.";
    $("browserHealthBadge").textContent = runtimeHealthy ? "OK" : "VARNING";

    $("healthAutoText").textContent = state.policy.autoProtect !== false
      ? "Aktivt och konfigurerat."
      : "Avstängt av föräldern.";
    $("healthAutoBadge").textContent = state.policy.autoProtect !== false ? "OK" : "AV";

    const today = $("todayRoutines");
    today.innerHTML = "";
    const enabled = state.parentConfig.routines.filter((r) => r.enabled);
    if (enabled.length === 0) {
      today.innerHTML = '<div class="muted">Inga rutiner aktiverade.</div>';
    } else {
      for (const r of enabled) {
        const div = document.createElement("div");
        div.className = "routine-preview-row";
        div.innerHTML = `<span><strong>${r.name}</strong><br><small>${formatMode(r.mode)}</small></span><span>${r.start}–${r.end}</span>`;
        today.appendChild(div);
      }
    }
  }

  function hydrateForm() {
    refs.autoProtect.checked = state.policy.autoProtect !== false;
    refs.blockShorts.checked = state.policy.blockShorts !== false;
    categoryMapToUi(state.policy.autoCategories || {});
    refs.customBlockedWords.value = (state.policy.customBlockedWords || []).join("\n");
    refs.blockedChannels.value = (state.policy.blockedChannels || [])
      .map((value) => value.startsWith("handle:") ? "@" + value.slice(7) : value.startsWith("channel:") ? value.slice(8) : value)
      .join("\n");
    refs.allowedApps.value = (state.parentConfig.allowedApps || []).join("\n");
    refs.blockedApps.value = (state.parentConfig.blockedApps || []).join("\n");
    renderRoutines();
    renderOverview();
  }

  async function load() {
    const local = await chrome.storage.local.get(["browserPolicy","parentConfig","runtimeState","policyReceipts","manualOverride"]);
    const session = await chrome.storage.session.get("filterStats");

    state.policy = {
      ...defaultPolicy,
      ...(local.browserPolicy || {}),
      autoCategories:{
        ...defaultPolicy.autoCategories,
        ...(local.browserPolicy?.autoCategories || {})
      }
    };
    state.parentConfig = {
      ...defaultParentConfig,
      ...(local.parentConfig || {}),
      routines:Array.isArray(local.parentConfig?.routines) ? local.parentConfig.routines : structuredClone(DEFAULT_ROUTINES)
    };
    state.runtimeState = local.runtimeState || null;
    state.filterStats = session.filterStats || {};
    state.receipts = Array.isArray(local.policyReceipts) ? local.policyReceipts : [];
    state.manualOverride = local.manualOverride || null;

    $("appVersion").textContent = chrome.runtime.getManifest().version;
    hydrateForm();
  }

  async function setManualOverride(type, minutes) {
    if (type === "clear") {
      await chrome.storage.local.remove("manualOverride");
      state.manualOverride = null;
      await chrome.runtime.sendMessage({ type:"skarmro:receipt", kind:"override-cleared", detail:"Tillfällig ändring avslutades av föräldern" });
      await chrome.runtime.sendMessage({ type:"skarmro:recalculate" });
      renderOverride();
      showToast("Tillfällig ändring återställd");
      return;
    }

    const until = new Date(Date.now() + Number(minutes) * 60000).toISOString();
    const manualOverride = { type, until, createdAt:new Date().toISOString() };
    await chrome.storage.local.set({ manualOverride });
    state.manualOverride = manualOverride;

    const detail = type === "pause"
      ? `YouTube pausat i ${minutes} minuter`
      : `Extra YouTube-tid i ${minutes} minuter`;

    await chrome.runtime.sendMessage({ type:"skarmro:receipt", kind:type === "pause" ? "pause-now" : "temporary-access", detail });
    await chrome.runtime.sendMessage({ type:"skarmro:recalculate" });
    renderOverride();
    showToast(detail);
  }

  async function save() {
    try {
      const policy = {
        autoProtect:refs.autoProtect.checked,
        blockShorts:refs.blockShorts.checked,
        autoCategories:categoryMapFromUi(),
        customBlockedWords:[...new Set(splitLines(refs.customBlockedWords.value))],
        blockedChannels:normalizeChannels()
      };
      const parentConfig = {
        routines:readRoutinesFromUi(),
        allowedApps:[...new Set(splitLines(refs.allowedApps.value))],
        blockedApps:[...new Set(splitLines(refs.blockedApps.value))]
      };

      await chrome.storage.local.set({ browserPolicy:policy, parentConfig });
      await chrome.runtime.sendMessage({
        type:"skarmro:receipt",
        kind:"policy-saved",
        detail:"Föräldrainställningar och rutiner sparades"
      });
      state.policy = policy;
      state.parentConfig = parentConfig;
      refs.saveState.textContent = "Alla ändringar sparade";
      refs.saveState.style.color = "";
      renderOverview();
      showToast("SKÄRMRO-inställningarna är sparade");
    } catch (error) {
      refs.saveState.textContent = "Kunde inte spara";
      refs.saveState.style.color = "#f08b8b";
      showToast(error.message || "Kunde inte spara");
    }
  }

  function activateView(name) {
    qsa(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    qsa(".view").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === name));
    $("viewTitle").textContent = viewTitles[name] || "SKÄRMRO";
  }

  qsa(".nav-item").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.view)));
  qsa(".jump").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.jump)));
  refs.saveAll.addEventListener("click", save);

  qsa(".quick-action").forEach((button) => {
    button.addEventListener("click", () => {
      setManualOverride(button.dataset.override, button.dataset.minutes)
        .catch((error) => showToast(error.message || "Kunde inte ändra tillgång"));
    });
  });

  document.addEventListener("change", (event) => {
    if (event.target.closest(".main")) markDirty();
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches("textarea")) markDirty();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.runtimeState) {
      state.runtimeState = changes.runtimeState.newValue || null;
      renderOverview();
    }
    if (changes.policyReceipts) {
      state.receipts = Array.isArray(changes.policyReceipts.newValue) ? changes.policyReceipts.newValue : [];
      renderReceipts();
    }
    if (changes.manualOverride) {
      state.manualOverride = changes.manualOverride.newValue || null;
      renderOverride();
    }
  });

  load().catch((error) => {
    refs.saveState.textContent = "Kunde inte läsa inställningar";
    refs.saveState.style.color = "#f08b8b";
    showToast(error.message || "Startfel");
  });
})();
