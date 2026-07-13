import type { Season } from "@/types/wardrobe";

export const getShanghaiDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric"
  }).formatToParts(date);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

export const deriveSeasonFromShanghaiDate = (dateText: string): Season => {
  const month = Number(dateText.slice(5, 7));

  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "autumn";

  return "winter";
};
