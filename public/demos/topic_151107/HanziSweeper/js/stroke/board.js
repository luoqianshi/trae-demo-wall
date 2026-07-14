// ====== 笔划扫雷棋盘生成 ======
import { HANZI_DB, getWuxing } from '../data.js';
import { findByComponents } from '../decomposition.js';

/** 部首笔画数映射（精简版） */
const STROKE_MAP = {
    '一':1, '丨':1, '丿':1, '丶':1, '乙':1, '亅':1,
    '二':2, '十':2, '厂':2, '卜':2, '人':2, '入':2, '八':2, '几':2,
    '力':2, '又':2, '了':2, '刀':2, '匕':2, '儿':2, '九':2, '冂':2,
    '三':3, '干':3, '工':3, '土':3, '士':3, '大':3, '寸':3, '小':3,
    '口':3, '山':3, '巾':3, '彳':3, '彡':3, '夕':3, '夂':3, '广':3,
    '门':3, '之':3, '尸':3, '己':3, '已':3, '巳':3, '弓':3, '子':3,
    '女':3, '幺':3, '马':3, '氵':3, '扌':3, '艹':3, '阝':3, '讠':3,
    '木':4, '不':4, '犬':4, '歹':4, '车':4, '戈':4, '比':4, '瓦':4,
    '止':4, '日':4, '曰':4, '月':4, '欠':4, '殳':4, '殳':4, '毋':4,
    '水':4, '火':4, '灬':4, '牛':4, '王':4, '见':4, '贝':4, '父':4,
    '心':4, '户':4, '手':4, '攵':4, '文':4, '斗':4, '斤':4, '方':4,
    '无':4, '毛':4, '气':4, '片':4, '牙':4, '爪':4, '爫':4, '爻':4,
    '夬':4, '区':4, '匹':4, '云':4, '专':4, '丐':4, '卅':4, '卌':4,
    '五':4, '井':4, '元':4, '天':4, '夫':4, '丰':4, '韦':4, '太':4,
    '尤':4, '历':4, '友':4, '巨':4, '屯':4, '互':4, '切':4, '艺':4,
    '世':5, '且':5, '失':5, '乍':5, '令':5, '包':5, '尔':5, '冬':5,
    '务':5, '氐':5, '勾':5, '勿':5, '册':5, '卯':5, '印':5, '氏':5,
    '民':5, '弗':5, '出':5, '皮':5, '矛':5, '母':5, '生':5, '用':5,
    '田':5, '由':5, '甲':5, '申':5, '电':5, '白':5, '目':5, '石':5,
    '示':5, '礻':5, '禾':5, '穴':5, '立':5, '龙':5, '鸟':5, '页':5,
    '弗':5, '必':5, '永':5, '汇':5, '汉':5, '对':5, '台':5, '纠':5,
    '驭':5, '丝':5, '主':5, '半':5, '去':5, '可':5, '只':5, '叫':5,
    '另':5, '兄':5, '史':5, '右':5, '号':5, '司':5, '四':5, '外':5,
    '央':5, '失':5, '头':5, '奶':5, '奴':5, '孕':5, '宁':5, '它':5,
    '写':5, '礼':5, '议':5, '记':5, '训':5, '让':5, '讨':5, '讯':5,
    '闪':5, '们':5, '他':5, '代':5, '仙':5, '付':5, '仗':5, '仔':5,
    '仕':5, '仞':5, '仟':5, '仡':5, '仫':5, '仭':5, '仸':5, '仹':5,
    '全':6, '会':6, '合':6, '各':6, '向':6, '后':6, '兆':6, '先':6,
    '寺':6, '共':6, '百':6, '有':6, '朱':6, '成':6, '杀':6, '杂':6,
    '机':6, '权':6, '过':6, '达':6, '迈':6, '早':6, '尖':6, '男':6,
    '休':6, '妈':6, '好':6, '林':6, '吹':6, '从':6, '李':6, '杏':6,
    '呆':6, '尘':6, '歪':6, '吞':6, '问':6, '闷':6, '闪':6, '闭':6,
    '江':6, '池':6, '沙':6, '泪':6, '汉':6, '没':6, '注':6, '活':6,
    '话':6, '说':6, '请':6, '认':6, '识':6, '记':6, '许':6, '评':6,
    '作':6, '你':6, '他':6, '们':6, '住':6, '位':6, '低':6, '体':6,
    '何':6, '但':6, '伯':6, '伴':6, '伙':6, '树':6, '板':6, '村':6,
    '权':6, '机':6, '材':6, '灯':6, '让':6, '饭':6, '抱':6, '挑':6,
    '岩':6, '跑':6, '闻':6, '相':6, '法':6, '松':6, '河':6, '明':6,
    '破':7, '清':7, '性':7, '做':7, '忠':7, '想':7, '阔':7, '湖':7,
    '海':7, '洋':7, '洗':7, '论':7, '语':7, '读':7, '课':7, '谁':7,
    '调':7, '谈':7, '船':7, '般':7, '航':7, '较':7, '轻':7, '辈':7,
    '连':7, '近':7, '远':7, '进':7, '运':7, '还':7, '这':7, '通':7,
    '速':7, '造':7, '道':7, '部':7, '都':7, '那':7, '邦':7, '邮':7,
    '量':7, '野':7, '铜':7, '银':7, '铁':7, '铅':7, '铆':7, '铈':7,
    '铉':7, '铊':7, '铋':7, '铌':7, '铍':7, '铏':7, '铐':7, '铑':7,
    '铒':7, '铓':7, '铔':7, '铕':7, '铖':7, '铗':7, '铘':7, '铙':7,
    '铚':7, '铛':7, '铜':7, '铝':7, '铞':7, '铟':7, '铠':7, '铡':7,
    '铢':7, '铣':7, '铤':7, '铥':7, '铦':7, '铧':7, '铨':7, '铩':7,
    '铪':7, '铫':7, '铬':7, '铳':7, '铴':7, '铷':7, '铹':7, '铼':7,
    '铽':7, '链':7, '铿':7, '锇':7, '锊':7, '锍':7, '锎':7, '锏':7,
    '锒':7, '锓':7, '锔':7, '锕':7, '锖':7, '锘':7, '锛':7, '锜':7,
    '锝':7, '锞':7, '锟':7, '锠':7, '锡':7, '锧':7, '锨':7, '锬':7,
    '锱':7, '锲':7, '锴':7, '锶':7, '锷':7, '锸':7, '锹':7, '锺':7,
    '锼':7, '锽':7, '锾':7, '锿':7, '镊':7, '镋':7, '镎':7, '镏':7,
    '镒':7, '镓':7, '镔':7, '镕':7, '镗':7, '镘':7, '镙':7, '镚':7,
    '镛':7, '镞':7, '镟':7, '镡':7, '镢':7, '镣':7, '镤':7, '镥':7,
    '镦':7, '镧':7, '镨':7, '镩':7, '镪':7, '镫':7, '镬':7, '镭':7,
    '镮':7, '镲':7, '镳':7, '镴':7, '镵':7, '镸':7, '镹':7, '镺':7,
    '镻':7, '镼':7, '镽':7, '镾':7, '长':7, '長':7, '門':7, '阰':7,
    '隹':7, '雨':7, '青':7, '非':7, '革':7, '音':7, '食':7, '鬼':7,
    '需':8, '翰':8, '魏':8, '郭':8, '殿':8, '港':8, '市':8, '城':8,
    '宫':8, '巍':8, '瀚':8, '翱':8, '鸿':8, '儒':8, '睿':8,
};

