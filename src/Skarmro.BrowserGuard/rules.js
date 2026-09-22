(() => {
  const api = {
    isShortsPath(pathname) {
      if (typeof pathname !== "string") return false;
      const normalized = pathname.toLowerCase();
      return normalized === "/shorts" || normalized.startsWith("/shorts/");
    },

    shouldHideAnchor(href) {
      if (typeof href !== "string") return false;

      try {
        const url = new URL(href, "https://www.youtube.com");
        return api.isShortsPath(url.pathname);
      } catch {
        return false;
      }
    },

    classifyUrl(value) {
      try {
        const url = new URL(value, "https://www.youtube.com");
        if (api.isShortsPath(url.pathname)) {
          return { action: "block-shorts", reason: "youtube-shorts-path" };
        }

        return { action: "allow", reason: "no-match" };
      } catch {
        return { action: "allow", reason: "invalid-url" };
      }
    }
  };

  globalThis.SkarmroBrowserRules = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
