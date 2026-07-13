import Link from "next/link";
import { Sparkles } from "lucide-react";
import { categoryLabels, formalityOptions, scenarioOptions, seasonOptions } from "@/lib/wardrobe/options";
import type { OutfitRecommendation, WardrobeItem } from "@/types/wardrobe";
import { createCustomRequestRecommendations, manualReplaceRecommendationItem } from "../outfit-actions";
import { OutfitCard } from "../outfit-card";

const snapshotString = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "string" ? value : undefined;
};

const snapshotNumber = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "number" ? value : undefined;
};

const isWardrobeItem = (item: WardrobeItem | undefined): item is WardrobeItem => Boolean(item);

export function CustomRequestForm() {
  return (
    <section aria-label="主动诉求推荐" className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <form action={createCustomRequestRecommendations} className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-stone-900">穿搭诉求</span>
          <textarea
            aria-label="穿搭诉求"
            className="min-h-24 resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-base leading-6 outline-none focus:border-[#D97706]"
            name="requestText"
            placeholder="比如：今天要见客户，想正式一点，但别太沉闷"
          />
        </label>

        <div className="grid gap-3 border-t border-stone-200 pt-3">
          <input className="peer sr-only" id="custom-request-options-toggle" type="checkbox" />
          <label
            className="flex min-h-10 cursor-pointer items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700"
            htmlFor="custom-request-options-toggle"
          >
            <span>轻量条件</span>
            <span aria-hidden="true" className="text-[#D97706]">可选</span>
          </label>
          <div className="hidden gap-2 peer-checked:grid sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-stone-600">场景</span>
              <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" name="scenario">
                <option value="">自动判断</option>
                {scenarioOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-stone-600">季节</span>
              <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" name="season">
                <option value="">自动判断</option>
                {seasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-stone-600">正式程度</span>
              <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" name="formality">
                <option value="">自动判断</option>
                {formalityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-stone-600">颜色偏好</span>
              <input className="min-h-10 rounded-md border border-stone-300 bg-white px-2" name="colorPreference" placeholder="例如 黑、白、卡其" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-stone-600">材质偏好</span>
              <input className="min-h-10 rounded-md border border-stone-300 bg-white px-2" name="materialPreference" placeholder="例如 棉、羊毛、皮革" />
            </label>
          </div>
        </div>

        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#D97706] px-4 text-sm font-semibold text-white shadow-sm" type="submit">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          推荐 3 套
        </button>
      </form>
    </section>
  );
}

export function CustomRecommendationResults({
  itemsById,
  recommendations,
  requestGroupId
}: {
  itemsById: Map<string, WardrobeItem>;
  recommendations: OutfitRecommendation[];
  requestGroupId: string;
}) {
  if (recommendations.length === 0) {
    return null;
  }

  const requestText = snapshotString(recommendations[0].inputSnapshot, "requestText");
  const isFocusedAdjustment = recommendations.length === 1 && snapshotString(recommendations[0].inputSnapshot, "source") === "item_replace";
  const title = isFocusedAdjustment ? "调整后的方案" : recommendations.length === 3 ? "为这段诉求推荐的 3 套" : "这段诉求的推荐";

  return (
    <section aria-label="诉求推荐结果" className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="text-2xl font-semibold text-stone-950">{title}</h2>
        {requestText ? <p className="text-sm leading-6 text-stone-600">{requestText}</p> : null}
      </div>
      <div className="grid gap-4">
        {recommendations.map((recommendation, index) => (
          <OutfitCard
            heading={`方案 ${snapshotNumber(recommendation.inputSnapshot, "requestIndex") ?? index + 1}`}
            items={recommendation.itemIds.map((itemId) => itemsById.get(itemId)).filter(isWardrobeItem)}
            key={recommendation.id}
            recommendation={recommendation}
            requestGroupId={requestGroupId}
          />
        ))}
      </div>
    </section>
  );
}

export function ManualReplacementPicker({
  basePath = "/request",
  candidates,
  recommendationId,
  requestGroupId,
  targetItem
}: {
  basePath?: "/" | "/request";
  candidates: WardrobeItem[];
  recommendationId: string;
  requestGroupId?: string;
  targetItem: WardrobeItem;
}) {
  const categoryLabel = targetItem.category ? categoryLabels[targetItem.category] : "单品";

  return (
    <section aria-label="选择替换单品" className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold text-stone-950">选择替换{categoryLabel}</h2>
        <p className="text-sm text-stone-600">只展示同品类单品，选中后会更新当前穿搭组合卡。</p>
      </div>

      <form action={basePath} className="grid gap-2 rounded-md border border-stone-200 bg-stone-50 p-3" method="get">
        <input name="adjustRecommendationId" type="hidden" value={recommendationId} />
        <input name="adjustItemId" type="hidden" value={targetItem.id} />
        {requestGroupId ? <input name="requestGroupId" type="hidden" value={requestGroupId} /> : null}
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="min-h-10 rounded-md border border-stone-300 bg-white px-2 text-sm" name="color" placeholder="颜色" />
          <input className="min-h-10 rounded-md border border-stone-300 bg-white px-2 text-sm" name="material" placeholder="材质" />
          <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2 text-sm" name="season">
            <option value="">季节</option>
            {seasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button className="min-h-10 rounded-md border border-amber-200 bg-white px-3 text-sm font-semibold text-[#D97706]" type="submit">
          筛选
        </button>
      </form>

      {candidates.length > 0 ? (
        <div className="grid gap-2">
          {candidates.map((item) => (
            <form action={manualReplaceRecommendationItem} className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-stone-50 p-3" key={item.id}>
              <input name="recommendationId" type="hidden" value={recommendationId} />
              <input name="itemId" type="hidden" value={targetItem.id} />
              <input name="replacementItemId" type="hidden" value={item.id} />
              {requestGroupId ? <input name="requestGroupId" type="hidden" value={requestGroupId} /> : null}
              <span className="min-w-0 text-sm font-medium text-stone-800">{[item.primaryColor, item.material].filter(Boolean).join(" / ")}</span>
              <button className="shrink-0 rounded-md bg-[#D97706] px-3 py-2 text-sm font-semibold text-white" type="submit">
                选这件
              </button>
            </form>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-stone-700">衣橱里暂无其他{categoryLabel}可替换。</p>
          <Link className="w-fit rounded-md bg-[#D97706] px-3 py-2 text-sm font-semibold text-white" href="/review">
            去录入单品
          </Link>
        </div>
      )}
    </section>
  );
}
