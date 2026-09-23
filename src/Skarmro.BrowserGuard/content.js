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

  const recordFiltered = async (category) => {
    try {
      const key = category || "unknown";
      const stored = await chrome.storage.session.get("filterStats");
      const stats = stored.filterStats && typeof stored.filterStats === "object"
        ? { ...stored.filterStats }
        : {};

      stats.total = Number(stats.total || 0) + 1;
      stats[key] = Number(stats[key] || 0) + 1;

      await chrome.storage.session.set({ filterStats: stats });
    } catch {
      // Stats are optional and must never affect filtering.
    }
  };

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

  const showBlockedSearchNotice = (decision, query) => {
    if (document.getElementById("skarmro-blocked-search")) return;

    const notice = document.createElement("div");
    notice.id = "skarmro-blocked-search";
    notice.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "background:#0d1117",
      "color:#f3f6fb",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "font-family:system-ui,-apple-system,Segoe UI,sans-serif"
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
      "max-width:620px",
      "width:100%",
      "background:#151b23",
      "border:1px solid #2b3544",
      "border-radius:20px",
      "padding:28px",
      "box-sizing:border-box"
    ].join(";");

    const title = document.createElement("h1");
    title.textContent = "Sökningen blockerades av SKÄRMRO";
    title.style.cssText = "font-size:28px;margin:0 0 12px";

    const body = document.createElement("p");
    body.textContent =
      "Auto Protect bedömde sökningen som olämplig för barn. Sökningen visades därför inte.";
    body.style.cssText = "color:#b7c2cf;font-size:16px;line-height:1.5;margin:0 0 18px";

    const detail = document.createElement("div");
    detail.textContent = "Kategori: " + (decision.category || "skyddad kategori");
    detail.style.cssText = "color:#8fa3b8;font-size:14px;margin-bottom:18px";

    const button = document.createElement("button");
    button.textContent = "Tillbaka till YouTube";
    button.style.cssText = [
      "border:0",
      "border-radius:12px",
      "padding:12px 18px",
      "font-weight:700",
      "cursor:pointer"
    ].join(";");
    button.addEventListener("click", () => {
      location.href = "https://www.youtube.com/";
    });

    panel.append(title, body, detail, button);
    notice.append(panel);
    document.documentElement.append(notice);
  };

  const getCurrentSearchQuery = () => {
    try {
      const fromUrl = new URL(location.href).searchParams.get("search_query") || "";
      if (fromUrl.trim()) return fromUrl.trim();
    } catch {
      // Fall through to visible search UI.
    }

    const selectors = [
      'input[name="search_query"]',
      'ytd-searchbox input#search',
      'input#search',
      'form[action="/results"] input'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      const value = input?.value || input?.getAttribute("value") || "";
      if (String(value).trim()) {
        return String(value).trim();
      }
    }

    return "";
  };

  const blockUnsafeSearch = () => {
    if (location.pathname !== "/results") return false;

    const query = getCurrentSearchQuery();
    if (!query) return false;

    const decision = rules.classifyText(query, policy);
    if (decision.action !== "hide-content") return false;

    showBlockedSearchNotice(decision, query);

    if (!document.documentElement.dataset.skarmroSearchCounted) {
      document.documentElement.dataset.skarmroSearchCounted = "true";
      void recordFiltered(decision.category || "search");
    }

    return true;
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
          void recordFiltered(decision.category || "unknown");
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
          void recordFiltered(decision.category || "watch");
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
    if (blockUnsafeSearch()) return;
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

    if (message?.type === "skarmro:get-protection-status") {
      const query = location.pathname === "/results" ? getCurrentSearchQuery() : "";
      const queryDecision = query ? rules.classifyText(query, policy) : null;

      sendResponse({
        ok: true,
        status: {
          autoProtect: policy.autoProtect !== false,
          blockShorts: policy.blockShorts !== false,
          query,
          queryDecision,
          url: location.href
        }
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
