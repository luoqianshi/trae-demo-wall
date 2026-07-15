/* ============================================================
   曲阳雕刻供应链平台 - 门户站点公共脚本
   纯原生 JS，负责 header/footer 注入、数据渲染、交互、表单验证
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 当前页面标识（由各页面 body data-page 指定） ---------- */
  function currentPage() {
    return document.body.getAttribute("data-page") || "index";
  }

  /* ---------- 顶部导航 HTML ---------- */
  function headerHTML() {
    var page = currentPage();
    var menu = [
      { key: "index", name: "首页", href: "index.html" },
      { key: "products", name: "产品中心", href: "products.html" },
      { key: "cases", name: "工程案例", href: "cases.html" },
      { key: "news", name: "新闻资讯", href: "news.html" },
      { key: "about", name: "关于我们", href: "about.html" },
      { key: "contact", name: "联系我们", href: "contact.html" }
    ];
    var menuHTML = menu
      .map(function (m) {
        var cls = m.key === page ? ' class="active"' : "";
        return '<a href="' + m.href + '"' + cls + ">" + m.name + "</a>";
      })
      .join("");

    return (
      '<div class="topbar">' +
      '<div class="container">' +
      "<span>欢迎来到曲阳雕刻供应链平台 · 中国曲阳·雕刻之乡</span>" +
      '<div class="topbar-right">' +
      "<span>源头厂家直供</span>" +
      "<span>支持来图来样定制</span>" +
      '<a href="tel:0312-4221888">咨询热线：0312-4221888</a>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<header class="site-header">' +
      '<div class="container">' +
      '<nav class="nav">' +
      '<a href="index.html" class="logo">' +
      '<span class="logo-mark">雕</span>' +
      '<span class="logo-text">曲阳雕刻供应链平台<small>QUYANG CARVING</small></span>' +
      "</a>" +
      '<div class="nav-menu" id="navMenu">' +
      menuHTML +
      "</div>" +
      '<div class="nav-actions">' +
      '<a href="inquiry.html" class="btn btn-accent btn-sm">立即询价</a>' +
      '<button class="nav-toggle" id="navToggle" aria-label="菜单">' +
      "<span></span><span></span><span></span>" +
      "</button>" +
      "</div>" +
      "</nav>" +
      "</div>" +
      "</header>"
    );
  }

  /* ---------- 底部 HTML ---------- */
  function footerHTML() {
    return (
      '<footer class="site-footer">' +
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand">' +
      '<a href="index.html" class="logo">' +
      '<span class="logo-mark">雕</span>' +
      '<span class="logo-text">曲阳雕刻供应链平台<small>QUYANG CARVING</small></span>' +
      "</a>" +
      "<p>曲阳雕刻供应链平台立足“中国丝网之都”河北安平，整合源头厂家资源，提供不锈钢网、电焊网、护栏网、钢板网、过滤网等全品类丝网产品，源头直供、品质保障、询价速回、物流直达。</p>" +
      '<ul class="footer-contact">' +
      "<li><strong>地址：</strong>河北省保定市曲阳县雕刻产业园</li>" +
      "<li><strong>电话：</strong>0312-4221888 / 138-3388-0000</li>" +
      "<li><strong>邮箱：</strong>service@diaoke.com</li>" +
      "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      "<h4>产品中心</h4>" +
      "<ul>" +
      "<li><a href=\"products.html?cat=stainless\">汉白玉雕刻</a></li>" +
      "<li><a href=\"products.html?cat=welded\">花岗岩雕塑</a></li>" +
      "<li><a href=\"products.html?cat=fence\">铜雕工艺品</a></li>" +
      "<li><a href=\"products.html?cat=expanded\">不锈钢雕塑</a></li>" +
      "<li><a href=\"products.html?cat=filter\">佛像石雕</a></li>" +
      "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      "<h4>快速链接</h4>" +
      "<ul>" +
      "<li><a href=\"about.html\">关于我们</a></li>" +
      "<li><a href=\"cases.html\">工程案例</a></li>" +
      "<li><a href=\"news.html\">新闻资讯</a></li>" +
      "<li><a href=\"inquiry.html\">在线询价</a></li>" +
      "<li><a href=\"contact.html\">联系我们</a></li>" +
      "</ul>" +
      "</div>" +
      '<div class="footer-col footer-qr">' +
      "<h4>关注我们</h4>" +
      '<div class="qr-box"></div>' +
      "<p>扫码关注公众号</p>" +
      "</div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      "<span>© 2024 曲阳雕刻供应链平台 冀ICP备2024000000号-1 冀公网安备 13112500000000号</span>" +
      '<div class="links">' +
      '<a href="about.html">关于</a>|' +
      '<a href="contact.html">联系</a>|' +
      '<a href="inquiry.html">询价</a>|' +
      '<a href="#">隐私政策</a>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</footer>" +
      '<div class="float-inquiry">' +
      '<a href="inquiry.html" class="float-btn primary">✎<span class="fb-label">在线询价</span></a>' +
      '<a href="tel:0312-4221888" class="float-btn">☎<span class="fb-label">电话咨询</span></a>' +
      "</div>" +
      '<button class="back-top" id="backTop" aria-label="返回顶部">↑</button>'
    );
  }

  /* ---------- 注入 header / footer ---------- */
  function injectLayout() {
    var headerSlot = document.getElementById("site-header");
    var footerSlot = document.getElementById("site-footer");
    if (headerSlot) headerSlot.innerHTML = headerHTML();
    if (footerSlot) footerSlot.innerHTML = footerHTML();
    bindLayoutEvents();
  }

  /* ---------- 绑定布局交互（菜单、返回顶部） ---------- */
  function bindLayoutEvents() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        menu.classList.toggle("open");
      });
    }
    var backTop = document.getElementById("backTop");
    if (backTop) {
      window.addEventListener("scroll", function () {
        if (window.pageYOffset > 400) {
          backTop.classList.add("show");
        } else {
          backTop.classList.remove("show");
        }
      });
      backTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ============================================================
     数据层
     ============================================================ */

  /* 产品分类 */
  var CATEGORIES = [
    { key: "marble", name: "汉白玉雕刻", icon: "玉", desc: "汉白玉石狮/佛像/浮雕/栏板", color: "#c28a2c" },
    { key: "granite", name: "花岗岩雕塑", icon: "岩", desc: "花岗岩人物/动物/抽象雕塑", color: "#78716c" },
    { key: "bronze", name: "铜雕工艺品", icon: "铜", desc: "铸铜/锻铜人物/动物/浮雕", color: "#b45309" },
    { key: "stainless", name: "不锈钢雕塑", icon: "钢", desc: "不锈钢镜面/拉丝/抽象雕塑", color: "#64748b" },
    { key: "buddha", name: "佛像石雕", icon: "佛", desc: "观音/弥勒/释迦牟尼/罗汉像", color: "#d97706" },
    { key: "garden", name: "园林景观", icon: "园", desc: "喷泉/花钵/石桌石凳/凉亭", color: "#0d9488" },
    { key: "relief", name: "浮雕壁画", icon: "浮", desc: "砂岩/汉白玉/花岗岩浮雕墙", color: "#a16207" },
    { key: "tombstone", name: "墓碑石碑", icon: "碑", desc: "家族墓碑/纪念碑/功德碑/刻字", color: "#57534e" }
  ];

  /* 产品图案生成器（CSS 渐变代替图片） */
  function productPattern(cat, seed) {
    var palettes = {
      marble: ["#f5f0e6", "#e8dcc8", "#c28a2c"],
      granite: ["#a8a29e", "#78716c", "#44403c"],
      bronze: ["#d4a574", "#b45309", "#78350f"],
      stainless: ["#e2e8f0", "#94a3b8", "#475569"],
      buddha: ["#fef3c7", "#f59e0b", "#92400e"],
      garden: ["#d1fae5", "#0d9488", "#064e3b"],
      relief: ["#fde68a", "#d97706", "#78350f"],
      tombstone: ["#d6d3d1", "#57534e", "#1c1917"]
    };
    var templates = {
      marble: "linear-gradient(135deg,{l1},{d1}),repeating-linear-gradient(0deg,transparent 0 20px,rgba(255,255,255,0.06) 20px 22px),repeating-linear-gradient(90deg,transparent 0 25px,rgba(0,0,0,0.04) 25px 26px)",
      granite: "linear-gradient(135deg,{l1},{d1}),radial-gradient(circle at 20% 30%,rgba(0,0,0,0.08) 1px,transparent 2px),radial-gradient(circle at 70% 60%,rgba(0,0,0,0.06) 1px,transparent 2px),radial-gradient(circle at 50% 80%,rgba(255,255,255,0.1) 1px,transparent 2px)",
      bronze: "linear-gradient(135deg,{l1},{d1}),repeating-linear-gradient(45deg,rgba(255,255,255,0.08) 0 3px,transparent 3px 12px)",
      stainless: "linear-gradient(135deg,{l1},{d1}),repeating-linear-gradient(90deg,rgba(255,255,255,0.15) 0 2px,transparent 2px 8px)",
      buddha: "linear-gradient(135deg,{l1},{d1}),radial-gradient(ellipse at 50% 40%,rgba(255,255,255,0.12) 0%,transparent 60%)",
      garden: "linear-gradient(135deg,{l1},{d1}),repeating-linear-gradient(0deg,transparent 0 15px,rgba(255,255,255,0.05) 15px 16px)",
      relief: "linear-gradient(135deg,{l1},{d1}),repeating-linear-gradient(45deg,transparent 0 8px,rgba(0,0,0,0.05) 8px 10px),repeating-linear-gradient(-45deg,transparent 0 8px,rgba(255,255,255,0.05) 8px 10px)",
      tombstone: "linear-gradient(135deg,{l1},{d1}),repeating-linear-gradient(0deg,transparent 0 30px,rgba(0,0,0,0.03) 30px 31px)"
    };
    var p = palettes[cat] || palettes[Object.keys(palettes)[0]];
    var tpl = templates[cat] || templates[Object.keys(templates)[0]];
    var bg = tpl.replace("{l1}", p[0]).replace("{d1}", p[1]);
    return "background:" + bg + ",linear-gradient(135deg," + p[1] + "," + p[2] + ");";
  }
  /* 热门产品 / 全部产品 */
  var PRODUCTS = [
    { id: 1, name: "汉白玉石狮 高1.8米 精品一对", cat: "marble", spec: "汉白玉材质 / 高1.8m / 传统中式造型", price: "8800-18000", unit: "元/对", tag: "热销", maker: "曲阳鑫源石雕" },
    { id: 2, name: "花岗岩孔子像 高2.5米", cat: "granite", spec: "花岗岩 / 高2.5m / 校园文化雕塑", price: "12000-25000", unit: "元/尊", tag: "推荐", maker: "曲阳恒久雕塑" },
    { id: 3, name: "铸铜狮子 高2米 故宫同款", cat: "bronze", spec: "铸铜 / 高2m / 仿故宫铜狮", price: "28000-55000", unit: "元/对", tag: "热销", maker: "曲阳铜艺坊" },
    { id: 4, name: "不锈钢抽象雕塑 高3-8米", cat: "stainless", spec: "304不锈钢 / 镜面/拉丝 / 定制", price: "15000-80000", unit: "元/座", tag: "新品", maker: "曲阳现代雕塑" },
    { id: 5, name: "汉白玉观音像 高1.5-3米", cat: "buddha", spec: "一级汉白玉 / 滴水观音/送子观音", price: "6800-35000", unit: "元/尊", tag: "热销", maker: "曲阳佛缘雕刻" },
    { id: 6, name: "石雕喷泉 直径2-5米", cat: "garden", spec: "花岗岩/汉白玉 / 多层喷泉/欧式", price: "9800-45000", unit: "元/套", tag: "推荐", maker: "曲阳园林石雕" },
    { id: 7, name: "砂岩浮雕壁画 定制", cat: "relief", spec: "砂岩/汉白玉 / 人物/山水/文化墙", price: "1200-2800", unit: "元/㎡", tag: "热销", maker: "曲阳浮雕艺术" },
    { id: 8, name: "花岗岩墓碑 家族墓 定制", cat: "tombstone", spec: "花岗岩/山西黑/印度红 / 刻字安装", price: "2800-15000", unit: "元/套", tag: "热销", maker: "曲阳碑石工艺" },
    { id: 9, name: "汉白玉栏板 河道护栏", cat: "marble", spec: "汉白玉 / 线雕/浮雕 / 定制尺寸", price: "680-1500", unit: "元/米", tag: "推荐", maker: "曲阳鑫源石雕" },
    { id: 10, name: "不锈钢凤凰雕塑 高5米", cat: "stainless", spec: "304不锈钢 / 镜面抛光 / 户外景观", price: "35000-65000", unit: "元/座", tag: "新品", maker: "曲阳现代雕塑" },
    { id: 11, name: "石桌石凳 庭院套装", cat: "garden", spec: "花岗岩/青石 / 圆桌方桌/自然面", price: "680-2800", unit: "元/套", tag: "热销", maker: "曲阳园林石雕" },
    { id: 12, name: "十八罗汉石雕 全套", cat: "buddha", spec: "青石/花岗岩 / 高0.8-1.8m / 整套18尊", price: "38000-120000", unit: "元/套", tag: "定制", maker: "曲阳佛缘雕刻" }
  ];

  /* 厂家 */
  var MAKERS = [
    { name: "曲阳鑫源石雕", main: "汉白玉雕刻、栏板、石狮、浮雕", logo: "鑫", color: "#c28a2c", badges: ["源头厂家", "30年+", "ISO认证"] },
    { name: "曲阳恒久雕塑", main: "花岗岩雕塑、人物像、动物雕塑", logo: "恒", color: "#78716c", badges: ["源头厂家", "工程资质"] },
    { name: "曲阳铜艺坊", main: "铸铜、锻铜、铜佛像、铜狮子", logo: "铜", color: "#b45309", badges: ["源头厂家", "非遗传承"] },
    { name: "曲阳现代雕塑", main: "不锈钢雕塑、抽象雕塑、景观雕塑", logo: "现", color: "#64748b", badges: ["源头厂家", "设计安装"] }
  ];

  /* 工程案例 */
  var CASES = [
    { id: 1, title: "北京某高校孔子像文化广场", cat: "granite", catName: "花岗岩雕塑", location: "北京·海淀", desc: "供应高2.5米花岗岩孔子像及配套石栏板、石书等，总工程量38万元，安装后成为校园文化地标。" },
    { id: 2, title: "杭州某别墅区景观喷泉工程", cat: "garden", catName: "园林景观", location: "浙江·杭州", desc: "提供直径3.5米多层汉白玉石雕喷泉3套，配套花钵、石灯等景观小品，欧式风格，深受业主好评。" },
    { id: 3, title: "山西五台山寺院佛像供应", cat: "buddha", catName: "佛像石雕", location: "山西·忻州", desc: "为五台山某寺院定制汉白玉观音像、释迦牟尼佛、十八罗汉等共计28尊，最高3米，庄严如法。" },
    { id: 4, title: "深圳城市广场不锈钢雕塑", cat: "stainless", catName: "不锈钢雕塑", location: "广东·深圳", desc: "设计制作高8米镜面不锈钢抽象雕塑《启航》，夜间配灯光效果，成为城市地标性艺术品。" },
    { id: 5, title: "山东某景区文化浮雕墙", cat: "relief", catName: "浮雕壁画", location: "山东·泰安", desc: "制作长68米高3米砂岩文化浮雕墙，展现当地历史文化故事，雕刻精美，工期45天交付。" },
    { id: 6, title: "河北美丽乡村入口标识石", cat: "tombstone", catName: "墓碑石碑", location: "河北·保定", desc: "为多个美丽乡村定制村口标识石、村名碑共计42块，选用花岗岩材质，刻字填金，庄重大气。" }
  ];

  /* 新闻资讯 */
  var NEWS = [
    { day: "20", month: "2024-06", tag: "行业动态", title: "曲阳雕刻：千年技艺焕发新生，数字化赋能产业升级", desc: "2024年曲阳县大力推动雕刻产业数字化转型，建设雕刻产业互联网平台，超2000家雕刻厂家入驻平台，线上询价、3D建模、来图定制……" },
    { day: "12", month: "2024-06", tag: "展会资讯", title: "曲阳雕刻亮相中国（北京）国际园林博览会", desc: "曲阳组织38家重点雕刻企业参展北京园博会，展出汉白玉精品、铜雕、不锈钢雕塑等200余件作品，现场签约金额超8000万元……" },
    { day: "05", month: "2024-06", tag: "技术科普", title: "汉白玉雕刻如何选料？不同等级汉白玉特点对比", desc: "汉白玉分为一级、二级、三级料，一级料洁白细腻无杂质，适合佛像、精品雕塑；二级料适合栏板、浮雕；三级料适合工程用石……" },
    { day: "28", month: "2024-05", tag: "政策解读", title: "曲阳县出台扶持政策：雕刻企业技改补贴最高200万", desc: "曲阳县政府发布《雕刻产业高质量发展扶持办法》，对企业技术改造、品牌建设、人才培养、电商发展等给予资金补贴……" }
  ];

  /* ============================================================
     渲染辅助
     ============================================================ */

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function productCard(p) {
    var cat = CATEGORIES.find(function (c) { return c.key === p.cat; });
    var card = el("a", "product-card");
    card.href = "product-detail.html?id=" + p.id;
    var thumb = el("div", "product-thumb");
    var pattern = el("div", "thumb-pattern");
    pattern.setAttribute("style", productPattern(p.cat, p.id));
    thumb.appendChild(pattern);
    if (p.tag) {
      var tag = el("span", "product-tag", p.tag);
      thumb.appendChild(tag);
    }
    card.appendChild(thumb);

    var body = el("div", "product-body");
    body.appendChild(el("h3", null, p.name));
    body.appendChild(el("div", "product-spec", p.spec));
    var foot = el("div", "product-foot");
    foot.appendChild(el("div", "product-price", "¥" + p.price + ' <small>' + p.unit + "</small>"));
    foot.appendChild(el("a", "btn btn-accent btn-sm", "询价"));
    foot.lastChild.setAttribute("href", "inquiry.html?product=" + encodeURIComponent(p.name));
    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function categoryCard(c) {
    var card = el("a", "category-card");
    card.href = "products.html?cat=" + c.key;
    var icon = el("div", "cat-icon", c.icon);
    icon.style.background = "linear-gradient(135deg," + c.color + "22," + c.color + "44)";
    icon.style.color = c.color;
    card.appendChild(icon);
    card.appendChild(el("h3", null, c.name));
    card.appendChild(el("p", null, c.desc));
    return card;
  }

  function makerCard(m) {
    var card = el("div", "maker-card");
    var logo = el("div", "maker-logo", m.logo);
    logo.style.background = "linear-gradient(135deg," + m.color + "," + m.color + "cc)";
    card.appendChild(logo);
    card.appendChild(el("h3", null, m.name));
    card.appendChild(el("div", "maker-main", m.main));
    var badges = el("div", "maker-badges");
    m.badges.forEach(function (b, i) {
      var cls = i === 0 ? "maker-badge verified" : "maker-badge";
      badges.appendChild(el("span", cls, b));
    });
    card.appendChild(badges);
    return card;
  }

  function caseCard(c) {
    var card = el("a", "case-card");
    card.href = "cases.html";
    var thumb = el("div", "case-thumb");
    var pattern = el("div", "thumb-pattern");
    pattern.setAttribute("style", productPattern(c.cat, c.id + 3));
    thumb.appendChild(pattern);
    thumb.appendChild(el("span", "case-cat", c.catName));
    card.appendChild(thumb);
    var body = el("div", "case-body");
    body.appendChild(el("h3", null, c.title));
    var meta = el("div", "case-meta");
    meta.appendChild(el("span", null, c.location));
    body.appendChild(meta);
    body.appendChild(el("p", "case-desc", c.desc));
    card.appendChild(body);
    return card;
  }

  function newsCard(n) {
    var card = el("a", "news-card");
    card.href = "news.html";
    var date = el("div", "news-date");
    date.appendChild(el("div", "day", n.day));
    date.appendChild(el("div", "month", n.month));
    card.appendChild(date);
    var content = el("div", "news-content");
    content.appendChild(el("h3", null, n.title));
    content.appendChild(el("p", null, n.desc));
    content.appendChild(el("span", "news-tag", n.tag));
    card.appendChild(content);
    return card;
  }

  /* ============================================================
     首页渲染
     ============================================================ */
  function initHome() {
    var catBox = document.getElementById("homeCategories");
    if (catBox) CATEGORIES.forEach(function (c) { catBox.appendChild(categoryCard(c)); });

    var prodBox = document.getElementById("homeProducts");
    if (prodBox) PRODUCTS.slice(0, 8).forEach(function (p) { prodBox.appendChild(productCard(p)); });

    var makerBox = document.getElementById("homeMakers");
    if (makerBox) MAKERS.forEach(function (m) { makerBox.appendChild(makerCard(m)); });

    var caseBox = document.getElementById("homeCases");
    if (caseBox) CASES.slice(0, 3).forEach(function (c) { caseBox.appendChild(caseCard(c)); });

    var newsBox = document.getElementById("homeNews");
    if (newsBox) NEWS.slice(0, 4).forEach(function (n) { newsBox.appendChild(newsCard(n)); });

    // 数字滚动动画
    animateStats();
  }

  function animateStats() {
    var nums = document.querySelectorAll("[data-count]");
    nums.forEach(function (node) {
      var target = parseInt(node.getAttribute("data-count"), 10);
      var cur = 0;
      var step = Math.max(1, Math.ceil(target / 40));
      var timer = setInterval(function () {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(timer); }
        node.firstChild ? (node.firstChild.nodeValue = cur) : (node.textContent = cur);
      }, 30);
    });
  }

  /* ============================================================
     产品列表页
     ============================================================ */
  var PRODUCT_PAGE = { current: 1, size: 8, cat: "all" };

  function initProductsPage() {
    var listBox = document.getElementById("productList");
    var chipsBox = document.getElementById("catChips");
    if (!listBox) return;

    // 读取 URL 分类
    var params = new URLSearchParams(location.search);
    var cat = params.get("cat") || "all";
    PRODUCT_PAGE.cat = cat;

    // 渲染分类筛选
    if (chipsBox) {
      var allChip = el("button", "chip" + (cat === "all" ? " active" : ""), "全部");
      allChip.addEventListener("click", function () { setCat("all"); });
      chipsBox.appendChild(allChip);
      CATEGORIES.forEach(function (c) {
        var chip = el("button", "chip" + (cat === c.key ? " active" : ""), c.name);
        chip.addEventListener("click", function () { setCat(c.key); });
        chipsBox.appendChild(chip);
      });
    }

    renderProductList();
  }

  function setCat(cat) {
    PRODUCT_PAGE.cat = cat;
    PRODUCT_PAGE.current = 1;
    var chips = document.querySelectorAll("#catChips .chip");
    chips.forEach(function (chip) {
      chip.classList.remove("active");
      if (
        (cat === "all" && chip.textContent === "全部") ||
        CATEGORIES.some(function (c) { return c.key === cat && c.name === chip.textContent; })
      ) {
        chip.classList.add("active");
      }
    });
    renderProductList();
  }

  function filteredProducts() {
    if (PRODUCT_PAGE.cat === "all") return PRODUCTS;
    return PRODUCTS.filter(function (p) { return p.cat === PRODUCT_PAGE.cat; });
  }

  function renderProductList() {
    var listBox = document.getElementById("productList");
    var pageBox = document.getElementById("productPagination");
    if (!listBox) return;
    var list = filteredProducts();
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE.size));
    if (PRODUCT_PAGE.current > totalPages) PRODUCT_PAGE.current = totalPages;

    listBox.innerHTML = "";
    var start = (PRODUCT_PAGE.current - 1) * PRODUCT_PAGE.size;
    var slice = list.slice(start, start + PRODUCT_PAGE.size);

    if (slice.length === 0) {
      listBox.appendChild(el("div", "empty-state", '<div class="es-icon">📭</div><p>暂无相关产品</p>'));
    } else {
      slice.forEach(function (p) { listBox.appendChild(productCard(p)); });
    }

    // 分页
    if (pageBox) {
      pageBox.innerHTML = "";
      var prev = el("button", null, "上一页");
      prev.disabled = PRODUCT_PAGE.current <= 1;
      prev.addEventListener("click", function () { if (PRODUCT_PAGE.current > 1) { PRODUCT_PAGE.current--; renderProductList(); window.scrollTo({ top: 200, behavior: "smooth" }); } });
      pageBox.appendChild(prev);
      for (var i = 1; i <= totalPages; i++) {
        (function (i) {
          var btn = el("button", i === PRODUCT_PAGE.current ? "active" : null, String(i));
          btn.addEventListener("click", function () { PRODUCT_PAGE.current = i; renderProductList(); window.scrollTo({ top: 200, behavior: "smooth" }); });
          pageBox.appendChild(btn);
        })(i);
      }
      var next = el("button", null, "下一页");
      next.disabled = PRODUCT_PAGE.current >= totalPages;
      next.addEventListener("click", function () { if (PRODUCT_PAGE.current < totalPages) { PRODUCT_PAGE.current++; renderProductList(); window.scrollTo({ top: 200, behavior: "smooth" }); } });
      pageBox.appendChild(next);
    }

    // 结果计数
    var count = document.getElementById("resultCount");
    if (count) count.textContent = "共 " + total + " 个产品";
  }

  /* ============================================================
     产品详情页
     ============================================================ */
  function initDetailPage() {
    var box = document.getElementById("detailRoot");
    if (!box) return;
    var params = new URLSearchParams(location.search);
    var id = parseInt(params.get("id"), 10) || 1;
    var p = PRODUCTS.find(function (x) { return x.id === id; }) || PRODUCTS[0];
    var cat = CATEGORIES.find(function (c) { return c.key === p.cat; });
    var maker = MAKERS.find(function (m) { return m.name === p.maker; }) || MAKERS[0];

    document.getElementById("detailName").textContent = p.name;
    document.getElementById("detailCat").textContent = cat.name;
    document.getElementById("detailPrice").textContent = "¥" + p.price;
    document.getElementById("detailPriceUnit").textContent = p.unit;
    document.getElementById("detailSpec").textContent = p.spec;

    // 主图
    var mainImg = document.getElementById("detailMainImg");
    mainImg.setAttribute("style", productPattern(p.cat, p.id));

    // 缩略图
    var thumbs = document.getElementById("detailThumbs");
    thumbs.innerHTML = "";
    for (var i = 0; i < 4; i++) {
      (function (i) {
        var t = el("div", "dt" + (i === 0 ? " active" : ""));
        t.setAttribute("style", productPattern(p.cat, p.id + i));
        t.addEventListener("click", function () {
          mainImg.setAttribute("style", productPattern(p.cat, p.id + i));
          thumbs.querySelectorAll(".dt").forEach(function (x) { x.classList.remove("active"); });
          t.classList.add("active");
        });
        thumbs.appendChild(t);
      })(i);
    }

    // 规格表
    var specTable = document.getElementById("detailSpecTable");
    var specs = [
      ["产品名称", p.name],
      ["所属分类", cat.name],
      ["规格参数", p.spec],
      ["材质", p.spec.split("/")[0] ? p.spec.split("/")[0].trim() : "—"],
      ["价格区间", "¥" + p.price + " " + p.unit],
      ["起订量", "100 " + (p.unit.indexOf("片") > -1 ? "片" : "㎡")],
      ["供货能力", "50000 " + (p.unit.indexOf("片") > -1 ? "片/月" : "㎡/月")],
      ["发货地", "河北·曲阳雕刻"]
    ];
    specTable.innerHTML = specs.map(function (s) {
      return "<tr><th>" + s[0] + "</th><td>" + s[1] + "</td></tr>";
    }).join("");

    // 厂家信息
    var dm = document.getElementById("detailMaker");
    dm.innerHTML = "";
    var logo = el("div", "dm-logo", maker.logo);
    logo.style.background = "linear-gradient(135deg," + maker.color + "," + maker.color + "cc)";
    dm.appendChild(logo);
    var info = el("div", "dm-info");
    info.appendChild(el("h4", null, maker.name));
    info.appendChild(el("p", null, "主营：" + maker.main + " · 源头厂家 · 资质认证"));
    dm.appendChild(info);
    dm.appendChild(el("a", "btn btn-outline btn-sm", "进入厂家"));
    dm.lastChild.setAttribute("href", "about.html");

    // 询价按钮
    var iq = document.getElementById("detailInquiry");
    if (iq) iq.setAttribute("href", "inquiry.html?product=" + encodeURIComponent(p.name));

    // 相关产品
    var rel = document.getElementById("relatedProducts");
    if (rel) {
      PRODUCTS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4).forEach(function (x) { rel.appendChild(productCard(x)); });
    }
  }

  /* ============================================================
     案例页
     ============================================================ */
  function initCasesPage() {
    var listBox = document.getElementById("caseList");
    var chipsBox = document.getElementById("caseChips");
    if (!listBox) return;

    var cats = [{ key: "all", name: "全部" }];
    CATEGORIES.forEach(function (c) {
      if (CASES.some(function (cs) { return cs.cat === c.key; })) {
        cats.push(c);
      }
    });

    if (chipsBox) {
      cats.forEach(function (c) {
        var chip = el("button", "chip" + (c.key === "all" ? " active" : ""), c.name);
        chip.addEventListener("click", function () {
          chipsBox.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("active"); });
          chip.classList.add("active");
          renderCases(c.key);
        });
        chipsBox.appendChild(chip);
      });
    }
    renderCases("all");
  }

  function renderCases(cat) {
    var listBox = document.getElementById("caseList");
    listBox.innerHTML = "";
    var list = cat === "all" ? CASES : CASES.filter(function (c) { return c.cat === cat; });
    if (list.length === 0) {
      listBox.appendChild(el("div", "empty-state", '<div class="es-icon">📭</div><p>暂无相关案例</p>'));
    } else {
      list.forEach(function (c) { listBox.appendChild(caseCard(c)); });
    }
  }

  /* ============================================================
     新闻页
     ============================================================ */
  function initNewsPage() {
    var listBox = document.getElementById("newsList");
    if (!listBox) return;
    NEWS.forEach(function (n) { listBox.appendChild(newsCard(n)); });
  }

  /* ============================================================
     表单验证（询价 / 联系留言）
     ============================================================ */
  function validateForm(form) {
    var ok = true;
    var required = form.querySelectorAll("[data-required]");
    required.forEach(function (field) {
      var val = (field.value || "").trim();
      var err = field.nextElementSibling;
      if (!val) {
        field.classList.add("error");
        ok = false;
      } else if (field.type === "tel" && !/^1[3-9]\d{9}$|^\d{3,4}-?\d{7,8}$/.test(val)) {
        field.classList.add("error");
        ok = false;
      } else {
        field.classList.remove("error");
      }
    });
    return ok;
  }

  function initForms() {
    // 询价表单
    var iqForm = document.getElementById("inquiryForm");
    if (iqForm) {
      // 预填产品名
      var params = new URLSearchParams(location.search);
      var pre = params.get("product");
      if (pre) {
        var nameField = iqForm.querySelector("[name='product']");
        if (nameField) nameField.value = decodeURIComponent(pre);
      }
      iqForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = validateForm(iqForm);
        var success = document.getElementById("inquirySuccess");
        if (ok) {
          if (success) {
            success.classList.add("show");
            success.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          iqForm.reset();
          if (pre) {
            var nameField2 = iqForm.querySelector("[name='product']");
            if (nameField2) nameField2.value = "";
          }
          setTimeout(function () { if (success) success.classList.remove("show"); }, 6000);
        }
      });
    }

    // 联系留言表单
    var ctForm = document.getElementById("contactForm");
    if (ctForm) {
      ctForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = validateForm(ctForm);
        var success = document.getElementById("contactSuccess");
        if (ok) {
          if (success) {
            success.classList.add("show");
            success.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          ctForm.reset();
          setTimeout(function () { if (success) success.classList.remove("show"); }, 6000);
        }
      });
    }

    // 实时清除错误
    document.querySelectorAll(".form-control").forEach(function (field) {
      field.addEventListener("input", function () { field.classList.remove("error"); });
    });
  }

  /* ============================================================
     初始化
     ============================================================ */
  function init() {
    injectLayout();
    initHome();
    initProductsPage();
    initDetailPage();
    initCasesPage();
    initNewsPage();
    initForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 暴露给页面调试用（可选）
  window.PortalSite = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS, MAKERS: MAKERS, CASES: CASES, NEWS: NEWS };
})();
