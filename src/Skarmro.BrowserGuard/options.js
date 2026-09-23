(() => {
  const rules = globalThis.SkarmroBrowserRules;

  const autoProtect = document.getElementById("autoProtect");
  const blockShorts = document.getElementById("blockShorts");
  const customBlockedWords = document.getElementById("customBlockedWords");
  const blockedChannels = document.getElementById("blockedChannels");
  const save = document.getElementById("save");
  const status = document.getElementById("status");

  const defaultPolicy = {
    blockShorts: true,
    autoProtect: true,
    customBlockedWords: [],
    blockedChannels: []
  };

  function explainInvalidChannel(line, result) {
    if (result.reason === "video-url") {
      return `"${line}" är en videolänk, inte en kanal. Klicka på kanalnamnet under videon och kopiera kanalens adress i stället.`;
    }

    return `"${line}" känns inte igen som en YouTube-kanal. Använd @handle eller en kanaladress.`;
  }

  async function load() {
    const stored = await chrome.storage.local.get("browserPolicy");
    const policy = {
      ...defaultPolicy,
      ...(stored.browserPolicy || {})
    };

    autoProtect.checked = policy.autoProtect !== false;
    blockShorts.checked = policy.blockShorts !== false;
    customBlockedWords.value = (policy.customBlockedWords || []).join("\n");
    blockedChannels.value = (policy.blockedChannels || [])
      .map((value) => {
        if (value.startsWith("handle:")) return "@" + value.slice("handle:".length);
        if (value.startsWith("channel:")) return value.slice("channel:".length);
        return value;
      })
      .join("\n");
  }

  async function persist() {
    const rawLines = blockedChannels.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const normalized = [];
    const invalid = [];

    for (const line of rawLines) {
      const result = rules?.normalizeBlockedChannelInput(line) ?? {
        ok: false,
        reason: "invalid"
      };

      if (result.ok) {
        normalized.push(result.key);
      } else {
        invalid.push(explainInvalidChannel(line, result));
      }
    }

    if (invalid.length > 0) {
      status.textContent = invalid[0];
      status.dataset.state = "error";
      return;
    }

    const unique = [...new Set(normalized)];
    const customWords = customBlockedWords.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    await chrome.storage.local.set({
      browserPolicy: {
        autoProtect: autoProtect.checked,
        blockShorts: blockShorts.checked,
        customBlockedWords: [...new Set(customWords)],
        blockedChannels: unique
      }
    });

    status.dataset.state = "success";
    status.textContent = "Sparat.";
    window.setTimeout(() => {
      status.textContent = "";
      delete status.dataset.state;
    }, 1800);
  }

  save.addEventListener("click", () => {
    persist().catch((error) => {
      status.textContent = "Kunde inte spara: " + error.message;
    });
  });

  load().catch((error) => {
    status.textContent = "Kunde inte läsa inställningar: " + error.message;
  });
})();
