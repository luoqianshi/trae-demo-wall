import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Heart, RefreshCw, Wand2, type LucideIcon } from "lucide-react";
import { OutfitTag, OutfitTagGroup } from "@/components/outfit-tags";
import { getOutfitStyleLabel } from "@/lib/recommendations/outfit-style";
import { categoryLabels } from "@/lib/wardrobe/options";
import type { OutfitRecommendation, WardrobeItem, WardrobeCategory } from "@/types/wardrobe";
import {
  autoReplaceRecommendationItem,
  changeOutfitRecommendation,
  toggleLikeRecommendation,
  wearRecommendationToday
} from "./outfit-actions";

const primaryOutfitCategories: WardrobeCategory[] = ["hat", "top", "pants", "shoes"];
const desktopGridColumnsByCount: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4"
};

const sortPrimaryItems = (items: WardrobeItem[]) => {
  const primaryItems = primaryOutfitCategories
    .map((category) => items.find((item) => item.category === category))
    .filter((item): item is WardrobeItem => Boolean(item));
  const fallbackItems = items.filter((item) => !primaryItems.some((primaryItem) => primaryItem.id === item.id));

  return [...primaryItems, ...fallbackItems];
};

const getDesktopGridColumnClass = (itemCount: number) => desktopGridColumnsByCount[Math.min(Math.max(itemCount, 1), 4)];

function OutfitPhotoTile({
  className,
  item,
  priority = false,
  recommendation,
  requestGroupId
}: {
  className?: string;
  item: WardrobeItem;
  priority?: boolean;
  recommendation: OutfitRecommendation;
  requestGroupId?: string;
}) {
  const categoryLabel = item.category ? categoryLabels[item.category] : "单品";
  const colorText = item.primaryColor ?? "未标注颜色";
  const detailText = [item.primaryColor, item.material].filter(Boolean).join(" / ") || "未标注";

  return (
    <article
      aria-label={`${categoryLabel} · ${colorText}`}
      className={`relative min-h-36 overflow-hidden rounded-md bg-stone-100 lg:aspect-square lg:min-h-0 ${className ?? ""}`}
    >
      <Image
        alt={item.originalFilename ?? "穿搭品"}
        className="object-cover"
        fill
        priority={priority}
        sizes="(min-width: 768px) 28vw, 50vw"
        src={item.imagePath}
        unoptimized
      />
      <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/75 to-transparent p-2 text-white">
        <div>
          <p className="text-sm font-semibold">{categoryLabel}</p>
          <p className="text-xs text-white/85">{detailText}</p>
        </div>
        <ItemAdjustmentControls item={item} recommendation={recommendation} requestGroupId={requestGroupId} />
      </div>
    </article>
  );
}

