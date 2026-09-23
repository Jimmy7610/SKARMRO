(() => {
  const categories = Object.freeze({
    adult: {
      label: "Vuxeninnehåll",
      terms: [
        "porn", "porno", "pornography", "xxx", "nude", "nudity",
        "sexual", "onlyfans", "escort", "porr", "naken", "nakenbild",
        "nakenbilder", "sexuell", "sexuellt innehåll"
      ]
    },
    drugs: {
      label: "Droger och vape",
      terms: [
        "cocaine", "heroin", "meth", "methamphetamine", "fentanyl",
        "ecstasy", "mdma", "marijuana", "cannabis", "weed", "vape",
        "vaping", "kokain", "heroin", "metamfetamin", "fentanyl",
        "ecstasy", "cannabis", "marijuana", "vejpa", "vaping"
      ]
    },
    gambling: {
      label: "Gambling",
      terms: [
        "casino", "gambling", "betting", "sportsbook", "slot machine",
        "slots", "online casino", "kasino", "spelautomat", "betting"
      ]
    },
    violence: {
      label: "Grovt våld",
      terms: [
        "gore", "beheading", "decapitation", "execution video",
        "torture", "murder footage", "shooting footage", "stabbing",
        "beheaded", "dismemberment", "halshuggning", "avrättning",
        "tortyr", "mordfilm", "skjutning", "knivhuggning"
      ]
    },
    selfHarm: {
      label: "Självskada",
      terms: [
        "suicide", "self harm", "self-harm", "how to cut yourself",
        "kill myself", "självmord", "självskada", "skära sig",
        "ta livet av mig"
      ]
    },
    profanity: {
      label: "Grovt språk",
      terms: [
        "fuck", "fucking", "motherfucker", "cunt", "asshole",
        "jävla", "fitta", "kuk", "hora", "helvete"
      ]
    }
  });

  globalThis.SkarmroAutoProtectLexicon = categories;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = categories;
  }
})();
