import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import RequestPage from "./page";
import type { OutfitRecommendation, WardrobeItem } from "@/types/wardrobe";

const { getWardrobeRepository, getWeatherSnapshot } = vi.hoisted(() => ({
  getWardrobeRepository: vi.fn(),
  getWeatherSnapshot: vi.fn()
}));

vi.mock("@/lib/weather/open-meteo", () => ({
  getWeatherSnapshot
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository
}));

const baseItem: WardrobeItem = {
  id: "item-1",
  imagePath: "/api/uploads/item-1.png",
  status: "confirmed",
  recognitionStatus: "success",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
  material: "棉",
  primaryColor: "白色"
};

const item = (
  id: string,
  category: WardrobeItem["category"],
  primaryColor: string,
  extra: Partial<WardrobeItem> = {}
): WardrobeItem => ({
  ...baseItem,
  ...extra,
  id,
  imagePath: `/api/uploads/${id}.png`,
  category,
  primaryColor
});

const dailyRecommendation: OutfitRecommendation = {
  id: "recommendation-1",
  title: "休闲穿搭",
  reason: "白色上衣、黑色裤子和棕色鞋子适合今天。",
  isLiked: false,
  itemIds: ["top-1", "pants-1", "shoes-1"],
  createdAt: "2026-06-14T00:00:00.000Z"
};

