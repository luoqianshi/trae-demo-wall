import { Fragment, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WorkScene } from "@/types";

/* ================================================================
   Types
   ================================================================ */

type SceneType =
  | "office"
  | "lab"
  | "cafe"
  | "home"
  | "meeting"
  | "outdoor"
  | "studio"
  | "factory"
  | "hospital"
  | "classroom"
  | "courtroom"
  | "construction";

type TimeOfDay = "morning" | "noon" | "afternoon" | "evening" | "night";
type WeatherType = "sunny" | "cloudy" | "rainy" | "night" | "foggy";
type ParticleKind = "dust" | "steam" | "leaves" | "rain" | "snow" | "sparks" | "papers";

export interface SceneBackgroundProps {
  scene: WorkScene;
  accent: string;
  className?: string;
  timeOfDay?: string;
  weather?: WeatherType;
  mousePosition?: { x: number; y: number };
  moodLevel?: number;
}

/* ================================================================
   Scene Inference
   ================================================================ */

// eslint-disable-next-line react-refresh/only-export-components
export function inferSceneType(scene: WorkScene): SceneType {
  const text = `${scene.location} ${scene.title} ${scene.desc}`.toLowerCase();

  if (/医院|诊所|病房|护士|医生|手术|急诊|门诊|体检|病床/.test(text)) return "hospital";
  if (/法庭|法院|审判|法官|律师|被告|原告|陪审|辩护/.test(text)) return "courtroom";
  if (/教室|课堂|讲堂|讲台|学生|上课|教学|讲课|课桌|黑板|板书/.test(text)) return "classroom";
  if (/工地|建筑|施工|脚手架|塔吊|水泥|砖|建造|工地现场/.test(text)) return "construction";
  if (/工厂|车间|流水线|传送带|机械臂|生产|装配|质检|厂房/.test(text)) return "factory";

  if (/咖啡|cafe|茶歇|休息|茶水|餐厅|食堂|甜点|奶茶|饮品/.test(text)) return "cafe";
  if (/实验|lab|测试|调试|服务器|机柜|集群|显微镜|试管|烧瓶/.test(text)) return "lab";
  if (/家|home|远程|居家|书房|沙发|角落|窝|卧室|客厅|阳台/.test(text)) return "home";
  if (/会议|meeting|讨论|评审|对接|客户|汇报|评审会|研讨会|头脑风暴/.test(text)) return "meeting";
  if (/户外|outdoor|现场|外勤|通勤|地铁|路上|勘察|公园|街道|广场/.test(text)) return "outdoor";
  if (/工作室|studio|设计|画板|创意|画|美术|素描|调色/.test(text)) return "studio";
  if (/工位|办公|office|电脑|屏幕|代码|桌|白板|开放|办公区|写字楼/.test(text)) return "office";

  return "office";
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ================================================================
   Time of Day Parsing & Lighting
   ================================================================ */

function parseTimeOfDay(time: string): TimeOfDay {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 5 && hour < 8) return "morning";
  if (hour >= 8 && hour < 11) return "noon";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function getTimeOfDayLighting(time: string): { overlay: string; vignette: string; ambient: string } {
  const tod = parseTimeOfDay(time);
  const lighting: Record<TimeOfDay, { overlay: string; vignette: string; ambient: string }> = {
    morning: {
      overlay: "linear-gradient(180deg, rgba(255,200,120,0.18) 0%, rgba(255,180,100,0.08) 35%, rgba(255,220,160,0.03) 70%, transparent 100%)",
      vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(255,180,100,0.12) 100%)",
      ambient: "rgba(255,200,140,0.06)",
    },
    noon: {
      overlay: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,240,0.04) 40%, rgba(255,255,255,0.01) 100%)",
      vignette: "radial-gradient(ellipse at center, transparent 55%, rgba(255,255,255,0.04) 100%)",
      ambient: "rgba(255,255,250,0.03)",
    },
    afternoon: {
      overlay: "linear-gradient(180deg, rgba(255,220,150,0.14) 0%, rgba(255,200,120,0.06) 45%, rgba(255,180,100,0.02) 100%)",
      vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(255,200,120,0.09) 100%)",
      ambient: "rgba(255,210,140,0.05)",
    },
    evening: {
      overlay: "linear-gradient(180deg, rgba(255,140,60,0.22) 0%, rgba(255,100,40,0.12) 30%, rgba(100,40,80,0.08) 65%, rgba(20,20,60,0.06) 100%)",
      vignette: "radial-gradient(ellipse at center, transparent 45%, rgba(255,100,40,0.15) 100%)",
      ambient: "rgba(255,120,50,0.08)",
    },
    night: {
      overlay: "linear-gradient(180deg, rgba(15,25,70,0.35) 0%, rgba(10,18,55,0.25) 35%, rgba(8,15,40,0.2) 70%, rgba(5,10,30,0.15) 100%)",
      vignette: "radial-gradient(ellipse at center, transparent 40%, rgba(5,10,30,0.35) 100%)",
      ambient: "rgba(8,15,45,0.15)",
    },
  };
  return lighting[tod];
}

/* ================================================================
   Weather Effect Inference
   ================================================================ */

function getWeatherEffect(time: string): WeatherType {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 20 || hour < 5) return "night";
  if (hour >= 5 && hour < 7) return "foggy";
  return "sunny";
}

function getWeatherForScene(scene: WorkScene): WeatherType {
  const seed = hashCode(`${scene.id}-${scene.location}`);
  const type = inferSceneType(scene);
  if (type === "outdoor" || type === "construction") {
    const r = seed % 100;
    if (r < 45) return "sunny";
    if (r < 65) return "cloudy";
    if (r < 80) return "rainy";
    if (r < 92) return "foggy";
    return "night";
  }
  return getWeatherEffect(scene.time);
}

/* Keyframes now in src/styles/scene-keyframes.css, imported via main.tsx */

/* ================================================================
   Particle System (Canvas)
   ================================================================ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
  wobble: number;
}

function createParticle(
  kind: ParticleKind,
  accent: string,
  w: number,
  h: number,
): Particle {
  const life = 60 + Math.random() * 200;
  switch (kind) {
    case "dust":
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.1 - Math.random() * 0.4,
        size: 0.5 + Math.random() * 2,
        opacity: 0,
        life,
        maxLife: life,
        color: `rgba(255,255,255,${0.04 + Math.random() * 0.08})`,
        wobble: Math.random() * Math.PI * 2,
      };
    case "steam":
      return {
        x: Math.random() * w,
        y: h * 0.5 + Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.4 - Math.random() * 0.6,
        size: 2 + Math.random() * 4,
        opacity: 0,
        life,
        maxLife: life,
        color: `rgba(255,255,255,${0.05 + Math.random() * 0.1})`,
        wobble: Math.random() * Math.PI * 2,
      };
    case "leaves":
      return {
        x: -30 + Math.random() * (w + 60),
        y: -20 - Math.random() * 120,
        vx: 0.4 + Math.random() * 1.0,
        vy: 0.5 + Math.random() * 0.8,
        size: 2 + Math.random() * 4,
        opacity: 0,
        life,
        maxLife: life,
        color: accent,
        wobble: Math.random() * Math.PI * 2,
      };
    case "rain":
      return {
        x: Math.random() * w,
        y: -10 - Math.random() * 120,
        vx: -0.3,
        vy: 5 + Math.random() * 8,
        size: 0.4 + Math.random() * 1.2,
        opacity: 0,
        life: 25 + Math.random() * 50,
        maxLife: 75,
        color: `rgba(160,200,240,${0.18 + Math.random() * 0.25})`,
        wobble: 0,
      };
    case "snow":
      return {
        x: Math.random() * w,
        y: -10 - Math.random() * 120,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.3 + Math.random() * 1.0,
        size: 1 + Math.random() * 4,
        opacity: 0,
        life: 150 + Math.random() * 300,
        maxLife: 450,
        color: `rgba(255,255,255,${0.45 + Math.random() * 0.45})`,
        wobble: Math.random() * Math.PI * 2,
      };
    case "sparks":
      return {
        x: Math.random() * w,
        y: h * 0.3 + Math.random() * h * 0.4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 2.0,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0,
        life: 20 + Math.random() * 40,
        maxLife: 60,
        color: accent,
        wobble: 0,
      };
    case "papers":
      return {
        x: -30 + Math.random() * (w + 60),
        y: -20 - Math.random() * 100,
        vx: 0.3 + Math.random() * 0.7,
        vy: 0.2 + Math.random() * 0.5,
        size: 3 + Math.random() * 5,
        opacity: 0,
        life: 100 + Math.random() * 200,
        maxLife: 300,
        color: `rgba(255,255,255,${0.15 + Math.random() * 0.2})`,
        wobble: Math.random() * Math.PI * 2,
      };
  }
}

function ParticleCanvas({
  kind,
  accent,
  density,
  className,
}: {
  kind: ParticleKind;
  accent: string;
  density: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const targetCount = Math.floor(((w * h) / 10000) * density);
    particlesRef.current = Array.from({ length: targetCount }, () =>
      createParticle(kind, accent, w, h),
    );

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    let lastTime = 0;
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (kind === "snow" || kind === "leaves" || kind === "papers") {
          p.wobble += 0.02 * dt;
          p.x += Math.sin(p.wobble) * 0.3 * dt;
        }

        const progress = p.life / p.maxLife;
        p.opacity =
          progress < 0.1
            ? progress / 0.1
            : progress > 0.85
              ? (1 - progress) / 0.15
              : 1;

        if (p.life <= 0) {
          const fresh = createParticle(kind, accent, w, h);
          if (kind === "leaves" || kind === "rain" || kind === "snow" || kind === "papers") {
            fresh.x = -30 + Math.random() * (w + 60);
            fresh.y = -20 - Math.random() * 120;
          } else if (kind === "steam") {
            fresh.y = h * 0.5 + Math.random() * h * 0.5;
            fresh.x = Math.random() * w;
          }
          particles[i] = fresh;
        }

        if (p.opacity <= 0.01) continue;

        ctx.save();
        if (kind === "rain") {
          ctx.strokeStyle = p.color.replace(
            /[\d.]+\)$/,
            `${(p.opacity * 0.35).toFixed(2)})`,
          );
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 3, p.y + 8);
          ctx.stroke();
        } else if (kind === "snow") {
          ctx.fillStyle = p.color.replace(
            /[\d.]+\)$/,
            `${(p.opacity * 0.8).toFixed(2)})`,
          );
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "sparks") {
          ctx.fillStyle = p.color.replace(
            /[\d.]+\)$/,
            `${(p.opacity * 0.7).toFixed(2)})`,
          );
          ctx.shadowColor = accent;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (kind === "papers") {
          ctx.fillStyle = p.color.replace(
            /[\d.]+\)$/,
            `${(p.opacity * 0.6).toFixed(2)})`,
          );
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.wobble);
          ctx.fillRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
          ctx.restore();
        } else {
          ctx.fillStyle = p.color.replace(
            /[\d.]+\)$/,
            `${(p.opacity * 0.5).toFixed(2)})`,
          );
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [kind, accent, density]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className || ""}`}
    />
  );
}

/* ================================================================
   Shared Sub-components
   ================================================================ */

