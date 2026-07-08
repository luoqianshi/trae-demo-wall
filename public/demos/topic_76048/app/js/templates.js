/* ============================================================
   templates.js · 场景模板库
   每个模板接收 opts，返回完整可独立打开的 HTML 字符串
   opts: { palette, title, subtitle, time, location, price, items, rawText }
   ============================================================ */

window.Templates = (function () {

  // 注入配色为 CSS 变量的公共头
  function paletteVars(p) {
    p = p || {};
    return `
    :root{
      --c-primary:${p.primary || '#2563eb'};
      --c-secondary:${p.secondary || '#f8fafc'};
      --c-accent:${p.accent || '#f59e0b'};
      --c-bg:${p.bg || '#ffffff'};
      --c-text:${p.text || '#1a202c'};
      --c-bg-soft:${p.bgSoft || '#f1f5f9'};
    }`;
  }

  function doc(title, body, extraCSS) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=Noto+Serif+SC:wght@500;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Noto Sans SC",-apple-system,sans-serif;color:var(--c-text);background:var(--c-bg);line-height:1.7;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:var(--c-primary)}
${extraCSS || ''}
</style>
</head>
<body>
${body}
</body>
</html>`;
  }

  // ===== 1. 活动海报 =====
  function eventPoster(o) {
    o = o || {};
    const title = o.title || '周末魔法音乐节';
    const subtitle = o.subtitle || 'MAGIC WEEKEND FESTIVAL';
    const time = o.time || '2026年8月15日-17日';
    const location = o.location || '星光草坪 · 城市中央公园';
    const items = (o.items && o.items.length) ? o.items : [
      { name: '银河列车', desc: '独立摇滚 / 开场嘉宾' },
      { name: '雾色海岸', desc: '梦幻流行 / 压轴' },
      { name: '午夜电波', desc: '电子合成器' },
      { name: '纸飞机乐队', desc: '民谣 / 暖场' }
    ];
    const css = paletteVars(o.palette) + `
    .hero{min-height:88vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:#fff;
      background:linear-gradient(135deg,var(--c-primary),var(--c-accent));position:relative;overflow:hidden;padding:60px 20px}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.18),transparent 40%),radial-gradient(circle at 70% 80%,rgba(0,0,0,.25),transparent 50%)}
    .hero-sub{font-family:"Noto Serif SC",serif;letter-spacing:6px;font-size:14px;opacity:.85;margin-bottom:18px;position:relative}
    .hero-title{font-family:"Noto Serif SC",serif;font-weight:900;font-size:clamp(2.4rem,7vw,5rem);line-height:1.1;margin-bottom:24px;position:relative;text-shadow:0 4px 30px rgba(0,0,0,.3)}
    .countdown{display:flex;gap:16px;margin:30px 0;position:relative}
    .cd-box{background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:14px 20px;min-width:78px}
    .cd-num{font-size:2rem;font-weight:900;line-height:1}
    .cd-lbl{font-size:11px;opacity:.8;margin-top:4px}
    .info-bar{display:flex;flex-wrap:wrap;justify-content:center;gap:30px;padding:26px 20px;background:var(--c-bg-soft);border-bottom:1px solid rgba(0,0,0,.06);font-size:15px}
    .info-item{display:flex;align-items:center;gap:10px}
    .info-ico{font-size:22px}
    .buy-btn{display:inline-block;margin-top:10px;padding:16px 50px;background:var(--c-accent);color:#1a0f00;font-weight:700;font-size:18px;border-radius:50px;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.25);transition:transform .25s,box-shadow .25s;position:relative;border:none;cursor:pointer}
    .buy-btn:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.35)}
    .section{max-width:880px;margin:0 auto;padding:70px 20px}
    .sec-title{text-align:center;font-family:"Noto Serif SC",serif;font-size:2rem;font-weight:900;margin-bottom:40px;position:relative}
    .sec-title::after{content:'';display:block;width:50px;height:3px;background:var(--c-accent);margin:12px auto 0;border-radius:2px}
    .lineup{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px}
    .lineup-card{background:#fff;border-radius:16px;padding:26px 22px;box-shadow:0 6px 24px rgba(0,0,0,.08);border-top:4px solid var(--c-primary);transition:transform .3s}
    .lineup-card:hover{transform:translateY(-6px)}
    .lineup-name{font-family:"Noto Serif SC",serif;font-size:1.35rem;font-weight:700;margin-bottom:6px}
    .lineup-desc{color:#666;font-size:14px}
    .footer{text-align:center;padding:40px 20px;background:var(--c-text);color:rgba(255,255,255,.7);font-size:13px}
    @media(max-width:560px){.countdown{gap:8px}.cd-box{min-width:60px;padding:10px 12px}.cd-num{font-size:1.4rem}.info-bar{gap:16px;flex-direction:column;align-items:center}}
    `;
    const body = `
<section class="hero">
  <div class="hero-sub">${subtitle}</div>
  <h1 class="hero-title">${title}</h1>
  <div class="countdown" id="cd">
    <div class="cd-box"><div class="cd-num" id="cd-d">28</div><div class="cd-lbl">天</div></div>
    <div class="cd-box"><div class="cd-num" id="cd-h">06</div><div class="cd-lbl">时</div></div>
    <div class="cd-box"><div class="cd-num" id="cd-m">42</div><div class="cd-lbl">分</div></div>
    <div class="cd-box"><div class="cd-num" id="cd-s">15</div><div class="cd-lbl">秒</div></div>
  </div>
  <button class="buy-btn" onclick="alert('🎉 跳转到购票页（Demo）')">立即购票</button>
</section>
<div class="info-bar">
  <div class="info-item"><span class="info-ico">📅</span><span>${time}</span></div>
  <div class="info-item"><span class="info-ico">📍</span><span>${location}</span></div>
  <div class="info-item"><span class="info-ico">🎫</span><span>早鸟票 ¥128 起</span></div>
</div>
<section class="section">
  <h2 class="sec-title">演出阵容</h2>
  <div class="lineup">
    ${items.map((it, i) => `
    <div class="lineup-card">
      <div class="lineup-name">${it.name}</div>
      <div class="lineup-desc">${it.desc || ''}</div>
    </div>`).join('')}
  </div>
</section>
<footer class="footer">© ${title} · 由 HTML魔术师 变出来 ✨</footer>
<script>
(function(){
  var target=new Date();target.setDate(target.getDate()+28);target.setHours(target.getHours()+6,target.getMinutes()+42,15,0);
  function tick(){var n=Date.now(),d=target-n;if(d<0)d=0;var s=Math.floor(d/1000);document.getElementById('cd-d').textContent=Math.floor(s/86400);document.getElementById('cd-h').textContent=String(Math.floor(s%86400/3600)).padStart(2,'0');document.getElementById('cd-m').textContent=String(Math.floor(s%3600/60)).padStart(2,'0');document.getElementById('cd-s').textContent=String(s%60).padStart(2,'0');}
  tick();setInterval(tick,1000);
})();
</script>`;
    return doc(title, body, css);
  }

  // ===== 2. 产品介绍页 =====
  function productPage(o) {
    o = o || {};
    const title = o.title || '晨光手作咖啡';
    const subtitle = o.subtitle || '每一杯，都是慢下来的味道';
    const items = (o.items && o.items.length) ? o.items : [
      { name: '经典拿铁', desc: '绵密奶泡 · 醇厚 espresso', price: '28' },
      { name: '冷萃黑咖', desc: '12 小时低温萃取 · 顺滑回甘', price: '32' },
      { name: '桂花燕麦拿铁', desc: '当季桂花 · 燕麦奶', price: '34' },
      { name: '手冲耶加雪菲', desc: '柑橘 · 茉莉 · 蜂蜜尾韵', price: '38' }
    ];
    const css = paletteVars(o.palette) + `
    .topbar{display:flex;justify-content:space-between;align-items:center;padding:18px 6%;background:var(--c-bg);box-shadow:0 2px 20px rgba(0,0,0,.05);position:sticky;top:0;z-index:10}
    .brand{font-family:"Noto Serif SC",serif;font-weight:900;font-size:22px;color:var(--c-primary)}
    .nav a{margin-left:24px;text-decoration:none;color:var(--c-text);font-size:14px;font-weight:500}
    .hero{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:70px 6%;max-width:1200px;margin:0 auto}
    .hero-text h1{font-family:"Noto Serif SC",serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;line-height:1.2;margin-bottom:18px;color:var(--c-text)}
    .hero-text h1 em{color:var(--c-primary);font-style:normal}
    .hero-text p{font-size:17px;color:#555;margin-bottom:26px}
    .hero-img{height:340px;border-radius:24px;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;font-size:90px;box-shadow:0 20px 50px rgba(0,0,0,.15)}
    .cta{display:inline-block;padding:14px 38px;background:var(--c-primary);color:#fff;border-radius:50px;text-decoration:none;font-weight:700;transition:transform .25s}
    .cta:hover{transform:translateY(-3px)}
    .products{max-width:1200px;margin:0 auto;padding:50px 6% 80px}
    .sec-title{font-family:"Noto Serif SC",serif;font-size:2rem;font-weight:900;margin-bottom:8px;text-align:center}
    .sec-sub{text-align:center;color:#888;margin-bottom:40px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px}
    .card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.07);transition:transform .3s,box-shadow .3s}
    .card:hover{transform:translateY(-8px);box-shadow:0 18px 44px rgba(0,0,0,.13)}
    .card-img{height:150px;background:linear-gradient(135deg,var(--c-secondary),var(--c-primary));display:flex;align-items:center;justify-content:center;font-size:50px}
    .card-body{padding:20px}
    .card-name{font-weight:700;font-size:1.1rem;margin-bottom:6px}
    .card-desc{color:#777;font-size:13px;margin-bottom:14px;min-height:40px}
    .card-foot{display:flex;justify-content:space-between;align-items:center}
    .card-price{font-family:"Noto Serif SC",serif;font-size:1.5rem;font-weight:900;color:var(--c-primary)}
    .card-price small{font-size:13px;font-weight:500}
    .add-btn{padding:8px 18px;background:var(--c-accent);color:#1a0f00;border:none;border-radius:50px;font-weight:700;cursor:pointer;transition:transform .2s}
    .add-btn:hover{transform:scale(1.06)}
    .footer{text-align:center;padding:36px 20px;background:var(--c-text);color:rgba(255,255,255,.6);font-size:13px}
    @media(max-width:760px){.hero{grid-template-columns:1fr;padding-top:40px}.hero-img{height:240px}}
    `;
    const body = `
<div class="topbar">
  <div class="brand">${title}</div>
  <div class="nav"><a href="#products">产品</a><a href="#about">关于</a><a href="#" onclick="alert('Demo')">下单</a></div>
</div>
<section class="hero" id="about">
  <div class="hero-text">
    <h1>慢下来的<em>那一杯</em></h1>
    <p>${subtitle}</p>
    <a class="cta" href="#products" onclick="alert('🛒 已加入购物车（Demo）')">看看菜单 →</a>
  </div>
  <div class="hero-img">☕</div>
</section>
<section class="products" id="products">
  <h2 class="sec-title">当季手作</h2>
  <p class="sec-sub">每一款都现点现做，限量供应</p>
  <div class="grid">
    ${items.map(it => `
    <div class="card">
      <div class="card-img">🥤</div>
      <div class="card-body">
        <div class="card-name">${it.name}</div>
        <div class="card-desc">${it.desc || ''}</div>
        <div class="card-foot">
          <div class="card-price"><small>¥</small>${it.price || '--'}</div>
          <button class="add-btn" onclick="alert('已加入：${it.name}')">加购</button>
        </div>
      </div>
    </div>`).join('')}
  </div>
</section>
<footer class="footer">© ${title} · 由 HTML魔术师 变出来 ✨</footer>`;
    return doc(title, body, css);
  }

  // ===== 3. 数据看板 =====
  function dashboard(o) {
    o = o || {};
    const title = o.title || '本月销售数据看板';
    const subtitle = o.subtitle || '2026年6月 · 实时更新';
    const css = paletteVars(o.palette) + `
    body{background:var(--c-bg-soft)}
    .wrap{max-width:1180px;margin:0 auto;padding:30px 20px}
    .head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px;flex-wrap:wrap;gap:12px}
    .head h1{font-family:"Noto Serif SC",serif;font-size:1.8rem;font-weight:900;color:var(--c-text)}
    .head .sub{color:#888;font-size:13px}
    .badge{padding:6px 14px;background:var(--c-primary);color:#fff;border-radius:50px;font-size:12px;font-weight:600}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-bottom:24px}
    .kpi{background:#fff;border-radius:16px;padding:22px;box-shadow:0 4px 18px rgba(0,0,0,.05);border-left:4px solid var(--c-primary)}
    .kpi-lbl{color:#888;font-size:13px;margin-bottom:8px}
    .kpi-val{font-family:"Noto Serif SC",serif;font-size:2rem;font-weight:900;color:var(--c-text)}
    .kpi-trend{font-size:12px;margin-top:6px}
    .up{color:#10b981}.down{color:#ef4444}
    .panels{display:grid;grid-template-columns:1.6fr 1fr;gap:18px;margin-bottom:24px}
    .panel{background:#fff;border-radius:16px;padding:22px;box-shadow:0 4px 18px rgba(0,0,0,.05)}
    .panel-title{font-weight:700;font-size:15px;margin-bottom:18px;color:var(--c-text)}
    .chart{display:flex;align-items:flex-end;gap:14px;height:200px;padding-top:10px}
    .bar{flex:1;background:linear-gradient(180deg,var(--c-primary),var(--c-accent));border-radius:8px 8px 0 0;position:relative;transition:opacity .25s;cursor:pointer;min-height:8px}
    .bar:hover{opacity:.8}
    .bar span{position:absolute;bottom:-22px;left:0;right:0;text-align:center;font-size:11px;color:#888}
    .bar em{position:absolute;top:-22px;left:0;right:0;text-align:center;font-size:11px;font-style:normal;color:var(--c-text);font-weight:700}
    .pie-list{display:flex;flex-direction:column;gap:14px}
    .pie-row{display:flex;justify-content:space-between;align-items:center;font-size:13px}
    .pie-bar{flex:1;height:8px;background:#eee;border-radius:4px;margin:0 12px;overflow:hidden}
    .pie-fill{height:100%;background:var(--c-primary);border-radius:4px}
    .table{width:100%;border-collapse:collapse;font-size:13px}
    .table th{text-align:left;padding:10px 12px;background:var(--c-bg-soft);color:#666;font-weight:600;border-bottom:2px solid #eee}
    .table td{padding:11px 12px;border-bottom:1px solid #f0f0f0}
    .table tr:hover td{background:#fafafa}
    .tag{padding:3px 10px;border-radius:50px;font-size:11px;font-weight:600}
    .tag.ok{background:#dcfce7;color:#16a34a}.tag.warn{background:#fef3c7;color:#d97706}.tag.bad{background:#fee2e2;color:#dc2626}
    @media(max-width:860px){.panels{grid-template-columns:1fr}}
    `;
    const months = ['第一周','第二周','第三周','第四周'];
    const bars = [320, 480, 410, 560];
    const body = `
<div class="wrap">
  <div class="head">
    <div><h1>${title}</h1><div class="sub">${subtitle}</div></div>
    <div class="badge">● 实时</div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-lbl">总销售额</div><div class="kpi-val">¥177万</div><div class="kpi-trend up">↑ 12.4% 较上月</div></div>
    <div class="kpi"><div class="kpi-lbl">订单数</div><div class="kpi-val">8,642</div><div class="kpi-trend up">↑ 8.1%</div></div>
    <div class="kpi"><div class="kpi-lbl">客单价</div><div class="kpi-val">¥205</div><div class="kpi-trend up">↑ 3.9%</div></div>
    <div class="kpi"><div class="kpi-lbl">退款率</div><div class="kpi-val">1.8%</div><div class="kpi-trend down">↓ 0.3%</div></div>
  </div>
  <div class="panels">
    <div class="panel">
      <div class="panel-title">📈 周度销售额趋势（万元）</div>
      <div class="chart">
        ${bars.map((v,i)=>`<div class="bar" style="height:${v/560*100}%" title="${months[i]}：${v}万"><em>${v}</em><span>${months[i]}</span></div>`).join('')}
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">🍩 渠道占比</div>
      <div class="pie-list">
        <div class="pie-row"><span>小程序</span><div class="pie-bar"><div class="pie-fill" style="width:48%"></div></div><span>48%</span></div>
        <div class="pie-row"><span>门店</span><div class="pie-bar"><div class="pie-fill" style="width:30%;background:var(--c-accent)"></div></div><span>30%</span></div>
        <div class="pie-row"><span>外卖</span><div class="pie-bar"><div class="pie-fill" style="width:14%;background:var(--c-secondary)"></div></div><span>14%</span></div>
        <div class="pie-row"><span>其他</span><div class="pie-bar"><div class="pie-fill" style="width:8%;background:#aaa"></div></div><span>8%</span></div>
      </div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-title">📋 热销商品 Top 5</div>
    <table class="table">
      <thead><tr><th>商品</th><th>销量</th><th>销售额</th><th>环比</th><th>状态</th></tr></thead>
      <tbody>
        <tr><td>经典拿铁</td><td>1,842</td><td>¥51,576</td><td>↑ 15%</td><td><span class="tag ok">热销</span></td></tr>
        <tr><td>冷萃黑咖</td><td>1,356</td><td>¥43,392</td><td>↑ 9%</td><td><span class="tag ok">热销</span></td></tr>
        <tr><td>桂花燕麦拿铁</td><td>980</td><td>¥33,320</td><td>↑ 22%</td><td><span class="tag warn">补货</span></td></tr>
        <tr><td>手冲耶加雪菲</td><td>412</td><td>¥15,656</td><td>↓ 4%</td><td><span class="tag bad">关注</span></td></tr>
        <tr><td>季节限定特调</td><td>268</td><td>¥10,452</td><td>↑ 31%</td><td><span class="tag ok">爆款</span></td></tr>
      </tbody>
    </table>
  </div>
</div>`;
    return doc(title, body, css);
  }

  // ===== 4. 电子邀请函 =====
  function invitation(o) {
    o = o || {};
    const title = o.title || '我们结婚啦';
    const subtitle = o.subtitle || 'THE WEDDING INVITATION';
    const time = o.time || '2026年10月18日 · 农历九月初八';
    const location = o.location || '云栖花园酒店 · 玫瑰厅';
    const css = paletteVars(o.palette) + `
    body{background:var(--c-bg-soft);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:30px 16px}
    .card{background:#fff;max-width:520px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.12);position:relative;text-align:center}
    .card-top{height:200px;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
    .card-top::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.3),transparent 60%)}
    .rings{font-size:70px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.2));position:relative}
    .deco{position:absolute;color:rgba(255,255,255,.4);font-size:20px}
    .deco.tl{top:18px;left:22px}.deco.tr{top:18px;right:22px}.deco.bl{bottom:18px;left:22px}.deco.br{bottom:18px;right:22px}
    .card-body{padding:44px 30px 36px}
    .sub{font-family:"Noto Serif SC",serif;letter-spacing:5px;font-size:12px;color:#aaa;margin-bottom:16px}
    .names{font-family:"Noto Serif SC",serif;font-size:2.4rem;font-weight:900;color:var(--c-primary);margin-bottom:8px;line-height:1.2}
    .names .amp{color:var(--c-accent);font-style:italic;margin:0 8px}
    .invite-text{color:#666;font-size:15px;line-height:2;margin:20px 0 26px}
    .divider{width:60px;height:1px;background:var(--c-accent);margin:0 auto 26px;position:relative}
    .divider::before,.divider::after{content:'❀';position:absolute;top:-10px;color:var(--c-accent);font-size:14px}
    .divider::before{left:-20px}.divider::after{right:-20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:30px;padding:20px;background:var(--c-bg-soft);border-radius:12px}
    .info-lbl{font-size:11px;color:#aaa;letter-spacing:2px;margin-bottom:6px}
    .info-val{font-family:"Noto Serif SC",serif;font-weight:700;color:var(--c-text);font-size:15px}
    .rsvp{display:inline-block;padding:14px 46px;background:var(--c-primary);color:#fff;border-radius:50px;text-decoration:none;font-weight:700;letter-spacing:2px;border:none;cursor:pointer;font-size:15px;transition:transform .25s,box-shadow .25s}
    .rsvp:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(0,0,0,.2)}
    .card-foot{padding:18px;background:var(--c-bg-soft);color:#999;font-size:12px}
    `;
    const body = `
<div class="card">
  <div class="card-top">
    <span class="deco tl">✦</span><span class="deco tr">✦</span><span class="deco bl">✦</span><span class="deco br">✦</span>
    <div class="rings">💍</div>
  </div>
  <div class="card-body">
    <div class="sub">${subtitle}</div>
    <div class="names">嘉树 <span class="amp">&</span> 念慈</div>
    <div class="invite-text">${title}<br>诚挚邀请您见证我们的幸福时刻<br>愿与您共赴这场浪漫之约</div>
    <div class="divider"></div>
    <div class="info-grid">
      <div><div class="info-lbl">TIME</div><div class="info-val">${time}</div></div>
      <div><div class="info-lbl">PLACE</div><div class="info-val">${location}</div></div>
    </div>
    <button class="rsvp" onclick="alert('💌 感谢您的回执！（Demo）')">出席回执</button>
  </div>
  <div class="card-foot">由 HTML魔术师 变出来 ✨</div>
</div>`;
    return doc(title, body, css);
  }

  // ===== 5. 班级主页 =====
  function classPage(o) {
    o = o || {};
    const title = o.title || '三年级二班 · 阳光小筑';
    const subtitle = o.subtitle || '每一个孩子都是发光的小星星';
    const css = paletteVars(o.palette) + `
    .banner{background:linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;padding:50px 20px;text-align:center}
    .banner h1{font-family:"Noto Serif SC",serif;font-size:2.2rem;font-weight:900;margin-bottom:10px}
    .banner p{opacity:.92;font-size:15px}
    .notice{max-width:900px;margin:-22px auto 0;background:#fff;border-radius:14px;padding:16px 22px;box-shadow:0 8px 30px rgba(0,0,0,.1);display:flex;align-items:center;gap:12px;font-size:14px;position:relative;z-index:2}
    .notice-ico{font-size:22px}
    .wrap{max-width:900px;margin:0 auto;padding:40px 20px}
    .sec{margin-bottom:40px}
    .sec-h{font-family:"Noto Serif SC",serif;font-size:1.4rem;font-weight:900;margin-bottom:18px;display:flex;align-items:center;gap:10px;color:var(--c-text)}
    .sec-h::before{content:'';width:5px;height:22px;background:var(--c-primary);border-radius:3px}
    .schedule{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.06)}
    .schedule th{background:var(--c-primary);color:#fff;padding:12px;font-weight:600;font-size:14px}
    .schedule td{padding:12px;text-align:center;border-bottom:1px solid #f0f0f0;font-size:14px}
    .schedule td:first-child{font-weight:700;background:var(--c-bg-soft);color:var(--c-primary)}
    .schedule tr:hover td{background:#fafafa}
    .schedule tr:hover td:first-child{background:var(--c-bg-soft)}
    .files{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
    .file{display:flex;align-items:center;gap:14px;background:#fff;padding:16px 18px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.05);transition:transform .25s;cursor:pointer}
    .file:hover{transform:translateY(-3px)}
    .file-ico{width:44px;height:44px;border-radius:10px;background:var(--c-bg-soft);display:flex;align-items:center;justify-content:center;font-size:22px}
    .file-name{font-weight:600;font-size:14px}
    .file-meta{color:#999;font-size:12px;margin-top:2px}
    .teachers{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
    .teacher{background:#fff;border-radius:14px;padding:22px;text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.06)}
    .t-ava{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 12px;color:#fff}
    .t-name{font-weight:700;margin-bottom:2px}
    .t-sub{color:#888;font-size:13px}
    .footer{text-align:center;padding:30px;color:#aaa;font-size:13px}
    `;
    const body = `
<div class="banner">
  <h1>${title}</h1>
  <p>${subtitle}</p>
</div>
<div class="notice"><span class="notice-ico">📢</span><span>本周五下午 3 点家长会，请准时出席～记得给孩子准备水彩笔。</span></div>
<div class="wrap">
  <div class="sec">
    <div class="sec-h">📚 本周课程表</div>
    <table class="schedule">
      <thead><tr><th>节次</th><th>周一</th><th>周二</th><th>周三</th><th>周四</th><th>周五</th></tr></thead>
      <tbody>
        <tr><td>第一节</td><td>语文</td><td>数学</td><td>语文</td><td>数学</td><td>语文</td></tr>
        <tr><td>第二节</td><td>数学</td><td>语文</td><td>英语</td><td>语文</td><td>数学</td></tr>
        <tr><td>第三节</td><td>美术</td><td>英语</td><td>数学</td><td>科学</td><td>英语</td></tr>
        <tr><td>第四节</td><td>音乐</td><td>体育</td><td>体育</td><td>道法</td><td>阅读</td></tr>
      </tbody>
    </table>
  </div>
  <div class="sec">
    <div class="sec-h">📥 学习资料下载</div>
    <div class="files">
      <div class="file" onclick="alert('📥 下载：第一单元练习（Demo）')"><div class="file-ico">📄</div><div><div class="file-name">第一单元练习</div><div class="file-meta">PDF · 1.2MB</div></div></div>
      <div class="file" onclick="alert('📥 下载：口算卡（Demo）')"><div class="file-ico">📄</div><div><div class="file-name">口算卡 100 道</div><div class="file-meta">PDF · 0.8MB</div></div></div>
      <div class="file" onclick="alert('📥 下载：英语单词表（Demo）')"><div class="file-ico">📄</div><div><div class="file-name">英语单词表</div><div class="file-meta">PDF · 0.5MB</div></div></div>
      <div class="file" onclick="alert('📥 下载：手工作业说明（Demo）')"><div class="file-ico">📄</div><div><div class="file-name">手工作业说明</div><div class="file-meta">PDF · 1.0MB</div></div></div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-h">👩‍🏫 任课老师</div>
    <div class="teachers">
      <div class="teacher"><div class="t-ava">👩</div><div class="t-name">王老师</div><div class="t-sub">语文 · 班主任</div></div>
      <div class="teacher"><div class="t-ava">👨</div><div class="t-name">李老师</div><div class="t-sub">数学</div></div>
      <div class="teacher"><div class="t-ava">👩</div><div class="t-name">张老师</div><div class="t-sub">英语</div></div>
      <div class="teacher"><div class="t-ava">👨</div><div class="t-name">陈老师</div><div class="t-sub">体育 · 科学</div></div>
    </div>
  </div>
</div>
<div class="footer">© ${title} · 由 HTML魔术师 变出来 ✨</div>`;
    return doc(title, body, css);
  }

  // ===== 6. 社团招新 =====
  function clubRecruit(o) {
    o = o || {};
    const title = o.title || '街舞社 · STREET SOUL';
    const subtitle = o.subtitle || '用身体写诗，用节奏说话';
    const css = paletteVars(o.palette) + `
    body{background:var(--c-bg);color:var(--c-text)}
    .hero{min-height:80vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 20px;position:relative;overflow:hidden;background:radial-gradient(ellipse at center,var(--c-primary),var(--c-bg) 70%)}
    .hero::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,.02) 30px,rgba(255,255,255,.02) 31px)}
    .tagline{font-family:"Noto Serif SC",serif;letter-spacing:8px;font-size:13px;color:var(--c-accent);margin-bottom:16px;position:relative}
    .hero h1{font-family:"Noto Serif SC",serif;font-size:clamp(2.5rem,8vw,5rem);font-weight:900;line-height:1.05;margin-bottom:18px;position:relative;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.4)}
    .hero p{font-size:18px;color:rgba(255,255,255,.8);max-width:560px;position:relative;margin-bottom:30px}
    .join-btn{padding:16px 50px;background:var(--c-accent);color:#1a0f00;font-weight:800;font-size:17px;border-radius:8px;border:none;cursor:pointer;letter-spacing:2px;position:relative;transition:transform .25s;box-shadow:0 10px 30px rgba(0,0,0,.3)}
    .join-btn:hover{transform:translateY(-3px) scale(1.03)}
    .stats{display:flex;justify-content:center;gap:50px;padding:36px 20px;background:var(--c-bg-soft);flex-wrap:wrap}
    .stat-num{font-family:"Noto Serif SC",serif;font-size:2.4rem;font-weight:900;color:var(--c-accent)}
    .stat-lbl{font-size:13px;color:#aaa;margin-top:4px}
    .wrap{max-width:1000px;margin:0 auto;padding:70px 20px}
    .sec-h{font-family:"Noto Serif SC",serif;font-size:1.8rem;font-weight:900;margin-bottom:24px;color:var(--c-text);position:relative;padding-left:18px}
    .sec-h::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:5px;background:var(--c-accent)}
    .about{color:#bbb;font-size:16px;line-height:2;margin-bottom:50px}
    .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:50px}
    .gal-item{height:180px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:50px;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));transition:transform .3s;cursor:pointer}
    .gal-item:hover{transform:scale(1.04)}
    .form-box{background:#fff;border-radius:18px;padding:32px;box-shadow:0 10px 40px rgba(0,0,0,.15);max-width:560px;margin:0 auto}
    .field{margin-bottom:18px}
    .field label{display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600}
    .field input,.field select{width:100%;padding:12px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:14px;font-family:inherit;transition:border .2s}
    .field input:focus,.field select:focus{outline:none;border-color:var(--c-accent)}
    .submit{width:100%;padding:14px;background:var(--c-primary);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;letter-spacing:2px;transition:transform .2s}
    .submit:hover{transform:translateY(-2px)}
    .contact{text-align:center;color:#888;font-size:14px;margin-top:40px;padding:24px;background:var(--c-bg-soft);border-radius:12px}
    .footer{text-align:center;padding:30px;color:#666;font-size:13px;background:var(--c-bg-soft)}
    `;
    const body = `
<section class="hero">
  <div class="tagline">STREET SOUL DANCE CLUB</div>
  <h1>${title}</h1>
  <p>${subtitle}<br>2026 招新正式启动，等你来燥。</p>
  <button class="join-btn" onclick="document.getElementById('form').scrollIntoView({behavior:'smooth'})">立即报名 ↓</button>
</section>
<div class="stats">
  <div><div class="stat-num">128+</div><div class="stat-lbl">社员</div></div>
  <div><div class="stat-num">15</div><div class="stat-lbl">获奖经历</div></div>
  <div><div class="stat-num">6</div><div class="stat-lbl">舞种方向</div></div>
  <div><div class="stat-num">∞</div><div class="stat-lbl">热爱</div></div>
</div>
<div class="wrap">
  <div class="sec-h">关于我们</div>
  <p class="about">我们是一群热爱街舞的年轻人，从 Breaking 到 Hiphop，从 Locking 到 Popping，每个舞种都有专属小分队。无论你是零基础小白还是已有功底的大神，这里都有你的舞台。每周三次团训、每月一次 cypher、每学期一场大型公演——只要你敢跳，我们就敢捧场。</p>
  <div class="sec-h">活动剪影</div>
  <div class="gallery">
    <div class="gal-item">💃</div><div class="gal-item">🕺</div><div class="gal-item">🤸</div>
    <div class="gal-item">🎵</div><div class="gal-item">🔥</div><div class="gal-item">🏆</div>
  </div>
  <div class="sec-h" id="form">报名表单</div>
  <form class="form-box" onsubmit="event.preventDefault();alert('🎉 报名成功！我们会尽快联系你（Demo）');">
    <div class="field"><label>你的名字</label><input type="text" placeholder="比如：张三" required></div>
    <div class="field"><label>联系方式</label><input type="text" placeholder="手机号 / 微信" required></div>
    <div class="field"><label>感兴趣的方向</label>
      <select><option>Breaking</option><option>Hiphop</option><option>Locking</option><option>Popping</option><option>Jazz</option><option>都感兴趣</option></select>
    </div>
    <div class="field"><label>有无基础</label>
      <select><option>零基础小白</option><option>学过一点</option><option>有扎实基础</option><option>大佬带飞</option></select>
    </div>
    <button class="submit" type="submit">提交报名</button>
  </form>
  <div class="contact">📬 联系我们：微信 street_soul_2026 · 面试地点：学生活动中心 B301</div>
</div>
<div class="footer">© ${title} · 由 HTML魔术师 变出来 ✨</div>`;
    return doc(title, body, css);
  }

  // 场景元信息
  const SCENES = [
    { key: 'eventPoster', label: '活动海报', emoji: '🎵', desc: '演出/派对/市集', example: '做一个蓝白色调的周末音乐节活动页，包含时间地点、购票按钮和乐队介绍' },
    { key: 'productPage', label: '产品介绍页', emoji: '🛍️', desc: '商品/店铺展示', example: '做一个暖橘色风格的手工咖啡品牌介绍页，包含产品列表、价格和购买按钮' },
    { key: 'dashboard', label: '数据看板', emoji: '📊', desc: '汇报/统计', example: '做一个深色科技风的本月销售数据看板，包含KPI、柱状图和趋势' },
    { key: 'invitation', label: '电子邀请函', emoji: '💌', desc: '婚礼/生日/满月', example: '做一个粉色浪漫风的婚礼邀请函，包含新人名字、时间地点和回执按钮' },
    { key: 'classPage', label: '班级主页', emoji: '📚', desc: '课程/课件', example: '做一个绿色清新风的三年级二班班级主页，包含课程表、公告和资料下载' },
    { key: 'clubRecruit', label: '社团招新', emoji: '🎯', desc: '报名/纳新', example: '做一个黑金酷炫风的街舞社招新页，包含社团介绍、活动剪影和报名表单' }
  ];

  const renderers = {
    eventPoster, productPage, dashboard, invitation, classPage, clubRecruit
  };

  return { SCENES, renderers, paletteVars };
})();