/** 获取笔画数 */
function getStrokeCount(component) {
    if (STROKE_MAP[component] !== undefined) return STROKE_MAP[component];
    const found = HANZI_DB.find(h => h.char === component);
    if (found && found.strokes) return found.strokes;
    return 5;
}

/** 计算相邻格子部首笔画总和 */
function sumAdjacentStrokes(grid, x, y, w, h) {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[ny][nx].type === 'radical') {
                sum += grid[ny][nx].strokes;
            }
        }
    return sum;
}

/** 创建部首条目 */
function createRadicalEntries(selected) {
    const entries = [];
    for (let ci = 0; ci < selected.length; ci++) {
        const ch = selected[ci];
        entries.push({ component: ch.left, charIndex: ci });
        entries.push({ component: ch.right, charIndex: ci });
    }
    return entries;
}

/** 随机选择汉字（五行均衡分布 + 优先有词条的字 + 跨房间去重） */
function selectCharacters(count, entryChars, excludeChars = []) {
    const excludeSet = new Set(excludeChars);
    const pool = [...HANZI_DB].filter(h => !excludeSet.has(h.char));
    const selected = [];
    const usedComps = new Set();

    // 优先确保入口字在棋盘上（入口字允许跨房间重复，不受 excludeChars 限制）
    if (entryChars && entryChars.length > 0) {
        for (const ec of entryChars) {
            // 入口字如果在 HANZI_DB 中，直接使用
            const entry = HANZI_DB.find(h => h.char === ec.char);
            if (entry) {
                selected.push(entry);
                usedComps.add(entry.left);
                usedComps.add(entry.right);
            } else if (ec.left && ec.right) {
                // 入口字自带部首定义，构造虚拟条目
                selected.push({
                    char: ec.char,
                    left: ec.left,
                    right: ec.right,
                    strokes: getStrokeCount(ec.char),
                    difficulty: 5
                });
                usedComps.add(ec.left);
                usedComps.add(ec.right);
            }
        }
    }

    // 补充剩余汉字，按五行均衡选择
    const remaining = count - selected.length;
    if (remaining > 0) {
        const available = pool.filter(e => !selected.includes(e));

        // 按五行属性分组
        const wuxingKeys = ['metal', 'wood', 'water', 'fire', 'earth'];
        const wuxingGroups = { metal: [], wood: [], water: [], fire: [], earth: [], none: [] };
        for (const e of available) {
            const wx = getWuxing(e.char);
            if (wx) wuxingGroups[wx].push(e);
            else wuxingGroups.none.push(e);
        }
        // 各组随机打乱
        for (const key of Object.keys(wuxingGroups)) {
            wuxingGroups[key].sort(() => Math.random() - 0.5);
        }

        // 统计当前已选汉字的五行分布
        const wuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
        for (const s of selected) {
            const wx = getWuxing(s.char);
            if (wx) wuxingCount[wx]++;
        }

        /** 检查字的部首是否与已用部首冲突 */
        const canUse = (e) => {
            if (e.left === e.right) return !usedComps.has(e.left);
            return !usedComps.has(e.left) && !usedComps.has(e.right);
        };

        /** 从指定分组中挑选一个可用的字（优先有词条） */
        const pickFrom = (group) => {
            const usable = group.filter(canUse);
            if (usable.length === 0) return null;
            // 优先有词条
            const withTrait = usable.find(e => e.trait);
            return withTrait || usable[0];
        };

        while (selected.length < count) {
            let picked = null;

            // 按五行数量升序，优先补充数量最少的五行
            const sorted = [...wuxingKeys].sort((a, b) => wuxingCount[a] - wuxingCount[b]);
            for (const wx of sorted) {
                picked = pickFrom(wuxingGroups[wx]);
                if (picked) {
                    wuxingCount[wx]++;
                    break;
                }
            }

            // 五行字都无可用的，从无五行属性的字中选
            if (!picked) {
                picked = pickFrom(wuxingGroups.none);
            }

            if (!picked) break; // 没有可用的字了

            selected.push(picked);
            usedComps.add(picked.left);
            usedComps.add(picked.right);

            // 从分组中移除已选
            const wx = getWuxing(picked.char);
            const group = wx ? wuxingGroups[wx] : wuxingGroups.none;
            const idx = group.indexOf(picked);
            if (idx >= 0) group.splice(idx, 1);
        }
    }
    return selected;
}

