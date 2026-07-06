# T2 — 产品解析型（Specs-driven）

**原型**：黄瓜详情页
**配色**：纯白 `#FFF` + 浅灰卡片 `#F5F5F5` + 黑色文字 `#1A1A1A` + 产品原色点缀
**字体**：OPPO Sans / 苹方 Heavy（标题）+ 思源黑体 Light（正文）
**叙事**：看 / 闻 / 挑 / 做

## 区块结构

```
s1-hero          满屏主图 + 居中标题 + 3 标签
s2-feature-1     单图卖点（鲜嫩多汁）
s3-dual-identity 双重身份 2 列（亦果亦蔬）
s4-feature-2     单图卖点（香味浓郁）
s5-selection     挑选方式 2x2 网格
s6-recipe-1      菜谱卡 1
s6-recipe-2      菜谱卡 2
```

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
  body{font-family:-apple-system,"PingFang SC","HarmonyOS Sans","Source Han Sans",sans-serif;background:#fff;color:#1a1a1a;line-height:1.8}
  .page{max-width:800px;margin:0 auto;background:#fff}
  .toolbar{position:sticky;top:0;z-index:99;background:#1a1a1a;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center}
  .toolbar button{background:#fff;color:#1a1a1a;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
  section{padding:48px 20px;position:relative}
  section img{max-width:100%;display:block;border-radius:12px}

  /* s1 hero */
  .s1-hero{padding:0;text-align:center;position:relative;overflow:hidden}
  .s1-hero .img-wrap{position:relative;aspect-ratio:4/3;overflow:hidden}
  .s1-hero .img-wrap img{width:100%;height:100%;object-fit:cover}
  .s1-hero h1{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:72px;font-weight:900;letter-spacing:.5em;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,.3);margin-left:.5em}
  .s1-hero .tags{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);display:flex;gap:8px;font-size:13px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5)}
  .s1-hero .tags span{padding:4px 0}
  .s1-hero .tags .sep{color:rgba(255,255,255,.6)}

  /* s2 s4 single feature */
  .s-feature h2{text-align:center;font-size:28px;letter-spacing:.5em;font-weight:600;margin-bottom:32px;text-indent:.5em}
  .s-feature h2::before,.s-feature h2::after{content:"— ";color:#999}
  .s-feature p{text-align:center;color:#666;font-size:14px;margin:20px 0;line-height:2}
  .s-feature img{aspect-ratio:16/9;object-fit:cover}

  /* s3 dual identity */
  .s3-dual-identity h2{text-align:center;font-size:28px;letter-spacing:.5em;font-weight:600;margin-bottom:8px}
  .s3-dual-identity .sub{text-align:center;color:#666;font-size:14px;margin-bottom:32px;line-height:2}
  .dual-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .dual-grid .item img{aspect-ratio:1/1;object-fit:cover}
  .dual-grid .item h4{text-align:center;font-size:15px;font-weight:600;margin:12px 0 4px}
  .dual-grid .item p{text-align:center;font-size:12px;color:#888}

  /* s5 selection 2x2 */
  .s5-selection h2{text-align:center;font-size:28px;letter-spacing:.5em;font-weight:600;margin-bottom:32px;text-indent:.5em}
  .s5-selection h2::before,.s5-selection h2::after{content:"— ";color:#999}
  .sel-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .sel-grid .item img{aspect-ratio:1/1;object-fit:cover;border-radius:50%;width:140px;height:140px;margin:0 auto}
  .sel-grid .item h4{text-align:center;font-size:16px;font-weight:600;margin:12px 0 4px}
  .sel-grid .item p{text-align:center;font-size:12px;color:#888;line-height:1.6}

  /* s6 recipe */
  .s-recipe{background:#f5f5f5;border-radius:12px;padding:24px;margin-bottom:16px}
  .s-recipe h3{font-size:20px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px}
  .s-recipe h3::before{content:"";width:4px;height:18px;background:#1a1a1a;border-radius:2px}
  .s-recipe .ingredients{font-size:13px;color:#666;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed #ccc}
  .s-recipe .ingredients::before{content:"食材：";font-weight:600;color:#1a1a1a}
  .s-recipe ol{font-size:13px;color:#444;padding-left:20px;line-height:2}
  .s-recipe img{width:100%;aspect-ratio:16/9;object-fit:cover;margin-top:16px}

  @media(max-width:600px){
    .s1-hero h1{font-size:48px;letter-spacing:.3em}
    .dual-grid,.sel-grid{grid-template-columns:1fr 1fr;gap:12px}
    .sel-grid .item img{width:120px;height:120px}
  }
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="exportAll()">📦 导出全部模块</button>
  <span style="font-size:12px;opacity:.7">文字可编辑 · 图片可替换</span>
</div>
<div class="page">

  <section class="s1-hero" data-section="s1-hero" data-section-name="Hero 主图">
    <div class="img-wrap">
      <img src="assets/hero.jpg" alt="{{产品名}}主图">
      <h1>黄 瓜</h1>
      <div class="tags">
        <span>原汁原味</span><span class="sep">│</span>
        <span>清脆爽口</span><span class="sep">│</span>
        <span>唇齿留香</span>
      </div>
    </div>
  </section>

  <section class="s-feature" data-section="s2-feature-1" data-section-name="卖点 鲜嫩多汁">
    <h2>鲜 嫩 多 汁</h2>
    <img src="assets/feature-1.jpg" alt="鲜嫩多汁">
  </section>

  <section class="s3-dual-identity" data-section="s3-dual-identity" data-section-name="双重身份">
    <h2>亦 果 亦 蔬</h2>
    <p class="sub">每一根品质甄选<br>每一口都让你味蕾绽放</p>
    <div class="dual-grid">
      <div class="item">
        <img src="assets/dual-1.jpg" alt="口感">
        <h4>口感清新香脆</h4>
        <p>生熟味道都保鲜美味</p>
      </div>
      <div class="item">
        <img src="assets/dual-2.jpg" alt="外观">
        <h4>精挑细选</h4>
        <p>瓜条匀称美观</p>
      </div>
    </div>
  </section>

  <section class="s-feature" data-section="s4-feature-2" data-section-name="卖点 香味浓郁">
    <h2>香 味 浓 郁</h2>
    <img src="assets/feature-2.jpg" alt="香味浓郁">
    <p>自然成熟 · 遇上好菜<br>每一口都是家的味道</p>
  </section>

  <section class="s5-selection" data-section="s5-selection" data-section-name="挑选方式">
    <h2>挑 选 方 式</h2>
    <div class="sel-grid">
      <div class="item">
        <img src="assets/sel-1.jpg" alt="看颜色">
        <h4>看颜色</h4>
        <p>果肉翠绿带白</p>
      </div>
      <div class="item">
        <img src="assets/sel-2.jpg" alt="看个头">
        <h4>看个头</h4>
        <p>瓜形美观 光泽水润</p>
      </div>
      <div class="item">
        <img src="assets/sel-3.jpg" alt="口感">
        <h4>口感</h4>
        <p>汁水充沛 清甜爽脆</p>
      </div>
      <div class="item">
        <img src="assets/sel-4.jpg" alt="看触感">
        <h4>看触感</h4>
        <p>表面特别光滑的慎选</p>
      </div>
    </div>
  </section>

  <section data-section="s6-recipe" data-section-name="烹饪方式">
    <h2 style="text-align:center;font-size:28px;letter-spacing:.5em;font-weight:600;margin-bottom:32px;text-indent:.5em">
      烹 饪 方 式
    </h2>
    <div class="s-recipe">
      <h3>紫衣黄瓜</h3>
      <img src="assets/recipe-1.jpg" alt="紫衣黄瓜">
      <p class="ingredients">紫皮黄瓜 / 蒜 / 生抽 / 香醋 / 香油</p>
      <ol>
        <li>把蒜料切碎，所有调料混合调成料汁备用</li>
        <li>黄瓜洗净去掉两头，均匀切成一圆后翻到另一面，再竖刀顺切</li>
        <li>切好的装衣衣瓜瓜滴上调好的料汁稍腌即可</li>
      </ol>
    </div>
    <div class="s-recipe">
      <h3>拍黄瓜</h3>
      <img src="assets/recipe-2.jpg" alt="拍黄瓜">
      <p class="ingredients">黄瓜 / 蒜 / 香油 / 生抽 / 糖 / 醋 / 辣椒</p>
      <ol>
        <li>黄瓜洗净，整条用菜刀拍裂开，再切成大段，大蒜剁成蓉</li>
        <li>加陈醋，砂糖，盐，香油，生抽等拌匀即可上桌</li>
      </ol>
    </div>
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

- [ ] 3 个标签：3~4 字短语，用 │ 分隔
- [ ] 2 个单图卖点标题：4 字短语
- [ ] 双重身份副标：2 行，每行 6~10 字
- [ ] 双重身份 2 列：4~6 字标题 + 8~12 字描述
- [ ] 挑选方式 2x2：4 项（看/闻/触/口感），每项 1 标题 + 1 句描述
- [ ] 菜谱：2~3 道，每道含食材 5~8 项 + 步骤 2~4 步
