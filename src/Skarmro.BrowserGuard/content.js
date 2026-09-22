(() => {
  const rules = globalThis.SkarmroBrowserRules;
  if (!rules) return;

  const defaultPolicy = {
    blockShorts: true,
    blockedChannels: []
  };

  let policy = { ...defaultPolicy };

  const redirectIfBlockedNavigation = () => {
    const decision = rules.classifyUrl(location.href, policy);

    if (decision.action === "block-shorts" || decision.action === "hide-channel") {
      location.replace("https://www.youtube.com/");
      return true;
    }

    return false;
  };

  const hideBlockedContent = (root = document) => {
    const anchors = root.querySelectorAll?.("a[href]") ?? [];

    for (const anchor of anchors) {
      const href = anchor.getAttribute("href");
      const decision = rules.classifyUrl(href, policy);

      if (decision.action === "block-shorts" || decision.action === "hide-channel") {
        const container =
          anchor.closest(
            "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-reel-shelf-renderer, ytd-channel-renderer, ytd-compact-video-renderer"
          ) || anchor;

        container.style.setProperty("display", "none", "important");
        container.dataset.skarmroHidden = decision.reason;
      }
    }

    if (policy.blockShorts !== false) {
      for (const shelf of root.querySelectorAll?.("ytd-reel-shelf-renderer") ?? []) {
        shelf.style.setProperty("display", "none", "important");
        shelf.dataset.skarmroHidden = "shorts-shelf";
      }
    }
  };

  const scan = () => {
    if (redirectIfBlockedNavigation()) return;
    hideBlockedContent();
  };

  const startObserver = () => {
    scan();

    const observer = new MutationObserver(() => scan());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    let previousUrl = location.href;
    window.setInterval(() => {
      if (location.href !== previousUrl) {
        previousUrl = location.href;
        scan();
      }
    }, 500);
  };

  async function loadPolicy() {
    const stored = await chrome.storage.local.get("browserPolicy");
    policy = {
      ...defaultPolicy,
      ...(stored.browserPolicy || {})
    };
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.browserPolicy) return;

    policy = {
      ...defaultPolicy,
      ...(changes.browserPolicy.newValue || {})
    };

    scan();
  });

  loadPolicy()
    .catch(() => {
      policy = { ...defaultPolicy };
    })
    .finally(() => {
      if (document.documentElement) {
        startObserver();
      } else {
        document.addEventListener("DOMContentLoaded", startObserver, { once: true });
      }
    });
})();
