import Link from "next/link";
import { AdminSidebar } from "@/components/admin-shell";
import { deriveSeasonFromShanghaiDate, getShanghaiDate } from "@/lib/dates/shanghai-date";
import { getOrCreateDailyOutfitRecommendation, type SavedOutfitRecommendationResult } from "@/lib/recommendations/recommendation-service";
import { getWeatherSnapshot } from "@/lib/weather/open-meteo";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import type { WardrobeItem } from "@/types/wardrobe";
import type { Season } from "@/types/wardrobe";
import type { WeatherSnapshot } from "@/lib/weather/open-meteo";
import { MobileBrandHeader } from "./mobile-home-shell";
import { OutfitCard } from "./outfit-card";
import { ManualReplacementPicker } from "./request/request-page-content";
import { WeatherLine } from "./weather-card";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<{
    adjustItemId?: string;
    adjustRecommendationId?: string;
    color?: string;
    focusRecommendationId?: string;
    material?: string;
    replaceMessage?: string;
    season?: Season;
  }>;
};

const getHomeData = async (): Promise<{
  result: SavedOutfitRecommendationResult;
  weather: WeatherSnapshot;
}> => {
  const repository = getWardrobeRepository();
  const recommendationDate = getShanghaiDate();
  const season = deriveSeasonFromShanghaiDate(recommendationDate);
  const dailyRecommendation = repository.getDailyRecommendationForDate(recommendationDate);
  const weather = await getWeatherSnapshot();

  if (dailyRecommendation?.recommendationId) {
    const existingRecommendation = repository.getOutfitRecommendation(dailyRecommendation.recommendationId);

    if (existingRecommendation) {
      return {
        result: {
          ok: true,
          recommendation: existingRecommendation
        },
        weather
      };
    }
  }

  return {
    result: getOrCreateDailyOutfitRecommendation(repository, recommendationDate, {
      scenario: "casual",
      season,
      weather
    }),
    weather
  };
};

const snapshotString = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "string" ? value : undefined;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const repository = getWardrobeRepository();
  const { result, weather } = await getHomeData();
  const confirmedItems = repository.listConfirmedWardrobeItems();
  const itemsById = new Map(confirmedItems.map((item) => [item.id, item]));
  const focusedRecommendation = params?.focusRecommendationId ? repository.getOutfitRecommendation(params.focusRecommendationId) : undefined;
  const adjustedRecommendationWithoutGroup =
    focusedRecommendation && snapshotString(focusedRecommendation.inputSnapshot, "requestGroupId") === undefined
      ? focusedRecommendation
      : undefined;
  const displayedDailyRecommendation = result.ok ? adjustedRecommendationWithoutGroup ?? result.recommendation : undefined;
  const missingDailyRecommendationMessage = result.ok ? undefined : result.message;
  const outfitItems = displayedDailyRecommendation
    ? displayedDailyRecommendation.itemIds.map((itemId) => itemsById.get(itemId)).filter((item): item is WardrobeItem => Boolean(item))
    : [];
  const adjustmentRecommendation = params?.adjustRecommendationId ? repository.getOutfitRecommendation(params.adjustRecommendationId) : undefined;
  const adjustmentTargetItem = params?.adjustItemId ? itemsById.get(params.adjustItemId) : undefined;
  const replacementCandidates =
    adjustmentRecommendation && adjustmentTargetItem?.category
      ? confirmedItems.filter((item: WardrobeItem) => {
          const colorMatched = !params?.color || item.primaryColor?.includes(params.color);
          const materialMatched = !params?.material || item.material?.includes(params.material);
          const seasonMatched = !params?.season || item.seasons?.some((season) => season === params.season);

          return (
            item.category === adjustmentTargetItem.category &&
            item.id !== adjustmentTargetItem.id &&
            colorMatched &&
            materialMatched &&
            seasonMatched
          );
        })
      : [];
  const replacementMessage = params?.replaceMessage?.trim();

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-950 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <AdminSidebar activeHref="/" showSlogan={false} />

      <main className="mx-auto min-h-screen w-full max-w-none px-4 py-5 lg:px-8 lg:py-8">
        <section aria-label="移动首页内容" className="grid gap-4 lg:hidden">
          <MobileBrandHeader weather={weather} />

          {replacementMessage ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-stone-700" role="status">
              {replacementMessage}
            </p>
          ) : null}

          {displayedDailyRecommendation ? (
            <OutfitCard items={outfitItems} recommendation={displayedDailyRecommendation} />
          ) : (
            <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-[#D97706]">今日推荐</h2>
                <p className="mt-2 text-stone-600">{missingDailyRecommendationMessage}</p>
                <p className="mt-2 text-sm text-stone-500">先补齐基础单品，晨间衣橱会把它整理成可推荐的私人衣橱。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-md bg-[#D97706] px-4 py-3 font-semibold text-white shadow-sm" href="/review">
                  去入库整理
                </Link>
              </div>
            </section>
          )}
        </section>

        <section aria-label="桌面首页内容" className="hidden w-full gap-5 lg:mx-auto lg:grid lg:max-w-5xl">
          <header className="flex items-start justify-between gap-6">
            <div className="grid gap-2">
              <h1 className="text-4xl font-semibold leading-tight text-[#D97706]">今日推荐</h1>
              <p aria-label="品牌语" className="w-fit border-l-2 border-[#D97706] pl-3 text-sm leading-5 text-stone-500">
                Your daily edit of personal style.
              </p>
            </div>
            <WeatherLine className="max-w-[28rem] text-right text-xs text-stone-600" weather={weather} />
          </header>

          {replacementMessage ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-stone-700" role="status">
              {replacementMessage}
            </p>
          ) : null}

          {displayedDailyRecommendation ? (
            <OutfitCard items={outfitItems} recommendation={displayedDailyRecommendation} />
          ) : (
            <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-[#D97706]">今日推荐</h2>
              <p className="text-sm leading-6 text-stone-600">{missingDailyRecommendationMessage}</p>
            </section>
          )}
        </section>

        {adjustmentRecommendation && adjustmentTargetItem ? (
          <section className="mt-4 lg:mx-auto lg:max-w-5xl">
            <ManualReplacementPicker
              basePath="/"
              candidates={replacementCandidates}
              recommendationId={adjustmentRecommendation.id}
              targetItem={adjustmentTargetItem}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
