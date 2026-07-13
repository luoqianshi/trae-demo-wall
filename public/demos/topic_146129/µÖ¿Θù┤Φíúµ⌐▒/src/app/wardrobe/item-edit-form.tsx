import { Pencil, Save } from "lucide-react";
import {
  categoryOptions,
  formalityOptions,
  scenarioOptions,
  seasonOptions,
  styleOptions,
  warmthOptions
} from "@/lib/wardrobe/options";
import type { WardrobeItem } from "@/types/wardrobe";
import { fieldName } from "../review/confirmation-parser";
import { updateWardrobeItem } from "./actions";

function SelectField<T extends string>({
  label,
  name,
  options,
  value
}: {
  label: string;
  name: string;
  options: Array<{ value: T; label: string }>;
  value?: T;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      <select className="min-h-10 rounded-md border border-stone-300 bg-white px-2" defaultValue={value ?? ""} name={name}>
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
      <input className="min-h-10 rounded-md border border-stone-300 px-2" defaultValue={value ?? ""} name={name} />
    </label>
  );
}

const defaultSummaryClassName =
  "inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-[#D97706] transition hover:bg-amber-50";

export function WardrobeItemEditForm({
  item,
  summaryClassName = defaultSummaryClassName
}: {
  item: WardrobeItem;
  summaryClassName?: string;
}) {
  return (
    <details className="contents group">
      <summary className={`${summaryClassName} cursor-pointer list-none marker:hidden`}>
        <Pencil aria-hidden="true" className="h-4 w-4" />
        编辑属性
      </summary>
      <form action={updateWardrobeItem} className="col-span-2 grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-3">
        <input name="itemId" type="hidden" value={item.id} />
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
        <button className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-[#D97706] px-4 font-semibold text-white" type="submit">
          <Save aria-hidden="true" className="h-4 w-4" />
          保存修改
        </button>
      </form>
    </details>
  );
}
