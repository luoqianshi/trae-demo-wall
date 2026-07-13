import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import OutfitsPage from "./page";
import type { BehaviorEvent, OutfitRecommendation, WardrobeItem } from "@/types/wardrobe";

const { listBehaviorEvents, listConfirmedWardrobeItems, listOutfitRecommendations } = vi.hoisted(() => ({
  listBehaviorEvents: vi.fn(),
  listConfirmedWardrobeItems: vi.fn(),
  listOutfitRecommendations: vi.fn()
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository: () => ({
    listBehaviorEvents,
    listConfirmedWardrobeItems,
    listOutfitRecommendations
  })
}));

const item = (id: string, category: WardrobeItem["category"], primaryColor: string): WardrobeItem => ({
  id,
  imagePath: `/api/uploads/${id}.png`,
  status: "confirmed",
  recognitionStatus: "success",
  category,
  primaryColor,
  material: "棉",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z"
});

const recommendation = (id: string, title: string, itemIds: string[], isLiked = false): OutfitRecommendation => ({
  id,
  title,
  reason: `${title} 推荐理由`,
  itemIds,
  isLiked,
  createdAt: "2026-06-14T08:15:00.000Z"
});

const behavior = (recommendationId: string, eventType: BehaviorEvent["eventType"], eventDate: string): BehaviorEvent => ({
  id: `${recommendationId}-${eventType}`,
  eventType,
  recommendationId,
  itemIds: ["top-1", "pants-1", "shoes-1"],
  isLiked: eventType === "like",
  isWorn: eventType === "wear_today",
  isSkipped: eventType === "change_outfit",
  eventDate,
  createdAt: `${eventDate}T09:00:00.000Z`
});

