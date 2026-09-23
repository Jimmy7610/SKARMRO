(() => {
  const rules = globalThis.SkarmroBrowserRules;
  if (!rules) return;

  const defaultPolicy = {
    blockShorts: true,
    autoProtect: true,
    customBlockedWords: [],
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

  const hideAutomaticContent = (root = document) => {
    const cardSelectors = [
      "ytd-video-renderer",
      "ytd-rich-item-renderer",
      "ytd-grid-video-renderer",
      "ytd-compact-video-renderer",
      "yt-lockup-view-model"
    ];

    for (const selector of cardSelectors) {
      for (const card of root.querySelectorAll?.(selector) ?? []) {
        if (card.dataset.skarmroHidden) continue;

        const text = (card.textContent || "").trim();
        const decision = rules.classifyText(text, policy);

        if (decision.action === "hide-content") {
          card.style.setProperty("display", "none", "important");
          card.dataset.skarmroHidden = decision.reason;
          card.dataset.skarmroCategory = decision.category || "unknown";
        }
      }
    }

    if (location.pathname === "/watch") {
      const title =
        document.querySelector("ytd-watch-metadata h1")?.textContent ||
        document.querySelector("h1.ytd-watch-metadata")?.textContent ||
        "";

      if (title.trim()) {
        const decision = rules.classifyText(title, policy);
        if (decision.action === "hide-content") {
          location.replace("https://www.youtube.com/");
          return true;
        }
      }
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
    if (hideAutomaticContent()) return;
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

  function channelFromAnchor(anchor) {
    if (!anchor) return null;

    const href = anchor.getAttribute("href") || anchor.href || "";
    const key = rules.normalizeChannelKey(href);
    if (!key) return null;

    const name =
      (anchor.textContent || "").trim() ||
      (anchor.getAttribute("aria-label") || "").trim() ||
      key;

    return { key, name };
  }

  function findCurrentChannel() {
    const candidates = [
      'ytd-watch-metadata #owner a[href^="/@"]',
      'ytd-watch-metadata #owner a[href^="/channel/"]',
      'ytd-watch-metadata ytd-video-owner-renderer a[href^="/@"]',
      'ytd-watch-metadata ytd-video-owner-renderer a[href^="/channel/"]',
      '#above-the-fold #owner a[href^="/@"]',
      '#above-the-fold #owner a[href^="/channel/"]',
      '#meta-contents ytd-channel-name a[href^="/@"]',
      '#meta-contents ytd-channel-name a[href^="/channel/"]',
      'yt-content-metadata-view-model a[href^="/@"]',
      'yt-content-metadata-view-model a[href^="/channel/"]',
      'ytd-video-owner-renderer a[href^="/@"]',
      'ytd-video-owner-renderer a[href^="/channel/"]',
      'ytd-channel-name a[href^="/@"]',
      'ytd-channel-name a[href^="/channel/"]'
    ];

    for (const selector of candidates) {
      const result = channelFromAnchor(document.querySelector(selector));
      if (result) return result;
    }

    const metadataRoots = [
      "ytd-watch-metadata",
      "#above-the-fold",
      "#meta-contents",
      "yt-content-metadata-view-model"
    ];

    for (const rootSelector of metadataRoots) {
      const root = document.querySelector(rootSelector);
      if (!root) continue;

      const anchors = root.querySelectorAll('a[href^="/@"], a[href^="/channel/"]');
      for (const anchor of anchors) {
        const result = channelFromAnchor(anchor);
        if (result) return result;
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
