/* =================================================================
   CodeBeat 节奏编程 - WebGL 3D 隧道背景系统
   ================================================================= */

let webglCtx = null;
let webglProgram = null;
let webglUniforms = {};
let webglReady = false;

// 命中特效状态
const hitEffect = {
  intensity: 0,
  color: [0.5, 0.3, 1.0],
};

// ============ 着色器源码 ============

const WEBGL_VS = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const WEBGL_FS = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform vec3 u_color;
uniform float u_beat;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float depth = 1.0 / (radius + 0.08);

  // 隧道螺旋条纹
  float spiral = sin(angle * 6.0 + depth * 4.0 - u_time * 1.5) * 0.5 + 0.5;
  float rings = sin(depth * 8.0 - u_time * 3.0) * 0.5 + 0.5;
  float tunnel = spiral * rings;

  // 多层光速星星（径向条纹）
  float stars = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float speed = 0.15 + fi * 0.12;
    float size = 0.015 + fi * 0.005;
    float streakAngle = angle + fi * 1.256;
    float streak = pow(abs(sin(streakAngle * (12.0 + fi * 8.0))), 20.0);
    float ringPos = fract(u_time * speed + fi * 0.2);
    float radial = smoothstep(size, 0.0, abs(radius - ringPos));
    float fade = smoothstep(0.0, 0.3, ringPos) * smoothstep(1.0, 0.7, ringPos);
    stars += streak * radial * fade * (0.4 + 0.6 / (1.0 + fi * 0.5));
  }

  // 静态背景星空
  float bgStars = 0.0;
  vec2 starGrid = uv * 8.0;
  vec2 starId = floor(starGrid);
  vec2 starFp = fract(starGrid) - 0.5;
  float starRand = hash(starId);
  if (starRand > 0.85) {
    float d = length(starFp - (hash(starId + 100.0) - 0.5) * 0.4);
    float twinkle = 0.5 + 0.5 * sin(u_time * 3.0 + starRand * 6.28);
    bgStars = smoothstep(0.04, 0.0, d) * twinkle;
  }

  // 节拍脉冲
  float beatPulse = u_beat * 0.4;

  // 颜色合成
  vec3 bg = vec3(0.015, 0.015, 0.05);
  vec3 tunnelCol = u_color * tunnel * 0.12 * (1.0 + u_intensity * 2.0 + beatPulse);
  vec3 starCol = vec3(0.85, 0.92, 1.0) * stars * 0.5;
  vec3 bgStarCol = vec3(0.6, 0.7, 0.9) * bgStars * 0.3;
  vec3 glowCol = u_color * (u_intensity + beatPulse) * 0.25 / (1.0 + radius * 3.0);
  vec3 hitCol = u_color * u_intensity * 0.2 * (1.0 - radius);

  vec3 col = bg + tunnelCol + starCol + bgStarCol + glowCol + hitCol;

  // 暗角 + 色调映射
  col *= 1.0 - radius * 0.4;
  col = 1.0 - exp(-col * 1.8);

  gl_FragColor = vec4(col, 1.0);
}`;

// ============ 初始化 ============

function initWebGL() {
  const canvas = $('#webgl-canvas');
  if (!canvas) return;

  try {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    webglCtx = canvas.getContext('webgl', { alpha: false, antialias: false })
      || canvas.getContext('experimental-webgl', { alpha: false, antialias: false });

    if (!webglCtx) {
      console.warn('WebGL 不可用，使用 2D 粒子背景');
      webglReady = false;
      return;
    }

    function compileShader(source, type) {
      const shader = webglCtx.createShader(type);
      webglCtx.shaderSource(shader, source);
      webglCtx.compileShader(shader);
      if (!webglCtx.getShaderParameter(shader, webglCtx.COMPILE_STATUS)) {
        console.error('着色器编译失败:', webglCtx.getShaderInfoLog(shader));
        webglCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(WEBGL_VS, webglCtx.VERTEX_SHADER);
    const fs = compileShader(WEBGL_FS, webglCtx.FRAGMENT_SHADER);
    if (!vs || !fs) {
      webglReady = false;
      return;
    }

    webglProgram = webglCtx.createProgram();
    webglCtx.attachShader(webglProgram, vs);
    webglCtx.attachShader(webglProgram, fs);
    webglCtx.linkProgram(webglProgram);

    if (!webglCtx.getProgramParameter(webglProgram, webglCtx.LINK_STATUS)) {
      console.error('程序链接失败:', webglCtx.getProgramInfoLog(webglProgram));
      webglReady = false;
      return;
    }

    webglCtx.useProgram(webglProgram);

    // 全屏四边形
    const buffer = webglCtx.createBuffer();
    webglCtx.bindBuffer(webglCtx.ARRAY_BUFFER, buffer);
    webglCtx.bufferData(webglCtx.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), webglCtx.STATIC_DRAW);

    const aPos = webglCtx.getAttribLocation(webglProgram, 'a_position');
    webglCtx.enableVertexAttribArray(aPos);
    webglCtx.vertexAttribPointer(aPos, 2, webglCtx.FLOAT, false, 0, 0);

    webglUniforms.time = webglCtx.getUniformLocation(webglProgram, 'u_time');
    webglUniforms.resolution = webglCtx.getUniformLocation(webglProgram, 'u_resolution');
    webglUniforms.intensity = webglCtx.getUniformLocation(webglProgram, 'u_intensity');
    webglUniforms.color = webglCtx.getUniformLocation(webglProgram, 'u_color');
    webglUniforms.beat = webglCtx.getUniformLocation(webglProgram, 'u_beat');

    webglReady = true;
  } catch (err) {
    console.warn('WebGL 初始化失败，已回退到 2D 背景:', err.message);
    webglCtx = null;
    webglProgram = null;
    webglReady = false;
  }
}

// ============ 特效与渲染 ============

/** 触发命中特效 */
function triggerHitEffect(hexColor, trackKey) {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;
  hitEffect.color = [r, g, b];
  hitEffect.intensity = Math.min(1.0, hitEffect.intensity + 0.6);
  spawnHitParticles(trackKey, hexColor);
}

/** 渲染 WebGL 帧 */
function renderWebGL(timestamp) {
  if (!webglReady) return;

  const canvas = webglCtx.canvas;
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    webglCtx.viewport(0, 0, canvas.width, canvas.height);
  }

  hitEffect.intensity *= 0.93;
  if (hitEffect.intensity < 0.005) hitEffect.intensity = 0;

  const beatPhase = (timestamp % BEAT_MS) / BEAT_MS;
  const beatPulse = Math.exp(-beatPhase * 10.0);
  const comboBonus = Math.min(state.combo / 50.0, 1.0) * 0.15;
  const effectiveIntensity = Math.min(hitEffect.intensity + comboBonus, 1.0);

  webglCtx.uniform1f(webglUniforms.time, timestamp * 0.001);
  webglCtx.uniform2f(webglUniforms.resolution, canvas.width, canvas.height);
  webglCtx.uniform1f(webglUniforms.intensity, effectiveIntensity);
  webglCtx.uniform3fv(webglUniforms.color, hitEffect.color);
  webglCtx.uniform1f(webglUniforms.beat, beatPulse);

  webglCtx.drawArrays(webglCtx.TRIANGLES, 0, 6);
}
