(() => {
  const rules = globalThis.SkarmroBrowserRules;
  if (!rules) return;

  const defaultPolicy = {
    blockShorts: true,
    blockedChannels: []
  };

  let policy = { ...defaultPolicy };

  const syncDocumentFlags = () => {
    if (!document.documentElement) return;
    document.documentElement.dataset.skarmroBlockShorts =
      policy.blockShorts !== false ? "true" : "false";
  };

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
      const shortsSelectors = [
        "ytd-reel-shelf-renderer",
        "ytm-shorts-lockup-view-model-v2",
        'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
        'ytd-video-renderer:has(a[href^="/shorts/"])',
        'ytd-grid-video-renderer:has(a[href^="/shorts/"])',
        'yt-lockup-view-model:has(a[href^="/shorts/"])'
      ];

      for (const selector of shortsSelectors) {
        for (const node of root.querySelectorAll?.(selector) ?? []) {
          node.style.setProperty("display", "none", "important");
          node.dataset.skarmroHidden = "shorts";
        }
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
    syncDocumentFlags();
  }

  function findCurrentChannel() {
    const candidates = [
      '#owner a[href^="/@"]',
      '#owner a[href^="/channel/"]',
      'ytd-video-owner-renderer a[href^="/@"]',
      'ytd-video-owner-renderer a[href^="/channel/"]',
      'ytd-channel-name a[href^="/@"]',
      'ytd-channel-name a[href^="/channel/"]'
    ];

    for (const selector of candidates) {
      const anchor = document.querySelector(selector);
      const href = anchor?.getAttribute("href");
      const key = rules.normalizeChannelKey(href || "");
      if (key) {
        return {
          key,
          name: (anchor.textContent || "").trim() || key
        };
      }
    }

    const pageKey = rules.normalizeChannelKey(location.href);
    if (pageKey) {
      const heading =
        document.querySelector("ytd-c4-tabbed-header-renderer #channel-name") ||
        document.querySelector("yt-page-header-view-model h1") ||
        document.querySelector("h1");

      return {
        key: pageKey,
        name: (heading?.textContent || "").trim() || pageKey
      };
    }

    return null;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "skarmro:get-current-channel") {
      sendResponse({
        ok: true,
        channel: findCurrentChannel()
      });
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.browserPolicy) return;

    policy = {
      ...defaultPolicy,
      ...(changes.browserPolicy.newValue || {})
    };

    syncDocumentFlags();
    scan();
  });

  loadPolicy()
    .catch(() => {
      policy = { ...defaultPolicy };
      syncDocumentFlags();
    })
    .finally(() => {
      if (document.documentElement) {
        startObserver();
      } else {
        document.addEventListener("DOMContentLoaded", startObserver, { once: true });
      }
    });
})();
