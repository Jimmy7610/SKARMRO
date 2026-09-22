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

    normalizeBlockedChannelInput(value) {
      if (typeof value !== "string") {
        return { ok: false, reason: "invalid" };
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return { ok: false, reason: "empty" };
      }

      if (trimmed.startsWith("@") && trimmed.length > 1) {
        return {
          ok: true,
          key: "handle:" + trimmed.slice(1).toLowerCase()
        };
      }

      if (/^UC[A-Za-z0-9_-]+$/.test(trimmed)) {
        return {
          ok: true,
          key: "channel:" + trimmed.toLowerCase()
        };
      }

      try {
        const url = new URL(trimmed, "https://www.youtube.com");

        if (url.pathname === "/watch" || api.isShortsPath(url.pathname)) {
          return { ok: false, reason: "video-url" };
        }
      } catch {
        return { ok: false, reason: "invalid" };
      }

      const channelKey = api.normalizeChannelKey(trimmed);
      if (channelKey) {
        return { ok: true, key: channelKey };
      }

      return { ok: false, reason: "not-channel" };
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