describe("OutfitsPage", () => {
  beforeEach(() => {
    listBehaviorEvents.mockReset();
    listConfirmedWardrobeItems.mockReset();
    listOutfitRecommendations.mockReset();
  });

  it("filters outfit cards by date, behavior type and wardrobe item", async () => {
    listConfirmedWardrobeItems.mockReturnValue([
      item("top-1", "top", "白色"),
      item("pants-1", "pants", "黑色"),
      item("shoes-1", "shoes", "棕色"),
      item("top-2", "top", "蓝色")
    ]);
    listOutfitRecommendations.mockReturnValue([
      recommendation("liked-outfit", "喜欢的通勤", ["top-1", "pants-1", "shoes-1"], true),
      recommendation("skipped-outfit", "跳过的休闲", ["top-2", "pants-1", "shoes-1"])
    ]);
    listBehaviorEvents.mockReturnValue([
      behavior("liked-outfit", "like", "2026-06-14"),
      behavior("liked-outfit", "wear_today", "2026-06-14"),
      behavior("skipped-outfit", "change_outfit", "2026-06-15")
    ]);

    render(
      await OutfitsPage({
        searchParams: Promise.resolve({
          date: "2026-06-14",
          behavior: "liked",
          itemId: "top-1"
        })
      })
    );

    expect(screen.getAllByText("晨间衣橱").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Morning Atelier").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "后台导航" })).toHaveClass("hidden", "lg:flex");
    expect(within(screen.getByRole("navigation", { name: "后台导航" })).getByRole("link", { name: "穿搭组合卡" })).toHaveClass(
      "bg-amber-50",
      "text-[#D97706]"
    );
    expect(screen.getByRole("heading", { name: "穿搭组合卡" })).toBeInTheDocument();
    expect(screen.getByText("查看已生成的穿搭组合，按日期、行为或单品筛选历史反馈。")).toHaveClass(
      "text-sm",
      "text-stone-600"
    );
    const filterRegion = screen.getByRole("region", { name: "组合筛选区" });
    const filterDetails = filterRegion.querySelector("details");
    const filterSummary = within(filterRegion).getByText("筛选条件").closest("summary");

    expect(filterDetails).not.toBeNull();
    expect(filterDetails).not.toHaveAttribute("open");
    expect(filterSummary).not.toBeNull();
    expect(filterSummary).toHaveClass("border-b", "border-stone-100", "pb-3");
    expect(filterSummary?.querySelector("svg")).not.toBeNull();
    expect(screen.getByLabelText("日期筛选")).toHaveValue("2026-06-14");
    expect(screen.getByLabelText("行为筛选")).toHaveValue("liked");
    expect(screen.getByLabelText("单品筛选")).toHaveValue("top-1");
    const visibleCard = screen.getByText("喜欢的通勤").closest("article");

    expect(visibleCard).not.toBeNull();
    expect(screen.getByText("喜欢的通勤")).toBeInTheDocument();
    expect(screen.queryByText("跳过的休闲")).not.toBeInTheDocument();
    expect(within(visibleCard!).getByText("喜欢")).toBeInTheDocument();
    expect(within(visibleCard!).getByText("穿过")).toBeInTheDocument();
    const tagGroup = within(visibleCard!).getByLabelText("组合标签");

    expect(tagGroup).toHaveClass("flex", "flex-wrap", "items-center", "gap-1.5");
    for (const tag of within(tagGroup).getAllByText(/.+/)) {
      expect(tag).toHaveClass("text-xs", "font-semibold", "leading-none");
    }
  });

  it("shows source tags for custom request and item replacement recommendations", async () => {
    listConfirmedWardrobeItems.mockReturnValue([
      item("top-1", "top", "白色"),
      item("pants-1", "pants", "黑色"),
      item("shoes-1", "shoes", "棕色")
    ]);
    listOutfitRecommendations.mockReturnValue([
      {
        ...recommendation("custom-outfit", "客户诉求方案", ["top-1", "pants-1", "shoes-1"]),
        inputSnapshot: {
          source: "custom_request",
          requestGroupId: "request-group-1"
        }
      },
      {
        ...recommendation("auto-replaced-outfit", "自动替换结果", ["top-1", "pants-1", "shoes-1"]),
        inputSnapshot: {
          source: "item_replace",
          replaceMode: "auto"
        }
      },
      {
        ...recommendation("manual-replaced-outfit", "手动替换结果", ["top-1", "pants-1", "shoes-1"]),
        inputSnapshot: {
          source: "item_replace",
          replaceMode: "manual"
        }
      }
    ]);
    listBehaviorEvents.mockReturnValue([
      behavior("auto-replaced-outfit", "auto_replace_item", "2026-06-14"),
      behavior("manual-replaced-outfit", "manual_replace_item", "2026-06-14")
    ]);

    render(
      await OutfitsPage({
        searchParams: Promise.resolve({})
      })
    );

    expect(within(screen.getByText("客户诉求方案").closest("article")!).getByText("诉求推荐")).toBeInTheDocument();
    expect(within(screen.getByText("自动替换结果").closest("article")!).getByText("自动替换")).toBeInTheDocument();
    expect(within(screen.getByText("手动替换结果").closest("article")!).getByText("手动替换")).toBeInTheDocument();

    for (const label of ["诉求推荐", "自动替换", "手动替换"]) {
      expect(screen.getByText(label)).toHaveClass("text-xs", "font-semibold", "leading-none");
    }
  });

  it("shows the same outfit style tag as the recommendation card", async () => {
    listConfirmedWardrobeItems.mockReturnValue([
      { ...item("top-1", "top", "白色"), styles: ["minimal"] },
      { ...item("pants-1", "pants", "黑色"), styles: ["minimal"] },
      { ...item("shoes-1", "shoes", "棕色"), styles: ["minimal"] }
    ]);
    listOutfitRecommendations.mockReturnValue([
      recommendation("minimal-outfit", "简约通勤", ["top-1", "pants-1", "shoes-1"])
    ]);
    listBehaviorEvents.mockReturnValue([]);

    render(
      await OutfitsPage({
        searchParams: Promise.resolve({})
      })
    );

    expect(within(screen.getByText("简约通勤").closest("article")!).getByText("简约风格")).toHaveClass("text-[#D97706]");
  });
});
