# T4 — 杂志大片型（Editorial Magazine）

**灵感**：Kinfolk / Cereal / Wallpaper 生活方式杂志
**配色**：纯白 `#FFFFFF` + 米色 `#F5F1E8` + 墨黑 `#1A1A1A` + 产品原色 1 处点缀
**字体**：思源宋体 Heavy（中文主标）+ Playfair Display Italic（英文副标）+ Roboto Mono（刊号）
**叙事**：文字本身是视觉、图 ≤ 30%、大量负白

## 区块结构

```
s1-issue         刊号
s2-main-title    巨型主标（80~120px）
s3-asymmetric    不对称图文
s4-origin-quote  产地 + 巨型引文
s5-flavor        风味 + 不对称双图 + 巨型数据
s6-table         餐桌 + 散文化小标
s7-outro         收尾大引文
```

## HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{产品名}} · 寻果记</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600&family=Noto+Serif+SC:wght@400;700;900&family=Roboto+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Noto Serif SC","Source Han Serif",serif;background:#fff;color:#1a1a1a;line-height:1.8}
  .page{max-width:800px;margin:0 auto;background:#fff;padding-bottom:80px}
  .toolbar{position:sticky;top:0;z-index:99;background:#1a1a1a;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center;font-family:sans-serif}
  .toolbar button{background:#fff;color:#1a1a1a;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
  section{padding:60px 32px;position:relative}
  section img{max-width:100%;display:block}

  /* s1 issue */
  .s1-issue{text-align:center;padding:48px 20px 24px;font-family:"Roboto Mono",monospace;font-size:11px;letter-spacing:.4em;color:#999}
  .s1-issue::after{content:"";display:block;width:60px;height:1px;background:#1a1a1a;margin:24px auto 0}

  /* s2 main title */
  .s2-main-title{text-align:left;padding:40px 32px 60px}
  .s2-main-title h1{font-family:"Noto Serif SC",serif;font-size:96px;font-weight:900;line-height:1.1;letter-spacing:.1em;color:#1a1a1a}
  .s2-main-title h1 span{display:block}
  .s2-main-title .en{font-family:"Playfair Display",serif;font-style:italic;font-size:18px;color:#999;letter-spacing:.3em;margin-top:24px}

  /* s3 asymmetric */
  .s3-asymmetric{display:grid;grid-template-columns:1fr 2fr;gap:32px;align-items:start}
  .s3-asymmetric img{width:100%;aspect-ratio:3/4;object-fit:cover}
  .s3-asymmetric p{font-size:14px;color:#444;line-height:2;padding-top:20px;text-align:justify}

  /* s4 origin + quote */
  .s4-origin .label{font-family:"Roboto Mono",monospace;font-size:11px;letter-spacing:.4em;color:#999;margin-bottom:32px}
  .s4-origin .quote{font-family:"Playfair Display","Noto Serif SC",serif;font-style:italic;font-size:42px;line-height:1.4;color:#1a1a1a;margin:32px 0;font-weight:400}
  .s4-origin img{width:100%;aspect-ratio:16/9;object-fit:cover;margin:32px 0}
  .s4-origin p{font-size:14px;line-height:2.2;color:#444;text-align:justify;text-indent:2em}

  /* s5 flavor */
  .s5-flavor .label{font-family:"Roboto Mono",monospace;font-size:11px;letter-spacing:.4em;color:#999;margin-bottom:32px}
  .s5-flavor .duo{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:32px 0}
  .s5-flavor .duo img{width:100%;aspect-ratio:3/4;object-fit:cover}
  .s5-flavor .duo .cap{font-size:13px;color:#666;margin-top:12px;text-align:center;letter-spacing:.1em}
  .s5-flavor .stat{text-align:center;margin:60px 0;padding:40px 0;border-top:1px solid #e8e8e8;border-bottom:1px solid #e8e8e8}
  .s5-flavor .stat .num{font-family:"Roboto Mono",monospace;font-size:96px;font-weight:300;color:#1a1a1a;line-height:1;letter-spacing:-.02em}
  .s5-flavor .stat .unit{font-size:14px;color:#999;letter-spacing:.3em;margin-top:8px}

  /* s6 table */
  .s6-table .label{font-family:"Roboto Mono",monospace;font-size:11px;letter-spacing:.4em;color:#999;margin-bottom:32px}
  .s6-table .poem{font-family:"Noto Serif SC",serif;font-size:32px;font-weight:400;line-height:1.8;color:#1a1a1a;margin:32px 0;letter-spacing:.2em}
  .s6-table .poem span{display:block;text-indent:1em}
  .s6-table img{width:100%;aspect-ratio:21/9;object-fit:cover;margin:32px 0}
  .s6-table ul{list-style:none;display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-top:24px}
  .s6-table ul li{font-size:13px;color:#666;letter-spacing:.1em;position:relative;padding-left:16px}
  .s6-table ul li::before{content:"·";position:absolute;left:0;color:#c8a96a}

  /* s7 outro */
  .s7-outro{text-align:center;padding:80px 32px}
  .s7-outro .big-quote{font-family:"Noto Serif SC",serif;font-size:24px;font-weight:700;line-height:2;color:#1a1a1a;letter-spacing:.4em;margin-bottom:32px}

  @media(max-width:600px){
    .s2-main-title h1{font-size:48px}
    .s3-asymmetric{grid-template-columns:1fr}
    .s4-origin .quote{font-size:28px}
    .s5-flavor .stat .num{font-size:64px}
    .s6-table .poem{font-size:22px}
  }
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="exportAll()">📦 导出全部模块</button>
  <span style="font-size:12px;opacity:.7;font-family:sans-serif">文字可编辑 · 图片可替换</span>
</div>
<div class="page">

  <section class="s1-issue" data-section="s1-issue" data-section-name="刊号">
    ISSUE 01 ／ FRESH ／ 2026
  </section>

  <section class="s2-main-title" data-section="s2-main-title" data-section-name="巨型主标">
    <h1>
      <span>寻</span>
      <span>一只</span>
      <span>好桃</span>
    </h1>
    <div class="en">— a good peach —</div>
  </section>

  <section class="s3-asymmetric" data-section="s3-asymmetric" data-section-name="不对称图文">
    <img src="assets/asymmetric.jpg" alt="产品特写">
    <p>产于山东蒙阴，海拔 600 米山间。沙土孕育，温差淬炼，凝聚一整季的阳光与风。我们寻找的，不只是甜的果实，而是「值得被讲述」的风物。</p>
  </section>

  <section class="s4-origin" data-section="s4-origin" data-section-name="产地引文">
    <div class="label">— 01 ／ ORIGIN —</div>
    <div class="quote">"每一颗果实，<br>都来自一片风土的耐心。"</div>
    <img src="assets/origin.jpg" alt="产地">
    <p>散文段。山东蒙阴，中国桃乡，土壤 pH 值 5.5~6.5，年均日照 2400 小时，昼夜温差 12°C，每一颗果实都凝聚了一整个春夏的呼吸。我们坚持树熟采摘，只取最佳状态的八分熟，让桃子在枝头完成最后的糖分转化，再以最快速度送达你手中。</p>
  </section>

  <section class="s5-flavor" data-section="s5-flavor" data-section-name="风味数据">
    <div class="label">— 02 ／ FLAVOR —</div>
    <div class="duo">
      <div><img src="assets/flavor-1.jpg" alt="整果"><div class="cap">爽 脆 多 汁</div></div>
      <div><img src="assets/flavor-2.jpg" alt="切面"><div class="cap">汁 水 丰 盈</div></div>
    </div>
    <div class="stat">
      <div class="num">13.5</div>
      <div class="unit">° B R I X ／ 糖 度 实 测</div>
    </div>
  </section>

  <section class="s6-table" data-section="s6-table" data-section-name="餐桌场景">
    <div class="label">— 03 ／ ON THE TABLE —</div>
    <div class="poem">
      <span>早 上 ，</span>
      <span>一 颗 桃 ，</span>
      <span>就 是 一 顿 早 餐 。</span>
    </div>
    <img src="assets/table.jpg" alt="餐桌">
    <ul>
      <li>燕麦杯</li>
      <li>蜜桃挞</li>
      <li>冰沙</li>
      <li>沙拉</li>
    </ul>
  </section>

  <section class="s7-outro" data-section="s7-outro" data-section-name="收尾大引文">
    <div class="big-quote">「 食 之 有 物 ， 不 负 山 川 」</div>
  </section>

</div>

<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script>
async function exportAll(){
  const sections = document.querySelectorAll('[data-section]');
  const zip = new JSZip();
  for(const s of sections){
    const name = s.dataset.sectionName || s.dataset.section;
    const canvas = await html2canvas(s, {backgroundColor: '#ffffff', scale: 2});
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    zip.file(`${name}.png`, blob);
  }
  const out = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(out);
  a.download = '{{产品名}}-modules.zip';
  a.click();
}
</script>
</body>
</html>
```

## 内容填写 checklist

- [ ] 刊号：ISSUE 编号 / 主题 / 年份
- [ ] 巨型主标：3~4 行短句，单字 96px
- [ ] 不对称图文：左图右文，散文 60~80 字
- [ ] 产地引文：1 句引文 20~30 字 + 1 段散文 100~150 字
- [ ] 风味双图 + 巨型数据：1 个核心数字（糖度 / 重量 / 海拔）
- [ ] 餐桌散文化小标：3 行短句
- [ ] 收尾大引文：1 句 8~12 字（仅保留引文本身，无刊号签名）