function ScenePerson({
  x,
  y,
  scale = 1,
  anim = "stand",
  delay = 0,
  color = "rgba(255,255,255,0.15)",
}: {
  x: string | number;
  y: string | number;
  scale?: number;
  anim?: "stand" | "type" | "walk" | "talk" | "nod" | "sit";
  delay?: number;
  color?: string;
}) {
  const animClass =
    anim === "type"
      ? "sb-typing"
      : anim === "walk"
        ? "sb-walk"
        : anim === "talk"
          ? "sb-sway"
          : anim === "nod"
            ? "sb-sway-subtle"
            : "sb-float-slow";
  const dur =
    anim === "type"
      ? "0.8s"
      : anim === "walk"
        ? "2s"
        : anim === "talk"
          ? "1.5s"
          : "4s";

  return (
    <div
      className="absolute"
      style={{
        left: x,
        bottom: `calc(100% - ${y}px)`,
        transform: `scale(${scale})`,
        animation: anim === "sit" ? "" : `${animClass} ${dur} ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: color,
          opacity: 0.6,
          margin: "0 auto",
        }}
      />
      <div
        style={{
          width: 14,
          height: anim === "sit" ? 14 : 20,
          borderRadius: 4,
          background: color,
          opacity: 0.45,
          margin: "0 auto",
          marginTop: -2,
        }}
      />
      {anim !== "sit" && (
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: -1 }}>
          <div
            style={{
              width: 3,
              height: 12,
              background: color,
              opacity: 0.35,
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: 3,
              height: 12,
              background: color,
              opacity: 0.35,
              borderRadius: 1,
            }}
          />
        </div>
      )}
    </div>
  );
}

function Cloud({
  top,
  left,
  width,
  delay = 0,
  opacity = 0.08,
  speed = 14,
}: {
  top: number;
  left: number;
  width: number;
  delay?: number;
  opacity?: number;
  speed?: number;
}) {
  return (
    <div
      className="absolute"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}px`,
        height: width * 0.35,
        borderRadius: "50%",
        background: `rgba(255,255,255,${opacity})`,
        filter: "blur(10px)",
        animation: `sb-cloud-drift ${speed}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function BlinkLight({
  color,
  size = 3,
  delay = 0,
  dur = "1.5s",
}: {
  color: string;
  size?: number;
  delay?: number;
  dur?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        animation: `sb-blink ${dur} ease-in-out infinite`,
        animationDelay: `${delay}s`,
        boxShadow: `0 0 ${size * 2.5}px ${color}`,
      }}
    />
  );
}

function Bird({
  top,
  left,
  delay = 0,
  size = 10,
}: {
  top: number;
  left: number;
  delay?: number;
  size?: number;
}) {
  return (
    <div
      className="absolute"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        animation: `sb-bird-flap ${1.5 + delay * 0.3}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <svg width={size * 2} height={size} viewBox="0 0 20 12">
        <path
          d="M10 2 Q6 0 2 6 Q6 4 10 6 Q14 4 18 6 Q14 0 10 2Z"
          fill="rgba(255,255,255,0.12)"
        />
      </svg>
    </div>
  );
}

/* ================================================================
   SCENE: Office (办公室)
   ================================================================ */

function OfficeScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(10,15,50,0.5) 0%, rgba(15,20,45,0.4) 50%, rgba(20,25,50,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(180,200,220,0.12) 0%, rgba(200,215,230,0.08) 50%, rgba(220,230,240,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Window wall */}
        <div
          className="absolute left-[3%] top-[3%] h-[42%] w-[48%] rounded-xl border border-white/[0.07]"
          style={{
            background: isNight
              ? "radial-gradient(ellipse at 50% 80%, rgba(30,40,80,0.4) 0%, rgba(10,15,40,0.3) 60%)"
              : "radial-gradient(ellipse at 50% 80%, rgba(200,225,255,0.08) 0%, rgba(180,210,240,0.03) 60%)",
          }}
        >
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.05]" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.05]" />
          {[6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90].map(
            (l, i) => (
              <div
                key={i}
                className="absolute bottom-0"
                style={{
                  left: `${l}%`,
                  width: `${3 + (i % 3) * 2.5}%`,
                  height: `${20 + (i % 3) * 18}%`,
                  background: `rgba(255,255,255,${0.03 + (i % 2) * 0.03})`,
                  borderRadius: "2px 2px 0 0",
                }}
              />
            ),
          )}
          {isNight &&
            [18, 25, 35, 42, 52, 58, 65, 72, 80, 88].map((l, i) => (
              <div
                key={`lit-${i}`}
                className="absolute"
                style={{
                  left: `${l}%`,
                  bottom: `${8 + (i % 4) * 10}%`,
                  width: "3%",
                  height: "5%",
                  background: accent,
                  opacity: 0.25 + (i % 3) * 0.15,
                  animation: `sb-blink ${2 + i * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
        </div>

        <Cloud top={5} left={8} width={90} delay={0} opacity={0.07} speed={18} />
        <Cloud top={3} left={38} width={70} delay={4} opacity={0.05} speed={22} />
        <Cloud top={8} left={22} width={80} delay={2} opacity={0.06} speed={16} />

        {/* Whiteboard */}
        <div
          className="absolute right-[5%] top-[5%] h-[32%] w-[15%] rounded-lg border border-white/[0.07]"
          style={{ background: "rgba(255,255,255,0.025)" }}
        >
          <div className="absolute left-[10%] top-[10%] h-[3%] w-[55%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute left-[10%] top-[20%] h-[3%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute left-[10%] top-[30%] h-[3%] w-[65%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[40%] h-[3%] w-[35%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Ceiling lights */}
        <div className="absolute left-[10%] top-[2%] h-[2%] w-[6%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute left-[50%] top-[2%] h-[2%] w-[6%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Desks */}
        <div className="absolute bottom-[5%] left-[10%] h-[8%] w-[30%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }} />
        <div className="absolute bottom-[5%] right-[10%] h-[8%] w-[28%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }} />

        {/* Monitors on desks */}
        <div className="absolute bottom-[13%] left-[18%] h-[8%] w-[10%] rounded-md border border-white/[0.06]" style={{ background: "rgba(60,80,120,0.15)" }}>
          <div className="absolute bottom-0 left-0 h-[15%] w-full rounded-b-md" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="absolute bottom-[13%] right-[18%] h-[8%] w-[10%] rounded-md border border-white/[0.06]" style={{ background: "rgba(60,80,120,0.15)" }}>
          <div className="absolute bottom-0 left-0 h-[15%] w-full rounded-b-md" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* People */}
        <ScenePerson x="25%" y={60} anim="type" delay={0} />
        <ScenePerson x="55%" y={62} anim="stand" delay={1.5} />
        <ScenePerson x="70%" y={60} anim="type" delay={2.5} />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Keyboard & mouse */}
        <div className="absolute bottom-[7%] left-[20%] h-[3%] w-[8%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="absolute right-[-4px] bottom-0 h-[50%] w-[8px] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="absolute bottom-[7%] right-[20%] h-[3%] w-[8%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="absolute right-[-4px] bottom-0 h-[50%] w-[8px] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Coffee mug */}
        <div className="absolute bottom-[11%] left-[32%] h-[4%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="absolute right-[-2px] top-[20%] h-[40%] w-[3px] rounded-r-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Plant */}
        <div className="absolute bottom-[5%] left-[3%] h-[12%] w-[5%] rounded-b-full" style={{ background: "rgba(100,180,100,0.06)" }}>
          <div className="absolute bottom-[80%] left-[20%] h-[40%] w-[60%] rounded-t-full" style={{ background: "rgba(100,180,100,0.05)" }} />
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Lab (实验室)
   ================================================================ */

function LabScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(5,10,30,0.6) 0%, rgba(10,18,40,0.5) 50%, rgba(10,18,35,0.4) 100%)" }
    : { background: "linear-gradient(180deg, rgba(200,220,240,0.1) 0%, rgba(210,225,242,0.07) 50%, rgba(220,230,240,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Server racks */}
        <div className="absolute left-[3%] top-[5%] h-[75%] w-[12%] rounded-md border border-white/[0.08]" style={{ background: "linear-gradient(180deg, rgba(30,30,50,0.3) 0%, rgba(20,20,40,0.25) 100%)" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="absolute left-[5%] h-[10%] w-[90%] rounded-sm border border-white/[0.04]" style={{ top: `${5 + i * 12}%`, background: "rgba(0,0,0,0.2)" }}>
              <div className="absolute right-[5%] top-[25%] flex gap-1">
                <BlinkLight color="#00ff88" size={2} delay={i * 0.2} dur="0.8s" />
                <BlinkLight color={accent} size={2} delay={i * 0.3 + 0.5} dur="1.2s" />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute left-[17%] top-[5%] h-[75%] w-[12%] rounded-md border border-white/[0.08]" style={{ background: "linear-gradient(180deg, rgba(30,30,50,0.3) 0%, rgba(20,20,40,0.25) 100%)" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="absolute left-[5%] h-[10%] w-[90%] rounded-sm border border-white/[0.04]" style={{ top: `${5 + i * 12}%`, background: "rgba(0,0,0,0.2)" }}>
              <div className="absolute right-[5%] top-[25%] flex gap-1">
                <BlinkLight color="#ff6600" size={2} delay={i * 0.25 + 0.3} dur="1s" />
                <BlinkLight color={accent} size={2} delay={i * 0.15} dur="0.9s" />
              </div>
            </div>
          ))}
        </div>

        {/* Fluorescent ceiling lights */}
        <div className="absolute left-[5%] top-[1%] h-[2%] w-[25%] rounded-sm" style={{ background: "rgba(200,220,255,0.1)", boxShadow: "0 0 20px rgba(200,220,255,0.05)" }} />
        <div className="absolute left-[45%] top-[1%] h-[2%] w-[25%] rounded-sm" style={{ background: "rgba(200,220,255,0.1)", boxShadow: "0 0 20px rgba(200,220,255,0.05)" }} />

        {/* Large monitor wall */}
        <div className="absolute right-[3%] top-[5%] h-[40%] w-[18%] rounded-md border border-white/[0.06]" style={{ background: "rgba(20,30,60,0.3)" }}>
          <div className="absolute left-[10%] top-[10%] h-[25%] w-[80%] rounded-sm" style={{ background: `rgba(${accent.startsWith('#') ? '100,200,255' : '100,200,255'},0.08)` }}>
            <div className="absolute left-[5%] top-[15%] h-[20%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="absolute left-[5%] top-[50%] h-[20%] w-[50%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
          <div className="absolute left-[10%] top-[45%] h-[5%] w-[80%]" style={{ display: "flex", gap: "15%", justifyContent: "center" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-full rounded-sm" style={{ width: "15%", background: accent, opacity: 0.15 + i * 0.05, animation: `sb-blink ${1.5 + i * 0.3}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>

        {/* Oscilloscope screen */}
        <div className="absolute right-[24%] top-[5%] h-[25%] w-[12%] rounded-md border border-white/[0.06]" style={{ background: "rgba(0,20,0,0.3)" }}>
          <div className="absolute left-[10%] top-[15%] h-[60%] w-[80%] rounded-sm" style={{ background: "rgba(0,255,100,0.04)" }}>
            <svg className="absolute inset-0" viewBox="0 0 100 60">
              <path d="M5,30 Q15,28 20,30 Q25,45 30,30 Q35,15 40,30 Q50,28 60,30 Q70,32 80,30 Q85,20 90,30 Q95,28 98,30" fill="none" stroke="rgba(0,255,100,0.3)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Lab bench */}
        <div className="absolute bottom-[10%] left-[35%] h-[6%] w-[40%] rounded-md border border-white/[0.06]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}>
          {/* Test tubes */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="absolute bottom-[100%] rounded-b-full" style={{ left: `${10 + i * 18}%`, width: "4%", height: `${20 + i * 5}%`, background: `rgba(${i % 2 === 0 ? '100,200,255' : '255,100,200'},${0.1 + i * 0.02})`, border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none" }}>
              <div className="absolute bottom-[10%] left-[20%] h-[15%] w-[60%] rounded-sm" style={{ background: `rgba(${i % 2 === 0 ? '100,200,255' : '255,100,200'},${0.15})` }} />
            </div>
          ))}
        </div>

        {/* Microscope */}
        <div className="absolute bottom-[16%] left-[48%]" style={{ width: 18, height: 30 }}>
          <div className="absolute bottom-0 left-1/2 h-[50%] w-[6px] rounded-sm" style={{ transform: "translateX(-50%)", background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute bottom-[45%] left-0 h-[40%] w-[40%] rounded-t-md" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-0 left-[30%] h-[20%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Scientists */}
        <ScenePerson x="40%" y={55} anim="stand" delay={0} color="rgba(200,220,255,0.15)" />
        <ScenePerson x="60%" y={57} anim="type" delay={1} color="rgba(200,220,255,0.15)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Keyboard */}
        <div className="absolute bottom-[7%] left-[52%] h-[3%] w-[8%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        {/* Lab notebook */}
        <div className="absolute bottom-[7%] left-[40%] h-[3%] w-[6%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(-5deg)" }} />
        {/* Safety goggles */}
        <div className="absolute bottom-[9%] right-[20%] h-[4%] w-[5%] rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Cafe (咖啡厅)
   ================================================================ */

function CafeScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  void accent;
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(40,20,15,0.5) 0%, rgba(50,25,20,0.4) 50%, rgba(30,15,10,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(200,170,140,0.12) 0%, rgba(180,150,120,0.08) 50%, rgba(160,130,100,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Window with street view */}
        <div className="absolute left-[3%] top-[3%] h-[40%] w-[35%] rounded-xl border border-white/[0.06]" style={{ background: isNight ? "rgba(20,15,30,0.4)" : "rgba(200,180,150,0.1)" }}>
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.04]" />
          {/* Street lamp glow */}
          <div className="absolute left-[25%] top-[15%] h-[8%] w-[8%] rounded-full" style={{ background: "rgba(255,200,120,0.12)", filter: "blur(8px)" }} />
          <div className="absolute left-[65%] top-[18%] h-[8%] w-[8%] rounded-full" style={{ background: "rgba(255,200,120,0.1)", filter: "blur(8px)" }} />
        </div>

        {/* Menu board */}
        <div className="absolute right-[5%] top-[3%] h-[35%] w-[14%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(30,20,10,0.3)" }}>
          <div className="absolute left-[10%] top-[8%] h-[3%] w-[50%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute left-[10%] top-[18%] h-[2%] w-[35%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[28%] h-[2%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[38%] h-[2%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[48%] h-[2%] w-[45%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[10%] top-[58%] h-[2%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Ambient pendant lights */}
        <div className="absolute left-[15%] top-[0%] h-[3%] w-[6%] rounded-b-full" style={{ background: "rgba(255,200,140,0.08)", boxShadow: "0 0 30px rgba(255,180,120,0.06)" }} />
        <div className="absolute left-[50%] top-[0%] h-[3%] w-[6%] rounded-b-full" style={{ background: "rgba(255,200,140,0.08)", boxShadow: "0 0 30px rgba(255,180,120,0.06)" }} />

        {/* Shelves */}
        <div className="absolute right-[3%] top-[42%] h-[2%] w-[16%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="absolute right-[3%] top-[52%] h-[2%] w-[16%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Barista counter */}
        <div className="absolute bottom-[15%] left-[3%] h-[20%] w-[20%] rounded-md border border-white/[0.06]" style={{ background: "rgba(80,50,30,0.15)" }}>
          {/* Coffee machine */}
          <div className="absolute left-[10%] top-[10%] h-[50%] w-[30%] rounded-sm" style={{ background: "rgba(60,40,25,0.2)" }}>
            <div className="absolute left-[15%] top-[5%] h-[25%] w-[70%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="absolute left-[30%] bottom-[5%] h-[20%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
          {/* Steam */}
          <div className="absolute left-[20%] top-[5%] h-[20%] w-[6%] rounded-full" style={{ background: "rgba(255,255,255,0.06)", filter: "blur(4px)", animation: "sb-steam-rise 3s ease-out infinite" }} />
        </div>

        {/* Customer tables */}
        <div className="absolute bottom-[25%] left-[30%] h-[5%] w-[14%] rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }} />
        <div className="absolute bottom-[25%] right-[20%] h-[5%] w-[12%] rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }} />

        {/* Coffee cups on tables */}
        <div className="absolute bottom-[31%] left-[35%] h-[4%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="absolute right-[-2px] top-[25%] h-[40%] w-[3px] rounded-r-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="absolute bottom-[31%] right-[25%] h-[4%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="absolute right-[-2px] top-[25%] h-[40%] w-[3px] rounded-r-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Customers */}
        <ScenePerson x="33%" y={50} anim="sit" delay={0} color="rgba(255,220,180,0.18)" />
        <ScenePerson x="40%" y={52} anim="talk" delay={1} color="rgba(255,220,180,0.18)" />
        <ScenePerson x="62%" y={50} anim="sit" delay={2} color="rgba(255,220,180,0.15)" />
        <ScenePerson x="68%" y={52} anim="sit" delay={0.5} color="rgba(255,220,180,0.15)" />
        <ScenePerson x="15%" y={48} anim="stand" delay={1.5} color="rgba(255,200,160,0.2)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Laptop on left table */}
        <div className="absolute bottom-[27%] left-[32%] h-[6%] w-[8%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="absolute bottom-0 left-0 h-[20%] w-full rounded-b-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Foreground table */}
        <div className="absolute bottom-[3%] left-[25%] h-[5%] w-[50%] rounded-md border border-white/[0.04]" style={{ background: "rgba(255,255,255,0.025)" }} />

        {/* Plant pot */}
        <div className="absolute bottom-[3%] left-[8%] h-[10%] w-[4%] rounded-b-md" style={{ background: "rgba(120,80,40,0.1)" }}>
          <div className="absolute bottom-[85%] left-[10%] h-[40%] w-[80%] rounded-t-full" style={{ background: "rgba(100,160,80,0.06)" }} />
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Home (居家办公)
   ================================================================ */

function HomeScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  void accent;
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(15,12,30,0.5) 0%, rgba(20,15,35,0.4) 50%, rgba(15,10,28,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(200,190,170,0.1) 0%, rgba(190,180,160,0.07) 50%, rgba(180,170,150,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Window with night/city view */}
        <div className="absolute right-[3%] top-[3%] h-[45%] w-[30%] rounded-xl border border-white/[0.06]" style={{ background: isNight ? "rgba(10,15,40,0.4)" : "rgba(180,200,220,0.08)" }}>
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.04]" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.04]" />
          {/* Stars at night */}
          {isNight && [15, 25, 35, 48, 55, 62, 70, 78, 85].map((l, i) => (
            <div key={i} className="absolute rounded-full" style={{ left: `${l}%`, top: `${10 + (i % 4) * 8}%`, width: 2, height: 2, background: "rgba(255,255,255,0.3)", animation: `sb-blink ${2 + i * 0.5}s ease-in-out infinite` }} />
          ))}
          {/* Moon */}
          {isNight && <div className="absolute right-[15%] top-[8%] h-[12%] w-[12%] rounded-full" style={{ background: "rgba(255,255,200,0.15)", boxShadow: "0 0 10px rgba(255,255,200,0.1)" }} />}
          {/* Curtains */}
          <div className="absolute left-[-2%] top-0 h-full w-[8%] rounded-l-xl" style={{ background: "rgba(255,255,255,0.02)" }} />
          <div className="absolute right-[-2%] top-0 h-full w-[8%] rounded-r-xl" style={{ background: "rgba(255,255,255,0.02)" }} />
        </div>

        {/* Bookshelf */}
        <div className="absolute left-[3%] top-[3%] h-[55%] w-[14%] rounded-md border border-white/[0.06]" style={{ background: "rgba(60,40,25,0.15)" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="absolute left-[5%] h-[3%] w-[90%] rounded-sm" style={{ top: `${5 + i * 20}%`, background: "rgba(255,255,255,0.04)" }} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Fragment key={`books-${i}`}>
              <div className="absolute rounded-sm" style={{ left: `${8 + (i % 3) * 28}%`, top: `${8 + i * 20}%`, width: `${8 + i * 3}%`, height: `${14 + i * 2}%`, background: `rgba(${100 + i * 30},${80 + i * 20},${120 + i * 25},0.08)`, transform: `rotate(${i % 2 === 0 ? 2 : -2}deg)` }} />
              <div className="absolute rounded-sm" style={{ left: `${18 + (i % 3) * 28}%`, top: `${8 + i * 20}%`, width: `${6 + i * 2}%`, height: `${12 + i}%`, background: `rgba(${150 + i * 20},${100 + i * 15},${80 + i * 30},0.07)`, transform: `rotate(${i % 2 === 0 ? -1 : 3}deg)` }} />
            </Fragment>
          ))}
        </div>

        {/* Wall art */}
        <div className="absolute left-[22%] top-[5%] h-[20%] w-[12%] rounded-md border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="absolute left-[15%] top-[15%] h-[30%] w-[30%] rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[55%] top-[35%] h-[25%] w-[25%] rounded-full" style={{ background: "rgba(255,255,255,0.02)" }} />
        </div>

        {/* Desk lamp glow */}
        <div className="absolute left-[45%] top-[15%] h-[8%] w-[8%] rounded-full" style={{ background: "rgba(255,220,160,0.08)", filter: "blur(12px)" }} />
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Desk */}
        <div className="absolute bottom-[8%] left-[20%] h-[6%] w-[55%] rounded-lg border border-white/[0.05]" style={{ background: "rgba(80,60,40,0.12)" }} />

        {/* Monitor */}
        <div className="absolute bottom-[14%] left-[35%] h-[14%] w-[16%] rounded-md border border-white/[0.05]" style={{ background: "rgba(40,50,70,0.2)" }}>
          <div className="absolute bottom-0 left-0 h-[15%] w-full rounded-b-md" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[15%] top-[15%] h-[20%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[15%] top-[45%] h-[20%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[15%] top-[70%] h-[15%] w-[35%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Desk lamp */}
        <div className="absolute bottom-[20%] left-[42%]">
          <div className="h-[10px] w-[2px] rounded-sm" style={{ background: "rgba(255,255,255,0.06)", margin: "0 auto" }} />
          <div className="h-[6px] w-[12px] rounded-t-md" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>

        {/* Sofa */}
        <div className="absolute bottom-[5%] left-[3%] h-[12%] w-[18%] rounded-lg" style={{ background: "rgba(100,80,70,0.12)" }}>
          <div className="absolute left-[5%] top-[5%] h-[40%] w-[25%] rounded-md" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute right-[5%] top-[5%] h-[40%] w-[25%] rounded-md" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Person at desk */}
        <ScenePerson x="38%" y={52} anim="type" delay={0} color="rgba(255,240,220,0.15)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Keyboard */}
        <div className="absolute bottom-[10%] left-[37%] h-[3%] w-[10%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        {/* Coffee mug */}
        <div className="absolute bottom-[10%] left-[55%] h-[4%] w-[2.5%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="absolute right-[-2px] top-[25%] h-[40%] w-[3px] rounded-r-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        {/* Notebook */}
        <div className="absolute bottom-[10%] right-[25%] h-[3%] w-[5%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(-8deg)" }} />
        {/* Slippers */}
        <div className="absolute bottom-[3%] left-[35%] h-[3%] w-[4%] rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="absolute bottom-[3%] left-[40%] h-[3%] w-[4%] rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Meeting (会议室)
   ================================================================ */

function MeetingScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(10,12,35,0.5) 0%, rgba(15,18,40,0.4) 50%, rgba(12,15,30,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(180,190,210,0.1) 0%, rgba(190,200,220,0.07) 50%, rgba(200,210,225,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Ceiling lights */}
        <div className="absolute left-[10%] top-[1%] h-[2%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)", boxShadow: "0 0 20px rgba(255,255,255,0.03)" }} />
        <div className="absolute left-[40%] top-[1%] h-[2%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)", boxShadow: "0 0 20px rgba(255,255,255,0.03)" }} />
        <div className="absolute left-[70%] top-[1%] h-[2%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)", boxShadow: "0 0 20px rgba(255,255,255,0.03)" }} />

        {/* Presentation screen */}
        <div className="absolute left-[5%] top-[8%] h-[35%] w-[22%] rounded-md border border-white/[0.06]" style={{ background: "rgba(30,40,70,0.3)" }}>
          <div className="absolute left-[10%] top-[15%] h-[8%] w-[50%] rounded-sm" style={{ background: accent, opacity: 0.2 }} />
          <div className="absolute left-[10%] top-[35%] h-[3%] w-[35%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[45%] h-[3%] w-[45%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[10%] top-[55%] h-[3%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[65%] h-[3%] w-[55%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          {/* Chart bars */}
          <div className="absolute left-[50%] bottom-[15%] h-[20%] w-[6%] rounded-t-sm" style={{ background: accent, opacity: 0.15 }} />
          <div className="absolute left-[58%] bottom-[15%] h-[30%] w-[6%] rounded-t-sm" style={{ background: accent, opacity: 0.2 }} />
          <div className="absolute left-[66%] bottom-[15%] h-[15%] w-[6%] rounded-t-sm" style={{ background: accent, opacity: 0.12 }} />
          <div className="absolute left-[74%] bottom-[15%] h-[25%] w-[6%] rounded-t-sm" style={{ background: accent, opacity: 0.18 }} />
        </div>

        {/* Whiteboard */}
        <div className="absolute right-[5%] top-[8%] h-[35%] w-[18%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="absolute left-[10%] top-[10%] h-[3%] w-[60%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute left-[10%] top-[24%] h-[3%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[15%] top-[38%] h-[3%] w-[35%] rounded-sm" style={{ background: "rgba(100,150,255,0.08)" }} />
          <div className="absolute left-[20%] top-[52%] h-[3%] w-[25%] rounded-sm" style={{ background: "rgba(255,100,100,0.08)" }} />
          <div className="absolute left-[10%] top-[66%] h-[3%] w-[50%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Window blinds */}
        <div className="absolute right-[3%] top-[3%] h-[65%] w-[2%]" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 6px)" }} />
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Conference table */}
        <div className="absolute bottom-[12%] left-[10%] h-[10%] w-[80%] rounded-xl border border-white/[0.06]" style={{ background: "rgba(60,50,40,0.15)" }}>
          {/* Water bottles */}
          <div className="absolute left-[10%] top-[30%] h-[40%] w-[2%] rounded-full" style={{ background: "rgba(100,180,220,0.08)" }} />
          <div className="absolute left-[25%] top-[30%] h-[40%] w-[2%] rounded-full" style={{ background: "rgba(100,180,220,0.08)" }} />
          <div className="absolute left-[55%] top-[30%] h-[40%] w-[2%] rounded-full" style={{ background: "rgba(100,180,220,0.08)" }} />
          <div className="absolute left-[75%] top-[30%] h-[40%] w-[2%] rounded-full" style={{ background: "rgba(100,180,220,0.08)" }} />
        </div>

        {/* Chairs around table */}
        {[12, 22, 32, 52, 62, 72].map((l, i) => (
          <div key={i} className="absolute bottom-[22%] rounded-t-md" style={{ left: `${l}%`, width: "5%", height: "8%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", borderBottom: "none" }} />
        ))}

        {/* People at table */}
        <ScenePerson x="17%" y={45} anim="sit" delay={0} color="rgba(200,210,230,0.15)" />
        <ScenePerson x="28%" y={47} anim="sit" delay={0.5} color="rgba(200,210,230,0.15)" />
        <ScenePerson x="35%" y={45} anim="talk" delay={1} color="rgba(200,210,230,0.18)" />
        <ScenePerson x="55%" y={47} anim="sit" delay={2} color="rgba(200,210,230,0.15)" />
        <ScenePerson x="65%" y={45} anim="sit" delay={1.5} color="rgba(200,210,230,0.15)" />
        <ScenePerson x="78%" y={47} anim="nod" delay={0.8} color="rgba(200,210,230,0.15)" />

        {/* Standing presenter */}
        <ScenePerson x="8%" y={50} anim="stand" delay={0} color="rgba(220,230,240,0.2)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Laptop on table */}
        <div className="absolute bottom-[22%] left-[20%] h-[5%] w-[6%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="absolute bottom-0 left-0 h-[20%] w-full rounded-b-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
        {/* Notepad */}
        <div className="absolute bottom-[22%] left-[60%] h-[3%] w-[4%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(3deg)" }} />
        {/* Phone */}
        <div className="absolute bottom-[22%] left-[45%] h-[3%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Outdoor (户外)
   ================================================================ */

function OutdoorScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  void accent;
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(5,8,30,0.6) 0%, rgba(10,15,45,0.5) 50%, rgba(8,12,35,0.4) 100%)" }
    : { background: "linear-gradient(180deg, rgba(135,200,235,0.15) 0%, rgba(160,215,240,0.1) 40%, rgba(180,220,240,0.06) 70%, rgba(200,225,240,0.04) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Sky gradient */}
        <div className="absolute inset-0" style={{ background: isNight ? "linear-gradient(180deg, rgba(5,8,30,0.4) 0%, rgba(15,20,50,0.3) 50%, rgba(8,12,35,0.2) 100%)" : "linear-gradient(180deg, rgba(135,200,235,0.1) 0%, rgba(170,220,240,0.06) 60%, rgba(190,230,240,0.03) 100%)" }} />

        {/* Sun/moon */}
        <div className="absolute right-[15%] top-[5%] h-[12%] w-[12%] rounded-full" style={{ background: isNight ? "rgba(255,255,200,0.12)" : "rgba(255,240,200,0.15)", boxShadow: isNight ? "0 0 20px rgba(255,255,200,0.08)" : "0 0 40px rgba(255,240,200,0.1)" }} />

        {/* Clouds */}
        <Cloud top={8} left={10} width={120} delay={0} opacity={0.08} speed={20} />
        <Cloud top={4} left={35} width={90} delay={3} opacity={0.06} speed={18} />
        <Cloud top={12} left={55} width={100} delay={6} opacity={0.07} speed={22} />
        <Cloud top={6} left={70} width={80} delay={2} opacity={0.05} speed={16} />

        {/* Birds */}
        <Bird top={10} left={20} delay={0} size={8} />
        <Bird top={7} left={30} delay={1.5} size={6} />
        <Bird top={12} left={45} delay={3} size={7} />

        {/* Distant buildings */}
        <div className="absolute bottom-[35%] left-0 h-[15%] w-full">
          {[5, 10, 18, 25, 32, 40, 48, 55, 63, 70, 78, 85, 92].map((l, i) => (
            <div key={i} className="absolute bottom-0" style={{ left: `${l}%`, width: `${3 + (i % 3) * 2}%`, height: `${25 + (i % 4) * 15}%`, background: `rgba(255,255,255,${0.02 + (i % 3) * 0.02})`, borderRadius: "2px 2px 0 0" }} />
          ))}
        </div>

        {/* Trees */}
        {[8, 22, 38, 55, 72, 85].map((l, i) => (
          <Fragment key={`tree-${i}`}>
            <div className="absolute" style={{ left: `${l}%`, bottom: "40%", width: `${6 + i * 2}%`, height: `${20 + i * 3}%`, background: `rgba(${80 + i * 10},${140 + i * 5},${60 + i * 10},0.08)`, borderRadius: "50% 50% 0 0" }} />
            <div className="absolute" style={{ left: `${l + 1.5}%`, bottom: "40%", width: "2%", height: `${8 + i}%`, background: "rgba(120,80,40,0.06)", borderRadius: "1px" }} />
          </Fragment>
        ))}
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Park benches */}
        <div className="absolute bottom-[25%] left-[15%] h-[4%] w-[15%] rounded-md" style={{ background: "rgba(100,70,40,0.1)" }}>
          <div className="absolute left-[8%] top-[-15%] h-[40%] w-[6%] rounded-sm" style={{ background: "rgba(100,70,40,0.08)" }} />
          <div className="absolute right-[8%] top-[-15%] h-[40%] w-[6%] rounded-sm" style={{ background: "rgba(100,70,40,0.08)" }} />
        </div>
        <div className="absolute bottom-[25%] right-[20%] h-[4%] w-[15%] rounded-md" style={{ background: "rgba(100,70,40,0.1)" }}>
          <div className="absolute left-[8%] top-[-15%] h-[40%] w-[6%] rounded-sm" style={{ background: "rgba(100,70,40,0.08)" }} />
          <div className="absolute right-[8%] top-[-15%] h-[40%] w-[6%] rounded-sm" style={{ background: "rgba(100,70,40,0.08)" }} />
        </div>

        {/* Street lamps */}
        <div className="absolute bottom-[30%] left-[25%] h-[20%] w-[1%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="absolute top-0 left-[-200%] h-[15%] w-[500%] rounded-t-full" style={{ background: "rgba(255,220,150,0.06)", boxShadow: "0 0 15px rgba(255,220,150,0.05)" }} />
        </div>
        <div className="absolute bottom-[30%] right-[30%] h-[20%] w-[1%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="absolute top-0 left-[-200%] h-[15%] w-[500%] rounded-t-full" style={{ background: "rgba(255,220,150,0.06)", boxShadow: "0 0 15px rgba(255,220,150,0.05)" }} />
        </div>

        {/* People walking */}
        <ScenePerson x="12%" y={30} anim="walk" delay={0} color="rgba(255,255,255,0.12)" />
        <ScenePerson x="30%" y={32} anim="stand" delay={1} color="rgba(255,255,255,0.12)" />
        <ScenePerson x="50%" y={30} anim="walk" delay={2.5} color="rgba(255,255,255,0.12)" />
        <ScenePerson x="65%" y={32} anim="stand" delay={0.5} color="rgba(255,255,255,0.12)" />
        <ScenePerson x="80%" y={30} anim="walk" delay={3} color="rgba(255,255,255,0.12)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Sidewalk */}
        <div className="absolute bottom-[5%] left-0 h-[6%] w-full" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="absolute top-[40%] left-0 h-[1px] w-full" style={{ background: "rgba(255,255,255,0.02)" }} />
        </div>

        {/* Grass */}
        <div className="absolute bottom-[0%] left-0 h-[5%] w-full" style={{ background: "linear-gradient(0deg, rgba(100,160,60,0.06) 0%, transparent 100%)" }} />

        {/* Close tree */}
        <div className="absolute bottom-[10%] left-[5%] h-[35%] w-[8%] rounded-t-full" style={{ background: "rgba(80,150,60,0.06)" }}>
          <div className="absolute bottom-0 left-[35%] h-[20%] w-[30%] rounded-sm" style={{ background: "rgba(100,70,40,0.06)" }} />
        </div>

        {/* Fire hydrant */}
        <div className="absolute bottom-[8%] right-[12%] h-[6%] w-[3%] rounded-sm" style={{ background: "rgba(200,50,30,0.05)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Studio (设计工作室)
   ================================================================ */

function StudioScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(15,10,25,0.5) 0%, rgba(20,15,35,0.4) 50%, rgba(15,12,30,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(230,220,210,0.1) 0%, rgba(220,210,200,0.07) 50%, rgba(210,200,190,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Mood board */}
        <div className="absolute left-[3%] top-[3%] h-[55%] w-[22%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(40,35,30,0.2)" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="absolute rounded-sm" style={{ left: `${5 + (i % 2) * 55}%`, top: `${5 + Math.floor(i / 2) * 30}%`, width: "40%", height: "22%", background: `rgba(${100 + i * 30},${80 + i * 25},${150 + i * 20},0.08)`, border: "1px solid rgba(255,255,255,0.04)" }} />
          ))}
        </div>

        {/* Color swatches */}
        <div className="absolute right-[5%] top-[3%] h-[40%] w-[10%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
          {["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8", "#20c997", "#ff8787"].map((c, i) => (
            <div key={i} className="absolute left-[10%] h-[8%] w-[80%] rounded-sm" style={{ top: `${5 + i * 12}%`, background: c, opacity: 0.15 }} />
          ))}
        </div>

        {/* Large window */}
        <div className="absolute left-[28%] top-[3%] h-[35%] w-[25%] rounded-xl border border-white/[0.06]" style={{ background: isNight ? "rgba(10,15,40,0.3)" : "rgba(180,200,220,0.06)" }}>
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.04]" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.04]" />
        </div>

        {/* Shelves */}
        <div className="absolute right-[18%] top-[3%] h-[2%] w-[12%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="absolute right-[18%] top-[15%] h-[2%] w-[12%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="absolute right-[18%] top-[27%] h-[2%] w-[12%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Drawing tablet */}
        <div className="absolute bottom-[12%] left-[35%] h-[18%] w-[18%] rounded-md border border-white/[0.06]" style={{ background: "rgba(30,30,40,0.2)", transform: "rotate(-3deg)" }}>
          <div className="absolute left-[10%] top-[10%] h-[20%] w-[35%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[10%] top-[40%] h-[20%] w-[25%] rounded-sm" style={{ background: accent, opacity: 0.1 }} />
          <div className="absolute left-[10%] top-[65%] h-[15%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          {/* Stylus */}
          <div className="absolute right-[5%] top-[15%] h-[50%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Desk */}
        <div className="absolute bottom-[8%] left-[25%] h-[5%] w-[45%] rounded-lg border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.025)" }} />

        {/* Art supplies on desk */}
        <div className="absolute bottom-[13%] left-[28%] h-[4%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(5deg)" }} />
        <div className="absolute bottom-[13%] left-[33%] h-[4%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)", transform: "rotate(-3deg)" }} />
        <div className="absolute bottom-[13%] right-[30%] h-[4%] w-[2%] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        {/* Designer */}
        <ScenePerson x="40%" y={52} anim="type" delay={0} color="rgba(240,230,220,0.15)" />
        <ScenePerson x="55%" y={54} anim="stand" delay={1.5} color="rgba(240,230,220,0.13)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Sketchbook */}
        <div className="absolute bottom-[10%] left-[30%] h-[6%] w-[8%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(-5deg)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="absolute left-[10%] top-[10%] h-[30%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Pencil holder */}
        <div className="absolute bottom-[10%] right-[25%] h-[6%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute left-[10%] h-[30%] w-[80%] rounded-t-sm" style={{ top: `${-10 - i * 15}%`, background: `rgba(255,255,255,${0.05 - i * 0.01})` }} />
          ))}
        </div>

        {/* Pantone book */}
        <div className="absolute bottom-[10%] right-[20%] h-[3%] w-[6%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Factory (工厂)
   ================================================================ */

function FactoryScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(10,8,20,0.6) 0%, rgba(15,12,30,0.5) 50%, rgba(12,10,25,0.4) 100%)" }
    : { background: "linear-gradient(180deg, rgba(180,175,170,0.1) 0%, rgba(190,185,180,0.07) 50%, rgba(200,195,190,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Factory ceiling structure */}
        <div className="absolute left-0 top-0 h-[15%] w-full" style={{ background: "linear-gradient(180deg, rgba(40,40,50,0.2) 0%, transparent 100%)" }}>
          {/* Steel beams */}
          <div className="absolute left-[10%] top-[20%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[30%] top-[20%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[50%] top-[20%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[70%] top-[20%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[90%] top-[20%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          {/* Horizontal beams */}
          <div className="absolute left-0 top-[30%] h-[10%] w-full" style={{ background: "rgba(255,255,255,0.02)" }} />
        </div>

        {/* Large machinery (background) */}
        <div className="absolute left-[5%] top-[25%] h-[40%] w-[15%] rounded-md" style={{ background: "rgba(50,50,60,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="absolute left-[10%] top-[10%] h-[20%] w-[80%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[30%] top-[40%] h-[15%] w-[15%] rounded-full" style={{ background: "rgba(255,255,255,0.04)", animation: "sb-spin-slow 8s linear infinite" }} />
          <div className="absolute left-[10%] top-[65%] h-[5%] w-[60%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        <div className="absolute right-[5%] top-[25%] h-[40%] w-[18%] rounded-md" style={{ background: "rgba(50,50,60,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="absolute left-[10%] top-[10%] h-[25%] w-[80%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[20%] top-[45%] h-[20%] w-[20%] rounded-full" style={{ background: "rgba(255,255,255,0.04)", animation: "sb-spin-slow 6s linear infinite" }} />
          <div className="absolute left-[50%] top-[45%] h-[20%] w-[20%] rounded-full" style={{ background: "rgba(255,255,255,0.04)", animation: "sb-spin-slow 7s linear infinite reverse" }} />
        </div>

        {/* Warning lights */}
        <div className="absolute left-[8%] top-[22%]">
          <BlinkLight color="#ff6600" size={4} delay={0} dur="0.6s" />
        </div>
        <div className="absolute right-[8%] top-[22%]">
          <BlinkLight color="#ff6600" size={4} delay={0.3} dur="0.6s" />
        </div>
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Conveyor belt */}
        <div className="absolute bottom-[35%] left-0 h-[6%] w-full" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 20px, transparent 20px, transparent 25px)", animation: "sb-conveyor 2s linear infinite" }}>
          <div className="absolute top-[-15%] left-0 h-[15%] w-full rounded-t-md" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute bottom-[-15%] left-0 h-[15%] w-full rounded-b-md" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Items on conveyor */}
        {[10, 30, 50, 70, 90].map((l, i) => (
          <div key={i} className="absolute bottom-[42%] rounded-sm" style={{ left: `${l}%`, width: "4%", height: "5%", background: `rgba(${100 + i * 30},${80 + i * 20},${120 + i * 25},0.08)`, animation: "sb-slide 4s ease-in-out infinite", animationDelay: `${i * 0.8}s` }} />
        ))}

        {/* Robotic arm */}
        <div className="absolute bottom-[42%] left-[40%]">
          <div className="h-[20px] w-[4px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)", margin: "0 auto" }} />
          <div className="h-[4px] w-[30px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)", animation: "sb-arm-rotate 4s ease-in-out infinite", transformOrigin: "left center" }} />
          <div className="absolute top-[-8px] left-[24px] h-[8px] w-[6px] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        <div className="absolute bottom-[42%] right-[30%]">
          <div className="h-[24px] w-[4px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)", margin: "0 auto" }} />
          <div className="h-[4px] w-[25px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)", animation: "sb-arm-rotate 3.5s ease-in-out infinite reverse", transformOrigin: "left center", animationDelay: "1s" }} />
        </div>

        {/* Steam */}
        <div className="absolute bottom-[47%] left-[15%] h-[10%] w-[5%] rounded-full" style={{ background: "rgba(255,255,255,0.05)", filter: "blur(6px)", animation: "sb-smoke-rise 4s ease-out infinite" }} />
        <div className="absolute bottom-[47%] left-[55%] h-[8%] w-[4%] rounded-full" style={{ background: "rgba(255,255,255,0.04)", filter: "blur(6px)", animation: "sb-smoke-rise 3.5s ease-out infinite", animationDelay: "1.5s" }} />

        {/* Workers */}
        <ScenePerson x="20%" y={42} anim="stand" delay={0} color="rgba(255,180,80,0.15)" />
        <ScenePerson x="50%" y={40} anim="walk" delay={1} color="rgba(255,180,80,0.15)" />
        <ScenePerson x="70%" y={42} anim="stand" delay={2} color="rgba(255,180,80,0.15)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Control panel */}
        <div className="absolute bottom-[8%] left-[10%] h-[20%] w-[12%] rounded-md border border-white/[0.06]" style={{ background: "rgba(30,30,40,0.3)" }}>
          <div className="absolute left-[15%] top-[10%] h-[10%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[15%] top-[30%] flex gap-2">
            <BlinkLight color="#00ff00" size={3} delay={0} dur="1s" />
            <BlinkLight color="#ff0000" size={3} delay={0.5} dur="1.2s" />
            <BlinkLight color={accent} size={3} delay={0.2} dur="0.8s" />
          </div>
          <div className="absolute left-[15%] top-[55%] h-[10%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[15%] top-[75%] h-[10%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Sparks */}
        <div className="absolute bottom-[32%] right-[25%] h-[3%] w-[3%] rounded-full" style={{ background: accent, opacity: 0.3, filter: "blur(2px)", animation: "sb-blink 0.3s ease-in-out infinite" }} />

        {/* Pipes */}
        <div className="absolute bottom-[5%] right-[5%] h-[6%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }} />
        <div className="absolute bottom-[5%] right-[22%] h-[10%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Hospital (医院)
   ================================================================ */

function HospitalScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  void accent;
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(5,10,25,0.5) 0%, rgba(10,18,38,0.4) 50%, rgba(8,15,30,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(220,230,245,0.12) 0%, rgba(225,235,248,0.08) 50%, rgba(230,238,250,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Ceiling fluorescent lights */}
        <div className="absolute left-[5%] top-[1%] h-[2%] w-[25%] rounded-sm" style={{ background: "rgba(200,220,255,0.1)", boxShadow: "0 0 30px rgba(200,220,255,0.06)" }} />
        <div className="absolute left-[40%] top-[1%] h-[2%] w-[25%] rounded-sm" style={{ background: "rgba(200,220,255,0.1)", boxShadow: "0 0 30px rgba(200,220,255,0.06)" }} />
        <div className="absolute left-[72%] top-[1%] h-[2%] w-[25%] rounded-sm" style={{ background: "rgba(200,220,255,0.1)", boxShadow: "0 0 30px rgba(200,220,255,0.06)" }} />

        {/* Window */}
        <div className="absolute right-[3%] top-[5%] h-[40%] w-[20%] rounded-xl border border-white/[0.06]" style={{ background: isNight ? "rgba(5,10,30,0.4)" : "rgba(180,200,230,0.08)" }}>
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.04]" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.04]" />
        </div>

        {/* Medical cabinet */}
        <div className="absolute left-[3%] top-[5%] h-[50%] w-[12%] rounded-md border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.025)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute left-[5%] h-[18%] w-[90%] rounded-sm border border-white/[0.04]" style={{ top: `${5 + i * 24}%`, background: "rgba(255,255,255,0.02)" }}>
              <div className="absolute left-[15%] top-[25%] h-[50%] w-[20%] rounded-sm" style={{ background: "rgba(200,230,255,0.06)" }} />
              <div className="absolute left-[45%] top-[25%] h-[50%] w-[20%] rounded-sm" style={{ background: "rgba(200,230,255,0.05)" }} />
              <div className="absolute right-[15%] top-[25%] h-[50%] w-[15%] rounded-full" style={{ background: "rgba(255,200,200,0.06)" }} />
            </div>
          ))}
        </div>

        {/* Wall-mounted monitors */}
        <div className="absolute left-[20%] top-[8%] h-[25%] w-[15%] rounded-md border border-white/[0.06]" style={{ background: "rgba(10,20,40,0.3)" }}>
          <div className="absolute left-[10%] top-[10%] h-[8%] w-[30%] rounded-sm" style={{ background: "rgba(0,255,100,0.06)" }} />
          <div className="absolute left-[10%] top-[25%] h-[3%] w-[50%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[10%] top-[35%] h-[3%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          {/* Heartbeat line */}
          <svg className="absolute left-[10%] bottom-[20%] h-[15%] w-[80%]" viewBox="0 0 100 20">
            <path d="M0,15 L20,15 L25,15 L28,5 L31,15 L36,15 L40,2 L44,15 L50,15 L54,15 L58,8 L62,15 L66,15 L70,15 L74,5 L77,15 L80,15 L100,15" fill="none" stroke="rgba(0,255,100,0.25)" strokeWidth="1" style={{ animation: "sb-heartbeat 1.2s ease-in-out infinite" }} />
          </svg>
        </div>
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Hospital bed */}
        <div className="absolute bottom-[8%] left-[30%] h-[12%] w-[35%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.025)" }}>
          {/* Pillow */}
          <div className="absolute left-[8%] top-[15%] h-[40%] w-[15%] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          {/* Blanket */}
          <div className="absolute left-[25%] top-[20%] h-[30%] w-[40%] rounded-sm" style={{ background: "rgba(200,220,240,0.06)" }} />
          {/* Bed rails */}
          <div className="absolute left-[5%] top-[10%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute right-[5%] top-[10%] h-[60%] w-[2%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* IV stand */}
        <div className="absolute bottom-[20%] left-[25%]">
          <div className="h-[40px] w-[2px] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute top-0 left-[-300%] h-[20%] w-[700%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute top-[10%] right-[-8px] h-[30%] w-[8px] rounded-sm" style={{ background: "rgba(200,230,255,0.06)", border: "1px solid rgba(255,255,255,0.04)" }} />
          {/* IV drip */}
          <div className="absolute top-[15%] right-[-4px] h-[4px] w-[2px] rounded-full" style={{ background: "rgba(200,230,255,0.08)", animation: "sb-drip 2s ease-in-out infinite" }} />
        </div>

        {/* Medical staff */}
        <ScenePerson x="20%" y={50} anim="stand" delay={0} color="rgba(200,220,240,0.15)" />
        <ScenePerson x="55%" y={52} anim="walk" delay={1.5} color="rgba(200,220,240,0.15)" />
        <ScenePerson x="75%" y={50} anim="type" delay={0.5} color="rgba(200,220,240,0.15)" />

        {/* Side table */}
        <div className="absolute bottom-[8%] right-[20%] h-[10%] w-[8%] rounded-md border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="absolute left-[20%] top-[15%] h-[20%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[20%] top-[50%] h-[15%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Medical clipboard */}
        <div className="absolute bottom-[10%] left-[18%] h-[8%] w-[5%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)", transform: "rotate(-5deg)" }}>
          <div className="absolute left-[10%] top-[10%] h-[15%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[10%] top-[35%] h-[15%] w-[55%] rounded-sm" style={{ background: "rgba(255,255,255,0.02)" }} />
          <div className="absolute left-[10%] top-[60%] h-[15%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Floor tiles */}
        <div className="absolute bottom-[0%] left-0 h-[4%] w-full" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 2px, transparent 2px, transparent 40px)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Classroom (教室)
   ================================================================ */

function ClassroomScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(8,10,30,0.5) 0%, rgba(12,16,38,0.4) 50%, rgba(10,14,32,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(200,195,185,0.1) 0%, rgba(210,205,195,0.07) 50%, rgba(220,215,205,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Blackboard */}
        <div className="absolute left-[5%] top-[3%] h-[45%] w-[30%] rounded-lg border border-white/[0.06]" style={{ background: "rgba(20,30,20,0.3)" }}>
          <div className="absolute left-[8%] top-[8%] h-[3%] w-[45%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute left-[8%] top-[18%] h-[3%] w-[35%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute left-[8%] top-[28%] h-[3%] w-[50%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute left-[8%] top-[38%] h-[3%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute left-[8%] top-[55%] h-[3%] w-[25%] rounded-sm" style={{ background: accent, opacity: 0.1 }} />
          <div className="absolute left-[8%] top-[65%] h-[3%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          {/* Chalk tray */}
          <div className="absolute bottom-[3%] left-[5%] h-[4%] w-[90%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Projector screen */}
        <div className="absolute right-[5%] top-[3%] h-[30%] w-[18%] rounded-md border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="absolute left-[15%] top-[15%] h-[10%] w-[40%] rounded-sm" style={{ background: accent, opacity: 0.12 }} />
          <div className="absolute left-[15%] top-[35%] h-[4%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[15%] top-[50%] h-[4%] w-[45%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[15%] top-[65%] h-[4%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Ceiling lights */}
        <div className="absolute left-[10%] top-[1%] h-[2%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute left-[40%] top-[1%] h-[2%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute left-[70%] top-[1%] h-[2%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* Windows */}
        <div className="absolute left-[38%] top-[3%] h-[35%] w-[18%] rounded-xl border border-white/[0.06]" style={{ background: isNight ? "rgba(5,10,30,0.4)" : "rgba(180,200,220,0.06)" }}>
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.04]" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.04]" />
        </div>

        {/* Bookshelf */}
        <div className="absolute right-[3%] top-[38%] h-[35%] w-[8%] rounded-md border border-white/[0.05]" style={{ background: "rgba(60,40,25,0.1)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute left-[5%] h-[2%] w-[90%] rounded-sm" style={{ top: `${5 + i * 25}%`, background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Teacher's desk */}
        <div className="absolute bottom-[30%] left-[15%] h-[6%] w-[20%] rounded-md border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="absolute left-[20%] top-[15%] h-[30%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[55%] top-[15%] h-[30%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Student desks */}
        {[0, 1, 2].map((row) => (
          <Fragment key={`row-${row}`}>
            {[0, 1].map((col) => (
              <div key={`desk-${row}-${col}`} className="absolute rounded-md border border-white/[0.05]" style={{ bottom: `${18 - row * 8}%`, left: `${25 + col * 25}%`, width: "18%", height: "5%", background: "rgba(255,255,255,0.02)" }} />
            ))}
          </Fragment>
        ))}

        {/* Student silhouettes */}
        {[0, 1, 2].map((row) => (
          [0, 1].map((col) => (
            <ScenePerson key={`stu-${row}-${col}`} x={`${29 + col * 25}%`} y={42 - row * 8} anim="sit" delay={row * 0.5 + col} color="rgba(200,210,230,0.12)" />
          ))
        ))}

        {/* Teacher */}
        <ScenePerson x="18%" y={50} anim="stand" delay={0} color="rgba(220,230,240,0.18)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Books on desk */}
        <div className="absolute bottom-[36%] left-[22%] h-[3%] w-[4%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(-3deg)" }} />
        <div className="absolute bottom-[36%] left-[27%] h-[3%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)", transform: "rotate(2deg)" }} />

        {/* Chalk on teacher's desk */}
        <div className="absolute bottom-[36%] left-[30%] h-[2%] w-[1%] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute bottom-[36%] left-[32%] h-[2%] w-[1%] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* Backpack */}
        <div className="absolute bottom-[5%] right-[10%] h-[8%] w-[4%] rounded-md" style={{ background: "rgba(255,255,255,0.03)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Courtroom (法庭)
   ================================================================ */

function CourtroomScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  void accent;
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(15,10,25,0.5) 0%, rgba(20,15,35,0.4) 50%, rgba(15,12,30,0.35) 100%)" }
    : { background: "linear-gradient(180deg, rgba(180,170,155,0.1) 0%, rgba(190,180,165,0.07) 50%, rgba(200,190,175,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Wooden wall panels */}
        <div className="absolute left-0 top-0 h-full w-[8%]" style={{ background: "repeating-linear-gradient(0deg, rgba(80,50,25,0.1) 0px, rgba(80,50,25,0.1) 2px, transparent 2px, transparent 15px)" }} />
        <div className="absolute right-0 top-0 h-full w-[8%]" style={{ background: "repeating-linear-gradient(0deg, rgba(80,50,25,0.1) 0px, rgba(80,50,25,0.1) 2px, transparent 2px, transparent 15px)" }} />

        {/* Ceiling */}
        <div className="absolute left-0 top-0 h-[12%] w-full" style={{ background: "linear-gradient(180deg, rgba(60,35,15,0.15) 0%, transparent 100%)" }}>
          {/* Ceiling lights */}
          <div className="absolute left-[15%] top-[20%] h-[3%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,240,0.06)" }} />
          <div className="absolute left-[42%] top-[20%] h-[3%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,240,0.06)" }} />
          <div className="absolute left-[70%] top-[20%] h-[3%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,240,0.06)" }} />
        </div>

        {/* Seal/emblem on wall */}
        <div className="absolute left-[42%] top-[15%] h-[18%] w-[16%] rounded-full border-2 border-white/[0.06]" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="absolute left-[30%] top-[30%] h-[40%] w-[40%] rounded-full border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.02)" }} />
          <div className="absolute left-[15%] top-[10%] h-[15%] w-[70%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[15%] bottom-[15%] h-[15%] w-[70%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Flags */}
        <div className="absolute left-[10%] top-[10%]">
          <div className="h-[40px] w-[2px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-0 left-[2px] h-[12px] w-[16px] rounded-sm" style={{ background: "rgba(200,50,30,0.08)" }} />
        </div>
        <div className="absolute right-[10%] top-[10%]">
          <div className="h-[40px] w-[2px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-0 left-[2px] h-[12px] w-[16px] rounded-sm" style={{ background: "rgba(200,50,30,0.08)" }} />
        </div>

        {/* Windows */}
        <div className="absolute left-[12%] top-[5%] h-[30%] w-[8%] rounded-md border border-white/[0.05]" style={{ background: isNight ? "rgba(5,10,25,0.4)" : "rgba(180,190,200,0.06)" }} />
        <div className="absolute right-[12%] top-[5%] h-[30%] w-[8%] rounded-md border border-white/[0.05]" style={{ background: isNight ? "rgba(5,10,25,0.4)" : "rgba(180,190,200,0.06)" }} />
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Judge's bench - elevated */}
        <div className="absolute bottom-[40%] left-[35%] h-[25%] w-[30%] rounded-lg border border-white/[0.06]" style={{ background: "linear-gradient(180deg, rgba(80,50,25,0.15) 0%, rgba(60,35,15,0.1) 100%)" }}>
          <div className="absolute left-[5%] top-[5%] h-[8%] w-[90%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute left-[10%] top-[25%] h-[10%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          {/* Gavel */}
          <div className="absolute right-[15%] top-[15%]">
            <div className="h-[8px] w-[12px] rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-[2px] w-[6px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)", margin: "0 auto" }} />
          </div>
        </div>

        {/* Witness stand */}
        <div className="absolute bottom-[25%] left-[20%] h-[12%] w-[12%] rounded-md border border-white/[0.05]" style={{ background: "rgba(80,50,25,0.1)" }}>
          <div className="absolute left-[30%] top-[15%] h-[20%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Defense/Prosecution tables */}
        <div className="absolute bottom-[20%] left-[10%] h-[6%] w-[18%] rounded-md border border-white/[0.05]" style={{ background: "rgba(80,50,25,0.08)" }}>
          <div className="absolute left-[15%] top-[15%] h-[30%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
        <div className="absolute bottom-[20%] right-[10%] h-[6%] w-[18%] rounded-md border border-white/[0.05]" style={{ background: "rgba(80,50,25,0.08)" }}>
          <div className="absolute left-[15%] top-[15%] h-[30%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* People */}
        <ScenePerson x="45%" y={38} anim="stand" delay={0} color="rgba(220,210,190,0.2)" />
        <ScenePerson x="28%" y={28} anim="stand" delay={0.5} color="rgba(220,210,190,0.15)" />
        <ScenePerson x="15%" y={25} anim="sit" delay={1} color="rgba(220,210,190,0.13)" />
        <ScenePerson x="72%" y={25} anim="sit" delay={1.5} color="rgba(220,210,190,0.13)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Court reporter desk */}
        <div className="absolute bottom-[35%] left-[48%] h-[5%] w-[8%] rounded-sm border border-white/[0.04]" style={{ background: "rgba(255,255,255,0.02)" }} />

        {/* Public gallery railing */}
        <div className="absolute bottom-[15%] left-[5%] h-[1%] w-[90%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
            <div key={i} className="absolute top-[-100%] h-[100%] w-[1%] rounded-sm" style={{ left: `${5 + i * 6}%`, background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>

        {/* Documents */}
        <div className="absolute bottom-[27%] left-[14%] h-[3%] w-[5%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(-3deg)" }} />
        <div className="absolute bottom-[27%] right-[14%] h-[3%] w-[5%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", transform: "rotate(2deg)" }} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCENE: Construction (建筑工地)
   ================================================================ */

