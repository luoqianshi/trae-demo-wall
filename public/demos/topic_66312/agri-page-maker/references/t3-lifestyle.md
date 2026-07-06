# T3 — 场景使用型（Lifestyle-driven）

**原型**：国产脆蜜桃详情页
**配色**：暖色水果色 + 米白 `#FAF7F2` + 浅灰信息卡 `#F0F0F0` + 墨黑 `#2A2A2A`
**字体**：阿里巴巴普惠体 Heavy（标题）+ 思源黑体 Regular（正文）
**叙事**：信息 + 产地 + 吃法 + 提示 完整闭环

## 区块结构

```
s1-hero          满屏主图 + 横向标题 + 3 标签
s2-description   产品描述（大图 + 副标 + 段）
s3-visual        视觉特征 2x2 图文
s4-product-info  产品信息表（左标签右值）
s5-origin        产地介绍（大图 + 引号标题 + 段）
s6-usage         更多吃法 2 列
s7-tips          温馨提示（背景图 + 渐变遮罩）
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
  body{font-family:-apple-system,"PingFang SC","Alibaba PuHuiTi","Source Han Sans",sans-serif;background:#faf7f2;color:#2a2a2a;line-height:1.7}
  .page{max-width:800px;margin:0 auto;background:#faf7f2}
  .toolbar{position:sticky;top:0;z-index:99;background:#2a2a2a;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center}
  .toolbar button{background:#fff;color:#2a2a2a;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
  section{padding:40px 20px}
  section img{max-width:100%;display:block;border-radius:8px}

  /* 统一小标题样式：左右带短横线 */
  .h-title{text-align:center;font-size:22px;font-weight:700;letter-spacing:.3em;margin-bottom:32px;text-indent:.3em;color:#2a2a2a}
  .h-title::before,.h-title::after{content:" — ";color:#c8a96a;letter-spacing:0}

  /* s1 hero */
  .s1-hero{padding:0;text-align:center;position:relative;overflow:hidden;background:#fff}
  .s1-hero .img-wrap{position:relative;aspect-ratio:4/3;overflow:hidden}
  .s1-hero .img-wrap img{width:100%;height:100%;object-fit:cover}
  .s1-hero h1{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:56px;font-weight:900;letter-spacing:.15em;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,.3);white-space:nowrap}
  .s1-hero .tags{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);display:flex;gap:8px;font-size:13px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5)}
  .s1-hero .tags .sep{color:rgba(255,255,255,.6)}

  /* s2 description */
  .s2-description img{width:100%;aspect-ratio:16/9;object-fit:cover;margin-bottom:24px}
  .s2-description .lead{text-align:center;font-size:18px;font-weight:700;color:#2a2a2a;margin-bottom:12px;line-height:1.6}
  .s2-description p{font-size:14px;color:#555;text-align:center;line-height:2;max-width:600px;margin:0 auto}

  /* s3 visual features */
  .visual-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .visual-grid .item{position:relative;aspect-ratio:1/1;overflow:hidden;border-radius:8px}
  .visual-grid .item img{width:100%;height:100%;object-fit:cover}
  .visual-grid .item p{position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent,rgba(0,0,0,.7));color:#fff;font-size:13px;text-align:center;margin:0}

  /* s4 product info */
  .s4-product-info{background:#fff;border-radius:12px;padding:24px;display:grid;grid-template-columns:1fr 120px;gap:20px;align-items:center}
  .s4-product-info dl{display:grid;grid-template-columns:80px 1fr;gap:12px 16px}
  .s4-product-info dt{color:#888;font-size:13px;padding:8px 0;border-bottom:1px solid #f0f0f0}
  .s4-product-info dd{font-size:14px;color:#2a2a2a;padding:8px 0;border-bottom:1px solid #f0f0f0}

  /* s5 origin */
  .s5-origin img{width:100%;aspect-ratio:21/9;object-fit:cover;margin-bottom:24px}
  .s5-origin .quote-title{text-align:center;font-family:"Source Han Serif","Noto Serif CJK SC",serif;font-size:24px;color:#2a2a2a;margin-bottom:24px;letter-spacing:.1em}
  .s5-origin p{text-align:center;font-size:14px;color:#555;line-height:2;max-width:600px;margin:0 auto}

  /* s6 usage */
  .usage-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .usage-grid .item img{aspect-ratio:1/1;object-fit:cover}
  .usage-grid .item p{font-size:13px;color:#666;text-align:center;margin-top:8px;line-height:1.6}

  /* s7 tips */
  .s7-tips{padding:0;position:relative;overflow:hidden}
  .s7-tips .bg{width:100%;aspect-ratio:16/9;object-fit:cover;filter:blur(2px)}
  .s7-tips .overlay{position:absolute;inset:0;background:linear-gradient(transparent 30%,rgba(0,0,0,.85));display:flex;flex-direction:column;justify-content:flex-end;padding:32px 24px}
  .s7-tips h3{color:#fff;font-size:20px;font-weight:700;margin-bottom:12px}
  .s7-tips p{color:rgba(255,255,255,.85);font-size:14px;line-height:1.8}

  @media(max-width:600px){
    .s1-hero h1{font-size:36px}
    .visual-grid,.usage-grid{grid-template-columns:1fr 1fr}
    .s4-product-info{grid-template-columns:1fr}
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
      <h1>国产脆蜜桃</h1>
      <div class="tags">
        <span>脆嫩可口</span><span class="sep">│</span>
        <span>味美汁多</span><span class="sep">│</span>
        <span>桃香四溢</span>
      </div>
    </div>
  </section>

  <section class="s2-description" data-section="s2-description" data-section-name="产品描述">
    <h2 class="h-title">产 品 描 述</h2>
    <img src="assets/desc.jpg" alt="产品细节">
    <p class="lead">颗颗美味香甜—爽脆可口令人爱不释口！</p>
    <p>国产脆蜜桃，圆润饱满，满蜜绒毛，外表透着一层层红晕，嫩黄色果肉垂涎欲滴，脆甜清甜芳香，十分美味！</p>
  </section>

  <section data-section="s3-visual" data-section-name="视觉特征">
    <h2 class="h-title">视 觉 特 征</h2>
    <div class="visual-grid">
      <div class="item"><img src="assets/visual-1.jpg" alt=""><p>圆润饱满</p></div>
      <div class="item"><img src="assets/visual-2.jpg" alt=""><p>皮薄肉厚</p></div>
      <div class="item"><img src="assets/visual-3.jpg" alt=""><p>爽脆可口 香甜多汁</p></div>
      <div class="item"><img src="assets/visual-4.jpg" alt=""><p>果肉饱满 肉质细腻</p></div>
    </div>
  </section>

  <section data-section="s4-product-info" data-section-name="产品信息">
    <h2 class="h-title">产 品 信 息</h2>
    <div class="s4-product-info">
      <dl>
        <dt>产品名称</dt><dd>国产脆蜜桃</dd>
        <dt>储藏方式</dt><dd>冷藏储存</dd>
        <dt>产品规格</dt><dd>5 斤 / 礼盒装</dd>
        <dt>产品口感</dt><dd>爽脆可口 香甜多汁</dd>
        <dt>产品产地</dt><dd>山东蒙阴</dd>
        <dt>发货时间</dt><dd>48 小时内</dd>
      </dl>
      <img src="assets/package.jpg" alt="包装">
    </div>
  </section>

  <section class="s5-origin" data-section="s5-origin" data-section-name="产地介绍">
    <h2 class="h-title">产 地 介 绍</h2>
    <img src="assets/origin.jpg" alt="产地">
    <h3 class="quote-title">"桃" 的 韵 味 —— 国 产 脆 蜜 桃</h3>
    <p>桃花倒影今犹在，又见硕果挂枝头。来自国产脆蜜桃产地，确保果子新鲜美味，脆甜爽口，每一颗都是饱满的诱惑。</p>
  </section>

  <section data-section="s6-usage" data-section-name="更多吃法">
    <h2 class="h-title">更 多 吃 法</h2>
    <div class="usage-grid">
      <div class="item">
        <img src="assets/usage-1.jpg" alt="吃法1">
        <p>蜜桃燕麦杯<br>健康早餐轻食之选</p>
      </div>
      <div class="item">
        <img src="assets/usage-2.jpg" alt="吃法2">
        <p>蜜桃甜品挞<br>下午茶绝配</p>
      </div>
    </div>
  </section>

  <section class="s7-tips" data-section="s7-tips" data-section-name="温馨提示">
    <img class="bg" src="assets/tips-bg.jpg" alt="">
    <div class="overlay">
      <h3>温馨提示</h3>
      <p>国产脆蜜桃的保存方法：国产脆蜜桃保存环境是 0~4°，可放于冰箱冷藏室……及时吃掉，不能久放。</p>
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
    const canvas = await html2canvas(s, {backgroundColor: '#faf7f2', scale: 2});
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

- [ ] 3 个标签：3~4 字短语
- [ ] 产品描述：1 句 lead + 1 段 60~100 字描述
- [ ] 视觉特征 2x2：4 个产品视觉特征短语
- [ ] 产品信息表：6~8 项参数
- [ ] 产地引号标题：5~10 字
- [ ] 产地段：60~100 字
- [ ] 更多吃法：2~3 张图 + 短描述
- [ ] 温馨提示：1 段 50~100 字
