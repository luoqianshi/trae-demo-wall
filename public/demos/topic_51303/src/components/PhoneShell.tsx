import type { ReactNode } from "react";
import TabBar from "./TabBar";

interface PhoneShellProps {
  children: ReactNode;
  /** 是否显示底部 Tab（一级 Tab 页显示） */
  showTabBar?: boolean;
}

/**
 * 手机壳布局：模拟微信小程序容器。
 * 移动端铺满屏幕；桌面端（≥768px）居中显示手机壳并带左右留白与说明。
 */
export default function PhoneShell({ children, showTabBar = false }: PhoneShellProps) {
  return (
    <div className="phone-shell-wrapper flex min-h-screen w-full items-center justify-center bg-[#e9ebef]">
      {/* 桌面端左右装饰说明 */}
      <aside className="desktop-side hidden flex-1 flex-col items-end justify-center pr-10 lg:flex">
        <div className="max-w-xs text-right">
          <div className="mb-3 flex items-center justify-end gap-2">
            <span className="text-3xl">🍄</span>
            <span className="text-2xl font-bold text-[#07c160]">菇管家</span>
          </div>
          <p className="text-[15px] leading-relaxed text-[#555]">
            面向中老年菇农的智慧种植小程序
            <br />
            大字 · 大图 · 语音优先 · 一键直达
          </p>
          <div className="mt-5 space-y-2 text-right text-[13px] text-[#888]">
            <p>✅ 一眼知全局的环境看板</p>
            <p>✅ 拍一拍 AI 秒级病害诊断</p>
            <p>✅ 按住说话，问什么答什么</p>
            <p>✅ 完整批次档案与时间轴</p>
          </div>
        </div>
      </aside>

      {/* 手机壳主体 */}
      <div
        className="phone-shell relative flex h-screen w-full flex-col overflow-hidden bg-[var(--color-bg)] shadow-2xl sm:h-[760px] sm:max-h-[92vh] sm:w-[390px] sm:rounded-[36px] sm:border-[10px] sm:border-[#1a1a1a] lg:my-6"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* 小程序状态栏（模拟） */}
        <div
          className="flex shrink-0 items-center justify-between px-5 text-[12px] font-medium"
          style={{ height: 28, background: "var(--color-bg-elevated)", color: "var(--color-text-primary)" }}
        >
          <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
          <span className="flex items-center gap-1">
            <span style={{ letterSpacing: 1 }}>●●●●</span>
            <span>📶</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>100%</span>
          </span>
        </div>

        {/* 页面内容区 */}
        <div className="relative flex flex-1 flex-col overflow-hidden">{children}</div>

        {/* 底部 Tab */}
        {showTabBar ? <TabBar /> : null}
      </div>

      {/* 桌面端右侧留白 */}
      <aside className="hidden flex-1 lg:block" />
    </div>
  );
}
