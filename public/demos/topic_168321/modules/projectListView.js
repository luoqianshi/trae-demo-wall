import { appStore } from "./appStore.js";
import { escapeHtml, projectProgressText } from "./utils.js";

export function renderProjectListView() {
  const { projects, project, projectFilter } = appStore.getState();
  const select = document.getElementById("projectSelect");
  const query = String(projectFilter || "").trim().toLowerCase();
  const filteredProjects = query
    ? projects.filter((item) => {
        const haystack = [
          item.name || "",
          item.id || "",
          projectProgressText(item),
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      })
    : projects;

  select.innerHTML = filteredProjects.length
    ? filteredProjects
        .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml((item.name || item.id) + " · " + projectProgressText(item))}</option>`)
        .join("")
    : `<option value="">没有匹配的项目</option>`;

  if (project?.id && filteredProjects.some((item) => item.id === project.id)) {
    select.value = project.id;
  }

  const meta = document.getElementById("projectFilterMeta");
  if (meta) {
    meta.textContent = query
      ? `当前筛选到 ${filteredProjects.length} / ${projects.length} 个项目`
      : `共 ${projects.length} 个项目`;
  }

  const input = document.getElementById("projectFilterInput");
  if (input && input.value !== projectFilter) {
    input.value = projectFilter || "";
  }
}
