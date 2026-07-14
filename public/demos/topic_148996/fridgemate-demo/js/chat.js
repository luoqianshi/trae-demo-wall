/**
 * FridgeMate 对话交互模块
 * 文本输入 + AI 模拟回复（基于规则 + 库存上下文）
 */

const Chat = (() => {
  let context = {};

  // ========== 刷新上下文 ==========
  function refreshContext() {
    const foods = FridgeDB.getFoods();
    context = {
      foods: foods,
      freshFoods: foods.filter(f => f.status === '新鲜'),
      urgentFoods: foods.filter(f => f.status === '临期' || f.status === '已过期'),
      consumedFoods: foods.filter(f => f.status === '已吃完'),
      meats: foods.filter(f => f.category === '肉类' && f.status !== '已吃完'),
      veggies: foods.filter(f => f.category === '蔬菜' && f.status !== '已吃完'),
      byLocation: {},
      byCategory: {}
    };

    for (const f of foods) {
      if (!context.byLocation[f.location]) context.byLocation[f.location] = [];
      context.byLocation[f.location].push(f);
      if (!context.byCategory[f.category]) context.byCategory[f.category] = [];
      context.byCategory[f.category].push(f);
    }
  }

  // ========== 意图识别 ==========
  function parseIntent(input) {
    const text = input.trim();

    // 添加食材
    const addMatch = text.match(/^(?:冰箱)?加([\u4e00-\u9fa5]+)(\d+(?:\.\d+)?)\s*(个|盒|把|斤|袋|根|块|桶|瓶|包|条|颗|只)?$/);
    if (addMatch) {
      return { intent: 'add', name: addMatch[1], quantity: parseFloat(addMatch[2]) || 1, unit: addMatch[3] || '个' };
    }

    const addMatch2 = text.match(/^添加\s*(.+)$/);
    if (addMatch2) {
      return { intent: 'add_manual', raw: addMatch2[1] };
    }

    // 消耗食材
    if (text.match(/^(吃完了?|没了|用完了?)$/) || text.match(/^(.+)吃完了?$/)) {
      const name = text.replace(/吃完了?|没了|用完了?/, '').trim();
      return { intent: 'consume', name: name || null };
    }

    // 查询特定分类（必须在通用查询前面）
    if (text.match(/有什么(肉|蔬菜|水果|饮料|冷冻)/)) {
      const cat = text.match(/有什么(肉|蔬菜|水果|饮料|冷冻)/)[1];
      return { intent: 'query_category', category: cat === '肉' ? '肉类' : cat === '冷冻' ? '冷冻食品' : cat };
    }

    if (text.match(/^(冷藏|冷冻).*有什么/)) {
      return { intent: 'query_location', keyword: text };
    }

    // 查询全部库存
    if (text.match(/^(有什么|冰箱里有什么|看看|查看|库存|查一下)/)) {
      return { intent: 'query_all' };
    }

    // 查询特定食材
    const queryMatch = text.match(/^(?:还有?|有没有?)(.+?)吗/);
    if (queryMatch) {
      return { intent: 'query_specific', name: queryMatch[1] };
    }

    // 需要补充什么
    if (text.match(/(需要补充|要买什么|缺什么|购物清单|采购)/)) {
      return { intent: 'shopping_list' };
    }

    // 定时提醒
    const remindMatch = text.match(/(\d+)\s*(小时|分钟|天)\s*(后|之后)\s*提醒\s*(?:我)?\s*(.+)/);
    if (remindMatch) {
      return { intent: 'remind', value: parseInt(remindMatch[1]), unit: remindMatch[2], message: remindMatch[4] };
    }

    const remindMatch2 = text.match(/提醒\s*(?:我)?\s*(.+)/);
    if (remindMatch2) {
      return { intent: 'remind_vague', message: remindMatch2[1] };
    }

    // 菜谱推荐
    if (text.match(/(吃什么|推荐|建议|菜谱|做什么|怎么做|今晚吃)/)) {
      return { intent: 'recipe' };
    }

    // 问候
    if (text.match(/^(你好|嗨|早上好|晚安|早安|下午好)/)) {
      return { intent: 'greet' };
    }

    // 帮助
    if (text.match(/^(帮助|怎么用|能做什么|功能)/)) {
      return { intent: 'help' };
    }

    // 感谢
    if (text.match(/^(谢谢|多谢|感谢)/)) {
      return { intent: 'thanks' };
    }

    return { intent: 'unknown' };
  }

  // ========== 生成回复 ==========
  function generateReply(input) {
    refreshContext();
    const intent = parseIntent(input);

    switch (intent.intent) {
      case 'add': return handleAdd(intent);
      case 'add_manual': return handleAddManual(intent);
      case 'consume': return handleConsume(intent);
      case 'query_all': return handleQueryAll();
      case 'query_category': return handleQueryCategory(intent);
      case 'query_location': return handleQueryLocation(intent);
      case 'query_specific': return handleQuerySpecific(intent);
      case 'shopping_list': return handleShoppingList();
      case 'remind': return handleRemind(intent);
      case 'remind_vague': return { reply: '好的，请告诉我具体什么时候提醒？比如"3小时后提醒我解冻五花肉"', action: null };
      case 'recipe': return handleRecipe();
      case 'greet': return handleGreet();
      case 'help': return handleHelp();
      case 'thanks': return { reply: '不客气！有需要随时叫我～', action: null };
      default: return handleUnknown(input);
    }
  }

  function handleAdd(intent) {
    const name = intent.name;
    const cat = guessCategory(name);
    const loc = guessLocation(cat);
    const emoji = guessEmoji(name, cat);
    const today = new Date().toISOString().split('T')[0];
    const expiry = guessExpiry(cat);

    FridgeDB.addFood({
      name, emoji, category: cat, location: loc,
      quantity: intent.quantity, unit: intent.unit,
      expiry_date: expiry, status: '新鲜'
    });

    refreshContext();
    return { reply: `收到！${emoji} ${name} ${intent.quantity}${intent.unit}已放入${loc}～`, action: 'refresh' };
  }

  function handleAddManual(intent) {
    return { reply: `要添加「${intent.raw}」对吗？请告诉我数量、单位和大概多久会过期～`, action: 'open_add' };
  }

  function handleConsume(intent) {
    if (intent.name) {
      const match = context.foods.find(f => f.name.includes(intent.name) && f.status !== '已吃完');
      if (match) {
        FridgeDB.consumeFood(match.id);
        refreshContext();
        const suggestions = getShoppingSuggestions();
        let reply = `已标记${match.emoji} ${match.name}吃完啦～`;
        if (suggestions) reply += `\n\n${suggestions}`;
        return { reply, action: 'refresh' };
      }
      return { reply: `我没找到「${intent.name}」呢，要不要先添加一下？`, action: null };
    }
    return { reply: '请问什么吃完了？比如"鸡蛋吃完了"', action: null };
  }

  function handleQueryAll() {
    const active = context.foods.filter(f => f.status !== '已吃完');
    if (active.length === 0) return { reply: '冰箱空空如也，该去采购啦～', action: null };

    const byLoc = {};
    for (const f of active) {
      if (!byLoc[f.location]) byLoc[f.location] = [];
      byLoc[f.location].push(f);
    }

    let reply = '冰箱里现在有：\n';
    for (const [loc, items] of Object.entries(byLoc)) {
      const itemStr = items.map(f => {
        let extra = '';
        if (f.status === '临期') extra = '⚠️临期';
        else if (f.status === '已过期') extra = '❌已过期';
        return `${f.emoji}${f.name}(${f.quantity}${f.unit}${extra ? ' ' + extra : ''})`;
      }).join('、');
      reply += `${loc}：${itemStr}\n`;
    }

    if (context.urgentFoods.length > 0) {
      reply += `\n⚠️ ${context.urgentFoods.map(f => f.name).join('、')}需要尽快处理哦～`;
    }

    return { reply, action: null };
  }

  function handleQueryCategory(intent) {
    const cat = intent.category;
    const items = context.byCategory[cat] || [];
    const active = items.filter(f => f.status !== '已吃完');

    if (active.length === 0) return { reply: `${cat}没有存货了～`, action: null };

    const list = active.map(f => `${f.emoji}${f.name}(${f.quantity}${f.unit}，${f.location})`).join('、');
    return { reply: `${cat}：${list}`, action: null };
  }

  function handleQueryLocation(intent) {
    return handleQueryAll();
  }

  function handleQuerySpecific(intent) {
    const matches = context.foods.filter(f => f.name.includes(intent.name) && f.status !== '已吃完');
    if (matches.length === 0) {
      return { reply: `没有找到「${intent.name}」哦～`, action: null };
    }
    const list = matches.map(f => {
      let status = '';
      if (f.status === '临期') status = '，⚠️临期要注意';
      else if (f.status === '已过期') status = '，❌已经过期了';
      return `${f.emoji}${f.name} ${f.quantity}${f.unit}，在${f.location}${status}`;
    }).join('\n');
    return { reply: list, action: null };
  }

  function handleShoppingList() {
    const suggestions = getShoppingSuggestions();
    if (!suggestions) return { reply: '目前库存充足，不需要补充什么～', action: null };
    return { reply: suggestions, action: null };
  }

  function getShoppingSuggestions() {
    const need = [];
    const consumed = context.consumedFoods.map(f => f.name);
    const urgent = context.urgentFoods.map(f => f.name);
    const low = context.freshFoods.filter(f => f.quantity <= 2 && f.status !== '已吃完').map(f => f.name);

    const all = [...new Set([...consumed, ...urgent, ...low])];
    if (all.length === 0) return null;

    return '建议采购：' + all.join('、');
  }

  function handleRemind(intent) {
    const now = new Date();
    let ms = intent.value;
    if (intent.unit === '分钟') ms *= 60 * 1000;
    else if (intent.unit === '小时') ms *= 3600 * 1000;
    else if (intent.unit === '天') ms *= 86400 * 1000;

    const remindAt = new Date(now.getTime() + ms);
    const timeStr = remindAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = remindAt.toISOString().replace('T', ' ').substring(0, 16);

    FridgeDB.addReminder(null, dateStr, intent.message);

    // 设置浏览器通知
    const delay = ms;
    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('冰箱精灵提醒', { body: intent.message, icon: '🧚' });
        }
        alert(`🧚 冰箱精灵提醒：${intent.message}`);
      }, delay);
    }

    return { reply: `好的，${intent.value}${intent.unit}后（${timeStr}）提醒你「${intent.message}」～`, action: null };
  }

  function handleRecipe() {
    const meats = context.meats;
    const veggies = context.veggies;

    if (meats.length === 0 && veggies.length === 0) {
      return { reply: '冰箱里没什么食材呢，先去买点菜吧～', action: null };
    }

    const recipes = suggestRecipes(meats, veggies);
    return { reply: recipes, action: null };
  }

  function suggestRecipes(meats, veggies) {
    const allRecipes = [
      { name: '红烧肉', need: ['五花肉'], match: 0, extra: '葱姜蒜、酱油、冰糖' },
      { name: '宫保鸡丁', need: ['鸡胸肉'], match: 0, extra: '花生、黄瓜、干辣椒' },
      { name: '番茄炒蛋', need: ['鸡蛋'], match: 0, extra: '番茄' },
      { name: '蒜蓉青菜', need: ['青菜'], match: 0, extra: '蒜' },
      { name: '小炒肉', need: ['五花肉'], match: 0, extra: '青椒、蒜苗' },
      { name: '鸡胸肉沙拉', need: ['鸡胸肉'], match: 0, extra: '生菜、番茄' },
      { name: '肉末蒸蛋', need: ['鸡蛋'], match: 0, extra: '肉末' },
      { name: '水煮肉片', need: ['五花肉'], match: 0, extra: '豆芽、干辣椒、花椒' },
    ];

    const allFoods = [...meats, ...veggies];
    const foodNames = allFoods.map(f => f.name);

    for (const r of allRecipes) {
      r.match = r.need.filter(n => foodNames.includes(n)).length;
    }

    allRecipes.sort((a, b) => b.match - a.match);
    const top = allRecipes.filter(r => r.match > 0).slice(0, 3);

    if (top.length === 0) {
      const names = allFoods.map(f => f.name).join('、');
      return `根据现有食材（${names}），暂时没有匹配的菜谱。要不要试试问"有什么肉"看看库存？`;
    }

    let reply = '根据冰箱里的食材，推荐：\n';
    for (const r of top) {
      reply += `\n🍳 ${r.name}（用到了${r.need.join('、')}${r.extra ? '，还需要' + r.extra : ''}）`;
    }
    return reply;
  }

  function handleGreet() {
    const hour = new Date().getHours();
    let greeting = hour < 12 ? '早安' : hour < 18 ? '下午好' : '晚上好';
    const active = context.foods.filter(f => f.status !== '已吃完');

    let reply = `${greeting}！`;
    if (active.length === 0) {
      reply += '冰箱空空如也，该去采购啦～';
    } else {
      reply += `冰箱里现在有${active.length}种食材。`;
      if (context.urgentFoods.length > 0) {
        reply += `⚠️ ${context.urgentFoods.map(f => f.name).join('、')}需要尽快处理哦。`;
      }
      reply += '\n试试说"有什么肉"或"推荐菜谱"吧～';
    }
    return { reply, action: null };
  }

  function handleHelp() {
    return {
      reply: `我可以帮你做这些事：
🥬 添加食材——说"冰箱加鸡蛋1盒"
🔍 查询库存——说"有什么肉"或"冰箱里有什么"
🍽️ 消耗食材——说"鸡蛋吃完了"
🛒 采购建议——说"需要补充什么"
⏰ 定时提醒——说"3小时后提醒我解冻五花肉"
🍳 菜谱推荐——说"推荐菜谱"或"今晚吃什么"

试试看吧～`,
      action: null
    };
  }

  function handleUnknown(input) {
    return {
      reply: `抱歉，我还不太理解"${input}"。\n\n试试这些：\n· "冰箱加鸡蛋1盒"\n· "有什么肉"\n· "推荐菜谱"\n· "需要补充什么"\n· "3小时后提醒我解冻五花肉"`,
      action: null
    };
  }

  // ========== 智能推断 ==========
  function guessCategory(name) {
    const map = {
      '猪肉': '肉类', '牛肉': '肉类', '羊肉': '肉类', '鸡肉': '肉类', '鸭肉': '肉类',
      '五花肉': '肉类', '排骨': '肉类', '鸡胸肉': '肉类', '鸡腿': '肉类', '鸡翅': '肉类',
      '鱼肉': '肉类', '虾': '肉类', '虾仁': '肉类', '香肠': '肉类', '火腿': '肉类',
      '青菜': '蔬菜', '白菜': '蔬菜', '菠菜': '蔬菜', '生菜': '蔬菜', '西兰花': '蔬菜',
      '番茄': '蔬菜', '西红柿': '蔬菜', '黄瓜': '蔬菜', '胡萝卜': '蔬菜', '土豆': '蔬菜',
      '洋葱': '蔬菜', '青椒': '蔬菜', '辣椒': '蔬菜', '豆腐': '蔬菜',
      '苹果': '水果', '香蕉': '水果', '橙子': '水果', '葡萄': '水果', '草莓': '水果',
      '牛奶': '乳制品', '酸奶': '乳制品', '奶酪': '乳制品', '黄油': '乳制品',
      '可乐': '饮料', '雪碧': '饮料', '果汁': '饮料', '啤酒': '饮料', '矿泉水': '饮料',
      '冰棍': '冷冻食品', '冰淇淋': '冷冻食品', '饺子': '冷冻食品', '汤圆': '冷冻食品', '速冻水饺': '冷冻食品',
      '鸡蛋': '其他', '鸭蛋': '其他',
      '酱油': '调味品', '醋': '调味品', '盐': '调味品', '油': '调味品',
    };
    return map[name] || '其他';
  }

  function guessLocation(cat) {
    const config = FridgeDB.getFridgeConfig();
    const locs = config.locations;
    const map = {
      '肉类': locs.find(l => l.includes('冷冻下层')) || locs.find(l => l.includes('冷冻')) || locs[0],
      '冷冻食品': locs.find(l => l.includes('冷冻上层')) || locs.find(l => l.includes('冷冻')) || locs[0],
      '蔬菜': locs.find(l => l.includes('冷藏上层')) || locs.find(l => l.includes('冷藏')) || locs[0],
      '水果': locs.find(l => l.includes('冷藏上层')) || locs.find(l => l.includes('冷藏')) || locs[0],
      '乳制品': locs.find(l => l.includes('门架')) || locs[0],
      '饮料': locs.find(l => l.includes('门架')) || locs[0],
      '调味品': locs.find(l => l.includes('门架')) || locs[0],
    };
    return map[cat] || locs[0];
  }

  function guessEmoji(name, cat) {
    const map = {
      '五花肉': '🥩', '排骨': '🍖', '猪肉': '🥩', '牛肉': '🥩', '羊肉': '🐑',
      '鸡肉': '🍗', '鸡胸肉': '🍗', '鸡腿': '🍗', '鸡翅': '🍗',
      '鱼肉': '🐟', '虾': '🦐', '虾仁': '🦐',
      '鸡蛋': '🥚', '鸭蛋': '🥚',
      '青菜': '🥬', '白菜': '🥬', '菠菜': '🥬', '生菜': '🥬', '西兰花': '🥦',
      '番茄': '🍅', '西红柿': '🍅', '黄瓜': '🥒', '胡萝卜': '🥕', '土豆': '🥔',
      '洋葱': '🧅', '青椒': '🫑', '辣椒': '🌶️', '豆腐': '🧈',
      '苹果': '🍎', '香蕉': '🍌', '橙子': '🍊', '葡萄': '🍇', '草莓': '🍓',
      '牛奶': '🥛', '酸奶': '🥛', '奶酪': '🧀', '黄油': '🧈',
      '可乐': '🥤', '雪碧': '🥤', '果汁': '🧃', '啤酒': '🍺', '矿泉水': '💧',
      '冰棍': '🍦', '冰淇淋': '🍦', '饺子': '🥟', '汤圆': '🍡', '速冻水饺': '🥟',
      '酱油': '🫙', '醋': '🫙', '盐': '🧂', '油': '🫒',
    };
    return map[name] || (cat === '肉类' ? '🥩' : cat === '蔬菜' ? '🥬' : cat === '水果' ? '🍎' : cat === '乳制品' ? '🥛' : cat === '饮料' ? '🥤' : cat === '冷冻食品' ? '❄️' : '📦');
  }

  function guessExpiry(cat) {
    const today = new Date();
    const days = { '肉类': 7, '蔬菜': 5, '水果': 7, '乳制品': 10, '饮料': 30, '调味品': 90, '冷冻食品': 30, '其他': 14 };
    const d = new Date(today);
    d.setDate(d.getDate() + (days[cat] || 14));
    return d.toISOString().split('T')[0];
  }

  // ========== 渲染消息 ==========
  function addMessage(text, type) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    const result = generateReply(text);
    setTimeout(() => {
      addMessage(result.reply, 'spirit');
      if (result.action === 'refresh') {
        Inventory.render();
      } else if (result.action === 'open_add') {
        Inventory.showAddForm();
      }
    }, 400);
  }

  function initEvents() {
    document.getElementById('chat-send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // 快捷指令
    document.getElementById('chat-quick-btns').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick]');
      if (!btn) return;
      const input = document.getElementById('chat-input');
      input.value = btn.dataset.quick;
      sendMessage();
    });
  }

  return { refreshContext, sendMessage, addMessage, initEvents, generateReply };
})();