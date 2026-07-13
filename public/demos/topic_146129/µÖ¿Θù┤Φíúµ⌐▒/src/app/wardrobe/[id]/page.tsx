import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  categoryLabels,
  formalityOptions,
  scenarioOptions,
  seasonOptions,
  styleOptions,
  warmthOptions
} from "@/lib/wardrobe/options";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import type { Formality, Scenario, Season, Style, WardrobeItem, WarmthLevel } from "@/types/wardrobe";
import { WardrobeItemEditForm } from "../item-edit-form";

export const dynamic = "force-dynamic";

type WardrobeItemDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const optionLabel = <T extends string>(options: Array<{ value: T; label: string }>, value: T | undefined) =>
  options.find((option) => option.value === value)?.label ?? value ?? "未标注";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-stone-100 py-3">
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="font-medium text-stone-950">{value}</dd>
    </div>
  );
}

function UsageStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-xs text-stone-500">
        {label} {value}
      </p>
      <p aria-hidden="true" className="text-2xl font-semibold text-[#D97706]">
        {value}
      </p>
    </div>
  );
}

function itemTitle(item: WardrobeItem) {
  return item.originalFilename ?? (item.category ? categoryLabels[item.category] : "穿搭品详情");
}

export default async function WardrobeItemDetailPage({ params }: WardrobeItemDetailPageProps) {
  const { id } = await params;
  const repository = getWardrobeRepository();
  const item = repository.listConfirmedWardrobeItems().find((confirmedItem) => confirmedItem.id === id);

  if (!item) {
    notFound();
  }

  const usage = repository.getWardrobeItemUsageStats().find((stat) => stat.itemId === item.id);

  return (
    <AdminShell
      activeHref="/wardrobe"
      eyebrow="单品详情"
      subtitle="查看单品属性、使用数据，并在识别不准时直接修正。"
      title={itemTitle(item)}
    >
      <div className="flex justify-end">
        <Link className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800" href="/wardrobe">
          返回衣橱
        </Link>
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          <Image
            alt={item.originalFilename ?? "穿搭品"}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            src={item.imagePath}
            unoptimized
          />
        </div>

        <div className="grid gap-4">
          <section className="grid grid-cols-3 gap-2">
            <UsageStatCard label="引用穿搭" value={usage?.referencedOutfitCount ?? 0} />
            <UsageStatCard label="喜欢穿搭" value={usage?.likedOutfitCount ?? 0} />
            <UsageStatCard label="穿着次数" value={usage?.wornCount ?? 0} />
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <dl>
              <DetailRow label="品类" value={item.category ? categoryLabels[item.category] : "未标注"} />
              <DetailRow label="主色" value={item.primaryColor ?? "未标注"} />
              <DetailRow label="辅色" value={item.secondaryColor ?? "未标注"} />
              <DetailRow label="材质" value={item.material ?? "未标注"} />
              <DetailRow label="季节" value={item.seasons?.map((season) => optionLabel(seasonOptions, season as Season)).join("、") || "未标注"} />
              <DetailRow label="场景" value={item.scenarios?.map((scenario) => optionLabel(scenarioOptions, scenario as Scenario)).join("、") || "未标注"} />
              <DetailRow label="正式程度" value={optionLabel(formalityOptions, item.formality as Formality | undefined)} />
              <DetailRow label="风格" value={item.styles?.map((style) => optionLabel(styleOptions, style as Style)).join("、") || "未标注"} />
              <DetailRow label="厚薄" value={optionLabel(warmthOptions, item.warmth as WarmthLevel | undefined)} />
            </dl>
          </section>

          <WardrobeItemEditForm item={item} />
        </div>
      </section>
    </AdminShell>
  );
}
