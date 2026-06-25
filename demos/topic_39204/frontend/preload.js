import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("qnDesktop", {
  getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") || "control";
  },
});
