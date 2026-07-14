import { HANZI_DB } from './data.js';

/**
 * 选择汉字用于棋盘生成
 * @param {number} count - 需要选择的汉字数量
 * @param {Set|null} unlockedChars - 已解锁的汉字集合，如果提供则优先选择未解锁的汉字
 */
export function selectCharacters(count, unlockedChars = null) {
    let pool = [...HANZI_DB];
    
    // 如果提供了已解锁汉字集合，优先选择未解锁的汉字
    if (unlockedChars && unlockedChars.size > 0) {
        const locked = pool.filter(e => !unlockedChars.has(e.char));
        const unlocked = pool.filter(e => unlockedChars.has(e.char));
        pool = [...locked, ...unlocked];
    }
    
    // 先尝试严格模式（部首不重复）
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = [];
    const used = new Set();
    for (const entry of shuffled) {
        if (selected.length >= count) break;
        const { left, right } = entry;
        if (left === right) { if (used.has(left)) continue; }
        else { if (used.has(left) || used.has(right)) continue; }
        selected.push(entry);
        used.add(left);
        used.add(right);
    }
    
    // 如果严格模式不够，放宽限制允许共享部首
    if (selected.length < count) {
        const usedChars = new Set(selected.map(e => e.char));
        const remaining = pool.filter(e => !usedChars.has(e.char));
        const shuffledRemaining = remaining.sort(() => Math.random() - 0.5);
        for (const entry of shuffledRemaining) {
            if (selected.length >= count) break;
            selected.push(entry);
        }
    }
    return selected;
}

/** 统计每个部首需要的份数（共享部首需要多份） */
export function getComponentCounts(selected) {
    const counts = {};
    for (const e of selected) {
        counts[e.left] = (counts[e.left] || 0) + 1;
        counts[e.right] = (counts[e.right] || 0) + 1;
    }
    return counts;
}

/** 根据部首份数展开组件列表 */
export function getComponents(selected) {
    const c = [];
    for (const e of selected) { c.push(e.left); c.push(e.right); }
    return c;
}

export function matchComponents(a, b) {
    for (const e of HANZI_DB) {
        if ((e.left === a && e.right === b) || (e.left === b && e.right === a)) return e.char;
    }
    return null;
}

/** 为每个目标汉字创建带字符索引的部首条目，共享部首会自然产生多份 */
function createRadicalEntries(selected) {
    const entries = [];
    for (let ci = 0; ci < selected.length; ci++) {
        const ch = selected[ci];
        entries.push({ component: ch.left, charIndex: ci });
        entries.push({ component: ch.right, charIndex: ci });
    }
    return entries;
}

export function generateBoard(width, height, charCount, unlockedChars = null, artifact = null) {
    const totalCells = width * height;
    const maxRadicals = Math.floor(totalCells * 0.3);
    // 如果指定了神器汉字，预留2个部首位置
    const artifactSlots = artifact ? 2 : 0;
    const actual = Math.min(charCount, Math.floor((maxRadicals - artifactSlots) / 2));
    for (let i = 0; i < 50; i++) {
        const b = tryGenerateBoard(width, height, actual, unlockedChars, artifact);
        if (b) return b;
    }
    return generateFallbackBoard(width, height, unlockedChars, artifact);
}

function tryGenerateBoard(width, height, charCount, unlockedChars = null, artifact = null) {
    const selected = selectCharacters(charCount, unlockedChars);
    // 如果指定了神器汉字，将其加入选中列表
    if (artifact) {
        const artEntry = HANZI_DB.find(h => h.char === artifact.char);
        if (artEntry) {
            // 避免重复：如果神器汉字已在列表中，不重复添加
            if (!selected.find(s => s.char === artifact.char)) {
                selected.push(artEntry);
            }
        }
    }
    const radicalEntries = createRadicalEntries(selected);
    const totalRadicals = radicalEntries.length;
    const grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++)
            grid[y][x] = { type: 'number', state: 'hidden', number: 0, radicalIndex: -1 };
    }
    const positions = [];
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) positions.push({ x, y });
    positions.sort(() => Math.random() - 0.5);
    for (let i = 0; i < totalRadicals; i++) {
        const { x, y } = positions[i];
        grid[y][x].type = 'radical';
        grid[y][x].radicalIndex = i;
    }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            if (grid[y][x].type === 'radical') continue;
            grid[y][x].number = countAdjacentRadicals(grid, x, y, width, height);
        }
    let hasZero = false;
    for (let y = 0; y < height && !hasZero; y++)
        for (let x = 0; x < width && !hasZero; x++)
            if (grid[y][x].type === 'number' && grid[y][x].number === 0) hasZero = true;
    if (!hasZero) return null;
    return { width, height, grid, totalRadicals, characters: selected, radicalEntries };
}

function generateFallbackBoard(width, height, unlockedChars = null, artifact = null) {
    const selected = selectCharacters(2, unlockedChars);
    if (artifact) {
        const artEntry = HANZI_DB.find(h => h.char === artifact.char);
        if (artEntry && !selected.find(s => s.char === artifact.char)) {
            selected.push(artEntry);
        }
    }
    const radicalEntries = createRadicalEntries(selected);
    const totalRadicals = radicalEntries.length;
    const grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++)
            grid[y][x] = { type: 'number', state: 'hidden', number: 0, radicalIndex: -1 };
    }
    const rp = [
        { x: width-1, y: height-1 }, { x: width-2, y: height-1 },
        { x: width-1, y: height-2 }, { x: width-2, y: height-2 }
    ];
    for (let i = 0; i < totalRadicals && i < rp.length; i++) {
        grid[rp[i].y][rp[i].x].type = 'radical';
        grid[rp[i].y][rp[i].x].radicalIndex = i;
    }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            if (grid[y][x].type !== 'radical')
                grid[y][x].number = countAdjacentRadicals(grid, x, y, width, height);
        }
    return { width, height, grid, totalRadicals, characters: selected, radicalEntries };
}

export function countAdjacentRadicals(grid, x, y, w, h) {
    let c = 0;
    for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[ny][nx].type === 'radical') c++;
        }
    return c;
}
