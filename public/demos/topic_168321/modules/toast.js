import { escapeHtml } from "./utils.js";

let seed = 0;

export function showToast(message, options = {}) {
  const stack = document.getElementById("toastStack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${options.tone || "info"}`;
  toast.dataset.toastId = `toast_${Date.now()}_${seed++}`;
  toast.innerHTML = `
    ${options.title ? `<strong>${escapeHtml(options.title)}</strong>` : ""}
    <div>${escapeHtml(message)}</div>
  `;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  const duration = Number(options.duration || 3200);
  const remove = () => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 220);
  };
  setTimeout(remove, duration);
  toast.addEventListener("click", remove, { once: true });
}
