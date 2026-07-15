import { api } from "./api.js";

export async function fetchCurrentUser() {
  return api("/api/auth/me");
}

export async function fetchProjects() {
  return api("/api/projects");
}

export async function fetchProject(projectId) {
  return api(`/api/projects/${projectId}`);
}

export async function createProjectRecord(payload) {
  return api("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function saveProjectRecord(project) {
  return api(`/api/projects/${project.id}`, {
    method: "PUT",
    headers: {
      "If-Match": `v${project.version || 0}`,
    },
    body: JSON.stringify(project),
  });
}

export async function deleteProjectRecord(projectId) {
  return api(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}