/** 尝试生成棋盘 */
function tryGenerateStrokeBoard(width, height, charCount, entryChars, excludeChars = []) {
    const selected = selectCharacters(charCount, entryChars, excludeChars);
    const radicalEntries = createRadicalEntries(selected);
    const totalRadicals = radicalEntries.length;
    const grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++)
            grid[y][x] = { type: 'number', state: 'hidden', number: 0, radicalIndex: -1, strokes: 0 };
    }
    const positions = [];
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) positions.push({ x, y });
    positions.sort(() => Math.random() - 0.5);
    for (let i = 0; i < totalRadicals; i++) {
        const { x, y } = positions[i];
        grid[y][x].type = 'radical';
        grid[y][x].radicalIndex = i;
        grid[y][x].strokes = getStrokeCount(radicalEntries[i].component);
    }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            if (grid[y][x].type === 'radical') continue;
            grid[y][x].number = sumAdjacentStrokes(grid, x, y, width, height);
        }
    let hasZero = false;
    for (let y = 0; y < height && !hasZero; y++)
        for (let x = 0; x < width && !hasZero; x++)
            if (grid[y][x].type === 'number' && grid[y][x].number === 0) hasZero = true;
    if (!hasZero) return null;
    return { width, height, grid, totalRadicals, characters: selected, radicalEntries };
}

/** 生成笔划扫雷棋盘 */
export function generateStrokeBoard(width, height, charCount, entryChars = [], excludeChars = []) {
    // 主选：使用完整 excludeChars 排除跨房间已用字
    for (let i = 0; i < 50; i++) {
        const b = tryGenerateStrokeBoard(width, height, charCount, entryChars, excludeChars);
        if (b) return b;
    }
    // 放宽：若排除后无法生成，逐步减少 excludeChars
    let relaxedExclude = [...excludeChars];
    while (relaxedExclude.length > 0) {
        relaxedExclude = relaxedExclude.slice(0, Math.floor(relaxedExclude.length / 2));
        for (let i = 0; i < 30; i++) {
            const b = tryGenerateStrokeBoard(width, height, charCount, entryChars, relaxedExclude);
            if (b) return b;
        }
    }
    // 最终回退：不排除任何字，减少字数
    return tryGenerateStrokeBoard(width, height, Math.min(2, charCount), entryChars, []);
}

/** 匹配两个部首能否组成汉字 */
export function matchComponents(a, b) {
    for (const e of HANZI_DB) {
        if ((e.left === a && e.right === b) || (e.left === b && e.right === a)) return e;
    }
    const found = findByComponents(a, b);
    if (found && found.length > 0) {
        const char = found[0];
        return { char, left: a, right: b, strokes: getStrokeCount(char), difficulty: 5 };
    }
    return null;
}

/** 获取笔画数（导出） */
export { getStrokeCount };