"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildConfirmationAttributes } from "@/app/review/confirmation-parser";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";

export async function updateWardrobeItem(formData: FormData) {
  const itemIdValue = formData.get("itemId");

  if (typeof itemIdValue !== "string" || !itemIdValue.trim()) {
    redirect("/wardrobe");
  }

  const itemId = itemIdValue.trim();

  getWardrobeRepository().confirmWardrobeItem(itemId, buildConfirmationAttributes(formData, itemId));

  revalidatePath("/wardrobe");
  revalidatePath("/");
  revalidatePath("/outfits");
  redirect("/wardrobe");
}
