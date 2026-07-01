# T1 — 产地故事型（Story-driven）

**原型**：新疆圆椰枣小白杏详情页
**配色**：浅色暖调背景 + 深色文字 + 绿色农产品强调 `#2E7D32` + 红色点缀 `#C8161D`
**字体**：思源宋体 Heavy（标题）+ 思源黑体 Regular（正文）+ Roboto Mono（英文标签）
**叙事**：风土 → 匠心 → 真实

## 区块结构（必须全部包含，按顺序）

```
s1-top-tag       顶部小标签
s2-hero          主标 + 主图 + 圆形徽章
s3-origin        2x2 产地画廊（带白色文字浮层）
s4-product-info  产品信息（左图右参）
s5-feature-1     红色强调句 + 描述段 + 图
s5-feature-2     红色强调句 + 描述段 + 图
s5-feature-3     红色强调句 + 描述段 + 图
s5-feature-4     红色强调句 + 描述段 + 图
s5-feature-5     红色强调句 + 描述段 + 多张小图
s6-origin-story  ORIGIN STORY 收尾
```

## 图片尺寸对齐规则（避免拉伸变形）

AI 生成图片的尺寸必须与网页 CSS 的 `aspect-ratio` 一致：

| 图片 | 网页 CSS | AI 生成尺寸 | 说明 |
|---|---|---|---|
| hero.jpg | `aspect-ratio:4/3` | `landscape_4_3` (1152x864) | Hero 主图，完美匹配 |
| origin-1~4.jpg | `.item {aspect-ratio:4/3}` | `landscape_4_3` (1152x864) | 产地画廊 2x2 网格 |
| info-1.jpg | 120x120 正方形 | `square_hd` (1024x1024) | 产品信息配图 |
| feature-1~4.jpg | 无固定比例，自然宽度 | `landscape_16_9` (1280x720) | 卖点配图，横版展示 |
| usage-1~4.jpg | `.gallery {grid 2x2}` | `square_hd` (1024x1024) | 吃法 2x2 网格 |
| story-circle.jpg | `.circle {160x160}` | `square_hd` (1024x1024) | 圆形裁剪，正方形原图无变形 |

## HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{产品名}} · 详情页</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,"PingFang SC","Source Han Sans","Noto Sans CJK SC",sans-serif;background:#FAF8F5;color:#2C2C2C;line-height:1.8}
  .page{max-width:800px;margin:0 auto;background:#FAF8F5}
  .toolbar{position:sticky;top:0;z-index:99;background:#fff;color:#333;padding:10px 14px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #e0e0e0}
  .toolbar button{background:#2E7D32;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px}
  section{padding:40px 20px;position:relative}
  section img{max-width:100%;display:block;border-radius:8px}

  /* s1 top tag */
  .s1-top-tag{text-align:center;padding:24px 20px;font-size:11px;letter-spacing:.4em;color:#999;text-transform:uppercase}

  /* s2 hero */
  .s2-hero{text-align:center;padding:0 0 40px}
  .s2-hero h1{font-family:"Source Han Serif","Noto Serif CJK SC",serif;font-size:48px;font-weight:900;letter-spacing:.2em;line-height:1.4;margin:24px 0;color:#2C2C2C}
  .s2-hero .badge{position:absolute;top:20px;right:20px;width:90px;height:90px;border:2px solid #2E7D32;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:"Source Han Serif",serif;font-size:13px;color:#2E7D32;background:rgba(46,125,50,.08);transform:rotate(-8deg)}
  .s2-hero img{aspect-ratio:4/3;object-fit:cover;width:100%}

  /* s3 origin gallery */
  .s3-origin h2{text-align:center;font-size:32px;letter-spacing:.3em;margin-bottom:32px;color:#2C2C2C}
  .gallery{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .gallery .item{position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:6px}
  .gallery .item img{width:100%;height:100%;object-fit:cover}
  .gallery .item .label{position:absolute;bottom:0;left:0;right:0;padding:12px;background:linear-gradient(transparent,rgba(0,0,0,.8));color:#fff;font-size:13px}

  /* s4 product info */
  .s4-product-info{background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:24px;display:grid;grid-template-columns:120px 1fr;gap:16px;align-items:center}
  .s4-product-info h3{font-size:14px;letter-spacing:.3em;color:#2E7D32;margin-bottom:12px}
  .s4-product-info dl{display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:13px}
  .s4-product-info dt{color:#999}
  .s4-product-info dd{color:#2C2C2C}

  /* s5 features */
  .s5-feature{padding:48px 20px}
  .s5-feature h3{color:#c8161d;font-size:28px;font-weight:900;line-height:1.4;margin-bottom:16px;letter-spacing:.05em}
  .s5-feature p{color:#555;font-size:14px;margin-bottom:20px}
  .s5-feature .quote{background:#f0f7f0;border-left:3px solid #2E7D32;padding:16px 20px;margin:20px 0;font-family:"Source Han Serif",serif;color:#2C2C2C}

  /* s6 origin story */
  .s6-origin-story{text-align:center;background:#f5f0e8;padding:60px 20px}
  .s6-origin-story h2{font-family:"Source Han Serif",serif;font-size:36px;letter-spacing:.3em;margin-bottom:24px;color:#2C2C2C}
  .s6-origin-story .en{font-family:monospace;letter-spacing:.5em;color:#2E7D32;font-size:14px;margin-bottom:24px}
  .s6-origin-story p{color:#666;font-size:14px;max-width:600px;margin:0 auto 24px;line-height:2}
  .s6-origin-story .circle{width:160px;height:160px;border-radius:50%;overflow:hidden;margin:0 auto;border:2px solid #2E7D32}

  /* edit mode */
  body.edit-mode [contenteditable="true"]{outline:1px dashed #2E7D32;outline-offset:2px;cursor:text}
  body.edit-mode [contenteditable="true"]:focus{outline:2px solid #2E7D32;outline-offset:2px;background:rgba(46,125,50,.05)}
  body.edit-mode img{cursor:pointer;outline:2px dashed #2E7D32;outline-offset:2px;transition:outline .2s}
  body.edit-mode img:hover{outline:3px solid #2E7D32}
  body.edit-mode .circle{cursor:pointer;outline:2px dashed #2E7D32;outline-offset:2px}
  body.edit-mode .circle:hover{outline:3px solid #2E7D32}

  @media(max-width:600px){
    .s2-hero h1{font-size:32px}
    .s3-origin h2{font-size:22px}
    .gallery{grid-template-columns:1fr 1fr}
    .s4-product-info{grid-template-columns:1fr}
  }
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="exportAll()">📦 导出全部模块</button>
  <button onclick="toggleEdit()" id="editBtn" style="background:#666;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px">✏️ 编辑</button>
  <span style="font-size:12px;opacity:.7">文字可编辑 · 图片可替换</span>
</div>
<div class="page">

  <section class="s1-top-tag" data-section="s1-top-tag" data-section-name="顶部标签">蜜杏青涩 · 认知甘愿</section>

  <section class="s2-hero" data-section="s2-hero" data-section-name="Hero 主图">
    <h1>新 疆 圆 椰 枣<br>小 白 杏</h1>
    <div class="badge">树上<br>自然熟</div>
    <img src="assets/hero.jpg" alt="新疆小白杏主图">
  </section>

  <section class="s3-origin" data-section="s3-origin" data-section-name="产地画廊">
    <h2>来 自 大 漠 戈 壁<br>凝 聚 日 夜 精 华</h2>
    <div class="gallery">
      <div class="item"><img src="assets/origin-1.jpg" alt="产地1"><div class="label">天山脚下 北纬 42°</div></div>
      <div class="item"><img src="assets/origin-2.jpg" alt="产地2"><div class="label">昼夜温差 15°C</div></div>
      <div class="item"><img src="assets/origin-3.jpg" alt="产地3"><div class="label">雪水灌溉 0 污染</div></div>
      <div class="item"><img src="assets/origin-4.jpg" alt="产地4"><div class="label">年日照 2800h</div></div>
    </div>
  </section>

  <section class="s4-product-info" data-section="s4-product-info" data-section-name="产品信息">
    <img src="assets/info-1.jpg" alt="产品细节">
    <div>
      <h3>产 品 信 息</h3>
      <dl>
        <dt>产品名</dt><dd>新疆圆椰枣小白杏</dd>
        <dt>口感</dt><dd>皮薄肉厚 甘甜多汁</dd>
        <dt>产地</dt><dd>新疆阿克苏</dd>
        <dt>规格</dt><dd>500g / 礼盒装</dd>
        <dt>储存</dt><dd>0~4°C 冷藏</dd>
        <dt>赏味期</dt><dd>收货后 5 天内</dd>
      </dl>
    </div>
  </section>

  <section class="s5-feature" data-section="s5-feature-1" data-section-name="卖点 1">
    <h3>■ 外形似白玉凝脂，<br>　 圆润娇俏</h3>
    <p>描述段……</p>
    <img src="assets/feature-1.jpg" alt="卖点1配图">
  </section>

  <section class="s5-feature" data-section="s5-feature-2" data-section-name="卖点 2">
    <h3>■ 果肉如凝乳软绵，<br>　 细腻可口</h3>
    <img src="assets/feature-2.jpg" alt="卖点2配图">
  </section>

  <section class="s5-feature" data-section="s5-feature-3" data-section-name="卖点 3">
    <h3>■ 坚持树上自然熟采摘</h3>
    <div class="quote">树上的杏是主角，<br>取代过早透支其味</div>
    <img src="assets/feature-3.jpg" alt="卖点3配图">
  </section>

  <section class="s5-feature" data-section="s5-feature-4" data-section-name="卖点 4">
    <h3>■ 每日甜蜜加持，<br>　 优质由内而外</h3>
    <img src="assets/feature-4.jpg" alt="卖点4配图">
  </section>

  <section class="s5-feature" data-section="s5-feature-5" data-section-name="卖点 5">
    <h3>■ 每一颗杏子<br>　 都是百变大咖</h3>
    <p>可鲜食、可入菜、可制酱……</p>
    <div class="gallery">
      <img src="assets/usage-1.jpg" alt="吃法1">
      <img src="assets/usage-2.jpg" alt="吃法2">
      <img src="assets/usage-3.jpg" alt="吃法3">
      <img src="assets/usage-4.jpg" alt="吃法4">
    </div>
  </section>

  <section class="s6-origin-story" data-section="s6-origin-story" data-section-name="ORIGIN STORY 收尾">
    <h2>努 力 所 在<br>真 实 呈 现</h2>
    <div class="en">ORIGIN STORY</div>
    <p>散文段……产地故事、工艺、匠心……</p>
    <div class="circle"><img src="assets/story-circle.jpg" alt="圆形产品图" style="width:100%;height:100%;object-fit:cover"></div>
  </section>

</div>

<script>
function toggleEdit(){
  const editable = document.body.classList.toggle('edit-mode');
  document.getElementById('editBtn').textContent = editable ? '🔒 预览' : '✏️ 编辑';
  document.querySelectorAll('h1,h2,h3,p,span,dt,dd,.quote,.label,.badge,.s1-top-tag,.en').forEach(el=>{
    el.contentEditable = editable ? 'true' : 'false';
  });
  // 图片编辑：编辑模式下点击图片可替换
  document.querySelectorAll('img,.circle').forEach(el=>{
    if(editable){
      el.addEventListener('click', handleImgClick);
    }else{
      el.removeEventListener('click', handleImgClick);
    }
  });
}

function handleImgClick(e){
  e.preventDefault();
  e.stopPropagation();
  var target = e.target;
  if(target.tagName.toLowerCase() !== 'img') target = target.querySelector('img');
  if(!target) return;
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(ev){
    var file = ev.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(evt){
      target.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
</script>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script>
async function exportAll(){
  const sections = document.querySelectorAll('[data-section]');
  const zip = new JSZip();
  for(const s of sections){
    const name = s.dataset.sectionName || s.dataset.section;
    const canvas = await html2canvas(s, {backgroundColor: null, scale: 2});
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

- [ ] 顶部小标签：1 句 8~16 字的氛围短语
- [ ] 主标题：产品名 4~8 字，可分行
- [ ] 徽章：2~4 字短句
- [ ] 产地画廊：4 个产地亮点数据
- [ ] 产品信息：6 项参数
- [ ] 5 条卖点：每条 1 句红色强调 + 1 段描述 + 1 张配图
- [ ] ORIGIN STORY：1 段 100~200 字散文
