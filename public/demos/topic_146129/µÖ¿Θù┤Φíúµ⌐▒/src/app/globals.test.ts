import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("global interactive cursor styles", () => {
  it("uses a pointer cursor for clickable controls on fine pointer devices", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain("@media (pointer: fine)");
    expect(css).toContain("button:not(:disabled)");
    expect(css).toContain("a[href]");
    expect(css).toContain("summary");
    expect(css).toContain("cursor: pointer");
  });
});
