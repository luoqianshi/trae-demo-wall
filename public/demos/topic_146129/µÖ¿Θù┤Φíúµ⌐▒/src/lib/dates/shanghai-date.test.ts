import { describe, expect, it } from "vitest";
import { deriveSeasonFromShanghaiDate, getShanghaiDate } from "./shanghai-date";

describe("shanghai date helpers", () => {
  it("formats a date in Asia/Shanghai", () => {
    expect(getShanghaiDate(new Date("2026-06-14T16:30:00.000Z"))).toBe("2026-06-15");
  });

  it("derives the current season from the Shanghai date month", () => {
    expect(deriveSeasonFromShanghaiDate("2026-04-01")).toBe("spring");
    expect(deriveSeasonFromShanghaiDate("2026-07-01")).toBe("summer");
    expect(deriveSeasonFromShanghaiDate("2026-10-01")).toBe("autumn");
    expect(deriveSeasonFromShanghaiDate("2026-01-01")).toBe("winter");
  });
});
