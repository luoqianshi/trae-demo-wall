import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./brand-mark";

describe("BrandMark", () => {
  it("shows a compact beta badge next to the brand name", () => {
    render(<BrandMark href="/" />);

    const brandLink = screen.getByRole("link", { name: "晨间衣橱 首页" });
    const betaBadge = within(brandLink).getByText("BETA");

    expect(betaBadge).toHaveClass("text-[10px]", "text-[#D97706]", "border-amber-200", "bg-amber-50");
  });
});
