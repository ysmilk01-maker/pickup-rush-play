const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const platform = {
  kind: window.ReactNativeWebView ? "native-webview" : (window.TossApp ? "apps-in-toss" : "web"),
  emit(type, detail = {}) {
    const payload = JSON.stringify({ type, detail, at: Date.now() });
    if (window.ReactNativeWebView?.postMessage) window.ReactNativeWebView.postMessage(payload);
    window.dispatchEvent(new CustomEvent("pickup-rush", { detail: { type, ...detail } }));
  },
  saveProgress(level) {
    localStorage.setItem("pickup-rush-level", String(level));
    this.emit("progress", { level });
  },
  loadProgress() {
    return Math.max(0, Number(localStorage.getItem("pickup-rush-level") || 0));
  },
  saveCoins(coins) {
    localStorage.setItem("pickup-rush-coins", String(coins));
  },
  loadCoins() {
    return Math.max(0, Number(localStorage.getItem("pickup-rush-coins") || 60));
  },
  haptic(kind = "light") {
    if (navigator.vibrate) navigator.vibrate(kind === "success" ? [25, 35, 25] : 18);
    this.emit("haptic", { kind });
  },
  async requestRewardedAd(onProgress = () => {}) {
    if (window.PickupRushAds?.showRewarded) {
      const result = await window.PickupRushAds.showRewarded({ placement: "extra-bay" });
      return { rewarded: Boolean(result?.rewarded), source: "app-adapter" };
    }

    const demoDuration = new URLSearchParams(location.search).has("adtest") ? 450 : 3000;
    const steps = 30;
    for (let step = 1; step <= steps; step += 1) {
      await delay(demoDuration / steps);
      onProgress(step / steps);
    }
    return { rewarded: true, source: "web-demo" };
  }
};
