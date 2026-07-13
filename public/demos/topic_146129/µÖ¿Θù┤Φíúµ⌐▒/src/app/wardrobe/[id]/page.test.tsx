import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { vi } from "vitest";
import WardrobeItemDetailPage from "./page";
import type { WardrobeItem } from "@/types/wardrobe";

const { getWardrobeItemUsageStats, listConfirmedWardrobeItems } = vi.hoisted(() => ({
  getWardrobeItemUsageStats: vi.fn(),
  listConfirmedWardrobeItems: vi.fn()
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository: () => ({
    getWardrobeItemUsageStats,
    listConfirmedWardrobeItems
  })
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not-found");
  })
}));

const confirmedItem = (id: string): WardrobeItem => ({
  id,
  imagePath: `/api/uploads/${id}.png`,
  originalFilename: "黑色西裤.jpg",
  status: "confirmed",
  recognitionStatus: "success",
  category: "pants",
  primaryColor: "黑色",
  secondaryColor: "灰色",
  material: "羊毛",
  seasons: ["winter"],
  scenarios: ["commute"],
  formality: "semi_formal",
  styles: ["business"],
  warmth: "heavy",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z"
});

describe("WardrobeItemDetailPage", () => {
  beforeEach(() => {
    listConfirmedWardrobeItems.mockReset();
    getWardrobeItemUsageStats.mockReset();
    vi.mocked(notFound).mockClear();
  });

  it("shows one confirmed wardrobe item with usage details and edit fields", async () => {
    listConfirmedWardrobeItems.mockReturnValue([confirmedItem("item-1")]);
    getWardrobeItemUsageStats.mockReturnValue([{ itemId: "item-1", referencedOutfitCount: 4, likedOutfitCount: 2, wornCount: 1 }]);

    render(await WardrobeItemDetailPage({ params: Promise.resolve({ id: "item-1" }) }));

    expect(screen.getByRole("heading", { name: "黑色西裤.jpg" })).toBeInTheDocument();
    expect(screen.getByText("引用穿搭 4")).toBeInTheDocument();
    expect(screen.getByText("喜欢穿搭 2")).toBeInTheDocument();
    expect(screen.getByText("穿着次数 1")).toBeInTheDocument();
    expect(screen.queryByText("winter")).not.toBeInTheDocument();
    expect(screen.getAllByText("冬").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("主色")).toHaveAttribute("name", "item-1:primaryColor");
    expect(screen.getByRole("button", { name: "保存修改" })).toBeInTheDocument();
  });

  it("returns not found for missing confirmed wardrobe item", async () => {
    listConfirmedWardrobeItems.mockReturnValue([]);
    getWardrobeItemUsageStats.mockReturnValue([]);

    await expect(WardrobeItemDetailPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("not-found");
  });
});