function OutfitPhotoStage({
  items,
  recommendation,
  requestGroupId
}: {
  items: WardrobeItem[];
  recommendation: OutfitRecommendation;
  requestGroupId?: string;
}) {
  const sortedItems = sortPrimaryItems(items);
  const primaryItems = sortedItems.filter((item) => item.category && primaryOutfitCategories.includes(item.category));
  const supplementalItems = sortedItems.filter((item) => !primaryItems.some((primaryItem) => primaryItem.id === item.id));
  const desktopColumnClass = getDesktopGridColumnClass(primaryItems.length || supplementalItems.length);

  const tileClassByCategory: Partial<Record<WardrobeCategory, string>> = {
    hat: "aspect-[4/3]",
    top: "aspect-[4/3]",
    pants: "aspect-[4/3]",
    shoes: "aspect-[4/3]"
  };

  return (
    <div className="grid gap-3">
      <div
        aria-label="今日推荐图片组合"
        className={`grid grid-cols-1 gap-3 ${desktopColumnClass}`}
      >
        {primaryItems.map((item, index) => (
          <OutfitPhotoTile
            className={item.category ? tileClassByCategory[item.category] : "aspect-[4/3]"}
            item={item}
            key={item.id}
            priority={index === 0}
            recommendation={recommendation}
            requestGroupId={requestGroupId}
          />
        ))}
      </div>

      {supplementalItems.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-[#D97706]">补充单品</p>
          <div aria-label="补充单品图片组合" className={`grid grid-cols-1 gap-3 ${desktopColumnClass}`}>
            {supplementalItems.map((item) => (
              <OutfitPhotoTile
                className="aspect-[4/3]"
                item={item}
                key={item.id}
                recommendation={recommendation}
                requestGroupId={requestGroupId}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecommendationActionButton({
  children,
  icon: Icon,
  isPrimary = false
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  isPrimary?: boolean;
}) {
  const className = isPrimary
    ? "min-h-12 w-full min-w-0 rounded-md bg-[#D97706] px-2 py-3 text-[0.8rem] font-semibold text-white shadow-sm sm:text-sm"
    : "min-h-12 w-full min-w-0 rounded-md border border-amber-200 bg-white px-2 py-3 text-[0.8rem] font-semibold text-[#D97706] shadow-sm sm:text-sm";

  return (
    <button className={`${className} inline-flex items-center justify-center gap-1.5 whitespace-nowrap`} type="submit">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      <span>{children}</span>
    </button>
  );
}

function buildManualReplaceHref(recommendationId: string, itemId: string, requestGroupId?: string) {
  const params = new URLSearchParams({
    adjustRecommendationId: recommendationId,
    adjustItemId: itemId
  });

  if (requestGroupId) {
    params.set("requestGroupId", requestGroupId);
  }

  const basePath = requestGroupId ? "/request" : "/";

  return `${basePath}?${params.toString()}`;
}

const itemAdjustmentButtonClass =
  "inline-flex min-h-9 w-full min-w-0 items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-white/95 px-2 font-sans text-[0.8rem] font-semibold leading-none text-[#D97706] shadow-sm backdrop-blur";

function ItemAdjustmentControls({
  item,
  recommendation,
  requestGroupId
}: {
  item: WardrobeItem;
  recommendation: OutfitRecommendation;
  requestGroupId?: string;
}) {
  const categoryLabel = item.category ? categoryLabels[item.category] : "单品";

  return (
    <div aria-label={`${categoryLabel}调整`} className="grid grid-cols-2 gap-2">
      <form action={autoReplaceRecommendationItem} className="min-w-0">
        <input name="recommendationId" type="hidden" value={recommendation.id} />
        <input name="itemId" type="hidden" value={item.id} />
        {requestGroupId ? <input name="requestGroupId" type="hidden" value={requestGroupId} /> : null}
        <button className={itemAdjustmentButtonClass} type="submit">
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">自动换一件</span>
        </button>
      </form>
      <Link
        className={itemAdjustmentButtonClass}
        href={buildManualReplaceHref(recommendation.id, item.id, requestGroupId)}
      >
        <Wand2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">自己选</span>
      </Link>
    </div>
  );
}

export function OutfitCard({
  heading = "今日推荐",
  items,
  recommendation,
  requestGroupId
}: {
  heading?: string;
  items: WardrobeItem[];
  recommendation: OutfitRecommendation;
  requestGroupId?: string;
}) {
  const styleLabel = getOutfitStyleLabel(items, recommendation);

  return (
    <section
      aria-label={heading}
      className="grid min-h-[calc(100svh-13rem)] gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:min-h-0 lg:max-w-none"
    >
      <div className="grid gap-3">
        <h2 className="text-xl font-semibold text-[#D97706]">{heading}</h2>
        <OutfitTagGroup>
          <OutfitTag>{styleLabel}</OutfitTag>
        </OutfitTagGroup>
      </div>

      <OutfitPhotoStage items={items} recommendation={recommendation} requestGroupId={requestGroupId} />

      <section aria-label="推荐理由" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
        <h3 className="text-sm font-semibold text-stone-950">推荐理由</h3>
        <p className="mt-1 text-sm leading-6 text-stone-700">{recommendation.reason}</p>
      </section>

      <div aria-label="推荐动作" className="grid grid-cols-2 gap-2" role="group">
        <form action={wearRecommendationToday} className="col-span-2 min-w-0">
          <input name="recommendationId" type="hidden" value={recommendation.id} />
          <RecommendationActionButton icon={CheckCircle2} isPrimary>
            今天穿这套
          </RecommendationActionButton>
        </form>
        <form action={toggleLikeRecommendation} className="min-w-0">
          <input name="recommendationId" type="hidden" value={recommendation.id} />
          <RecommendationActionButton icon={Heart}>
            {recommendation.isLiked ? "已喜欢" : "喜欢"}
          </RecommendationActionButton>
        </form>
        <form action={changeOutfitRecommendation} className="min-w-0">
          <input name="recommendationId" type="hidden" value={recommendation.id} />
          <RecommendationActionButton icon={RefreshCw}>
            换一套
          </RecommendationActionButton>
        </form>
      </div>
    </section>
  );
}
