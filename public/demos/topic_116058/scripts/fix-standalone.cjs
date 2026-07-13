// 构建后处理：让单文件 HTML 可以直接用 file:// 协议打开
// 核心问题：<script type="module"> 在 file:// 协议下被浏览器阻止
// 解决方案：移除 type="module"，转义 </script>，包裹 DOMContentLoaded
//
// 注意：页面可能有两个 <script> 标签（主JS + traeBadgePlugin），
// 必须只处理主 JS 的 <script type="module" crossorigin> 标签，
// 用 indexOf 找到它的闭合标签（第一个 </script>），不能用 lastIndexOf

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');

let html = fs.readFileSync(htmlPath, 'utf-8');

// Step 1: 定位主 JS 的 <script type="module" crossorigin> 标签
const moduleTag = '<script type="module" crossorigin>';
const scriptTagStart = html.indexOf(moduleTag);
if (scriptTagStart === -1) {
  console.log('⚠️ 未找到 <script type="module"> 标签，跳过处理');
} else {
  // 找到开标签的 '>' 位置
  const tagContentStart = html.indexOf('>', scriptTagStart) + 1;
  // 用 indexOf 找到第一个 </script>（主JS的闭合标签），不是 lastIndexOf
  const scriptClose = html.indexOf('</script>', tagContentStart);

  if (scriptClose !== -1) {
    // 提取主 JS 的内容
    let jsContent = html.slice(tagContentStart, scriptClose);

    // 转义 JS 代码中的 </script> 防止浏览器提前关闭标签
    // 在 JS 字符串中 <\/script> 等价于 </script> 但不会被 HTML 解析器识别
    jsContent = jsContent.replace(/<\/script/gi, '<\\/script');

    // 替换原始的 script 标签：移除 type="module" crossorigin，包裹 DOMContentLoaded
    const before = html.slice(0, scriptTagStart);
    const after = html.slice(scriptClose + '</script>'.length);

    // 构建新的 script 块
    const newScript = `<script>
document.addEventListener('DOMContentLoaded', function() {
${jsContent}
});
</script>`;

    html = before + newScript + after;
  }
}

// Step 2: 内联 favicon 为 data URI（file:// 协议下外部资源加载不稳定）
if (fs.existsSync(faviconPath)) {
  const faviconSvg = fs.readFileSync(faviconPath, 'utf-8');
  const encoded = encodeURIComponent(faviconSvg);
  const dataUri = `data:image/svg+xml,${encoded}`;
  html = html.replace(/<link[^>]*rel="icon"[^>]*>/, () => {
    return `<link rel="icon" type="image/svg+xml" href="${dataUri}" />`;
  });
}

// Step 3: 移除 Google Fonts @import（离线环境下无法加载，会导致延迟）
html = html.replace(/@import\s*"https:\/\/fonts\.googleapis\.com[^"]*";?\s*/g, '');

fs.writeFileSync(htmlPath, html);
console.log('✅ 已修复 standalone HTML，可直接双击打开');
