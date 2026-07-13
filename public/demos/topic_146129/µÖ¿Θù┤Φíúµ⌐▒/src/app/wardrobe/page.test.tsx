import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import WardrobePage from "./page";
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

const confirmedItem = (id: string, originalFilename: string): WardrobeItem => ({
  id,
  imagePath: `/api/uploads/${id}.png`,
  originalFilename,
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

describe("WardrobePage", () => {
  beforeEach(() => {
    listConfirmedWardrobeItems.mockReset();
    getWardrobeItemUsageStats.mockReset();
  });

  it("provides editable fields for confirmed wardrobe items", async () => {
    listConfirmedWardrobeItems.mockReturnValue([confirmedItem("item-1", "黑色西裤.jpg")]);
    getWardrobeItemUsageStats.mockReturnValue([{ itemId: "item-1", referencedOutfitCount: 3, likedOutfitCount: 1, wornCount: 2 }]);

    render(await WardrobePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getAllByText("晨间衣橱").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Morning Atelier").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "后台导航" })).toHaveClass("hidden", "lg:flex");
    expect(within(screen.getByRole("navigation", { name: "后台导航" })).getByRole("link", { name: "我的衣橱" })).toHaveClass(
      "bg-amber-50",
      "text-[#D97706]"
    );
    expect(screen.getByRole("heading", { name: "我的衣橱" })).toBeInTheDocument();
    expect(screen.queryByText("穿搭品总览")).not.toBeInTheDocument();
    expect(screen.getByText("引用 3")).toBeInTheDocument();
    const filterRegion = screen.getByRole("region", { name: "衣橱筛选区" });
    expect(within(filterRegion).getByText("筛选条件")).toBeInTheDocument();
    expect(within(filterRegion).queryByText("1")).not.toBeInTheDocument();
    const resultSummary = screen.getByLabelText("衣橱结果统计");
    expect(resultSummary).toHaveTextContent("共 1 件单品");
    expect(within(resultSummary).getByText("1")).toHaveClass("text-[#D97706]");
    expect(within(screen.getByRole("region", { name: "衣橱卡片区" })).queryByText("总数 1")).not.toBeInTheDocument();
    expect(screen.queryByText("winter")).not.toBeInTheDocument();
    expect(screen.getByText(/季节 冬/)).toBeInTheDocument();
    const filterDetails = filterRegion.querySelector("details");
    const filterSummary = within(filterRegion).getByText("筛选条件").closest("summary");

    expect(filterDetails).not.toBeNull();
    expect(filterDetails).not.toHaveAttribute("open");
    expect(filterSummary).not.toBeNull();
    expect(filterSummary).not.toHaveClass("lg:hidden");
    expect(filterSummary?.querySelector("svg")).not.toBeNull();
    const itemActions = screen.getByLabelText("单品操作");
    const detailLink = within(itemActions).getByRole("link", { name: "查看详情" });
    const editSummary = within(itemActions).getByText("编辑属性").closest("summary");

    expect(itemActions).toHaveClass("grid", "grid-cols-2");
    expect(detailLink).toHaveClass("inline-flex", "items-center", "justify-center", "gap-1.5");
    expect(detailLink.querySelector("svg")).not.toBeNull();
    expect(editSummary).not.toBeNull();
    expect(editSummary).toHaveClass("inline-flex", "items-center", "justify-center", "gap-1.5");
    expect(editSummary?.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "筛选" }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("link", { name: "清除筛选" }).querySelector("svg")).not.toBeNull();
    expect(screen.getByLabelText("品类")).toHaveAttribute("name", "item-1:category");
    expect(screen.getByLabelText("主色")).toHaveAttribute("name", "item-1:primaryColor");
    expect(screen.getByLabelText("辅色")).toHaveAttribute("name", "item-1:secondaryColor");
    expect(screen.getByLabelText("材质")).toHaveAttribute("name", "item-1:material");
    expect(screen.getByLabelText("季节")).toHaveAttribute("name", "item-1:season");
    expect(screen.getByLabelText("场景")).toHaveAttribute("name", "item-1:scenario");
    expect(screen.getByLabelText("正式程度")).toHaveAttribute("name", "item-1:formality");
    expect(screen.getByLabelText("风格")).toHaveAttribute("name", "item-1:style");
    expect(screen.getByLabelText("厚薄")).toHaveAttribute("name", "item-1:warmth");
    expect(screen.getByRole("button", { name: "保存修改" }).querySelector("svg")).not.toBeNull();
  });

  it("uses category tabs and filters wardrobe items by category, color, material, season and scenario", async () => {
    listConfirmedWardrobeItems.mockReturnValue([
      confirmedItem("item-1", "黑色西裤.jpg"),
      {
        ...confirmedItem("item-2", "白色T恤.jpg"),
        category: "top",
        primaryColor: "白色",
        secondaryColor: undefined,
        material: "棉",
        seasons: ["summer"],
        scenarios: ["casual"]
      }
    ]);
    getWardrobeItemUsageStats.mockReturnValue([]);

    render(
      await WardrobePage({
        searchParams: Promise.resolve({
          category: "pants",
          color: "黑",
          material: "羊",
          season: "winter",
          scenario: "commute"
        })
      })
    );

    expect(screen.queryByRole("combobox", { name: "品类筛选" })).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "品类筛选" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "衣橱筛选区" })).getByText("品类筛选")).toHaveClass("font-medium", "text-stone-700");
    expect(screen.getByLabelText("颜色筛选")).toHaveValue("黑");
    expect(screen.getByLabelText("材质筛选")).toHaveValue("羊");
    expect(screen.getByLabelText("季节筛选")).toHaveValue("winter");
    expect(screen.getByLabelText("场景筛选")).toHaveValue("commute");
    expect(screen.getByRole("tab", { name: "裤子 1" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "裤子 1" })).toHaveClass("bg-[#D97706]", "text-white");
    expect(screen.getByRole("tab", { name: "全部 2" })).toHaveClass("bg-white", "text-stone-800");
    expect(screen.getByRole("tab", { name: "上衣 1" })).toHaveAttribute("href", "/wardrobe?color=%E9%BB%91&material=%E7%BE%8A&season=winter&scenario=commute&category=top");
    expect(screen.getByRole("tab", { name: "全部 2" })).toHaveAttribute("href", "/wardrobe?color=%E9%BB%91&material=%E7%BE%8A&season=winter&scenario=commute");
    expect(screen.getByAltText("黑色西裤.jpg")).toBeInTheDocument();
    expect(screen.queryByAltText("白色T恤.jpg")).not.toBeInTheDocument();
    expect(screen.getByLabelText("衣橱结果统计")).toHaveTextContent("共 1 件单品");
  });

  it("links each wardrobe item to its detail page", async () => {
    listConfirmedWardrobeItems.mockReturnValue([confirmedItem("item-1", "黑色西裤.jpg")]);
    getWardrobeItemUsageStats.mockReturnValue([]);

    render(await WardrobePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute("href", "/wardrobe/item-1");
  });
});