describe("RequestPage", () => {
  beforeEach(() => {
    getWeatherSnapshot.mockResolvedValue({
      source: "fallback",
      locationName: "上海",
      latitude: 31.2304,
      longitude: 121.4737,
      temperature: 22,
      precipitation: 0,
      windSpeed: 11,
      weatherCode: 0,
      condition: "多云",
      warmth: "medium",
      observedAt: "2026-06-14T08:15:00.000Z"
    });
    getWardrobeRepository.mockReturnValue({
      getOutfitRecommendation: vi.fn(() => undefined),
      listConfirmedWardrobeItems: vi.fn(() => []),
      listOutfitRecommendations: vi.fn(() => [])
    });
  });

  it("自定义推荐页作为独立模块展示诉求输入", async () => {
    render(
      await RequestPage({
        searchParams: Promise.resolve({
          replaceMessage: "没有可替换的上衣，可以先去衣橱录入。"
        })
      })
    );

    const requestPage = screen.getByLabelText("自定义推荐页面内容");

    expect(within(requestPage).getByRole("status")).toHaveTextContent("没有可替换的上衣，可以先去衣橱录入。");
    expect(requestPage).toHaveClass("flex", "flex-col", "lg:max-w-5xl");
    expect(requestPage).not.toHaveClass("grid");
    expect(within(requestPage).queryByText("Custom Style Request")).not.toBeInTheDocument();
    expect(within(requestPage).getByRole("heading", { name: "自定义穿搭诉求" })).not.toHaveClass("brand-title");
    expect(within(requestPage).queryByText("说出今天的场景、心情或约束，晨间衣橱会给你 3 套可选方案。")).not.toBeInTheDocument();
    expect(within(requestPage).getByText("输入今天的场景、心情或限制，生成 3 套可调整的穿搭方案。")).toHaveClass(
      "text-sm",
      "text-stone-600"
    );
    expect(within(requestPage).getByRole("region", { name: "主动诉求推荐" })).toBeInTheDocument();
    expect(within(requestPage).getByLabelText("穿搭诉求")).toBeInTheDocument();
    expect(within(requestPage).getByLabelText("季节")).toHaveAttribute("name", "season");
    expect(within(requestPage).getByLabelText("材质偏好")).toHaveAttribute("name", "materialPreference");
    expect(within(requestPage).getByRole("button", { name: "推荐 3 套" })).toBeInTheDocument();
    expect(within(requestPage).queryByRole("link", { name: "返回今日推荐" })).not.toBeInTheDocument();
    expect(within(requestPage).queryByRole("region", { name: "今日推荐" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "后台导航" })).toHaveClass("hidden", "lg:flex");
    expect(within(screen.getByRole("navigation", { name: "后台导航" })).getByRole("link", { name: "自定义推荐" })).toHaveClass(
      "bg-amber-50",
      "text-[#D97706]"
    );
    expect(within(screen.getByLabelText("页面菜单")).getByRole("link", { name: "自定义推荐" })).toHaveAttribute("aria-current", "page");
  });

  it("自定义推荐页展示同一批次的 3 套推荐", async () => {
    const confirmedItems = [
      item("top-1", "top", "白色", { styles: ["minimal"] }),
      item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
      item("shoes-1", "shoes", "棕色", { styles: ["minimal"] }),
      item("top-2", "top", "蓝色", { styles: ["business"] }),
      item("pants-2", "pants", "灰色", { styles: ["business"] }),
      item("shoes-2", "shoes", "黑色", { styles: ["business"] }),
      item("top-3", "top", "米色", { styles: ["minimal"] }),
      item("pants-3", "pants", "卡其色", { styles: ["minimal"] }),
      item("shoes-3", "shoes", "白色", { styles: ["minimal"] })
    ];
    const customRecommendations: OutfitRecommendation[] = [1, 2, 3].map((index) => ({
      id: `custom-${index}`,
      title: `诉求推荐 ${index}`,
      reason: `第 ${index} 套推荐理由。`,
      isLiked: false,
      itemIds: [`top-${index}`, `pants-${index}`, `shoes-${index}`],
      inputSnapshot: {
        source: "custom_request",
        requestText: "今天要见客户，想正式一点",
        requestGroupId: "request-group-1",
        requestIndex: index
      },
      createdAt: "2026-06-14T09:00:00.000Z"
    }));

    getWardrobeRepository.mockReturnValue({
      getOutfitRecommendation: vi.fn(() => undefined),
      listConfirmedWardrobeItems: vi.fn(() => confirmedItems),
      listOutfitRecommendations: vi.fn(() => customRecommendations)
    });

    render(
      await RequestPage({
        searchParams: Promise.resolve({
          requestGroupId: "request-group-1"
        })
      })
    );

    const requestPage = screen.getByLabelText("自定义推荐页面内容");

    expect(within(requestPage).getByText("为这段诉求推荐的 3 套")).toBeInTheDocument();
    expect(within(requestPage).getByText("今天要见客户，想正式一点")).toBeInTheDocument();
    expect(within(requestPage).getAllByRole("region", { name: /方案/ })).toHaveLength(3);
    expect(within(requestPage).getAllByRole("button", { name: "自动换一件" }).length).toBeGreaterThanOrEqual(9);
    expect(within(requestPage).getAllByRole("link", { name: "自己选" }).length).toBeGreaterThanOrEqual(9);
  });

  it("自定义诉求调整后只展示聚焦后的新方案", async () => {
    const confirmedItems = [
      item("top-1", "top", "白色", { styles: ["minimal"] }),
      item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
      item("shoes-1", "shoes", "棕色", { styles: ["minimal"] }),
      item("top-2", "top", "蓝色", { styles: ["business"] })
    ];
    const originalRecommendations: OutfitRecommendation[] = [1, 2, 3].map((index) => ({
      id: `custom-${index}`,
      title: `诉求推荐 ${index}`,
      reason: `第 ${index} 套原始推荐理由。`,
      isLiked: false,
      itemIds: ["top-1", "pants-1", "shoes-1"],
      inputSnapshot: {
        source: "custom_request",
        requestText: "今天要见客户，想正式一点",
        requestGroupId: "request-group-1",
        requestIndex: index
      },
      createdAt: "2026-06-14T09:00:00.000Z"
    }));
    const adjustedRecommendation: OutfitRecommendation = {
      id: "custom-adjusted",
      title: "诉求推荐 1 调整",
      reason: "调整后用蓝色上衣平衡黑色裤子。",
      isLiked: false,
      itemIds: ["top-2", "pants-1", "shoes-1"],
      inputSnapshot: {
        source: "item_replace",
        requestText: "今天要见客户，想正式一点",
        requestGroupId: "request-group-1",
        requestIndex: 1,
        baseRecommendationId: "custom-1"
      },
      createdAt: "2026-06-14T09:05:00.000Z"
    };

    getWardrobeRepository.mockReturnValue({
      getOutfitRecommendation: vi.fn((id: string) => (id === "custom-adjusted" ? adjustedRecommendation : undefined)),
      listConfirmedWardrobeItems: vi.fn(() => confirmedItems),
      listOutfitRecommendations: vi.fn(() => [...originalRecommendations, adjustedRecommendation])
    });

    render(
      await RequestPage({
        searchParams: Promise.resolve({
          requestGroupId: "request-group-1",
          focusRecommendationId: "custom-adjusted"
        })
      })
    );

    const requestPage = screen.getByLabelText("自定义推荐页面内容");

    expect(within(requestPage).getAllByRole("region", { name: /方案/ })).toHaveLength(1);
    expect(within(requestPage).getByRole("region", { name: "方案 1" })).toHaveTextContent("调整后用蓝色上衣平衡黑色裤子。");
    expect(within(requestPage).queryByText("第 1 套原始推荐理由。")).not.toBeInTheDocument();
    expect(within(requestPage).queryByText("第 2 套原始推荐理由。")).not.toBeInTheDocument();
    expect(within(requestPage).queryByText("第 3 套原始推荐理由。")).not.toBeInTheDocument();
  });

  it("手动选择层只展示同品类可替换单品", async () => {
    const confirmedItems = [
      item("top-1", "top", "白色"),
      item("top-2", "top", "蓝色"),
      item("pants-1", "pants", "黑色"),
      item("shoes-1", "shoes", "棕色")
    ];
    const baseRecommendation: OutfitRecommendation = {
      ...dailyRecommendation,
      id: "custom-1",
      title: "诉求推荐 1",
      reason: "推荐理由。",
      itemIds: ["top-1", "pants-1", "shoes-1"],
      inputSnapshot: {
        source: "custom_request",
        requestGroupId: "request-group-1"
      },
      createdAt: "2026-06-14T09:00:00.000Z"
    };

    getWardrobeRepository.mockReturnValue({
      getOutfitRecommendation: vi.fn((id: string) => (id === "custom-1" ? baseRecommendation : undefined)),
      listConfirmedWardrobeItems: vi.fn(() => confirmedItems),
      listOutfitRecommendations: vi.fn(() => [baseRecommendation])
    });

    render(
      await RequestPage({
        searchParams: Promise.resolve({
          requestGroupId: "request-group-1",
          adjustRecommendationId: "custom-1",
          adjustItemId: "top-1"
        })
      })
    );

    const manualPicker = screen.getByRole("region", { name: "选择替换单品" });

    expect(within(manualPicker).getByText("选择替换上衣")).toBeInTheDocument();
    expect(within(manualPicker).getByText("蓝色 / 棉")).toBeInTheDocument();
    expect(within(manualPicker).queryByText("黑色 / 棉")).not.toBeInTheDocument();
    expect(within(manualPicker).queryByText("棕色 / 棉")).not.toBeInTheDocument();
  });
});
