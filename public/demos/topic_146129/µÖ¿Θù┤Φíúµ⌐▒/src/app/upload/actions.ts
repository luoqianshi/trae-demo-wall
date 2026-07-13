"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRecognitionProvider } from "@/lib/recognition/provider-factory";
import { saveUploadedWardrobeFiles } from "@/lib/uploads/local-upload";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";

const isUploadableFile = (value: FormDataEntryValue): value is File => value instanceof File && value.size > 0;
const errorMessageFromUnknown = (error: unknown) => (error instanceof Error ? error.message : "识别失败");

export async function uploadWardrobeItems(formData: FormData) {
  const files = formData.getAll("photos").filter(isUploadableFile);

  if (files.length === 0) {
    redirect("/review?error=empty");
  }

  const savedFiles = await saveUploadedWardrobeFiles(files);
  const repository = getWardrobeRepository();
  const recognitionProvider = createRecognitionProvider();
  const providerName = process.env.RECOGNITION_PROVIDER ?? "mock";

  for (const file of savedFiles) {
    const item = repository.createWardrobeItem({
      imagePath: file.imagePath,
      originalFilename: file.originalFilename
    });

    try {
      const recognition = await recognitionProvider.recognize({
        imagePath: file.imagePath,
        originalFilename: file.originalFilename
      });

      repository.saveRecognitionDraft({
        itemId: item.id,
        provider: recognition.provider,
        model: recognition.model,
        rawResult: recognition.rawResult,
        attributes: recognition.attributes
      });
    } catch (error) {
      repository.saveRecognitionFailure({
        itemId: item.id,
        provider: providerName,
        rawResult: {
          imagePath: file.imagePath,
          originalFilename: file.originalFilename
        },
        errorMessage: errorMessageFromUnknown(error)
      });
    }
  }

  revalidatePath("/review");
  revalidatePath("/wardrobe");
  redirect("/review");
}
