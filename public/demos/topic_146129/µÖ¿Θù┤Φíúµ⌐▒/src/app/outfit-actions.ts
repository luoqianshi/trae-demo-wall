"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deriveSeasonFromShanghaiDate, getShanghaiDate } from "@/lib/dates/shanghai-date";
import {
  autoReplaceRecommendationItem as autoReplaceRecommendationItemService,
  createCustomRequestOutfitRecommendations,
  manualReplaceRecommendationItem as manualReplaceRecommendationItemService,
  replaceDailyOutfitRecommendation
} from "@/lib/recommendations/recommendation-service";
import { getWeatherSnapshot } from "@/lib/weather/open-meteo";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import { formalities, scenarios, seasons } from "@/types/wardrobe";

const recommendationIdFromForm = (formData: FormData) => {
  const recommendationId = formData.get("recommendationId");

  if (typeof recommendationId !== "string" || !recommendationId) {
    throw new Error("缺少推荐组合 ID");
  }

  return recommendationId;
};

const stringFromForm = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const optionalStringFromForm = (formData: FormData, key: string) => stringFromForm(formData, key) || undefined;

const typedFormValue = <T extends string>(formData: FormData, key: string, allowedValues: readonly T[]) => {
  const value = optionalStringFromForm(formData, key);

  return value && allowedValues.includes(value as T) ? (value as T) : undefined;
};

const redirectToRecommendationResult = ({
  focusRecommendationId,
  requestGroupId
}: {
  focusRecommendationId?: string;
  requestGroupId?: string;
}) => {
  const params = new URLSearchParams();

  if (requestGroupId) {
    params.set("requestGroupId", requestGroupId);
  }

  if (focusRecommendationId) {
    params.set("focusRecommendationId", focusRecommendationId);
  }

  const query = params.toString();
  const basePath = requestGroupId ? "/request" : "/";

  redirect(query ? `${basePath}?${query}` : basePath);
};

const redirectToReplacementFailure = ({ message, requestGroupId }: { message: string; requestGroupId?: string }): never => {
  const params = new URLSearchParams({
    replaceMessage: message
  });
  const basePath = requestGroupId ? "/request" : "/";

  if (requestGroupId) {
    params.set("requestGroupId", requestGroupId);
  }

  redirect(`${basePath}?${params.toString()}`);
};

export async function toggleLikeRecommendation(formData: FormData) {
  const repository = getWardrobeRepository();
  const recommendationId = recommendationIdFromForm(formData);
  const recommendation = repository.getOutfitRecommendation(recommendationId);

  if (!recommendation) {
    redirect("/");
  }

  const weather = await getWeatherSnapshot();

  repository.recordLike({
    recommendationId,
    liked: !recommendation.isLiked,
    eventDate: getShanghaiDate(),
    weatherSnapshot: weather
  });

  revalidatePath("/");
  revalidatePath("/outfits");
}

export async function wearRecommendationToday(formData: FormData) {
  const repository = getWardrobeRepository();
  const weather = await getWeatherSnapshot();

  repository.recordWearToday({
    recommendationId: recommendationIdFromForm(formData),
    eventDate: getShanghaiDate(),
    weatherSnapshot: weather
  });

  revalidatePath("/");
  revalidatePath("/outfits");
}

export async function changeOutfitRecommendation(formData: FormData) {
  const repository = getWardrobeRepository();
  const recommendationId = recommendationIdFromForm(formData);
  const eventDate = getShanghaiDate();
  const weather = await getWeatherSnapshot();

  repository.recordChangeOutfit({
    recommendationId,
    eventDate,
    weatherSnapshot: weather
  });

  replaceDailyOutfitRecommendation(repository, eventDate, {
    scenario: "casual",
    season: deriveSeasonFromShanghaiDate(eventDate),
    weather
  });

  revalidatePath("/");
  revalidatePath("/outfits");
  redirect("/");
}

export async function createCustomRequestRecommendations(formData: FormData) {
  const requestText = stringFromForm(formData, "requestText");

  if (!requestText) {
    redirect("/request");
  }

  const repository = getWardrobeRepository();
  const weather = await getWeatherSnapshot();
  const recommendationDate = getShanghaiDate();
  const result = createCustomRequestOutfitRecommendations(repository, {
    requestText,
    scenario: typedFormValue(formData, "scenario", scenarios),
    season: typedFormValue(formData, "season", seasons) ?? deriveSeasonFromShanghaiDate(recommendationDate),
    formality: typedFormValue(formData, "formality", formalities),
    colorPreference: optionalStringFromForm(formData, "colorPreference"),
    materialPreference: optionalStringFromForm(formData, "materialPreference"),
    weather
  });

  revalidatePath("/");
  revalidatePath("/request");
  revalidatePath("/outfits");

  if (!result.ok) {
    redirect("/request");
  }

  redirectToRecommendationResult({
    requestGroupId: result.requestGroupId
  });
}

export async function autoReplaceRecommendationItem(formData: FormData) {
  const repository = getWardrobeRepository();
  const weather = await getWeatherSnapshot();
  const result = autoReplaceRecommendationItemService(repository, {
    recommendationId: recommendationIdFromForm(formData),
    itemId: stringFromForm(formData, "itemId"),
    eventDate: getShanghaiDate(),
    weather
  });

  revalidatePath("/");
  revalidatePath("/request");
  revalidatePath("/outfits");

  if (result.ok === false) {
    redirectToReplacementFailure({
      message: result.message,
      requestGroupId: optionalStringFromForm(formData, "requestGroupId")
    });
  }

  if (result.ok === true) {
    redirectToRecommendationResult({
      requestGroupId: optionalStringFromForm(formData, "requestGroupId"),
      focusRecommendationId: result.recommendation.id
    });
  }
}

export async function manualReplaceRecommendationItem(formData: FormData) {
  const repository = getWardrobeRepository();
  const weather = await getWeatherSnapshot();
  const result = manualReplaceRecommendationItemService(repository, {
    recommendationId: recommendationIdFromForm(formData),
    itemId: stringFromForm(formData, "itemId"),
    replacementItemId: stringFromForm(formData, "replacementItemId"),
    eventDate: getShanghaiDate(),
    weather
  });

  revalidatePath("/");
  revalidatePath("/request");
  revalidatePath("/outfits");

  if (result.ok === false) {
    redirect("/");
  }

  if (result.ok === true) {
    redirectToRecommendationResult({
      requestGroupId: optionalStringFromForm(formData, "requestGroupId"),
      focusRecommendationId: result.recommendation.id
    });
  }
}
