const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'styles.css');
const jsPath = path.join(__dirname, '..', 'app.js');

const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

function extractAllKeyframes(css) {
  const keyframes = {};
  let i = 0;
  
  while (i < css.length) {
    const idx = css.indexOf('@keyframes ', i);
    if (idx === -1) break;
    
    const nameStart = idx + '@keyframes '.length;
    let nameEnd = nameStart;
    while (nameEnd < css.length && /[\w-]/.test(css[nameEnd])) {
      nameEnd++;
    }
    const name = css.substring(nameStart, nameEnd);
    
    let braceStart = css.indexOf('{', nameEnd);
    if (braceStart === -1) break;
    
    let braceCount = 1;
    let j = braceStart + 1;
    while (j < css.length && braceCount > 0) {
      if (css[j] === '{') braceCount++;
      else if (css[j] === '}') braceCount--;
      j++;
    }
    
    const body = css.substring(braceStart + 1, j - 1).trim().replace(/\n\s*/g, '');
    keyframes[name] = body;
    
    i = j;
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
    fillMode: 'none',
    transformOrigin: null
  };
  
  const animMatch = css.match(/animation\s*:\s*([^;]+)/);
  if (animMatch) {
    const parts = animMatch[1].split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].replace('!important', '').trim();
      if (!part) continue;
      
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
      } else if (!part.startsWith('var(')) {
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
  
  const originMatch = css.match(/transform-origin\s*:\s*([^;]+)/);
  if (originMatch) {
    result.transformOrigin = originMatch[1].trim().replace('!important', '').trim();
  }
  
  return result;
}

function keyframesToObject(kfStr) {
  const result = {};
  const regex = /([^{]+)\s*\{([^}]*)\}/g;
  let match;
  while ((match = regex.exec(kfStr)) !== null) {
    const percent = match[1].trim();
    const props = match[2].trim();
    if (percent && props) {
      result[percent] = props;
    }
  }
  return result;
}

function evalAnimEffects(jsText) {
  const start = jsText.indexOf('const animEffects = {');
  if (start === -1) return null;
  
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

function evalPresetCategories(jsText) {
  const start = jsText.indexOf('const presetAnimCategories = [');
  if (start === -1) return null;
  
  let bracketCount = 0;
  let i = start + 'const presetAnimCategories = ['.length - 1;
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
      } else if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0) break;
      }
    }
    i++;
  }
  
  const arrStr = jsText.substring(start + 'const presetAnimCategories = '.length, i + 1);
  try {
    return eval('(' + arrStr + ')');
  } catch (e) {
    console.error('解析 presetAnimCategories 失败:', e.message);
    return null;
  }
}

const keyframesMap = extractAllKeyframes(cssContent);
const animClasses = extractAnimClasses(cssContent);
const animEffects = evalAnimEffects(jsContent);
const presetCategories = evalPresetCategories(jsContent);

console.log('找到 keyframes 数量:', Object.keys(keyframesMap).length);
console.log('找到 anim-class 数量:', Object.keys(animClasses).length);
console.log('动画分类数量:', presetCategories ? presetCategories.length : 0);

const categoryIdByIndex = [
  'basic',
  'action',
  'lowerbody',
  'crazy-lowerbody',
  'crazy',
  '3d',
  'displacement',
  '3d-displacement',
  'both-ends'
];

function buildAnimationObject(anim, categoryType, categoryName) {
  const value = anim.value;
  const kfStr = keyframesMap[value];
  const animClassCSS = animClasses[value];
  
  const result = {
    name: anim.name,
    value: value,
    description: `${categoryName} - ${anim.name}`,
    defaultDuration: '1s',
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
    fillMode: 'none',
    transformOrigin: 'center center'
  };
  
  if (animClassCSS) {
    const parsed = parseAnimClass(animClassCSS);
    result.defaultDuration = parsed.duration;
    result.timingFunction = parsed.timingFunction;
    result.iterationCount = parsed.iterationCount;
    result.fillMode = parsed.fillMode;
    if (parsed.transformOrigin) {
      result.transformOrigin = parsed.transformOrigin;
    }
  }
  
  if (kfStr) {
    result.keyframes = keyframesToObject(kfStr);
  } else {
    result.keyframes = {};
    result.hasCSS = false;
  }
  
  return result;
}

