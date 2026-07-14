// ====== 地牢/多层棋盘管理器 ======
// 管理多个棋盘的切换、全局状态、神器碎片收集

import { HANZI_DB, ARTIFACT_POOL } from '../data.js';

/** 地牢房间定义 */
export const DUNGEON_MAP = {
    castle: {
        id: 'castle',
        name: '主城',
        desc: '汉字扫雷的起点',
        icon: '🏰',
        boardSize: { width: 6, height: 6, charCount: 4 },
        entryChars: [
            { char: '郭', left: '享', right: '阝', targetRoom: 'outer', label: '外郭' },
            { char: '闯', left: '门', right: '马', targetRoom: 'palace', label: '宫殿' },
            { char: '海', left: '氵', right: '每', targetRoom: 'port', label: '港口' },
            { char: '活', left: '氵', right: '舌', targetRoom: 'market', label: '市集' },
            { char: '林', left: '木', right: '木', targetRoom: 'forest', label: '密林' },
            { char: '岩', left: '山', right: '石', targetRoom: 'mine', label: '矿洞' },
        ],
        artifactForge: true,
    },
    outer: {
        id: 'outer',
        name: '外郭',
        desc: '城墙之外，碎片散落',
        icon: '🏯',
        boardSize: { width: 6, height: 6, charCount: 4 },
        fragment: 1,
    },
    palace: {
        id: 'palace',
        name: '宫殿',
        desc: '深宫之中，守卫森严',
        icon: '🏛️',
        boardSize: { width: 7, height: 7, charCount: 5 },
        fragment: 2,
        boss: true,
    },
    port: {
        id: 'port',
        name: '港口',
        desc: '远航归来，珍宝遍地',
        icon: '⚓',
        boardSize: { width: 6, height: 6, charCount: 4 },
        fragment: 3,
    },
    market: {
        id: 'market',
        name: '市集',
        desc: '交易词条，强化自身',
        icon: '🏪',
        boardSize: { width: 6, height: 6, charCount: 4 },
        traitShop: true,
    },
    forest: {
        id: 'forest',
        name: '密林',
        desc: '古木参天，词条丰饶',
        icon: '🌲',
        boardSize: { width: 7, height: 7, charCount: 5 },
        traitShop: true,
    },
    mine: {
        id: 'mine',
        name: '矿洞',
        desc: '深处矿脉，高分回报',
        icon: '⛏️',
        boardSize: { width: 8, height: 8, charCount: 6 },
        scoreBonus: true,
    },
};

/** 房间状态 */
class RoomState {
    constructor(roomDef) {
        this.id = roomDef.id;
        this.name = roomDef.name;
        this.desc = roomDef.desc;
        this.icon = roomDef.icon;
        this.board = null;
        this.matchedChars = [];
        this.backpack = [];
        this.synthesisSelection = [];
        this.fragmentCollected = false;
        this.bossDefeated = false;
        this.isExplored = false;
    }
}

/** 地牢管理器 */
export class DungeonManager {
    constructor() {
        this.rooms = {};
        this.currentRoom = null;
        this.unlocked = new Set(['castle']); // 初始只有主城解锁
        this.artifact = null;
        this.fragmentsCollected = 0;
        this.totalFragments = 3;

        // 全局状态（跨房间保持）
        this.hp = 1000;
        this.maxHp = 1000;
        this.traitSlots = [null, null, null];
        this.shieldActive = false;
        this.score = 0;
        this.scoreMultiplier = 1.0; // 顿悟：分数倍率
        this.combo = 0;
        this.maxCombo = 0;
        this.artifactForged = false;
        this.nextStrokeReduced = false; // 战意/烈焰：下次部首扣血减半
        this.spreadCharges = 0; // 蔓延：剩余蔓延次数
        // 五行被动技能通过 traitSlots.some(t => t.effect === 'metal' 等)实时查询，无需独立状态
        this.usedChars = new Set(); // 跨房间已用字（不含入口字，避免不同地点出现相同字）

        this.init();
    }

    init() {
        // 创建所有房间
        for (const [id, def] of Object.entries(DUNGEON_MAP)) {
            this.rooms[id] = new RoomState(def);
        }
        // 选择神器
        const artifact = ARTIFACT_POOL[Math.floor(Math.random() * ARTIFACT_POOL.length)];
        this.artifact = artifact;
    }

    /** 进入房间 */
    enterRoom(roomId) {
        if (!this.unlocked.has(roomId)) return null;
        const room = this.rooms[roomId];
        if (!room) return null;
        this.currentRoom = room;
        room.isExplored = true;
        return room;
    }

    /** 解锁房间 */
    unlockRoom(roomId) {
        if (this.unlocked.has(roomId)) return false;
        this.unlocked.add(roomId);
        return true;
    }

    /** 收集神器碎片 */
    collectFragment() {
        const room = this.currentRoom;
        if (!room) return false;
        const def = DUNGEON_MAP[room.id];
        if (!def.fragment || room.fragmentCollected) return false;
        room.fragmentCollected = true;
        this.fragmentsCollected++;
        return true;
    }

    /** 是否集齐所有碎片 */
    hasAllFragments() {
        return this.fragmentsCollected >= this.totalFragments;
    }

    /** 是否可以锻造神器 */
    canForgeArtifact() {
        return this.currentRoom
            && this.currentRoom.id === 'castle'
            && this.hasAllFragments()
            && !this.artifactForged;
    }

    /** 锻造神器 */
    forgeArtifact() {
        if (!this.canForgeArtifact()) return false;
        this.artifactForged = true;
        return true;
    }

    /** 获取入口字列表（当前房间可解锁其他房间的字） */
    getEntryChars() {
        if (!this.currentRoom) return [];
        const def = DUNGEON_MAP[this.currentRoom.id];
        if (!def.entryChars) return [];
        return def.entryChars.filter(ec => !this.unlocked.has(ec.targetRoom));
    }

    /** 获取已解锁房间列表 */
    getUnlockedRooms() {
        return Array.from(this.unlocked).map(id => this.rooms[id]);
    }

    /** 重置（新游戏） */
    reset() {
        this.rooms = {};
        this.currentRoom = null;
        this.unlocked = new Set(['castle']);
        this.fragmentsCollected = 0;
        this.hp = 1000;
        this.maxHp = 1000;
        this.traitSlots = [null, null, null];
        this.shieldActive = false;
        this.score = 0;
        this.scoreMultiplier = 1.0;
        this.combo = 0;
        this.maxCombo = 0;
        this.artifactForged = false;
        this.nextStrokeReduced = false;
        this.spreadCharges = 0;
        this.usedChars = new Set();
        this.init();
    }

    /** 获取已用字列表（跨房间累积，用于棋盘生成时排除） */
    getUsedChars() {
        return Array.from(this.usedChars);
    }

    /** 将本房间棋盘上使用的字加入已用集合 */
    addUsedChars(chars) {
        for (const c of chars) this.usedChars.add(c);
    }
}