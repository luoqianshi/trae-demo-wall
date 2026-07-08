/* ============================================================
   modifier.js · 修改指令解析器
   支持三类指令：配色 / 文案 / 区块增删
   策略：配色与文案修改 opts 后重新渲染模板；区块增删做字符串注入
   ============================================================ */

window.Modifier = (function () {

  const FIELD_LABEL = { title: '标题', subtitle: '副标题', time: '时间', location: '地点', price: '价格' };

  // 解析配色指令
  function parsePaletteInstruction(text) {
    const PALETTES = window.Generator.PALETTES;
    const ALIASES = window.Generator.PALETTE_ALIASES;
    // 命中别名
    for (const name of Object.keys(ALIASES)) {
      for (const alias of ALIASES[name]) {
        if (text.indexOf(alias) >= 0) {
          return { name, palette: PALETTES[name] };
        }
      }
    }
    // "换成X色" 显式提取
    const m = text.match(/(?:换成|改成|改为|调整[为成]|用)\s*([^\s,，。的]+?)(?:色|色调|风格|配色)/);
    if (m) {
      const want = m[1];
      for (const name of Object.keys(PALETTES)) {
        if (name.indexOf(want) >= 0 || want.indexOf(name) >= 0) {
          return { name, palette: PALETTES[name] };
        }
      }
    }
    return null;
  }

  // 解析文案指令
  function parseTextInstruction(text) {
    const patterns = [
      { field: 'subtitle', re: /(?:副标题|标语|口号|slogan)[^改换为]{0,4}(?:改成|换成|改为|调整[为成])\s*["「『“]?([^"」』”]+?)["」』”]?$/ },
      { field: 'title',    re: /(?:标题|主题|名字)[^改换为]{0,4}(?:改成|换成|改为|调整[为成])\s*["「『“]?([^"」』”]+?)["」』”]?$/ },
      { field: 'time',     re: /时间[^改换为]{0,4}(?:改成|换成|改为|调整[为成])\s*([^，,。.]+)$/ },
      { field: 'location', re: /(?:地点|地址|位置)[^改换为]{0,4}(?:改成|换成|改为|调整[为成])\s*([^，,。.]+)$/ },
      { field: 'price',    re: /(?:价格|票价|售价)[^改换为]{0,4}(?:改成|换成|改为|调整[为成])\s*¥?\s*([^，,。.]+)$/ }
    ];
    for (const p of patterns) {
      const m = text.match(p.re);
      if (m) return { field: p.field, value: m[1].trim() };
    }
    return null;
  }

  // 解析区块指令
  function parseBlockInstruction(text) {
    if (/加/.test(text) && /(报名|表单|申请表)/.test(text)) return { action: 'add', block: 'form' };
    if (/加/.test(text) && /(按钮|购买|购票|下单|咨询)/.test(text)) return { action: 'add', block: 'button' };
    if (/加/.test(text) && /(评价|评论|留言)/.test(text)) return { action: 'add', block: 'reviews' };
    if (/(去[掉除]|删[除去]|不要)/.test(text) && /(评价|评论)/.test(text)) return { action: 'remove', block: 'reviews' };
    if (/(去[掉除]|删[除去]|不要)/.test(text) && /(表单|报名)/.test(text)) return { action: 'remove', block: 'form' };
    return null;
  }

  // 重新渲染
  function regenerate(opts, scene) {
    const html = window.Templates.renderers[scene](opts);
    return html;
  }

  // 注入报名表单
  function injectForm(html) {
    if (html.indexOf('报名表单') >= 0) return null; // 已存在
    const section = `
<section style="max-width:880px;margin:0 auto;padding:60px 20px;font-family:'Noto Sans SC',sans-serif">
  <h2 style="font-family:'Noto Serif SC',serif;font-size:1.8rem;font-weight:900;margin-bottom:8px;color:var(--c-text)">📝 报名表单</h2>
  <p style="color:#888;margin-bottom:24px">填写下方信息，我们会尽快联系你</p>
  <form onsubmit="event.preventDefault();alert('✅ 报名成功！（Demo）')" style="background:var(--c-bg-soft);padding:28px;border-radius:16px;display:grid;gap:16px;max-width:520px">
    <div><label style="display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600">姓名</label><input required style="width:100%;padding:12px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:14px;font-family:inherit" placeholder="你的名字"></div>
    <div><label style="display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600">联系方式</label><input required style="width:100%;padding:12px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:14px;font-family:inherit" placeholder="手机号 / 微信"></div>
    <button type="submit" style="padding:14px;background:var(--c-primary);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;letter-spacing:1px">提交报名</button>
  </form>
</section>`;
    if (html.indexOf('</body>') >= 0) return html.replace('</body>', section + '\n</body>');
    return html + section;
  }

  // 注入行动按钮
  function injectButton(html) {
    const btn = `
<div style="text-align:center;padding:40px 20px;font-family:'Noto Sans SC',sans-serif">
  <button onclick="alert('✅ 已收到你的请求（Demo）')" style="padding:14px 44px;background:var(--c-primary);color:#fff;border:none;border-radius:50px;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.15)">立即咨询</button>
</div>`;
    if (html.indexOf('</body>') >= 0) return html.replace('</body>', btn + '\n</body>');
    return html + btn;
  }

  // 移除区块（按关键词定位最近的 section）
  function removeBlock(html, block) {
    const markers = {
      reviews: /<!--\s*reviews\s*-->|<section[^>]*>[^<]*<(?:h[1-6]|div)[^>]*>[^<]*(?:评价|评论|留言)/,
      form: /<section[^>]*>[^<]*<(?:h[1-6]|div)[^>]*>[^<]*报名表单/
    };
    const re = markers[block];
    if (!re) return null;
    const m = html.match(re);
    if (!m) return null;
    // 删除从该 section 开始到 </section> 的部分
    const start = m.index;
    const end = html.indexOf('</section>', start);
    if (end < 0) return null;
    return html.slice(0, start) + html.slice(end + '</section>'.length);
  }

  function apply(currentHtml, opts, scene, instruction) {
    const text = (instruction || '').trim();
    if (!text) return { html: currentHtml, opts, message: '请输入修改指令', changed: false };
    const newOpts = Object.assign({}, opts);

    // 1. 配色
    const p = parsePaletteInstruction(text);
    if (p) {
      newOpts.palette = p.palette;
      newOpts.paletteName = p.name;
      const html = regenerate(newOpts, scene);
      return { html, opts: newOpts, message: `已换成「${p.name}」配色 ✨`, changed: true };
    }

    // 2. 文案
    const t = parseTextInstruction(text);
    if (t) {
      newOpts[t.field] = t.value;
      const html = regenerate(newOpts, scene);
      return { html, opts: newOpts, message: `已更新${FIELD_LABEL[t.field]}为「${t.value}」 ✨`, changed: true };
    }

    // 3. 区块
    const b = parseBlockInstruction(text);
    if (b) {
      if (b.action === 'add') {
        let html;
        if (b.block === 'form') html = injectForm(currentHtml);
        else if (b.block === 'button') html = injectButton(currentHtml);
        if (html) return { html, opts: newOpts, message: '已加入报名表单 ✨', changed: true };
        return { html: currentHtml, opts, message: '当前页面已经有一个报名表单啦', changed: false };
      }
      if (b.action === 'remove') {
        const html = removeBlock(currentHtml, b.block);
        if (html) return { html, opts: newOpts, message: '已移除该区块 ✨', changed: true };
        return { html: currentHtml, opts, message: '当前页面没有找到这个区块', changed: false };
      }
    }

    return {
      html: currentHtml, opts, changed: false,
      message: '没太听懂这个指令 🤔 试试：「换成粉色」「标题改成夏日狂欢」「加个报名表单」'
    };
  }

  return { apply, parsePaletteInstruction, parseTextInstruction, parseBlockInstruction };
})();
