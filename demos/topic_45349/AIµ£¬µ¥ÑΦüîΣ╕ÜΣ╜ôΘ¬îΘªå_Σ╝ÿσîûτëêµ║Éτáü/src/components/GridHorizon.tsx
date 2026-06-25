/**
 * 网格地平线：底部透视网格，营造未来感空间
 */
export default function GridHorizon() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 顶部径向光晕 */}
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-radial-glow" />

      {/* 底部透视网格 */}
      <div
        className="absolute bottom-0 left-1/2 h-[50vh] w-[200vw] -translate-x-1/2"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.18) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "translateX(-50%) perspective(500px) rotateX(60deg)",
          transformOrigin: "bottom center",
          maskImage: "linear-gradient(to top, black 0%, transparent 90%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 90%)",
        }}
      />

      {/* 地平线发光线 */}
      <div className="absolute bottom-[50vh] left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
      <div className="absolute bottom-[50vh] left-0 right-0 h-8 bg-gradient-to-t from-neon-cyan/10 to-transparent" />
    </div>
  );
}
