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

    normalizeChannelKey(value) {
      if (typeof value !== "string") return null;

      try {
        const url = new URL(value, "https://www.youtube.com");
        const path = url.pathname.replace(/\/+$/, "");

        const handleMatch = path.match(/^\/@([^/]+)$/i);
        if (handleMatch) {
          return "handle:" + handleMatch[1].toLowerCase();
        }

        const channelMatch = path.match(/^\/channel\/([^/]+)$/i);
        if (channelMatch) {
          return "channel:" + channelMatch[1].toLowerCase();
        }

        return null;
      } catch {
        return null;
      }
    },

    classifyUrl(value, policy = {}) {
      try {
        const url = new URL(value, "https://www.youtube.com");

        if (policy.blockShorts !== false && api.isShortsPath(url.pathname)) {
          return { action: "block-shorts", reason: "youtube-shorts-path" };
        }

        const channelKey = api.normalizeChannelKey(url.href);
        const blockedChannels = Array.isArray(policy.blockedChannels)
          ? policy.blockedChannels.map((item) => String(item).toLowerCase())
          : [];

        if (channelKey && blockedChannels.includes(channelKey)) {
          return { action: "hide-channel", reason: "blocked-channel", channelKey };
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
