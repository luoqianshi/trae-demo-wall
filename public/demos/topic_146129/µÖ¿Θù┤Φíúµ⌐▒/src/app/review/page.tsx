import Image from "next/image";
import { AdminShell } from "@/components/admin-shell";
import {
  categoryOptions,
  formalityOptions,
  scenarioOptions,
  seasonOptions,
  styleOptions,
  warmthOptions
} from "@/lib/wardrobe/options";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import type { WardrobeItem } from "@/types/wardrobe";
import { confirmDraftItems } from "./actions";
import { fieldName } from "./confirmation-parser";
import { UploadEntryForm } from "./upload-entry-form";

export const dynamic = "force-dynamic";

type ReviewPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function SelectField<T extends string>({
  label,
  name,
  options,
  value,
  includeEmptyOption = false
}: {
  label: string;
  name: string;
  options: Array<{ value: T; label: string }>;
  value?: T;
  includeEmptyOption?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      <select
        className="min-h-10 w-full min-w-0 max-w-full rounded-md border border-stone-300 bg-white px-2"
        defaultValue={value ?? ""}
        name={name}
      >
        {includeEmptyOption ? <option value="">不批量修改</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  name,
  value
}: {
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      <input className="min-h-10 w-full min-w-0 max-w-full rounded-md border border-stone-300 px-2" defaultValue={value ?? ""} name={name} />
    </label>
  );
}

function DraftItemCard({ item }: { item: WardrobeItem }) {
  const batchLabel = `纳入批量修改 ${item.originalFilename ?? item.id}`;
  const isProductDetailDraft = item.sourceType === "product_detail_text";
  const isProductUrlDraft = item.sourceType === "product_url";

  return (
    <article className="grid min-w-0 gap-4 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <input name="itemId" type="hidden" value={item.id} />
      <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-stone-800">
        <input className="h-4 w-4 shrink-0" name="batchItemId" type="checkbox" value={item.id} />
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{batchLabel}</span>
      </label>
      {item.recognitionStatus === "failed" && !isProductUrlDraft ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          识别失败，可直接手动填写后保存。
        </p>
      ) : null}
      <div className="relative aspect-square overflow-hidden rounded-md bg-stone-100">
        <Image
          alt={item.originalFilename ?? "待整理穿搭品"}
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          src={item.imagePath}
          unoptimized
        />
      </div>
      {isProductDetailDraft ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-semibold">来源：商品详情文本</p>
          {item.productDetailText ? <p className="mt-1 max-h-12 overflow-hidden text-amber-900">{item.productDetailText}</p> : null}
        </div>
      ) : null}
      {isProductUrlDraft ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-semibold">来源：商品链接</p>
          {item.productUrl ? <p className="mt-1 max-h-12 overflow-hidden break-all text-amber-900">{item.productUrl}</p> : null}
          <p className="mt-1 text-amber-900">链接已保存，当前还没有自动读取商品页。</p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="品类"
          name={fieldName(item.id, "category")}
          options={categoryOptions}
          value={item.category ?? "top"}
        />
        <TextField label="主色" name={fieldName(item.id, "primaryColor")} value={item.primaryColor} />
        <TextField label="辅色" name={fieldName(item.id, "secondaryColor")} value={item.secondaryColor} />
        <TextField label="材质" name={fieldName(item.id, "material")} value={item.material} />
        <SelectField
          label="季节"
          name={fieldName(item.id, "season")}
          options={seasonOptions}
          value={item.seasons?.[0] ?? "multi"}
        />
        <SelectField
          label="场景"
          name={fieldName(item.id, "scenario")}
          options={scenarioOptions}
          value={item.scenarios?.[0] ?? "casual"}
        />
        <SelectField
          label="正式程度"
          name={fieldName(item.id, "formality")}
          options={formalityOptions}
          value={item.formality ?? "casual"}
        />
        <SelectField
          label="风格"
          name={fieldName(item.id, "style")}
          options={styleOptions}
          value={item.styles?.[0] ?? "minimal"}
        />
        <SelectField
          label="厚薄"
          name={fieldName(item.id, "warmth")}
          options={warmthOptions}
          value={item.warmth ?? "medium"}
        />
      </div>
    </article>
  );
}

function BatchCorrectionPanel() {
  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-stone-950">批量修正</h2>
        <p className="mt-1 text-sm text-stone-600">勾选单品后，下面选择的字段会在保存时覆盖对应单品。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField includeEmptyOption label="批量季节" name="batch:season" options={seasonOptions} />
        <SelectField includeEmptyOption label="批量场景" name="batch:scenario" options={scenarioOptions} />
        <SelectField includeEmptyOption label="批量正式程度" name="batch:formality" options={formalityOptions} />
        <SelectField includeEmptyOption label="批量风格" name="batch:style" options={styleOptions} />
        <SelectField includeEmptyOption label="批量厚薄" name="batch:warmth" options={warmthOptions} />
      </div>
    </section>
  );
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const drafts = getWardrobeRepository().listDraftWardrobeItems();
  const hasEmptyError = params?.error === "empty";
  const hasProductDetailError = params?.error === "empty-product-detail";

  return (
    <AdminShell
      activeHref="/review"
      eyebrow="入库整理"
      subtitle="把上传后的照片草稿整理成可推荐的穿搭素材，批量修正适合前期大量录入。"
      title="入库整理"
    >
      <UploadEntryForm hasEmptyError={hasEmptyError} hasProductDetailError={hasProductDetailError} />

      {drafts.length > 0 ? (
        <form action={confirmDraftItems} className="grid gap-4">
          <BatchCorrectionPanel />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {drafts.map((item) => (
              <DraftItemCard item={item} key={item.id} />
            ))}
          </div>
          <div className="sticky bottom-0 border-t border-stone-200 bg-stone-50/95 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-6xl justify-end">
              <button className="min-h-12 rounded-md bg-[#D97706] px-5 py-3 font-semibold text-white shadow-sm" type="submit">
                保存确认
              </button>
            </div>
          </div>
        </form>
      ) : (
        <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-stone-700">暂无待整理单品。</p>
        </section>
      )}
    </AdminShell>
  );
}
