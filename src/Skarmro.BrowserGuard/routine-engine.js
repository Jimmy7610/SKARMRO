(() => {
  const api = {
    toMinutes(value) {
      const [h,m] = String(value || "00:00").split(":").map(Number);
      return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
    },

    isActive(routine, nowMinutes) {
      if (!routine?.enabled) return false;
      const start = api.toMinutes(routine.start);
      const end = api.toMinutes(routine.end);
      const current = Number(nowMinutes);

      if (!Number.isFinite(current)) return false;
      if (start === end) return true;
      if (start < end) return current >= start && current < end;
      return current >= start || current < end;
    },

    findActive(routines, nowMinutes) {
      return (Array.isArray(routines) ? routines : []).find((r) => api.isActive(r, nowMinutes)) || null;
    },

    overridesFor(routine) {
      return {
        forceAutoProtect:routine?.mode === "focus",
        forceBlockShorts:routine?.mode === "focus",
        blockYouTube:routine?.mode === "pause"
      };
    }
  };

  globalThis.SkarmroRoutineEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
