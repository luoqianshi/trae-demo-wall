'use client';

/**
 * TreeCanvas2D —— WebGL 不可用时的 2D Canvas 降级方案
 *
 * 使用 Canvas 2D API 程序化生成生命树，保持与 3D 版本相同的视觉语言：
 * - L-System 递归分枝（5 级）
 * - 银白 / 冰蓝 / 淡青色发光树叶
 * - 向下生长的根系网络
 * - 树干能量流（脉冲）
 * - 数字地面网格 + 远景星尘
 * - 呼吸 / 摇曳 / 闪烁动画
 */

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import type { GrowthStage, FamilyMember } from './living-tree-3d';

/* ═══════════════ 常量 ═══════════════ */

const BG_COLOR = '#05070d';
const BARK_COLOR = '#8a8a9a';
const ROOT_COLOR = '#5a5a6a';
const GROUND_COLOR = '#1a1a2a';
const LEAF_COLORS = ['#e0e8f0', '#a0d8f0', '#b0f0e0'];

interface StageParams {
  trunkHeight: number;
  maxLevel: number;
  branchFactor: number;
  leafCount: number;
  rootCount: number;
  rootDepth: number;
  energy: number;
}

const STAGE_PARAMS: Record<GrowthStage, StageParams> = {
  seed: { trunkHeight: 0.35, maxLevel: 0, branchFactor: 0, leafCount: 0, rootCount: 4, rootDepth: 1, energy: 0.15 },
  sprout: { trunkHeight: 0.6, maxLevel: 2, branchFactor: 2, leafCount: 60, rootCount: 6, rootDepth: 2, energy: 0.35 },
  young: { trunkHeight: 0.9, maxLevel: 3, branchFactor: 2, leafCount: 240, rootCount: 10, rootDepth: 2, energy: 0.55 },
  mature: { trunkHeight: 1.15, maxLevel: 4, branchFactor: 3, leafCount: 500, rootCount: 14, rootDepth: 3, energy: 0.75 },
  bloom: { trunkHeight: 1.25, maxLevel: 5, branchFactor: 3, leafCount: 640, rootCount: 16, rootDepth: 3, energy: 0.9 },
  fruit: { trunkHeight: 1.3, maxLevel: 5, branchFactor: 3, leafCount: 700, rootCount: 16, rootDepth: 3, energy: 1.0 },
  eternal: { trunkHeight: 1.4, maxLevel: 5, branchFactor: 3, leafCount: 800, rootCount: 18, rootDepth: 4, energy: 1.0 },
};

/* ═══════════════ 工具 ═══════════════ */

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Branch2D {
  x1: number; y1: number;
  x2: number; y2: number;
  x3: number; y3: number; // 控制点（弯曲）
  thickness: number;
  level: number;
  familyIndex: number | null;
  angle: number;
  length: number;
}

interface Leaf2D {
  x: number; y: number;
  size: number;
  color: string;
  alpha: number;
  phase: number;
}

interface Root2D {
  x1: number; y1: number;
  x2: number; y2: number;
  cx: number; cy: number;
  thickness: number;
}

interface Star2D {
  x: number; y: number;
  size: number;
  phase: number;
}

interface TreeData2D {
  branches: Branch2D[];
  leaves: Leaf2D[];
  roots: Root2D[];
  stars: Star2D[];
  trunkPath: { x: number; y: number }[];
  trunkThickness: number;
  stage: StageParams;
}

/* ═══════════════ 生成 ═══════════════ */

