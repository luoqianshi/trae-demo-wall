import { MobileManagementMenu } from "@/components/admin-shell";
import { BrandMark } from "@/components/brand-mark";
import type { WeatherSnapshot } from "@/lib/weather/open-meteo";
import { WeatherLine } from "./weather-card";

export function MobileBrandHeader({
  action,
  activeHref = "/",
  showManagement = true,
  weather
}: {
  action?: React.ReactNode;
  activeHref?: string;
  showManagement?: boolean;
  weather: WeatherSnapshot;
}) {
  return (
    <header className="grid gap-3 border-b border-stone-200 pb-3">
      <div className="flex items-start justify-between gap-4">
        <BrandMark href="/" />
        {action ?? (showManagement ? <MobileManagementMenu activeHref={activeHref} /> : null)}
      </div>

      <div className="grid gap-3">
        <WeatherLine className="text-xs text-stone-600" weather={weather} />
        <p aria-label="品牌语" className="w-fit border-l-2 border-[#D97706] pl-3 text-sm leading-5 text-stone-500">
          Your daily edit of personal style.
        </p>
      </div>
    </header>
  );
}