const builtinCategories = [];

builtinCategories.push({
  id: 'entrance',
  name: '入场动画',
  icon: '↓',
  type: 'in',
  order: 1,
  file: 'entrance.json'
});

if (presetCategories) {
  let order = 2;
  for (let idx = 0; idx < presetCategories.length; idx++) {
    const cat = presetCategories[idx];
    const nameOnly = cat.name.replace(/^[^\s]+\s/, '');
    const iconMatch = cat.name.match(/^([^\s]+)/);
    const icon = iconMatch ? iconMatch[1] : '✨';
    
    const catId = categoryIdByIndex[idx] || nameOnly.replace(/[^\w]/g, '-').toLowerCase();
    
    builtinCategories.push({
      id: catId,
      name: nameOnly,
      icon: icon,
      type: 'preset',
      order: order++,
      file: catId + '.json'
    });
  }
}

builtinCategories.push({
  id: 'exit',
  name: '出场动画',
  icon: '↑',
  type: 'out',
  order: 99,
  file: 'exit.json'
});

const indexData = {
  version: '1.0.0',
  name: '字漫画动画插件库',
  description: '字漫画编辑器动画预设插件系统 - 支持AI生成动画插件',
  pluginFormat: 'animation-preset-v1',
  categories: builtinCategories,
  customPlugins: []
};

fs.writeFileSync(path.join(__dirname, 'index.json'), JSON.stringify(indexData, null, 2), 'utf8');
console.log('生成 index.json');

const presetAnims = animEffects.preset || [];
const presetAnimValueSet = new Set(presetAnims.map(a => a.value));

function getAnimsByValueList(valueList) {
  const result = [];
  for (const value of valueList) {
    const found = presetAnims.find(a => a.value === value);
    if (found) {
      result.push(found);
    }
  }
  return result;
}

function writeCategoryPlugin(catId, catName, catIcon, catType, anims) {
  const pluginData = {
    format: 'animation-preset-v1',
    id: catId,
    name: catName,
    description: `${catName}预设`,
    author: '字漫画内置',
    version: '1.0.0',
    category: catType,
    categoryName: catName,
    icon: catIcon,
    animations: []
  };
  
  for (const anim of anims) {
    pluginData.animations.push(buildAnimationObject(anim, catType, catName));
  }
  
  const fileName = catId + '.json';
  fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(pluginData, null, 2), 'utf8');
  console.log(`生成 ${fileName}: ${pluginData.animations.length} 个动画`);
  return pluginData;
}

writeCategoryPlugin('entrance', '入场动画', '↓', 'in', animEffects.in || []);

if (presetCategories) {
  for (let idx = 0; idx < presetCategories.length; idx++) {
    const cat = presetCategories[idx];
    const nameOnly = cat.name.replace(/^[^\s]+\s/, '');
    const iconMatch = cat.name.match(/^([^\s]+)/);
    const icon = iconMatch ? iconMatch[1] : '✨';
    
    const catId = categoryIdByIndex[idx] || nameOnly.replace(/[^\w]/g, '-').toLowerCase();
    
    const anims = getAnimsByValueList(cat.animes);
    writeCategoryPlugin(catId, nameOnly, icon, 'preset', anims);
  }
}

writeCategoryPlugin('exit', '出场动画', '↑', 'out', animEffects.out || []);

if (animEffects.weight && animEffects.weight.length > 0) {
  writeCategoryPlugin('weight', '字重动画', '⚖️', 'weight', animEffects.weight);
}

if (animEffects.path && animEffects.path.length > 0) {
  writeCategoryPlugin('path', '路径动画', '🛤️', 'path', animEffects.path);
}

console.log('\n全部完成！');