function generateTree2D(
  stage: StageParams,
  memoryCount: number,
  width: number,
  height: number,
): TreeData2D {
  const rng = mulberry32(20240607);
  const cx = width / 2;
  const groundY = height * 0.78;
  const scale = Math.min(width, height) * 0.32;
  const H = stage.trunkHeight * scale;

  const branches: Branch2D[] = [];
  const leaves: Leaf2D[] = [];
  const roots: Root2D[] = [];

  /* ── 树干（S 型扭曲）── */
  const bendX = (rng() - 0.5) * 0.3 * scale;
  const trunkPath = [
    { x: cx, y: groundY },
    { x: cx + bendX * 0.4, y: groundY - H * 0.33 },
    { x: cx - bendX * 0.3, y: groundY - H * 0.66 },
    { x: cx + bendX * 0.15, y: groundY - H },
  ];
  const trunkThickness = Math.max(4, scale * 0.05);

  // 树干作为 level 0 枝条
  const trunkEndAngle = -Math.PI / 2 + (bendX * 0.15) / H;

  branches.push({
    x1: trunkPath[0].x, y1: trunkPath[0].y,
    x2: trunkPath[3].x, y2: trunkPath[3].y,
    x3: trunkPath[1].x, y3: trunkPath[1].y,
    thickness: trunkThickness,
    level: 0,
    familyIndex: null,
    angle: trunkEndAngle,
    length: H,
  });

  /* ── 5 条主枝（家庭成员）── */
  const MAIN_COUNT = stage.maxLevel >= 1 ? 5 : 0;
  for (let i = 0; i < MAIN_COUNT; i++) {
    const ang = (i / MAIN_COUNT) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const t = 0.5 + 0.42 * (i / MAIN_COUNT) + (rng() - 0.5) * 0.05;
    // 在树干曲线上的位置
    const p0 = trunkPath[0];
    const p1 = trunkPath[1];
    const p2 = trunkPath[2];
    const p3 = trunkPath[3];
    const mt = 1 - t;
    const sx = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
    const sy = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;

    const branchAngle = -Math.PI / 2 + (ang - Math.PI) * 0.6 + (rng() - 0.5) * 0.3;
    const len = H * (0.55 + rng() * 0.25);
    const endX = sx + Math.cos(branchAngle) * len;
    const endY = sy + Math.sin(branchAngle) * len;
    const ctrlX = sx + Math.cos(branchAngle) * len * 0.5 + (rng() - 0.5) * len * 0.15;
    const ctrlY = sy + Math.sin(branchAngle) * len * 0.5 + (rng() - 0.5) * len * 0.1;

    const branch: Branch2D = {
      x1: sx, y1: sy,
      x2: endX, y2: endY,
      x3: ctrlX, y3: ctrlY,
      thickness: trunkThickness * 0.45 * (0.7 + rng() * 0.15),
      level: 1,
      familyIndex: i,
      angle: branchAngle,
      length: len,
    };
    branches.push(branch);
    growBranches2D(branch, stage, rng, branches, 1);
  }

  /* ── 递归子枝 ── */
  function growBranches2D(
    parent: Branch2D,
    st: StageParams,
    rnd: () => number,
    out: Branch2D[],
    currentLevel: number,
  ) {
    const nextLevel = currentLevel + 1;
    if (nextLevel > st.maxLevel || st.branchFactor === 0) return;
    const childCount =
      st.branchFactor === 2
        ? rnd() < 0.5 ? 1 : 2
        : nextLevel <= 2 ? (rnd() < 0.3 ? 4 : 3) : (rnd() < 0.5 ? 2 : 3);

    for (let c = 0; c < childCount; c++) {
      const angleOffset = (rnd() - 0.5) * Math.PI * 0.45;
      const childAngle = parent.angle + angleOffset;
      const upBias = nextLevel <= 2 ? 0.25 : nextLevel === 3 ? 0.1 : 0.0;
      const finalAngle = childAngle + (-Math.PI / 2 - childAngle) * upBias * 0.3;
      const len = parent.length * (0.7 + rnd() * 0.15);
      const endX = parent.x2 + Math.cos(finalAngle) * len;
      const endY = parent.y2 + Math.sin(finalAngle) * len;
      const ctrlX = parent.x2 + Math.cos(finalAngle) * len * 0.5 + (rnd() - 0.5) * len * 0.2;
      const ctrlY = parent.y2 + Math.sin(finalAngle) * len * 0.5 + (rnd() - 0.5) * len * 0.1;

      const child: Branch2D = {
        x1: parent.x2, y1: parent.y2,
        x2: endX, y2: endY,
        x3: ctrlX, y3: ctrlY,
        thickness: parent.thickness * (0.6 + rnd() * 0.12),
        level: nextLevel,
        familyIndex: parent.familyIndex,
        angle: finalAngle,
        length: len,
      };
      out.push(child);
      growBranches2D(child, st, rnd, out, nextLevel);
    }
  }

  /* ── 树叶 ── */
  const spawnBranches = branches.filter((b) => b.level >= 2 && b.familyIndex !== null);
  if (stage.leafCount > 0 && spawnBranches.length > 0) {
    for (let i = 0; i < stage.leafCount; i++) {
      const b = spawnBranches[Math.floor(rng() * spawnBranches.length)];
      const t = 0.6 + rng() * 0.4;
      // 二次贝塞尔曲线上的点
      const lx = (1 - t) * (1 - t) * b.x1 + 2 * (1 - t) * t * b.x3 + t * t * b.x2;
      const ly = (1 - t) * (1 - t) * b.y1 + 2 * (1 - t) * t * b.y3 + t * t * b.y2;
      const jitter = 8;
      const color = LEAF_COLORS[Math.floor(rng() * LEAF_COLORS.length)];
      leaves.push({
        x: lx + (rng() - 0.5) * jitter,
        y: ly + (rng() - 0.5) * jitter,
        size: 1.5 + rng() * 3,
        color,
        alpha: 0.3 + rng() * 0.5,
        phase: rng() * Math.PI * 2,
      });
    }
  }

  /* ── 树根 ── */
  const rootCount = Math.min(26, Math.max(4, stage.rootCount + Math.floor((memoryCount || 0) / 50)));
  function growRoots2D(
    startX: number, startY: number,
    angle: number, length: number,
    thickness: number,
    depth: number, maxDepth: number,
    rnd: () => number,
  ) {
    if (depth > maxDepth) return;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    const ctrlX = startX + Math.cos(angle) * length * 0.5 + (rnd() - 0.5) * length * 0.3;
    const ctrlY = startY + Math.sin(angle) * length * 0.5 + (rnd() - 0.5) * length * 0.1;

    roots.push({ x1: startX, y1: startY, x2: endX, y2: endY, cx: ctrlX, cy: ctrlY, thickness });

    const childCount = rnd() < 0.5 ? 1 : 2;
    for (let c = 0; c < childCount; c++) {
      const childAngle = angle + (rnd() - 0.5) * 0.8;
      const downBias = (Math.PI / 2 - childAngle) * 0.3;
      growRoots2D(endX, endY, childAngle + downBias, length * (0.65 + rnd() * 0.15), thickness * 0.6, depth + 1, maxDepth, rnd);
    }
  }

  for (let i = 0; i < rootCount; i++) {
    const ang = (i / rootCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    // 根从树干底部向外向下生长
    const startAngle = Math.PI / 2 + (ang - Math.PI) * 0.5; // 向下偏
    const len = scale * (0.25 + rng() * 0.25);
    growRoots2D(cx, groundY, startAngle, len, trunkThickness * 0.5, 0, stage.rootDepth, rng);
  }

  /* ── 星尘 ── */
  const stars: Star2D[] = [];
  const starN = 120;
  for (let i = 0; i < starN; i++) {
    stars.push({
      x: rng() * width,
      y: rng() * groundY * 0.9,
      size: 0.5 + rng() * 2,
      phase: rng() * Math.PI * 2,
    });
  }

  return { branches, leaves, roots, stars, trunkPath, trunkThickness, stage };
}

/* ═══════════════ 组件 ═══════════════ */

export interface TreeCanvas2DProps {
  growthStage?: GrowthStage;
  familyMembers?: FamilyMember[];
  memoryCount?: number;
  className?: string;
}

export default function TreeCanvas2D({
  growthStage = 'mature',
  familyMembers,
  memoryCount = 0,
  className,
}: TreeCanvas2DProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<TreeData2D | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const stage = STAGE_PARAMS[growthStage];
      dataRef.current = generateTree2D(stage, memoryCount, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const familyColors = (familyMembers ?? []).map((f) => f.color);

    const render = (time: number) => {
      const data = dataRef.current;
      if (!data) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const t = time * 0.001;

      // 背景
      const bgGrad = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.7);
      bgGrad.addColorStop(0, '#0a0e1a');
      bgGrad.addColorStop(1, BG_COLOR);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const groundY = h * 0.78;
      const swayX = Math.sin(t * 0.5) * 4;

      // ── 星尘 ──
      for (const s of data.stars) {
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.2 + s.phase * 2));
        ctx.globalAlpha = tw * 0.7;
        ctx.fillStyle = '#c0d0e8';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── 地面网格 ──
      ctx.strokeStyle = GROUND_COLOR;
      ctx.lineWidth = 0.5;
      const gridSize = 30;
      for (let x = -gridSize; x < w + gridSize; x += gridSize) {
        const persp = (x - w / 2) * 0.5;
        ctx.globalAlpha = 0.15 * Math.max(0, 1 - Math.abs(x - w / 2) / (w * 0.6));
        ctx.beginPath();
        ctx.moveTo(w / 2 + persp * 0.3, groundY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const y = groundY + i * (h - groundY) / 6;
        const widen = (i / 6) * w * 0.5;
        ctx.globalAlpha = 0.1 * (1 - i / 6);
        ctx.beginPath();
        ctx.moveTo(w / 2 - widen, y);
        ctx.lineTo(w / 2 + widen, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── 根部辉光 ──
      const glowGrad = ctx.createRadialGradient(w / 2, groundY, 0, w / 2, groundY, 120);
      glowGrad.addColorStop(0, 'rgba(94, 158, 245, 0.25)');
      glowGrad.addColorStop(1, 'rgba(94, 158, 245, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(w / 2, groundY, 120, 0, Math.PI * 2);
      ctx.fill();

      // ── 树根 ──
      for (const r of data.roots) {
        ctx.strokeStyle = ROOT_COLOR;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = Math.max(0.5, r.thickness * 0.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r.x1, r.y1);
        ctx.quadraticCurveTo(r.cx, r.cy, r.x2, r.y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── 树干能量流（脉冲）──
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
      ctx.strokeStyle = `rgba(94, 158, 245, ${0.15 + pulse * 0.2 * data.stage.energy})`;
      ctx.lineWidth = data.trunkThickness * 0.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(data.trunkPath[0].x, data.trunkPath[0].y);
      for (let i = 1; i < data.trunkPath.length; i++) {
        const prev = data.trunkPath[i - 1];
        const curr = data.trunkPath[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      ctx.stroke();

      // ── 枝条 ──
      for (const b of data.branches) {
        let color = BARK_COLOR;
        if (b.familyIndex !== null && familyColors.length > 0) {
          // 混合家庭色
          color = familyColors[b.familyIndex % familyColors.length];
        }
        const opacity = b.level === 0 ? 0.92 : Math.max(0.4, 0.85 - b.level * 0.08);
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = Math.max(0.5, b.thickness);
        ctx.lineCap = 'round';

        const offX = b.level > 0 ? swayX * (b.level / data.stage.maxLevel) * 0.5 : 0;
        ctx.beginPath();
        ctx.moveTo(b.x1 + (b.level > 0 ? swayX * 0.1 : 0), b.y1);
        ctx.quadraticCurveTo(b.x3 + offX * 0.5, b.y3, b.x2 + offX, b.y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── 树叶（发光粒子）──
      ctx.globalCompositeOperation = 'screen';
      for (const leaf of data.leaves) {
        const twinkle = 0.7 + 0.3 * Math.sin(t * 1.5 + leaf.phase * 3);
        const drift = Math.sin(t * 0.7 + leaf.phase) * 2;
        const driftY = Math.cos(t * 0.8 + leaf.phase) * 1.5;
        const swayOffset = swayX * 0.3;

        const alpha = leaf.alpha * twinkle;
        const r = leaf.size * 3;

        // 外发光
        const grad = ctx.createRadialGradient(
          leaf.x + drift + swayOffset, leaf.y + driftY, 0,
          leaf.x + drift + swayOffset, leaf.y + driftY, r,
        );
        grad.addColorStop(0, leaf.color);
        grad.addColorStop(0.3, leaf.color + '80');
        grad.addColorStop(1, leaf.color + '00');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(leaf.x + drift + swayOffset, leaf.y + driftY, r, 0, Math.PI * 2);
        ctx.fill();

        // 核心亮点
        ctx.globalAlpha = alpha * 1.2;
        ctx.fillStyle = leaf.color;
        ctx.beginPath();
        ctx.arc(leaf.x + drift + swayOffset, leaf.y + driftY, leaf.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [growthStage, familyMembers, memoryCount]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
