// ============================================================
// js/shaders/particle.vert.glsl.js
// 中华文化粒子云引擎 · 3D 粒子顶点着色器（ES module 导出 GLSL 源码字符串）
// SubTask 2.1：负责位置 morph 插值 + Simplex 风格流场偏移 + 点尺寸距离衰减
// ============================================================

export const particleVertexShader = /* glsl */`
// ====== attributes ======
// 注意：position 由 Three.js ShaderMaterial 自动声明，不可在此重复声明
// （geometry 上的 'position' attribute 由 Three.js 自动绑定到此变量）
attribute vec3 aTarget;      // 目标位置（来自 Layout 算法）
attribute float aSize;       // 粒子大小倍数
attribute vec3 aColor;       // 粒子颜色（线性 sRGB）
attribute float aOffset;     // 相位偏移，用于流场错峰

// ====== uniforms ======
// 注意：modelViewMatrix / projectionMatrix 由 Three.js 自动声明
uniform float uTime;          // 全局时间（秒）
uniform float uFlowStrength;  // 流场强度 0-1
uniform float uPixelRatio;   // 设备像素比
uniform float uSizeScale;     // 全局粒子大小缩放
uniform float uMorphProgress; // 0-1：基础位置→目标位置过渡进度

// ====== varyings ======
varying vec3 vColor;        // 传给片段着色器的颜色

void main() {
  // 1) 基础位置与目标位置按 morph 进度线性插值
  vec3 mixedPos = mix(position, aTarget, clamp(uMorphProgress, 0.0, 1.0));

  // 2) Simplex 风格流场偏移（用 sin/cos 近似 simplex 噪声，避免引入额外依赖）
  vec2 q = vec2(mixedPos.x * 0.3 + uTime * 0.05, mixedPos.z * 0.3);
  float n = sin(q.x * 1.3 + uTime * 0.2) * cos(q.y * 1.7 - uTime * 0.15);
  vec3 flow = vec3(
    n,
    sin(uTime + aOffset) * 0.5,
    cos(uTime * 0.7 + aOffset)
  ) * uFlowStrength * 8.0;
  vec3 finalPos = mixedPos + flow;

  // 3) 计算 view-space 位置（用于按距离衰减点尺寸）
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);

  // 4) 点尺寸：基础×缩放×像素比×距离衰减，下限 1.0 避免完全消失
  float ps = aSize * uSizeScale * uPixelRatio * (300.0 / max(-mvPosition.z, 1.0));
  gl_PointSize = clamp(ps, 1.0, 128.0);

  // 5) 传递颜色与最终裁剪空间位置
  vColor = aColor;
  gl_Position = projectionMatrix * mvPosition;
}
`;

// 功能描述：3D 粒子顶点着色器 GLSL 源码模块。
// 接收 aTarget/aSize/aColor/aOffset 四个自定义 attribute 与
// uTime/uFlowStrength/uPixelRatio/uSizeScale/uMorphProgress 五个 uniform；
// position / modelViewMatrix / projectionMatrix 由 Three.js ShaderMaterial 自动声明与绑定，
// 故 GLSL 内不再重复声明 position（重复声明会触发 'position' : redefinition 编译错误）。
// 完成：(1) 基础位置与目标位置按 uMorphProgress 线性插值得到 mixedPos；
// (2) 基于 mixedPos.xz 与 uTime 用 sin/cos 近似 simplex 噪声生成 flow 偏移向量；
// (3) 按 300.0 / -mvPosition.z 做距离衰减计算 gl_PointSize 并 clamp 到 [1, 128]；
// (4) 将 aColor 经 varying vColor 传给片段着色器；(5) 输出最终 gl_Position。
