import Link from "next/link";
import { CalendarCheck, ClipboardList, Layers3, Menu, Shirt, Sparkles } from "lucide-react";
import { BrandMark } from "./brand-mark";

const adminLinks = [
  { href: "/", label: "今日推荐", mobileLabel: "今日推荐", icon: CalendarCheck },
  { href: "/request", label: "自定义推荐", mobileLabel: "自定义推荐", icon: Sparkles },
  { href: "/review", label: "入库整理", mobileLabel: "入库整理", icon: ClipboardList },
  { href: "/wardrobe", label: "我的衣橱", mobileLabel: "我的衣橱", icon: Shirt },
  { href: "/outfits", label: "穿搭组合卡", mobileLabel: "穿搭组合卡", icon: Layers3 }
];

type AdminShellProps = {
  activeHref: string;
  children: React.ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

const navLinkClass = (isActive: boolean) =>
  [
    "relative flex min-h-11 items-center gap-3 px-6 text-sm font-semibold transition",
    isActive
      ? "bg-amber-50 text-[#D97706] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#D97706]"
      : "text-stone-600 hover:bg-amber-50/60 hover:text-[#D97706]"
  ].join(" ");

export function AdminSidebar({ activeHref, showSlogan = true }: { activeHref: string; showSlogan?: boolean }) {
  return (
    <aside className="hidden border-r border-stone-200/80 bg-white/80 px-4 py-5 shadow-sm lg:flex lg:min-h-screen lg:flex-col">
      <div aria-label="桌面品牌区" className="-mx-4 border-b border-stone-200 px-4 pb-5">
        <BrandMark href="/" />
        {showSlogan ? (
          <p aria-label="品牌语" className="mt-4 text-xs leading-5 text-stone-500">
            Your daily edit of personal style.
          </p>
        ) : null}
      </div>

      <nav aria-label="后台导航" className="-mx-4 mt-3 hidden flex-col lg:flex">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === activeHref;

          return (
            <Link className={navLinkClass(isActive)} href={link.href} key={link.href}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileManagementMenu({ activeHref }: { activeHref?: string }) {
  return (
    <details aria-label="页面菜单" className="relative z-20 lg:hidden">
      <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center bg-transparent text-stone-700 hover:text-[#D97706] [&::-webkit-details-marker]:hidden">
        <span className="sr-only">页面菜单</span>
        <Menu aria-hidden="true" className="h-5 w-5" />
      </summary>
      <div className="absolute right-0 mt-2 grid w-44 gap-2 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
        {adminLinks.map((link) => {
          const isActive = link.href === activeHref;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-3 py-3 text-sm font-medium ${
                isActive ? "bg-amber-50 text-[#D97706]" : "text-stone-800 hover:bg-stone-100"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.mobileLabel}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

export function AdminShell({ activeHref, children, subtitle, title }: AdminShellProps) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F7F5F0] text-stone-950 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <AdminSidebar activeHref={activeHref} />

      <main className="mx-auto flex min-h-screen w-full max-w-7xl min-w-0 flex-col gap-6 overflow-x-clip px-4 py-5 lg:px-8 lg:py-8">
        <header className="grid gap-5">
          <div aria-label="移动后台页眉" className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3 lg:hidden" role="banner">
            <BrandMark href="/" size="sm" />
            <MobileManagementMenu activeHref={activeHref} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#D97706] lg:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{subtitle}</p> : null}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
