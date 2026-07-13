import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import HomePage from "./page";
import { OutfitCard } from "./outfit-card";
import type { OutfitRecommendation, WardrobeItem } from "@/types/wardrobe";

const { deriveSeasonFromShanghaiDate, getOrCreateDailyOutfitRecommendation, getShanghaiDate, getWardrobeRepository, getWeatherSnapshot } = vi.hoisted(() => ({
  deriveSeasonFromShanghaiDate: vi.fn(),
  getOrCreateDailyOutfitRecommendation: vi.fn(),
  getShanghaiDate: vi.fn(),
  getWardrobeRepository: vi.fn(),
  getWeatherSnapshot: vi.fn()
}));

vi.mock("@/lib/dates/shanghai-date", () => ({
  deriveSeasonFromShanghaiDate,
  getShanghaiDate
}));

vi.mock("@/lib/recommendations/recommendation-service", () => ({
  getOrCreateDailyOutfitRecommendation
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

const recommendation: OutfitRecommendation = {
  id: "recommendation-1",
  title: "休闲穿搭",
  reason: "白色上衣、黑色裤子和棕色鞋子适合今天。",
  isLiked: false,
  itemIds: ["top-1", "pants-1", "shoes-1", "hat-1"],
  createdAt: "2026-06-14T00:00:00.000Z"
};

describe("HomePage", () => {
  beforeEach(() => {
    getShanghaiDate.mockReturnValue("2026-06-14");
    deriveSeasonFromShanghaiDate.mockReturnValue("summer");
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
      getDailyRecommendationForDate: vi.fn(() => undefined),
      getOutfitRecommendation: vi.fn(() => undefined),
      listConfirmedWardrobeItems: vi.fn(() => []),
      listDraftWardrobeItems: vi.fn(() => [
        item("draft-1", "top", "白色", { status: "draft" }),
        item("draft-2", "shoes", "黑色", { status: "draft" })
      ]),
      listOutfitRecommendations: vi.fn(() => [recommendation])
    });
    getOrCreateDailyOutfitRecommendation.mockReturnValue({
      ok: false,
      missingCategories: ["top", "pants", "shoes"],
      message: "还缺少上衣、裤子、鞋，暂时不能生成完整穿搭。"
    });
  });

  it("首页按移动端优先展示今日推荐，并把天气和品牌语放入顶部区域", async () => {
    render(await HomePage({}));

    const brandLinks = screen.getAllByLabelText("晨间衣橱 首页");
    expect(screen.getAllByText("晨间衣橱").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Morning Atelier").length).toBeGreaterThan(0);
    expect(brandLinks[0].firstElementChild).toHaveClass("gap-2");
    const mobileHome = screen.getByLabelText("移动首页内容");
    const desktopHome = screen.getByLabelText("桌面首页内容");

    expect(mobileHome).toHaveClass("lg:hidden");
    expect(desktopHome).toHaveClass("hidden", "lg:grid", "lg:max-w-5xl");
    expect(within(mobileHome).queryByRole("heading", { name: "今天穿什么" })).not.toBeInTheDocument();
    expect(within(mobileHome).queryByText("今天穿什么")).not.toBeInTheDocument();
    expect(within(desktopHome).getByRole("heading", { level: 1, name: "今日推荐" })).not.toHaveClass("brand-title");
    expect(within(desktopHome).queryByText("今日推荐", { selector: "p" })).not.toBeInTheDocument();
    expect(within(desktopHome).queryByText("今天穿什么")).not.toBeInTheDocument();
    expect(within(desktopHome).queryByText("穿搭管理后台")).not.toBeInTheDocument();
    expect(within(desktopHome).queryByText("桌面工作台")).not.toBeInTheDocument();
    expect(within(desktopHome).queryByLabelText("管理概览")).not.toBeInTheDocument();
    expect(screen.queryByText("What to Wear Today?")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("品牌语").length).toBeGreaterThan(1);
    expect(screen.queryByText("今日穿搭")).not.toBeInTheDocument();
    expect(screen.queryByText("今日天气")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "天气" })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("天气").length).toBe(2);
    expect(screen.getAllByLabelText("天气")[0]).toHaveTextContent(/^上海 ·/);
    expect(screen.getAllByText("今日推荐").length).toBeGreaterThan(1);
    expect(within(mobileHome).queryByLabelText("穿搭诉求")).not.toBeInTheDocument();
    expect(within(mobileHome).queryByLabelText("自定义推荐入口")).not.toBeInTheDocument();

    expect(screen.queryByRole("navigation", { name: "主导航" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "后台导航" })).toHaveClass("lg:flex");
    expect(within(screen.getByRole("navigation", { name: "后台导航" })).getByRole("link", { name: "今日推荐" })).toHaveClass(
      "bg-amber-50",
      "text-[#D97706]"
    );
    expect(screen.getAllByRole("link", { name: "自定义推荐" }).some((link) => link.getAttribute("href") === "/request")).toBe(true);
    const managementMenu = screen.getByLabelText("页面菜单");
    const managementSummary = managementMenu.querySelector("summary");

    expect(managementMenu.closest("header")).toHaveClass("grid", "gap-3", "border-b", "border-stone-200");
    expect(managementMenu.closest("div")).toHaveClass("flex", "items-start", "justify-between");
    expect(managementMenu).toHaveClass("relative", "lg:hidden");
    expect(managementMenu).not.toHaveClass("absolute", "right-4", "top-6");
    expect(managementSummary).toHaveClass("bg-transparent");
    expect(managementSummary).not.toHaveClass("rounded-full", "border", "bg-white", "shadow-sm");
    expect(screen.getByRole("link", { name: "去入库整理" })).toHaveAttribute("href", "/review");
    expect(screen.queryByRole("link", { name: "查看衣橱" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "上传照片" })).not.toBeInTheDocument();
    expect(within(managementMenu).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "今日推荐",
      "自定义推荐",
      "入库整理",
      "我的衣橱",
      "穿搭组合卡"
    ]);
    expect(within(managementMenu).getByRole("link", { name: "今日推荐" })).toHaveAttribute("href", "/");
    expect(within(managementMenu).getByRole("link", { name: "自定义推荐" })).toHaveAttribute("href", "/request");
    expect(within(managementMenu).getByRole("link", { name: "入库整理" })).toHaveAttribute("href", "/review");
    expect(within(managementMenu).getByRole("link", { name: "我的衣橱" })).toHaveAttribute("href", "/wardrobe");
    expect(within(managementMenu).getByRole("link", { name: "穿搭组合卡" })).toHaveAttribute("href", "/outfits");
  });

  it("有推荐时按帽子衣服裤子鞋竖向展示，并突出风格、理由和图标按钮", () => {
    render(
      <OutfitCard
        items={[
          item("top-1", "top", "白色", { styles: ["minimal"] }),
          item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
          item("shoes-1", "shoes", "棕色", { styles: ["minimal"] }),
          item("hat-1", "hat", "蓝色", { styles: ["minimal"] })
        ]}
        recommendation={recommendation}
      />
    );

    const card = screen.getByRole("region", { name: "今日推荐" });
    const photoStage = screen.getByLabelText("今日推荐图片组合");
    const photoTiles = within(photoStage).getAllByRole("article");

    expect(card).toHaveClass("min-h-[calc(100svh-13rem)]", "lg:max-w-none");
    expect(card).not.toHaveClass("lg:max-w-4xl");
    expect(screen.getByRole("heading", { name: "今日推荐" })).not.toHaveClass("brand-title");
    expect(screen.getByRole("heading", { name: "今日推荐" })).toHaveClass("text-[#D97706]");
    expect(photoStage).toHaveClass("grid-cols-1", "lg:grid-cols-4");
    expect(photoTiles.map((tile) => tile.getAttribute("aria-label"))).toEqual([
      "帽子 · 蓝色",
      "上衣 · 白色",
      "裤子 · 黑色",
      "鞋 · 棕色"
    ]);
    for (const tile of photoTiles) {
      expect(tile).toHaveClass("lg:aspect-square", "lg:min-h-0");
    }
    expect(screen.getByText("简约风格")).toBeInTheDocument();
    expect(screen.getByText("简约风格")).toHaveClass("text-[#D97706]");
    expect(screen.getByLabelText("组合标签")).toHaveClass("flex", "flex-wrap", "items-center", "gap-1.5");
    expect(screen.getByText("简约风格")).toHaveClass("text-xs", "font-semibold", "leading-none");
    expect(screen.getByRole("heading", { name: "推荐理由" })).toBeInTheDocument();
    expect(screen.getByText(recommendation.reason).closest("section")).toHaveAccessibleName("推荐理由");
    expect(screen.queryByText("补充单品")).not.toBeInTheDocument();
    expect(screen.queryByText("今日穿搭")).not.toBeInTheDocument();
    expect(screen.queryByText("休闲穿搭")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "单品调整" })).not.toBeInTheDocument();

    for (const tile of photoTiles) {
      const autoReplaceButton = within(tile).getByRole("button", { name: "自动换一件" });
      const manualReplaceLink = within(tile).getByRole("link", { name: "自己选" });

      expect(autoReplaceButton).toHaveClass("text-[0.8rem]", "text-[#D97706]", "font-sans");
      expect(autoReplaceButton).toHaveClass("min-h-9", "w-full");
      expect(manualReplaceLink).toHaveClass("text-[0.8rem]", "text-[#D97706]", "font-sans");
      expect(manualReplaceLink).toHaveClass("min-h-9", "w-full");
    }

    const actionGroup = screen.getByRole("group", { name: "推荐动作" });
    expect(actionGroup).toHaveClass("grid-cols-2");
    expect(screen.getByRole("button", { name: "今天穿这套" }).closest("form")).toHaveClass("col-span-2");
    expect(screen.getByRole("button", { name: "今天穿这套" })).toHaveClass("bg-[#D97706]");

    for (const buttonName of ["喜欢", "今天穿这套", "换一套"]) {
      expect(screen.getByRole("button", { name: buttonName }).querySelector("svg")).toBeInTheDocument();
    }
  });

  it("三件主单品在桌面端用三列铺满推荐卡", () => {
    render(
      <OutfitCard
        items={[
          item("top-1", "top", "白色", { styles: ["minimal"] }),
          item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
          item("shoes-1", "shoes", "棕色", { styles: ["minimal"] })
        ]}
        recommendation={{
          ...recommendation,
          itemIds: ["top-1", "pants-1", "shoes-1"]
        }}
      />
    );

    const photoStage = screen.getByLabelText("今日推荐图片组合");

    expect(photoStage).toHaveClass("grid-cols-1", "lg:grid-cols-3");
    expect(photoStage).not.toHaveClass("lg:grid-cols-4");
  });

  it("补充单品和主单品使用同一套卡片与按钮尺寸", () => {
    render(
      <OutfitCard
        items={[
          item("top-1", "top", "白色", { styles: ["minimal"] }),
          item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
          item("shoes-1", "shoes", "棕色", { styles: ["minimal"] }),
          item("bag-1", "bag", "焦糖色", { styles: ["minimal"] })
        ]}
        recommendation={{
          ...recommendation,
          itemIds: ["top-1", "pants-1", "shoes-1", "bag-1"]
        }}
      />
    );

    const photoStage = screen.getByLabelText("今日推荐图片组合");
    const supplementalStage = screen.getByLabelText("补充单品图片组合");
    const primaryTile = within(photoStage).getByRole("article", { name: "上衣 · 白色" });
    const supplementalTile = within(supplementalStage).getByRole("article", { name: "包 · 焦糖色" });
    const primaryButton = within(primaryTile).getByRole("button", { name: "自动换一件" });
    const supplementalButton = within(supplementalTile).getByRole("button", { name: "自动换一件" });
    const primaryManualLink = within(primaryTile).getByRole("link", { name: "自己选" });
    const supplementalManualLink = within(supplementalTile).getByRole("link", { name: "自己选" });

    expect(supplementalStage).toHaveClass("grid-cols-1", "lg:grid-cols-3");
    expect(supplementalTile).toHaveClass("lg:aspect-square", "lg:min-h-0");
    expect(supplementalTile).toHaveClass("aspect-[4/3]");
    expect(supplementalTile.className).toBe(primaryTile.className);
    expect(supplementalButton.className).toBe(primaryButton.className);
    expect(supplementalManualLink.className).toBe(primaryManualLink.className);
  });

  it("每日推荐调整后用新方案接管今日推荐卡片", async () => {
    const confirmedItems = [
      item("top-1", "top", "白色", { styles: ["minimal"] }),
      item("top-2", "top", "蓝色", { styles: ["minimal"] }),
      item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
      item("shoes-1", "shoes", "棕色", { styles: ["minimal"] })
    ];
    const baseRecommendation: OutfitRecommendation = {
      ...recommendation,
      id: "daily-base",
      reason: "原来的每日推荐理由。",
      itemIds: ["top-1", "pants-1", "shoes-1"]
    };
    const adjustedRecommendation: OutfitRecommendation = {
      ...recommendation,
      id: "daily-adjusted",
      title: "每日推荐调整",
      reason: "调整后的每日推荐理由。",
      itemIds: ["top-2", "pants-1", "shoes-1"],
      inputSnapshot: {
        source: "item_replace",
        baseRecommendationId: "daily-base"
      }
    };

    getWardrobeRepository.mockReturnValue({
      getDailyRecommendationForDate: vi.fn(() => undefined),
      getOutfitRecommendation: vi.fn((id: string) => (id === "daily-adjusted" ? adjustedRecommendation : undefined)),
      listConfirmedWardrobeItems: vi.fn(() => confirmedItems),
      listDraftWardrobeItems: vi.fn(() => []),
      listOutfitRecommendations: vi.fn(() => [baseRecommendation, adjustedRecommendation])
    });
    getOrCreateDailyOutfitRecommendation.mockReturnValue({
      ok: true,
      recommendation: baseRecommendation
    });

    render(
      await HomePage({
        searchParams: Promise.resolve({
          focusRecommendationId: "daily-adjusted"
        })
      })
    );

    const mobileHome = screen.getByLabelText("移动首页内容");

    expect(within(mobileHome).queryByRole("region", { name: "调整后的穿搭" })).not.toBeInTheDocument();
    expect(within(mobileHome).getAllByRole("region", { name: "今日推荐" })).toHaveLength(1);
    expect(within(mobileHome).getByRole("region", { name: "今日推荐" })).toHaveTextContent("调整后的每日推荐理由。");
    expect(within(mobileHome).queryByText("原来的每日推荐理由。")).not.toBeInTheDocument();
  });

  it("每日推荐点击自己选后展示同品类替换选择层", async () => {
    const confirmedItems = [
      item("top-1", "top", "白色", { styles: ["minimal"] }),
      item("top-2", "top", "蓝色", { styles: ["minimal"] }),
      item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
      item("shoes-1", "shoes", "棕色", { styles: ["minimal"] })
    ];
    const baseRecommendation: OutfitRecommendation = {
      ...recommendation,
      id: "daily-base",
      itemIds: ["top-1", "pants-1", "shoes-1"]
    };

    getWardrobeRepository.mockReturnValue({
      getDailyRecommendationForDate: vi.fn(() => undefined),
      getOutfitRecommendation: vi.fn((id: string) => (id === "daily-base" ? baseRecommendation : undefined)),
      listConfirmedWardrobeItems: vi.fn(() => confirmedItems),
      listDraftWardrobeItems: vi.fn(() => []),
      listOutfitRecommendations: vi.fn(() => [baseRecommendation])
    });
    getOrCreateDailyOutfitRecommendation.mockReturnValue({
      ok: true,
      recommendation: baseRecommendation
    });

    render(
      await HomePage({
        searchParams: Promise.resolve({
          adjustRecommendationId: "daily-base",
          adjustItemId: "top-1"
        })
      })
    );

    const replacementPicker = screen.getByRole("region", { name: "选择替换单品" });

    expect(within(replacementPicker).getByRole("heading", { name: "选择替换上衣" })).toBeInTheDocument();
    expect(within(replacementPicker).getByText("蓝色 / 棉")).toBeInTheDocument();
    expect(within(replacementPicker).getByRole("button", { name: "选这件" })).toBeInTheDocument();
  });

  it("每日推荐自动替换无备选时展示可见提示", async () => {
    getOrCreateDailyOutfitRecommendation.mockReturnValue({
      ok: true,
      recommendation
    });
    getWardrobeRepository.mockReturnValue({
      getDailyRecommendationForDate: vi.fn(() => undefined),
      getOutfitRecommendation: vi.fn(() => undefined),
      listConfirmedWardrobeItems: vi.fn(() => [
        item("top-1", "top", "白色", { styles: ["minimal"] }),
        item("pants-1", "pants", "黑色", { styles: ["minimal"] }),
        item("shoes-1", "shoes", "棕色", { styles: ["minimal"] })
      ]),
      listDraftWardrobeItems: vi.fn(() => []),
      listOutfitRecommendations: vi.fn(() => [recommendation])
    });

    render(
      await HomePage({
        searchParams: Promise.resolve({
          replaceMessage: "没有可替换的上衣，可以先去衣橱录入。"
        })
      })
    );

    expect(screen.getAllByText("没有可替换的上衣，可以先去衣橱录入。").length).toBeGreaterThan(0);
  });

});
