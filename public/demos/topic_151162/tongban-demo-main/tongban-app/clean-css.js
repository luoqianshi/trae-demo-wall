const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'www', 'index.html');
let content = fs.readFileSync(htmlPath, 'utf-8');

// 找到 style 标签内容
const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
if (styleMatch) {
    let styleContent = styleMatch[1];
    
    // 移除所有和模拟器相关的 CSS
    const patterns = [
        // 带注释的
        /\/\*\s*页面标题\s*\*\/[^}]*\}/g,
        /\/\*\s*手机模拟器框架\s*\*\/[^}]*\}/g,
        /\/\*\s*状态栏\s*\*\/[^}]*\}/g,
        /\/\*\s*手机震动动画\s*\*\/[^}]*\}/g,
        /\/\*\s*Home Indicator\s*\*\/[^}]*\}/g,
        // 各种 class
        /\.page-title\s*\{[^}]*\}/g,
        /\.phone-wrapper\s*\{[^}]*\}/g,
        /\.phone-frame\s*\{[^}]*\}/g,
        /\.phone-frame\.shaking\s*\{[^}]*\}/g,
        /\.phone-screen\s*\{[^}]*\}/g,
        /\.status-bar\s*\{[^}]*\}/g,
        /\.status-bar\s*\.\w+\s*\{[^}]*\}/g,
        /\.status-bar\s+\.\w+\s*\{[^}]*\}/g,
        /\.status-bar\s+\w+\s*\{[^}]*\}/g,
        /\.home-indicator\s*\{[^}]*\}/g,
        // @keyframes shake
        /@keyframes\s+shake\s*\{[^}]*\}/g,
        /@keyframes\s+fadeIn\s*\{[^}]*\}/g,
    ];
    
    let removed = 0;
    patterns.forEach(pattern => {
        const before = styleContent.length;
        styleContent = styleContent.replace(pattern, '');
        if (styleContent.length < before) removed++;
    });
    
    console.log(`移除了 ${removed} 组模拟器相关 CSS`);
    
    content = content.replace(styleMatch[0], `<style>${styleContent}</style>`);
}

fs.writeFileSync(htmlPath, content, 'utf-8');
console.log('✅ CSS 清理完成');
