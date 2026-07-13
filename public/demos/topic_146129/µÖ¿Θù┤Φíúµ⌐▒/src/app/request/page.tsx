import { AdminSidebar } from "@/components/admin-shell";
import { getWeatherSnapshot } from "@/lib/weather/open-meteo";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import type { OutfitRecommendation, WardrobeItem } from "@/types/wardrobe";
import { MobileBrandHeader } from "../mobile-home-shell";
import { CustomRecommendationResults, CustomRequestForm, ManualReplacementPicker } from "./request-page-content";

export const dynamic = "force-dynamic";

type RequestPageProps = {
  searchParams?: Promise<{
    adjustItemId?: string;
    adjustRecommendationId?: string;
    color?: string;
    focusRecommendationId?: string;
    material?: string;
    requestGroupId?: string;
    replaceMessage?: string;
    season?: string;
  }>;
};

const snapshotString = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "string" ? value : undefined;
};

const snapshotNumber = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "number" ? value : undefined;
};

export default async function RequestPage({ searchParams }: RequestPageProps) {
  const params = await searchParams;
  const repository = getWardrobeRepository();
  const weather = await getWeatherSnapshot();
  const confirmedItems = repository.listConfirmedWardrobeItems();
  const outfitRecommendations = repository.listOutfitRecommendations();
  const itemsById = new Map(confirmedItems.map((item) => [item.id, item]));
  const focusedRecommendation = params?.focusRecommendationId ? repository.getOutfitRecommendation(params.focusRecommendationId) : undefined;
  const customRecommendations: OutfitRecommendation[] = params?.requestGroupId
    ? focusedRecommendation && snapshotString(focusedRecommendation.inputSnapshot, "requestGroupId") === params.requestGroupId
      ? [focusedRecommendation]
      : outfitRecommendations
          .filter((recommendation) => snapshotString(recommendation.inputSnapshot, "requestGroupId") === params.requestGroupId)
          .sort(
            (left, right) =>
              (snapshotNumber(left.inputSnapshot, "requestIndex") ?? Number.MAX_SAFE_INTEGER) -
              (snapshotNumber(right.inputSnapshot, "requestIndex") ?? Number.MAX_SAFE_INTEGER)
          )
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

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-950 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <AdminSidebar activeHref="/request" showSlogan={false} />

      <main aria-label="自定义推荐页面内容" className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-5 lg:max-w-5xl lg:px-8 lg:py-8">
        <section className="lg:hidden">
          <MobileBrandHeader activeHref="/request" weather={weather} />
        </section>

        <section>
          <h1 className="text-3xl font-semibold leading-tight text-[#D97706]">自定义穿搭诉求</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">输入今天的场景、心情或限制，生成 3 套可调整的穿搭方案。</p>
        </section>

        {params?.replaceMessage ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-stone-700" role="status">
            {params.replaceMessage}
          </p>
        ) : null}

        <CustomRequestForm />

        <CustomRecommendationResults
          itemsById={itemsById}
          recommendations={customRecommendations}
          requestGroupId={params?.requestGroupId ?? ""}
        />

        {adjustmentRecommendation && adjustmentTargetItem ? (
          <ManualReplacementPicker
            candidates={replacementCandidates}
            recommendationId={adjustmentRecommendation.id}
            requestGroupId={params?.requestGroupId}
            targetItem={adjustmentTargetItem}
          />
        ) : null}
      </main>
    </div>
  );
}
