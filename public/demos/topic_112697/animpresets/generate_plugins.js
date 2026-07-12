const fs = require('fs');

const cssContent = fs.readFileSync('../styles.css', 'utf8');
const jsContent = fs.readFileSync('../app.js', 'utf8');

const animEffectsMatch = jsContent.match(/const animEffects = \{([\s\S]*?)\n\};/);
if (!animEffectsMatch) {
  console.error('未找到 animEffects');
  process.exit(1);
}

function extractKeyframes(css) {
  const keyframes = {};
  const regex = /@keyframes\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    keyframes[match[1]] = match[2].trim();
  }
  return keyframes;
}

function extractAnimClasses(css) {
  const classes = {};
  const regex = /\.anim-(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    classes[match[1]] = match[2].trim();
  }
  return classes;
}

function parseAnimClass(css) {
  const result = {
    duration: '1s',
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
    fillMode: 'none'
  };
  
  const animMatch = css.match(/animation\s*:\s*([^;]+)/);
  if (animMatch) {
    const parts = animMatch[1].split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/\d/.test(part) && (part.endsWith('s') || part.endsWith('ms'))) {
        if (part.includes('var(--')) {
          const defaultMatch = part.match(/,\s*([\d.]+s)\)/);
          if (defaultMatch) result.duration = defaultMatch[1];
        } else {
          result.duration = part;
        }
      } else if (part === 'infinite' || /^\d+$/.test(part)) {
        result.iterationCount = part;
      } else if (part === 'forwards' || part === 'backwards' || part === 'both' || part === 'none') {
        result.fillMode = part;
      } else if (!part.startsWith('var(') && part !== '!important') {
        const timingFuncs = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'];
        if (timingFuncs.includes(part) || part.startsWith('cubic-bezier') || part.startsWith('steps')) {
          result.timingFunction = part;
        }
      }
    }
  }
  
  const fillMatch = css.match(/animation-fill-mode\s*:\s*([^;]+)/);
  if (fillMatch) {
    result.fillMode = fillMatch[1].trim().replace('!important', '').trim();
  }
  
  return result;
}

const keyframesMap = extractKeyframes(cssContent);
const animClasses = extractAnimClasses(cssContent);

function evalAnimEffects(jsText) {
  const start = jsText.indexOf('const animEffects = {');
  let braceCount = 0;
  let i = start + 'const animEffects = {'.length - 1;
  let inString = false;
  let stringChar = '';
  
  while (i < jsText.length) {
    const char = jsText[i];
    if (inString) {
      if (char === stringChar && jsText[i-1] !== '\\') {
        inString = false;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) break;
      }
    }
    i++;
  }
  
  const objStr = jsText.substring(start + 'const animEffects = '.length, i + 1);
  try {
    return eval('(' + objStr + ')');
  } catch (e) {
    console.error('解析 animEffects 失败:', e.message);
    return null;
  }
}

const animEffects = evalAnimEffects(jsContent);

if (!animEffects) {
  console.error('无法解析 animEffects');
  process.exit(1);
}

console.log('找到动画类型:', Object.keys(animEffects));

const categories = [
  { id: 'entrance', name: '入场动画', icon: '↓', type: 'in', anims: animEffects.in || [] },
  { id: 'basic', name: '基础动画', icon: '📱', type: 'preset', range: [0, 21] },
  { id: 'action', name: '动作动画', icon: '👋', type: 'preset', range: [21, 32] },
  { id: 'lowerbody', name: '下半身动画', icon: '🦵', type: 'preset', range: [32, 52] },
  { id: 'crazy-lowerbody', name: '疯狂下半身', icon: '🤪', type: 'preset', range: [52, 72] },
  { id: '3d', name: '3D动画', icon: '🎲', type: 'preset', range: [72, 92] },
  { id: 'upperbody', name: '上半身动画', icon: '💪', type: 'preset', range: [92, 122] },
  { id: 'displacement', name: '位移动画', icon: '🔮', type: 'preset', range: [122, 142] },
  { id: '3d-displacement', name: '3D位移', icon: '💎', type: 'preset', range: [142, 152] },
  { id: 'both-ends', name: '两端动画', icon: '⚡', type: 'preset', range: [152, -1] },
  { id: 'exit', name: '出场动画', icon: '↑', type: 'out', anims: animEffects.out || [] }
];

const presetAnims = animEffects.preset || [];

for (const cat of categories) {
  let animList = [];
  
  if (cat.anims) {
    animList = cat.anims;
  } else if (cat.range) {
    const [start, end] = cat.range;
    const actualEnd = end === -1 ? presetAnims.length : end;
    animList = presetAnims.slice(start, actualEnd);
  }
  
  const pluginData = {
    format: 'animation-preset-v1',
    id: cat.id,
    name: cat.name,
    description: `${cat.name}预设`,
    author: '字漫画内置',
    version: '1.0.0',
    category: cat.type,
    categoryName: cat.name,
    icon: cat.icon,
    animations: []
  };
  
  for (const anim of animList) {
    const value = anim.value;
    const keyframeCSS = keyframesMap[value];
    const animClassCSS = animClasses[value];
    
    if (!keyframeCSS) {
      console.warn(`未找到 keyframes: ${value} (${anim.name})`);
      continue;
    }
    
    const parsed = parseAnimClass(animClassCSS || '');
    
    let transformOrigin = 'center center';
    if (value === 'fall' || value === 'jump') {
      transformOrigin = 'bottom center';
    }
    
    const keyframesObj = {};
    const kfRegex = /([^{]+)\s*\{([^}]+)\}/g;
    let kfMatch;
    while ((kfMatch = kfRegex.exec(keyframeCSS)) !== null) {
      const percent = kfMatch[1].trim();
      const props = kfMatch[2].trim();
      keyframesObj[percent] = props;
    }
    
    pluginData.animations.push({
      name: anim.name,
      value: value,
      description: `${cat.name} - ${anim.name}`,
      defaultDuration: parsed.duration,
      timingFunction: parsed.timingFunction,
      iterationCount: parsed.iterationCount,
      fillMode: parsed.fillMode,
      transformOrigin: transformOrigin,
      keyframes: keyframesObj
    });
  }
  
  const fileName = cat.id + '.json';
  fs.writeFileSync(fileName, JSON.stringify(pluginData, null, 2), 'utf8');
  console.log(`生成 ${fileName}: ${pluginData.animations.length} 个动画`);
}

console.log('\n全部完成！');
