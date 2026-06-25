import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * 全局鼠标光辉跟随效果
 * 设计原则：
 * - 纯白光晕 + plus-lighter 混合：深色背景上发光，浅色背景上自然融入，永不显脏
 * - 颜色随路由微调（青/品红/金/白），但主体保持白色以保证干净
 * - 跟随速度快（插值 0.25），干脆利落
 * - 按下时光点缩小，有反馈感
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // 根据路由决定主色调（用于光晕边缘染色）
  const accentColor = (() => {
    if (location.pathname.startsWith("/input")) return "#5eead4"; // 青
    if (location.pathname.startsWith("/results")) return "#f472b6"; // 品红
    if (location.pathname.startsWith("/experience")) return "#94a3b8"; // 中性银灰
    return "#ffffff"; // 默认纯白
  })();

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let curX = targetX;
    let curY = targetY;
    let rafId = 0;
    let entered = false;
    let pressed = false;

    const updateDot = () => {
      const scale = pressed ? 0.5 : 1;
      dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%) scale(${scale})`;
    };

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!entered) {
        entered = true;
        glow.style.opacity = "1";
        dot.style.opacity = "1";
      }
      updateDot();
    };

    const onLeave = () => {
      glow.style.opacity = "0";
      dot.style.opacity = "0";
      entered = false;
    };

    const onDown = () => {
      pressed = true;
      updateDot();
    };
    const onUp = () => {
      pressed = false;
      updateDot();
    };

    // 大光晕用 rAF 平滑跟随（快速插值，干脆利落）
    const tick = () => {
      curX += (targetX - curX) * 0.25;
      curY += (targetY - curY) * 0.25;
      glow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    rafId = requestAnimationFrame(tick);

    glow.style.opacity = "0";
    dot.style.opacity = "0";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className="cursor-glow"
        aria-hidden
        style={{
          background: `radial-gradient(circle, ${accentColor}26 0%, ${accentColor}0a 30%, transparent 65%)`,
        }}
      />
      <div
        ref={dotRef}
        className="cursor-glow-dot"
        aria-hidden
        style={{
          background: accentColor,
          boxShadow: `0 0 10px ${accentColor}, 0 0 20px ${accentColor}80`,
        }}
      />
    </>
  );
}
