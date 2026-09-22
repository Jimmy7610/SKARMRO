(() => {
  const rules = globalThis.SkarmroBrowserRules;
  if (!rules) return;

  const redirectIfShorts = () => {
    const decision = rules.classifyUrl(location.href);
    if (decision.action === "block-shorts") {
      location.replace("https://www.youtube.com/");
      return true;
    }

    return false;
  };

  const hideShortsLinks = (root = document) => {
    const anchors = root.querySelectorAll?.('a[href]') ?? [];

    for (const anchor of anchors) {
      if (rules.shouldHideAnchor(anchor.getAttribute("href"))) {
        const container =
          anchor.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-reel-shelf-renderer") ||
          anchor;

        container.style.setProperty("display", "none", "important");
        container.dataset.skarmroHidden = "shorts";
      }
    }

    for (const shelf of root.querySelectorAll?.("ytd-reel-shelf-renderer") ?? []) {
      shelf.style.setProperty("display", "none", "important");
      shelf.dataset.skarmroHidden = "shorts-shelf";
    }
  };

  if (redirectIfShorts()) return;

  const scan = () => {
    if (redirectIfShorts()) return;
    hideShortsLinks();
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
