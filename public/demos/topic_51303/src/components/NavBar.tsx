import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ChevronLeft, MoreHorizontal, Search } from "lucide-react";

interface NavBarProps {
  title: string;
  /** 是否显示返回按钮（二级页面） */
  showBack?: boolean;
  /** 右侧自定义内容 */
  right?: ReactNode;
  /** 标题右侧小箭头（首页切棚） */
  titleArrow?: boolean;
  onTitleClick?: () => void;
  /** 右侧是否显示搜索按钮 */
  showSearch?: boolean;
  onSearch?: () => void;
}

/** 微信小程序风格导航栏：44px 高，居中标题，左右平衡区 */
export default function NavBar({
  title,
  showBack = false,
  right,
  titleArrow = false,
  onTitleClick,
  showSearch = false,
  onSearch,
}: NavBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/home");
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center"
      style={{
        height: 44,
        padding: "0 12px",
        background: "var(--color-bg-elevated)",
        borderBottom: "1px solid var(--color-rule)",
      }}
    >
      {/* 左侧：返回 / 平衡 */}
      <div className="flex items-center" style={{ width: 88, minWidth: 44 }}>
        {showBack ? (
          <button
            onClick={handleBack}
            aria-label="返回"
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, minWidth: 44, minHeight: 44, color: "var(--color-text-primary)" }}
          >
            <ChevronLeft size={22} />
          </button>
        ) : null}
      </div>

      {/* 中间标题 */}
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={onTitleClick}
          disabled={!onTitleClick}
          className="flex items-center gap-1 truncate"
          style={{
            fontSize: "var(--text-page-title)",
            fontWeight: "var(--text-page-title-weight)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          <span className="truncate">{title}</span>
          {titleArrow ? <MoreHorizontal size={16} style={{ transform: "rotate(90deg)" }} /> : null}
        </button>
      </div>

      {/* 右侧：搜索 / 自定义 / 胶囊 */}
      <div className="flex items-center justify-end gap-2" style={{ width: 88 }}>
        {showSearch ? (
          <button
            onClick={onSearch}
            aria-label="搜索"
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, color: "var(--color-text-secondary)" }}
          >
            <Search size={20} />
          </button>
        ) : null}
        {right}
      </div>
    </header>
  );
}

/** 顶部状态栏占位（模拟小程序状态栏） */
export function StatusBar({ bg = "var(--color-bg-elevated)" }: { bg?: string }) {
  return <div style={{ height: 20, background: bg, flexShrink: 0 }} />;
}
