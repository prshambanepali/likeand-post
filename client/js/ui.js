export const $ = (sel) => document.querySelector(sel);

export function toast(message, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return;

  el.className = `toast ${type}`;
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