function ConstructionScene({
  accent,
  timeOfDay,
  mouseParallax,
}: {
  accent: string;
  timeOfDay: TimeOfDay;
  mouseParallax: { x: number; y: number };
}) {
  void accent;
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const bgStyle = isNight
    ? { background: "linear-gradient(180deg, rgba(5,8,25,0.6) 0%, rgba(10,15,40,0.5) 50%, rgba(8,12,35,0.4) 100%)" }
    : { background: "linear-gradient(180deg, rgba(200,210,220,0.12) 0%, rgba(190,200,210,0.08) 50%, rgba(180,190,200,0.05) 100%)" };

  return (
    <div className="relative h-full w-full overflow-hidden" style={bgStyle}>
      {/* LAYER 1: Background */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        animate={{ x: mouseParallax.x * -6, y: mouseParallax.y * -4 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        {/* Sky */}
        <div className="absolute inset-0" style={{ background: isNight ? "linear-gradient(180deg, rgba(5,8,25,0.4) 0%, rgba(10,15,40,0.3) 50%, rgba(8,12,30,0.2) 100%)" : "linear-gradient(180deg, rgba(180,200,220,0.08) 0%, rgba(190,210,225,0.05) 60%, rgba(200,215,230,0.03) 100%)" }} />

        {/* Clouds */}
        <Cloud top={5} left={10} width={100} delay={0} opacity={0.06} speed={18} />
        <Cloud top={3} left={45} width={80} delay={3} opacity={0.05} speed={16} />
        <Cloud top={8} left={70} width={90} delay={5} opacity={0.06} speed={20} />

        {/* Distant buildings */}
        <div className="absolute bottom-[30%] left-0 h-[15%] w-full">
          {[5, 12, 20, 28, 38, 48, 55, 65, 75, 85, 92].map((l, i) => (
            <div key={i} className="absolute bottom-0" style={{ left: `${l}%`, width: `${3 + (i % 3) * 2}%`, height: `${20 + (i % 3) * 20}%`, background: `rgba(255,255,255,${0.02 + (i % 3) * 0.02})`, borderRadius: "2px 2px 0 0" }} />
          ))}
        </div>

        {/* Crane */}
        <div className="absolute left-[30%] top-[5%]" style={{ animation: "sb-crane-swing 8s ease-in-out infinite" }}>
          <div className="h-[120px] w-[3px] rounded-sm" style={{ background: "rgba(255,255,255,0.06)", margin: "0 auto", transformOrigin: "bottom center" }} />
          <div className="absolute top-0 left-[-60px] h-[3px] w-[120px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-[3px] left-[52px] h-[30px] w-[2px] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute top-[33px] left-[52px] h-[4px] w-[8px] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Scaffolding */}
        <div className="absolute right-[5%] top-[5%] h-[55%] w-[15%] rounded-md border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="absolute left-0 h-[1%] w-full" style={{ top: `${5 + i * 18}%`, background: "rgba(255,255,255,0.03)" }} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute top-0 h-full w-[1%]" style={{ left: `${5 + i * 30}%`, background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      </motion.div>

      {/* LAYER 2: Midground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ x: mouseParallax.x * -3, y: mouseParallax.y * -2 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      >
        {/* Steel beams */}
        <div className="absolute bottom-[30%] left-[10%] h-[40%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute bottom-[30%] left-[25%] h-[4%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute bottom-[30%] left-[40%] h-[55%] w-[3%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute bottom-[30%] left-[55%] h-[4%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />

        {/* Construction materials */}
        <div className="absolute bottom-[25%] left-[15%] h-[5%] w-[15%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute top-[-30%] h-[30%] w-[10%] rounded-sm" style={{ left: `${10 + i * 25}%`, background: `rgba(${150 + i * 20},${100 + i * 15},${80 + i * 25},0.06)` }} />
          ))}
        </div>

        {/* Blueprint table */}
        <div className="absolute bottom-[30%] right-[25%] h-[10%] w-[15%] rounded-md border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="absolute left-[10%] top-[10%] h-[60%] w-[80%] rounded-sm" style={{ background: "rgba(100,150,220,0.06)" }}>
            <div className="absolute left-[10%] top-[10%] h-[15%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
            <div className="absolute left-[10%] top-[40%] h-[15%] w-[60%] rounded-sm" style={{ background: "rgba(255,255,255,0.02)" }} />
            <div className="absolute left-[10%] top-[70%] h-[15%] w-[30%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        </div>

        {/* Workers */}
        <ScenePerson x="15%" y={30} anim="stand" delay={0} color="rgba(255,200,100,0.15)" />
        <ScenePerson x="35%" y={32} anim="walk" delay={1} color="rgba(255,200,100,0.15)" />
        <ScenePerson x="50%" y={30} anim="stand" delay={2} color="rgba(255,200,100,0.15)" />
        <ScenePerson x="65%" y={32} anim="walk" delay={0.5} color="rgba(255,200,100,0.15)" />
      </motion.div>

      {/* LAYER 3: Foreground */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ x: mouseParallax.x * -1, y: mouseParallax.y * -0.5 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      >
        {/* Hard hat */}
        <div className="absolute bottom-[26%] left-[12%] h-[4%] w-[5%] rounded-t-full" style={{ background: "rgba(255,200,50,0.08)" }}>
          <div className="absolute bottom-0 left-0 h-[30%] w-full rounded-b-sm" style={{ background: "rgba(255,200,50,0.04)" }} />
        </div>

        {/* Warning sign */}
        <div className="absolute bottom-[15%] left-[50%] h-[10%] w-[5%]">
          <div className="h-[6px] w-[2px] rounded-sm" style={{ background: "rgba(255,255,255,0.04)", margin: "0 auto" }} />
          <div className="h-[18px] w-[18px] rounded-sm" style={{ background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.1)" }}>
            <div className="absolute left-[30%] top-[15%] h-[20%] w-[40%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>

        {/* Toolbox */}
        <div className="absolute bottom-[5%] left-[20%] h-[8%] w-[8%] rounded-md border border-white/[0.04]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="absolute left-[20%] top-[15%] h-[20%] w-[25%] rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Pile of bricks */}
        <div className="absolute bottom-[5%] right-[15%] h-[5%] w-[10%] rounded-sm" style={{ background: "rgba(180,80,40,0.06)" }}>
          <div className="absolute top-[-60%] left-[5%] h-[60%] w-[90%] rounded-sm" style={{ background: "rgba(180,80,40,0.05)" }} />
          <div className="absolute top-[-120%] left-[10%] h-[60%] w-[80%] rounded-sm" style={{ background: "rgba(180,80,40,0.04)" }} />
        </div>

        {/* Cement mixer */}
        <div className="absolute bottom-[5%] left-[40%] h-[14%] w-[10%] rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", animation: "sb-spin-slow 10s linear infinite" }}>
          <div className="absolute bottom-[-20%] left-[40%] h-[20%] w-[20%] rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   Particle System Wrapper
   ================================================================ */

function ParticleSystem({
  kind,
  accent,
  className,
}: {
  kind: ParticleKind;
  accent: string;
  className?: string;
}) {
  const density = kind === "dust" ? 0.6 : kind === "steam" ? 0.5 : kind === "sparks" ? 0.3 : 0.8;
  return <ParticleCanvas kind={kind} accent={accent} density={density} className={className} />;
}

/* ================================================================
   EXPORT: SceneBackground
   ================================================================ */

export function SceneBackground({
  scene,
  accent,
  className,
  timeOfDay = new Date().toTimeString().slice(0, 5),
  weather,
  mousePosition = { x: 0, y: 0 },
  moodLevel = 75,
}: SceneBackgroundProps) {
  const sceneType = useMemo(() => inferSceneType(scene), [scene]);
  const tod = useMemo(() => parseTimeOfDay(timeOfDay), [timeOfDay]);
  const lighting = useMemo(() => getTimeOfDayLighting(timeOfDay), [timeOfDay]);
  const resolvedWeather = useMemo(
    () => weather || getWeatherForScene(scene),
    [weather, scene],
  );

  // mousePosition 由 Experience 页面传入，已归一化为 -1~1，直接使用
  const mouseParallax = useMemo(
    () => ({
      x: mousePosition.x || 0,
      y: mousePosition.y || 0,
    }),
    [mousePosition.x, mousePosition.y],
  );

  const particleKind: ParticleKind = useMemo(() => {
    if (resolvedWeather === "rainy") return "rain";
    if (resolvedWeather === "foggy") return "steam";
    if (sceneType === "factory") return "sparks";
    if (sceneType === "outdoor" || sceneType === "construction") return "leaves";
    if (sceneType === "office" || sceneType === "meeting") return "papers";
    return "dust";
  }, [resolvedWeather, sceneType]);

  const sceneElement = useMemo(() => {
    switch (sceneType) {
      case "office":
        return <OfficeScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "lab":
        return <LabScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "cafe":
        return <CafeScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "home":
        return <HomeScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "meeting":
        return <MeetingScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "outdoor":
        return <OutdoorScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "studio":
        return <StudioScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "factory":
        return <FactoryScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "hospital":
        return <HospitalScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "classroom":
        return <ClassroomScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "courtroom":
        return <CourtroomScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      case "construction":
        return <ConstructionScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
      default:
        return <OfficeScene accent={accent} timeOfDay={tod} mouseParallax={mouseParallax} />;
    }
  }, [sceneType, accent, tod, mouseParallax]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className || ""}`}>

      <AnimatePresence mode="wait">
        <motion.div
          key={sceneType}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {sceneElement}
        </motion.div>
      </AnimatePresence>

      {/* Lighting overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 4, background: lighting.overlay }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 5, background: lighting.vignette }}
      />

      {/* Mood desaturation overlay (low mood → more desaturated) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 5,
          backdropFilter: `saturate(${moodLevel / 100})`,
          WebkitBackdropFilter: `saturate(${moodLevel / 100})`,
          transition: "backdrop-filter 1.5s ease, -webkit-backdrop-filter 1.5s ease",
        }}
      />

      {/* Weather particles */}
      <ParticleSystem
        kind={particleKind}
        accent={accent}
        className="z-[6]"
      />
    </div>
  );
}