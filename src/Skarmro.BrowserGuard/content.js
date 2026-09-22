(() => {
  const rules = globalThis.SkarmroBrowserRules;
  const policy = globalThis.SkarmroBrowserPolicy ?? {
    blockShorts: true,
    blockedChannels: []
  };

  if (!rules) return;

  const redirectIfBlockedNavigation = () => {
    const decision = rules.classifyUrl(location.href, policy);

    if (decision.action === "block-shorts") {
      location.replace("https://www.youtube.com/");
      return true;
    }

    if (decision.action === "hide-channel") {
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

  if (redirectIfBlockedNavigation()) return;

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

  if (document.documentElement) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  }
})();
