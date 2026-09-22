(() => {
  const channelName = document.getElementById("channelName");
  const toggleChannel = document.getElementById("toggleChannel");
  const status = document.getElementById("status");
  const openOptions = document.getElementById("openOptions");

  let currentChannel = null;
  let blockedChannels = [];

  function isBlocked(key) {
    return blockedChannels.includes(String(key).toLowerCase());
  }

  function render() {
    if (!currentChannel) {
      channelName.textContent = "Ingen kanal hittades på den här sidan.";
      toggleChannel.disabled = true;
      toggleChannel.textContent = "Blockera den här kanalen";
      return;
    }

    channelName.textContent = currentChannel.name || currentChannel.key;
    toggleChannel.disabled = false;
    toggleChannel.textContent = isBlocked(currentChannel.key)
      ? "Tillåt den här kanalen"
      : "Blockera den här kanalen";
  }

  async function loadPolicy() {
    const stored = await chrome.storage.local.get("browserPolicy");
    blockedChannels = Array.isArray(stored.browserPolicy?.blockedChannels)
      ? stored.browserPolicy.blockedChannels.map((item) => String(item).toLowerCase())
      : [];
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function detectCurrentChannel() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url?.includes("youtube.com")) {
      currentChannel = null;
      render();
      return;
    }

    currentChannel = null;
    channelName.textContent = "Letar efter kanal…";
    toggleChannel.disabled = true;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "skarmro:get-current-channel"
        });

        if (response?.channel) {
          currentChannel = response.channel;
          break;
        }
      } catch {
        // The content script may not be ready yet.
      }

      await delay(350);
    }

    render();
  }

  async function toggleCurrentChannel() {
    if (!currentChannel) return;

    const stored = await chrome.storage.local.get("browserPolicy");
    const policy = {
      blockShorts: stored.browserPolicy?.blockShorts !== false,
      blockedChannels: Array.isArray(stored.browserPolicy?.blockedChannels)
        ? [...stored.browserPolicy.blockedChannels]
        : []
    };

    const key = currentChannel.key.toLowerCase();
    const existing = policy.blockedChannels
      .map((item) => String(item).toLowerCase())
      .indexOf(key);

    if (existing >= 0) {
      policy.blockedChannels.splice(existing, 1);
      status.textContent = "Kanalen är nu tillåten.";
    } else {
      policy.blockedChannels.push(key);
      status.textContent = "Kanalen är nu blockerad.";
    }

    policy.blockedChannels = [...new Set(policy.blockedChannels)];

    await chrome.storage.local.set({ browserPolicy: policy });
    blockedChannels = policy.blockedChannels.map((item) => String(item).toLowerCase());
    render();
  }

  toggleChannel.addEventListener("click", () => {
    toggleCurrentChannel().catch((error) => {
      status.textContent = "Kunde inte ändra kanal: " + error.message;
    });
  });

  openOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  Promise.all([loadPolicy(), detectCurrentChannel()])
    .then(render)
    .catch((error) => {
      status.textContent = "Kunde inte läsa sidan: " + error.message;
    });
})();
