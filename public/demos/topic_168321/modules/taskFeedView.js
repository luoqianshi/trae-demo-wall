export function pushTaskFeedEntry(text, status) {
  const root = document.getElementById("taskFeed");
  if (!root) return;
  const div = document.createElement("div");
  div.className = `task-entry data-card data-card-compact status-${status}`;
  const timestamp = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  div.innerHTML = `
    <div class="data-card-head">
      <strong>任务事件</strong>
      <span class="status-badge status-badge-${status}">${status}</span>
    </div>
    <div class="muted task-feed-meta">${timestamp}</div>
    <div>${text}</div>
  `;
  root.prepend(div);
  while (root.children.length > 40) {
    root.removeChild(root.lastElementChild);
  }
}
