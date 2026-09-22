(() => {
  const rules = globalThis.SkarmroBrowserRules;

  const blockShorts = document.getElementById("blockShorts");
  const blockedChannels = document.getElementById("blockedChannels");
  const save = document.getElementById("save");
  const status = document.getElementById("status");

  const defaultPolicy = {
    blockShorts: true,
    blockedChannels: []
  };

  function normalizeInputLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("@")) {
      return "handle:" + trimmed.slice(1).toLowerCase();
    }

    const channelKey = rules?.normalizeChannelKey(trimmed);
    if (channelKey) return channelKey;

    if (/^UC[A-Za-z0-9_-]+$/.test(trimmed)) {
      return "channel:" + trimmed.toLowerCase();
    }

    return null;
  }

  async function load() {
    const stored = await chrome.storage.local.get("browserPolicy");
    const policy = {
      ...defaultPolicy,
      ...(stored.browserPolicy || {})
    };

    blockShorts.checked = policy.blockShorts !== false;
    blockedChannels.value = (policy.blockedChannels || [])
      .map((value) => {
        if (value.startsWith("handle:")) return "@" + value.slice("handle:".length);
        if (value.startsWith("channel:")) return value.slice("channel:".length);
        return value;
      })
      .join("\n");
  }

  async function persist() {
    const rawLines = blockedChannels.value.split(/\r?\n/);
    const normalized = rawLines
      .map(normalizeInputLine)
      .filter(Boolean);

    const unique = [...new Set(normalized)];

    await chrome.storage.local.set({
      browserPolicy: {
        blockShorts: blockShorts.checked,
        blockedChannels: unique
      }
    });

    status.textContent = "Sparat.";
    window.setTimeout(() => {
      status.textContent = "";
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
