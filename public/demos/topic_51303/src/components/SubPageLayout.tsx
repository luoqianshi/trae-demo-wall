import type { ReactNode } from "react";
import PhoneShell from "./PhoneShell";
import NavBar from "./NavBar";

interface SubPageLayoutProps {
  title: string;
  children: ReactNode;
  showSearch?: boolean;
  onSearch?: () => void;
  right?: ReactNode;
  bottomPadding?: number;
}

/** 二级页面通用布局：手机壳 + 导航栏（带返回）+ 可滚动内容 */
export default function SubPageLayout({
  title,
  children,
  showSearch,
  onSearch,
  right,
  bottomPadding = 24,
}: SubPageLayoutProps) {
  return (
    <PhoneShell>
      <NavBar title={title} showBack showSearch={showSearch} onSearch={onSearch} right={right} />
      <div className="no-scrollbar flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="animate-slide-in-left" style={{ paddingBottom: bottomPadding }}>
          {children}
        </div>
      </div>
    </PhoneShell>
  );
}
