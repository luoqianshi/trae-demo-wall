"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import { buildConfirmationAttributes } from "./confirmation-parser";

export async function confirmDraftItems(formData: FormData) {
  const itemIds = formData.getAll("itemId").filter((value): value is string => typeof value === "string");
  const repository = getWardrobeRepository();

  itemIds.forEach((id) => {
    repository.confirmWardrobeItem(id, buildConfirmationAttributes(formData, id));
  });

  revalidatePath("/review");
  revalidatePath("/wardrobe");
  redirect("/wardrobe");
}
