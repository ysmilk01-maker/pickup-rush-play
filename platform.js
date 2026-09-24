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
  haptic(kind = "light") {
    if (navigator.vibrate) navigator.vibrate(kind === "success" ? [25, 35, 25] : 18);
    this.emit("haptic", { kind });
  }
};
