// ============================================================
// js/shaders/particle.frag.glsl.js
// 中华文化粒子云引擎 · 3D 粒子片段着色器（ES module 导出 GLSL 源码字符串）
// SubTask 2.2：径向 alpha 渐变，中心亮、边缘软衰减，配合 AdditiveBlending
// ============================================================

export const particleFragmentShader = /* glsl */`
precision highp float;

// 由顶点着色器传入的粒子颜色（线性 sRGB）
varying vec3 vColor;

void main() {
  // gl_PointCoord ∈ [0,1]²，以 0.5 为中心
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  // 径向 alpha：中心 1.0 → 边缘 0.0，外圈 (>0.5) 直接为 0
  float alpha = smoothstep(0.5, 0.0, d);
  // 提升曲线指数让衰减更柔和
  alpha = pow(alpha, 1.5);

  // 中心更亮（用于配合加法混合产生辉光感）
  vec3 col = vColor * (1.0 + alpha * 0.5);

  gl_FragColor = vec4(col, alpha);
}
`;

// 功能描述：3D 粒子片段着色器 GLSL 源码模块。
// 接收顶点着色器传来的 varying vColor，基于 gl_PointCoord 计算到点中心的距离 d，
// 用 smoothstep(0.5, 0.0, d) 生成径向 alpha（中心 1.0、边缘 0.0），
// 再 pow(alpha, 1.5) 让衰减更柔和；颜色 vColor 乘以 (1 + alpha*0.5) 让中心更亮，
// 输出 vec4(col, alpha)。配合 ShaderMaterial 的 AdditiveBlending 与 transparent/depthWrite=false
// 即可呈现发光粒子球效果，无需在着色器内做 premultiplied alpha 处理。
