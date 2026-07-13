import { uploadWardrobeItems } from "@/app/upload/actions";
import { Camera, ImageIcon } from "lucide-react";
import { createWardrobeItemFromProductDetail } from "./product-source-actions";

export function UploadEntryForm({
  hasEmptyError = false,
  hasProductDetailError = false
}: {
  hasEmptyError?: boolean;
  hasProductDetailError?: boolean;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-stone-950">新增待整理单品</h2>
        <p className="mt-1 text-sm text-stone-600">选择图片上传，或粘贴商品详情页生成待整理草稿。</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="grid min-w-0 gap-3 rounded-md border border-stone-200 bg-stone-50/60 p-3" aria-label="选择图片上传">
          <div>
            <h3 className="text-sm font-semibold text-stone-950">选择图片上传</h3>
            <p className="mt-1 text-xs leading-5 text-stone-500">适合已经拍好的衣服、鞋子、帽子照片。</p>
          </div>
          <form action={uploadWardrobeItems} className="grid w-full max-w-full gap-3">
            <div className="grid min-w-0 gap-3">
              <label className="flex min-h-12 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#D97706] px-4 py-3 font-semibold text-white shadow-sm">
                <Camera aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>拍照录入</span>
                <input accept="image/*" capture="environment" className="sr-only" name="photos" type="file" />
              </label>
              <label className="flex min-h-12 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-600 shadow-sm">
                <ImageIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>从相册批量选择</span>
                <input accept="image/*" className="sr-only" multiple name="photos" type="file" />
              </label>
            </div>

            {hasEmptyError ? <p className="text-sm font-medium text-red-700">请选择至少一张图片。</p> : null}

            <button
              className="min-h-12 w-full min-w-0 rounded-md bg-[#D97706] px-4 py-3 font-semibold text-white shadow-sm"
              type="submit"
            >
              上传并进入整理
            </button>
          </form>
        </section>

        <section className="grid min-w-0 gap-3 rounded-md border border-stone-200 bg-stone-50/60 p-3" aria-label="粘贴商品详情页">
          <div>
            <h3 className="text-sm font-semibold text-stone-950">粘贴商品详情页</h3>
            <p className="mt-1 text-xs leading-5 text-stone-500">适合从电商页复制链接、商品参数或材质说明。</p>
          </div>
          <form action={createWardrobeItemFromProductDetail} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-stone-700">粘贴商品详情页</span>
              <textarea
                className="min-h-28 w-full min-w-0 max-w-full rounded-md border border-stone-300 bg-white px-3 py-2 leading-6"
                name="productDetailText"
                placeholder="可以粘贴商品链接、商品名称、颜色、材质成分、适合季节、商品参数..."
              />
            </label>

            {hasProductDetailError ? <p className="text-sm font-medium text-red-700">请粘贴商品详情页。</p> : null}

            <button
              className="min-h-12 w-full min-w-0 rounded-md border border-amber-200 bg-white px-4 py-3 font-semibold text-[#D97706] shadow-sm"
              type="submit"
            >
              生成待整理草稿
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
