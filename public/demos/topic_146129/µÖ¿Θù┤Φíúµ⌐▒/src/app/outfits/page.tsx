import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { CollapsibleFilterPanel } from "@/components/collapsible-filter-panel";
import { OutfitTag, OutfitTagGroup } from "@/components/outfit-tags";
import { getOutfitStyleLabel } from "@/lib/recommendations/outfit-style";
import { categoryLabels } from "@/lib/wardrobe/options";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import type { BehaviorEvent, OutfitRecommendation, WardrobeItem } from "@/types/wardrobe";

export const dynamic = "force-dynamic";

const isWardrobeItem = (item: WardrobeItem | undefined): item is WardrobeItem => Boolean(item);

type OutfitBehaviorFilter = "liked" | "worn" | "skipped";

type OutfitsPageProps = {
  searchParams?: Promise<{
    date?: string;
    behavior?: OutfitBehaviorFilter;
    itemId?: string;
  }>;
};

const behaviorOptions: Array<{ value: OutfitBehaviorFilter; label: string }> = [
  { value: "liked", label: "喜欢" },
  { value: "worn", label: "穿过" },
  { value: "skipped", label: "跳过" }
];

const eventsForRecommendation = (events: BehaviorEvent[], recommendationId: string) =>
  events.filter((event) => event.recommendationId === recommendationId);

const hasBehavior = (recommendation: OutfitRecommendation, events: BehaviorEvent[], behavior?: OutfitBehaviorFilter) => {
  if (!behavior) {
    return true;
  }

  if (behavior === "liked") {
    return recommendation.isLiked;
  }

  if (behavior === "worn") {
    return events.some((event) => event.eventType === "wear_today");
  }

  return events.some((event) => event.eventType === "change_outfit");
};

const matchesDate = (recommendation: OutfitRecommendation, events: BehaviorEvent[], date?: string) =>
  !date || recommendation.createdAt.startsWith(date) || events.some((event) => event.eventDate === date);

const itemOptionLabel = (item: WardrobeItem) =>
  [item.category ? categoryLabels[item.category] : "单品", item.primaryColor, item.material].filter(Boolean).join(" / ");

const snapshotString = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "string" ? value : undefined;
};

const recommendationContextTags = (recommendation: OutfitRecommendation, eventTypes: Set<BehaviorEvent["eventType"]>) => {
  const tags: Array<{ label: string; tone: "amber" | "stone" }> = [];
  const source = snapshotString(recommendation.inputSnapshot, "source");
  const replaceMode = snapshotString(recommendation.inputSnapshot, "replaceMode");

  if (source === "custom_request") {
    tags.push({ label: "诉求推荐", tone: "amber" });
  }

  if (replaceMode === "auto" || eventTypes.has("auto_replace_item")) {
    tags.push({ label: "自动替换", tone: "stone" });
  }

  if (replaceMode === "manual" || eventTypes.has("manual_replace_item")) {
    tags.push({ label: "手动替换", tone: "stone" });
  }

  return tags;
};

export default async function OutfitsPage({ searchParams }: OutfitsPageProps) {
  const params = await searchParams;
  const repository = getWardrobeRepository();
  const recommendations = repository.listOutfitRecommendations();
  const wardrobeItems = repository.listConfirmedWardrobeItems();
  const itemsById = new Map(wardrobeItems.map((item) => [item.id, item]));
  const behaviorEvents = repository.listBehaviorEvents();
  const visibleRecommendations = recommendations.filter((recommendation) => {
    const events = eventsForRecommendation(behaviorEvents, recommendation.id);

    return (
      matchesDate(recommendation, events, params?.date) &&
      hasBehavior(recommendation, events, params?.behavior) &&
      (!params?.itemId || recommendation.itemIds.includes(params.itemId))
    );
  });

  return (
    <AdminShell
      activeHref="/outfits"
      subtitle="查看已生成的穿搭组合，按日期、行为或单品筛选历史反馈。"
      title="穿搭组合卡"
    >
      <CollapsibleFilterPanel ariaLabel="组合筛选区" showSummaryOnDesktop title="筛选条件">
        <form action="/outfits" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto]" method="get">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-stone-700">日期筛选</span>
            <input className="min-h-10 rounded-md border border-stone-300 px-2" defaultValue={params?.date ?? ""} name="date" type="date" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-stone-700">行为筛选</span>
            <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" defaultValue={params?.behavior ?? ""} name="behavior">
              <option value="">全部</option>
              {behaviorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-stone-700">单品筛选</span>
            <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" defaultValue={params?.itemId ?? ""} name="itemId">
              <option value="">全部</option>
              {wardrobeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {itemOptionLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="min-h-10 rounded-md bg-[#D97706] px-4 text-sm font-semibold text-white" type="submit">
              筛选
            </button>
            <Link className="inline-flex min-h-10 items-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800" href="/outfits">
              清除
            </Link>
          </div>
        </form>
      </CollapsibleFilterPanel>

      {visibleRecommendations.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {visibleRecommendations.map((recommendation) => {
            const outfitItems = recommendation.itemIds.map((itemId) => itemsById.get(itemId)).filter(isWardrobeItem);
            const eventTypes = new Set(eventsForRecommendation(behaviorEvents, recommendation.id).map((event) => event.eventType));
            const contextTags = recommendationContextTags(recommendation, eventTypes);
            const styleLabel = getOutfitStyleLabel(outfitItems, recommendation);

            return (
              <article className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm" key={recommendation.id}>
                <div className="grid gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-950">{recommendation.title}</h2>
                    <p className="mt-1 text-sm text-stone-600">{recommendation.reason}</p>
                  </div>
                  <OutfitTagGroup>
                    <OutfitTag>{styleLabel}</OutfitTag>
                    {contextTags.map((tag) => (
                      <OutfitTag key={tag.label} tone={tag.tone}>
                        {tag.label}
                      </OutfitTag>
                    ))}
                    {recommendation.isLiked ? <OutfitTag>喜欢</OutfitTag> : null}
                    {eventTypes.has("wear_today") ? <OutfitTag>穿过</OutfitTag> : null}
                    {eventTypes.has("change_outfit") ? <OutfitTag tone="stone">跳过</OutfitTag> : null}
                  </OutfitTagGroup>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {outfitItems.map((item) => (
                    <div className="grid gap-1" key={item.id}>
                      <div className="relative aspect-square overflow-hidden rounded-md bg-stone-100">
                        <Image
                          alt={item.originalFilename ?? "穿搭品"}
                          className="object-cover"
                          fill
                          sizes="(min-width: 1024px) 12vw, 25vw"
                          src={item.imagePath}
                          unoptimized
                        />
                      </div>
                      <p className="text-xs text-stone-600">{item.category ? categoryLabels[item.category] : "单品"}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-stone-700">{recommendations.length > 0 ? "没有符合筛选条件的组合。" : "暂无穿搭组合。"}</p>
        </section>
      )}
    </AdminShell>
  );
}
