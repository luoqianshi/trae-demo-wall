import Image from "next/image";
import Link from "next/link";
import { Eye, RotateCcw, SlidersHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { CollapsibleFilterPanel } from "@/components/collapsible-filter-panel";
import { categoryLabels, categoryOptions, scenarioOptions, seasonOptions, warmthOptions } from "@/lib/wardrobe/options";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import type { Scenario, Season, WardrobeCategory, WardrobeItem, WarmthLevel } from "@/types/wardrobe";
import { WardrobeItemEditForm } from "./item-edit-form";

export const dynamic = "force-dynamic";

type WardrobePageProps = {
  searchParams?: Promise<{
    category?: WardrobeCategory;
    color?: string;
    material?: string;
    season?: Season;
    scenario?: Scenario;
  }>;
};

function FilterSelect<T extends string>({
  label,
  name,
  options,
  value
}: {
  label: string;
  name: string;
  options: Array<{ value: T; label: string }>;
  value?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" defaultValue={value ?? ""} name={name}>
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const normalizedFilter = (value: string | undefined) => value?.trim().toLowerCase() ?? "";

const includesText = (values: Array<string | undefined>, filter: string) =>
  !filter || values.some((value) => value?.toLowerCase().includes(filter));

const optionLabel = <T extends string>(options: Array<{ value: T; label: string }>, value: T | undefined) =>
  options.find((option) => option.value === value)?.label ?? value ?? "未标注";

const seasonText = (item: WardrobeItem) =>
  item.seasons?.map((season) => optionLabel(seasonOptions, season as Season)).join("、") || "未标注";

const categoryTabClass = (isActive: boolean) =>
  [
    "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "border-[#D97706] bg-[#D97706] text-white shadow-sm"
      : "border-stone-300 bg-white text-stone-800 hover:border-amber-300 hover:bg-amber-50 hover:text-[#D97706]"
  ].join(" ");

const wardrobeActionClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-[#D97706] transition hover:bg-amber-50";

const wardrobeHref = (params: Awaited<WardrobePageProps["searchParams"]> | undefined, category?: WardrobeCategory) => {
  const query = new URLSearchParams();
  const color = params?.color?.trim();
  const material = params?.material?.trim();

  if (color) {
    query.set("color", color);
  }

  if (material) {
    query.set("material", material);
  }

  if (params?.season) {
    query.set("season", params.season);
  }

  if (params?.scenario) {
    query.set("scenario", params.scenario);
  }

  if (category) {
    query.set("category", category);
  }

  const queryString = query.toString();

  return queryString ? `/wardrobe?${queryString}` : "/wardrobe";
};

const matchesFilters = (
  item: WardrobeItem,
  filters: {
    category?: WardrobeCategory;
    color: string;
    material: string;
    season?: Season;
    scenario?: Scenario;
  }
) =>
  (!filters.category || item.category === filters.category) &&
  includesText([item.primaryColor, item.secondaryColor], filters.color) &&
  includesText([item.material], filters.material) &&
  (!filters.season || item.seasons?.includes(filters.season)) &&
  (!filters.scenario || item.scenarios?.includes(filters.scenario));

export default async function WardrobePage({ searchParams }: WardrobePageProps) {
  const params = await searchParams;
  const filters = {
    category: params?.category,
    color: normalizedFilter(params?.color),
    material: normalizedFilter(params?.material),
    season: params?.season,
    scenario: params?.scenario
  };
  const repository = getWardrobeRepository();
  const items = repository.listConfirmedWardrobeItems();
  const usageStats = new Map(repository.getWardrobeItemUsageStats().map((stat) => [stat.itemId, stat]));
  const visibleItems = items.filter((item) => matchesFilters(item, filters));
  const categoryCounts = categoryOptions.map((option) => ({
    ...option,
    count: items.filter((item) => item.category === option.value).length
  }));

  return (
    <AdminShell
      activeHref="/wardrobe"
      eyebrow="我的衣橱"
      subtitle="按品类、颜色、材质和季节查看所有已入库单品，并保留每件单品的推荐调用记录。"
      title="我的衣橱"
    >
      <CollapsibleFilterPanel ariaLabel="衣橱筛选区" showSummaryOnDesktop title="筛选条件">
        <div className="grid gap-2">
          <span className="text-sm font-medium text-stone-700" id="wardrobe-category-filter-title">
            品类筛选
          </span>
          <div aria-labelledby="wardrobe-category-filter-title" className="flex flex-wrap gap-2" role="tablist">
            <Link aria-selected={!filters.category} className={categoryTabClass(!filters.category)} href={wardrobeHref(params)} role="tab">
              全部 {items.length}
            </Link>
            {categoryCounts.map((category) => {
              const isActive = filters.category === category.value;

              return (
                <Link
                  aria-selected={isActive}
                  className={categoryTabClass(isActive)}
                  href={wardrobeHref(params, category.value)}
                  key={category.value}
                  role="tab"
                >
                  {category.label} {category.count}
                </Link>
              );
            })}
          </div>
        </div>

        <form action="/wardrobe" className="grid gap-3 md:grid-cols-4" method="get">
          {filters.category ? <input name="category" type="hidden" value={filters.category} /> : null}
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-stone-700">颜色筛选</span>
            <input
              className="min-h-10 rounded-md border border-stone-300 px-2"
              defaultValue={params?.color ?? ""}
              name="color"
              placeholder="例：黑"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-stone-700">材质筛选</span>
            <input
              className="min-h-10 rounded-md border border-stone-300 px-2"
              defaultValue={params?.material ?? ""}
              name="material"
              placeholder="例：羊毛"
            />
          </label>
          <FilterSelect label="季节筛选" name="season" options={seasonOptions} value={filters.season} />
          <FilterSelect label="场景筛选" name="scenario" options={scenarioOptions} value={filters.scenario} />
          <div className="flex items-end gap-2 md:col-span-4">
            <button className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#D97706] px-4 text-sm font-semibold text-white" type="submit">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              筛选
            </button>
            <Link className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800" href="/wardrobe">
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              清除筛选
            </Link>
          </div>
        </form>
      </CollapsibleFilterPanel>

      <div aria-label="衣橱结果统计" className="text-sm text-stone-600">
        共 <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-[#D97706]">{visibleItems.length}</span> 件单品
      </div>

      <section aria-label="衣橱卡片区" className="grid gap-3">
        {visibleItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => {
              const usage = usageStats.get(item.id);

              return (
                <article className="grid gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm" key={item.id}>
                  <div className="relative aspect-square overflow-hidden rounded-md bg-stone-100">
                    <Image
                      alt={item.originalFilename ?? "穿搭品"}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      src={item.imagePath}
                      unoptimized
                    />
                  </div>
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-semibold text-stone-950">
                        {item.category ? categoryLabels[item.category] : "未分类"}
                      </h2>
                      <span className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700">
                        引用 {usage?.referencedOutfitCount ?? 0}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600">
                      {[item.primaryColor, item.secondaryColor, item.material].filter(Boolean).join(" / ") || "未标注"}
                    </p>
                    <p className="text-sm text-stone-500">
                      季节 {seasonText(item)} · 厚薄 {optionLabel(warmthOptions, item.warmth as WarmthLevel | undefined)}
                    </p>
                  </div>
                  <div aria-label="单品操作" className="grid grid-cols-2 gap-2">
                    <Link className={wardrobeActionClass} href={`/wardrobe/${item.id}`}>
                      <Eye aria-hidden="true" className="h-4 w-4" />
                      查看详情
                    </Link>
                    <WardrobeItemEditForm item={item} summaryClassName={wardrobeActionClass} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-stone-700">{items.length > 0 ? "没有符合筛选条件的单品。" : "暂无已确认单品。"}</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
