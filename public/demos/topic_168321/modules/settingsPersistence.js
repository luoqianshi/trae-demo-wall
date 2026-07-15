import { api } from "./api.js";

export async function fetchSettings() {
  return api("/api/settings");
}

export async function saveSettingsRecord(settings) {
  return api("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function testSettingsConnection(slot, config) {
  return api("/api/settings/test", {
    method: "POST",
    body: JSON.stringify({ slot, config }),
  });
}
