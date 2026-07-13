import Link from "next/link";

const links = [
  { href: "/", label: "今日推荐" },
  { href: "/request", label: "自定义推荐" },
  { href: "/review", label: "入库整理" },
  { href: "/wardrobe", label: "我的衣橱" },
  { href: "/outfits", label: "穿搭组合卡" }
];

type AppNavProps = {
  className?: string;
};

export function AppNav({ className = "flex" }: AppNavProps) {
  return (
    <nav className={`${className} flex-wrap gap-2 text-sm`} aria-label="主导航">
      {links.map((link) => (
        <Link
          className="rounded-md border border-stone-300 bg-white px-3 py-2 font-medium text-stone-800 shadow-sm"
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
