// AI JRPG MAKER Game Engine
// 游戏引擎核心类

const GameEngine = (function() {
  'use strict';

  const CELL_TYPES = ['grass', 'stone', 'water', 'tree', 'house', 'path', 'npc', 'monster', 'door', 'empty'];
  const MAX_MAP_SIZE = 100;

  function GameEngine() {
    this.maps = {};
    this.npcs = {};
    this.monsters = {};
    this.dialogues = {};
    this.player = {
      level: 1,
      exp: 0,
      hp: 100,
      maxHp: 100,
      atk: 10,
      def: 5,
      inventory: [],
      states: {},
      mapId: null,
      x: 0,
      y: 0
    };
    this.gameStart = { mapId: null, x: 0, y: 0 };
    this.currentDialogue = null;
  }

  // ==================== 地图系统 ====================
  
  GameEngine.prototype.createMap = function(id, name, width, height) {
    if (!id || !name) {
      return { ok: false, msg: '地图ID和名称不能为空' };
    }
    if (this.maps[id]) {
      return { ok: false, msg: '地图 ' + id + ' 已存在' };
    }
    if (width < 1 || height < 1 || width > MAX_MAP_SIZE || height > MAX_MAP_SIZE) {
      return { ok: false, msg: '地图尺寸必须在 1x1 到 ' + MAX_MAP_SIZE + 'x' + MAX_MAP_SIZE + ' 之间' };
    }

    var grid = [];
    for (var y = 0; y < height; y++) {
      var row = [];
      for (var x = 0; x < width; x++) {
        row.push('grass');
      }
      grid.push(row);
    }

    this.maps[id] = {
      id: id,
      name: name,
      width: width,
      height: height,
      grid: grid,
      npcList: [],
      monsterList: [],
      exits: []
    };

    return { ok: true, msg: '地图 "' + name + '" 创建成功 (' + width + 'x' + height + ')' };
  };

  GameEngine.prototype.deleteMap = function(id) {
    if (!this.maps[id]) {
      return { ok: false, msg: '地图 ' + id + ' 不存在' };
    }
    delete this.maps[id];
    return { ok: true, msg: '地图 ' + id + ' 已删除' };
  };

  GameEngine.prototype.editMap = function(id, x, y, type) {
    var map = this.maps[id];
    if (!map) {
      return { ok: false, msg: '地图 ' + id + ' 不存在' };
    }
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return { ok: false, msg: '坐标超出地图范围 (0,0) - (' + (map.width-1) + ',' + (map.height-1) + ')' };
    }
    if (CELL_TYPES.indexOf(type) === -1) {
      return { ok: false, msg: '无效的地块类型: ' + type + '，可选: ' + CELL_TYPES.join(', ') };
    }

    map.grid[y][x] = type;
    return { ok: true, msg: '地图 ' + id + ' (' + x + ',' + y + ') 已修改为: ' + type };
  };

  GameEngine.prototype.fillMapArea = function(id, x1, y1, x2, y2, type) {
    var map = this.maps[id];
    if (!map) return { ok: false, msg: '地图不存在' };
    if (CELL_TYPES.indexOf(type) === -1) return { ok: false, msg: '无效地块类型' };

    var minX = Math.min(x1, x2);
    var maxX = Math.max(x1, x2);
    var minY = Math.min(y1, y2);
    var maxY = Math.max(y1, y2);
    var count = 0;

    for (var y = minY; y <= maxY; y++) {
      for (var x = minX; x <= maxX; x++) {
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          map.grid[y][x] = type;
          count++;
        }
      }
    }

    return { ok: true, msg: '填充了 ' + count + ' 个地块为 ' + type };
  };

  GameEngine.prototype.listMaps = function() {
    var ids = Object.keys(this.maps);
    if (ids.length === 0) {
      return '暂无地图';
    }
    var result = '\n=== 地图列表 ===\n';
    for (var i = 0; i < ids.length; i++) {
      var m = this.maps[ids[i]];
      result += '  ' + m.id + ': ' + m.name + ' (' + m.width + 'x' + m.height + ')';
      if (this.player.mapId === m.id) result += ' [当前]';
      result += '\n';
    }
    return result;
  };

  // ==================== NPC系统 ====================

  GameEngine.prototype.createNPC = function(id, name, mapId, x, y) {
    if (!id || !name) {
      return { ok: false, msg: 'NPC ID和名称不能为空' };
    }
    if (this.npcs[id]) {
      return { ok: false, msg: 'NPC ' + id + ' 已存在' };
    }
    var map = this.maps[mapId];
    if (!map) {
      return { ok: false, msg: '地图 ' + mapId + ' 不存在' };
    }
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return { ok: false, msg: '坐标超出地图范围' };
    }

    this.npcs[id] = {
      id: id,
      name: name,
      mapId: mapId,
      x: x,
      y: y,
      states: {},
      dialogueIds: []
    };

    if (map.npcList.indexOf(id) === -1) {
      map.npcList.push(id);
    }

    return { ok: true, msg: 'NPC "' + name + '" 创建成功，位置: ' + mapId + ' (' + x + ',' + y + ')' };
  };

  GameEngine.prototype.addNPCState = function(npcId, key, defaultValue) {
    var npc = this.npcs[npcId];
    if (!npc) return { ok: false, msg: 'NPC ' + npcId + ' 不存在' };
    npc.states[key] = defaultValue;
    return { ok: true, msg: 'NPC ' + npcId + ' 添加状态: ' + key + ' = ' + defaultValue };
  };

  GameEngine.prototype.addNPCDialogue = function(npcId, dialogId, text, nextDialogId, priority, conditions) {
    var npc = this.npcs[npcId];
    if (!npc) return { ok: false, msg: 'NPC ' + npcId + ' 不存在' };
    if (this.dialogues[dialogId]) return { ok: false, msg: '对话 ' + dialogId + ' 已存在' };

    this.dialogues[dialogId] = {
      id: dialogId,
      npcId: npcId,
      speaker: npc.name,
      text: text,
      nextDialog: nextDialogId || null,
      priority: priority || 0,
      conditions: conditions || [],
      actions: []
    };

    if (npc.dialogueIds.indexOf(dialogId) === -1) {
      npc.dialogueIds.push(dialogId);
    }

    return { ok: true, msg: '对话 ' + dialogId + ' 添加成功: "' + (text.length > 20 ? text.substring(0, 20) + '...' : text) + '"' };
  };

  GameEngine.prototype.listNPCs = function() {
    var ids = Object.keys(this.npcs);
    if (ids.length === 0) return '暂无NPC';
    var result = '\n=== NPC列表 ===\n';
    for (var i = 0; i < ids.length; i++) {
      var n = this.npcs[ids[i]];
      result += '  ' + n.id + ': ' + n.name + ' @ ' + n.mapId + ' (' + n.x + ',' + n.y + ')';
      result += ' [' + n.dialogueIds.length + '段对话]\n';
    }
    return result;
  };

  // ==================== 怪物系统 ====================

  GameEngine.prototype.createMonster = function(id, name, hp, atk, def, exp, itemDrop) {
    if (!id || !name) return { ok: false, msg: '怪物ID和名称不能为空' };
    if (this.monsters[id]) return { ok: false, msg: '怪物 ' + id + ' 已存在' };

    this.monsters[id] = {
      id: id,
      name: name,
      hp: hp,
      maxHp: hp,
      atk: atk,
      def: def,
      exp: exp,
      itemDrop: itemDrop || null
    };

    return { ok: true, msg: '怪物 "' + name + '" 创建成功 (HP:' + hp + ' ATK:' + atk + ' DEF:' + def + ' EXP:' + exp + ')' };
  };

  GameEngine.prototype.listMonsters = function() {
    var ids = Object.keys(this.monsters);
    if (ids.length === 0) return '暂无怪物';
    var result = '\n=== 怪物列表 ===\n';
    for (var i = 0; i < ids.length; i++) {
      var m = this.monsters[ids[i]];
      result += '  ' + m.id + ': ' + m.name;
      result += ' [HP:' + m.hp + ' ATK:' + m.atk + ' DEF:' + m.def + ' EXP:' + m.exp + ']\n';
    }
    return result;
  };

  // ==================== 玩家系统 ====================

  GameEngine.prototype.setPlayerStats = function(level, hp, atk, def) {
    this.player.level = level;
    this.player.hp = hp;
    this.player.maxHp = hp;
    this.player.atk = atk;
    this.player.def = def;
    return { ok: true, msg: '玩家属性已设置: Lv.' + level + ' HP:' + hp + ' ATK:' + atk + ' DEF:' + def };
  };

  GameEngine.prototype.addPlayerState = function(key, defaultValue) {
    this.player.states[key] = defaultValue;
    return { ok: true, msg: '玩家状态添加: ' + key + ' = ' + defaultValue };
  };

  GameEngine.prototype.setGameStart = function(mapId, x, y) {
    var map = this.maps[mapId];
    if (!map) return { ok: false, msg: '地图 ' + mapId + ' 不存在' };
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return { ok: false, msg: '坐标超出地图范围' };
    }
    this.gameStart = { mapId: mapId, x: x, y: y };
    this.player.mapId = mapId;
    this.player.x = x;
    this.player.y = y;
    return { ok: true, msg: '游戏起点已设置: ' + mapId + ' (' + x + ',' + y + ')' };
  };

  // ==================== 游玩系统 ====================

  GameEngine.prototype.lookMap = function() {
    var map = this.maps[this.player.mapId];
    if (!map) return { ok: false, msg: '当前没有地图，请先设置游戏起点' };

    var result = '\n=== ' + map.name + ' (' + map.width + 'x' + map.height + ') ===\n';
    result += '玩家位置: (' + this.player.x + ', ' + this.player.y + ')\n\n';

    for (var y = 0; y < map.height; y++) {
      var row = '  ';
      for (var x = 0; x < map.width; x++) {
        if (x === this.player.x && y === this.player.y) {
          row += '[P]';
        } else {
          var cell = map.grid[y][x];
          var cellDisplay = this.getCellDisplay(cell);
          row += cellDisplay;
        }
      }
      result += row + '\n';
    }

    // 显示NPC位置
    if (map.npcList.length > 0) {
      result += '\nNPC位置:\n';
      for (var i = 0; i < map.npcList.length; i++) {
        var npc = this.npcs[map.npcList[i]];
        if (npc) {
          result += '  ' + npc.name + ' (' + npc.x + ',' + npc.y + ')\n';
        }
      }
    }

    return { ok: true, msg: result };
  };

  GameEngine.prototype.lookAround = function() {
    var map = this.maps[this.player.mapId];
    if (!map) return { ok: false, msg: '当前没有地图' };

    var radius = 3;
    var cx = this.player.x;
    var cy = this.player.y;
    var result = '\n=== 周围环境 (7x7视距) ===\n';
    result += '中心位置: (' + cx + ', ' + cy + ')\n\n';

    for (var dy = -radius; dy <= radius; dy++) {
      var row = '  ';
      for (var dx = -radius; dx <= radius; dx++) {
        var x = cx + dx;
        var y = cy + dy;
        if (dx === 0 && dy === 0) {
          row += '[P]';
        } else if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
          row += '[###]';
        } else {
          row += this.getCellDisplay(map.grid[y][x]);
        }
      }
      result += row + '\n';
    }

    // 附近的NPC
    var nearbyNPCs = this.getNearbyNPCs(cx, cy, radius);
    if (nearbyNPCs.length > 0) {
      result += '\n附近NPC:\n';
      for (var i = 0; i < nearbyNPCs.length; i++) {
        var npc = nearbyNPCs[i];
        result += '  ' + npc.name + ' (ID: ' + npc.id + ') - 距离: ' + this.manhattanDist(cx, cy, npc.x, npc.y) + '格\n';
      }
    }

    return { ok: true, msg: result };
  };

  GameEngine.prototype.getCellDisplay = function(type) {
    var displays = {
      'grass': '[草]',
      'stone': '[石]',
      'water': '[水]',
      'tree': '[树]',
      'house': '[屋]',
      'path': '[路]',
      'npc': '[N]',
      'monster': '[怪]',
      'door': '[门]',
      'empty': '[空]'
    };
    return displays[type] || '[?]';
  };

  GameEngine.prototype.move = function(direction) {
    var map = this.maps[this.player.mapId];
    if (!map) return { ok: false, msg: '当前没有地图' };

    var dx = 0, dy = 0;
    switch (direction.toLowerCase()) {
      case 'up': case 'u': case '北': case '上': dy = -1; break;
      case 'down': case 'd': case '南': case '下': dy = 1; break;
      case 'left': case 'l': case '西': case '左': dx = -1; break;
      case 'right': case 'r': case '东': case '右': dx = 1; break;
      default: return { ok: false, msg: '无效方向: ' + direction + '，请使用 up/down/left/right' };
    }

    var newX = this.player.x + dx;
    var newY = this.player.y + dy;

    if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
      return { ok: false, msg: '无法移动 - 已到达地图边界' };
    }

    var cell = map.grid[newY][newX];

    // 障碍物检查
    if (cell === 'stone' || cell === 'tree' || cell === 'water' || cell === 'house') {
      var obstacles = { stone: '石头', tree: '树木', water: '水域', house: '房屋' };
      return { ok: false, msg: '无法移动 - 前方是' + obstacles[cell] };
    }

    this.player.x = newX;
    this.player.y = newY;

    var msg = '移动到 (' + newX + ', ' + newY + ')';

    // 检查传送门
    if (cell === 'door') {
      msg += ' - 发现传送门！';
    }

    // 检查附近NPC
    var nearbyNPC = this.getNearbyNPCs(newX, newY, 1);
    if (nearbyNPC.length > 0) {
      msg += '\n附近有: ' + nearbyNPC.map(function(n) { return n.name + '(ID:' + n.id + ')'; }).join(', ');
      msg += '\n可使用 talk [NPC ID] 进行对话';
    }

    return { ok: true, msg: msg };
  };

  GameEngine.prototype.talk = function(npcId) {
    var npc = this.npcs[npcId];
    if (!npc) return { ok: false, msg: 'NPC ' + npcId + ' 不存在' };
    if (npc.mapId !== this.player.mapId) {
      return { ok: false, msg: npc.name + ' 不在当前地图' };
    }

    // 检查距离
    var dist = this.manhattanDist(this.player.x, this.player.y, npc.x, npc.y);
    if (dist > 1) {
      return { ok: false, msg: npc.name + ' 离你太远了（距离' + dist + '格），请先靠近' };
    }

    if (npc.dialogueIds.length === 0) {
      return { ok: false, msg: npc.name + ' 没有对话' };
    }

    // 找到第一个可用的对话（简化版，不考虑复杂条件）
    var dialogue = this.dialogues[npc.dialogueIds[0]];
    this.currentDialogue = dialogue;

    return { ok: true, msg: dialogue.speaker + ': ' + dialogue.text, dialogue: dialogue };
  };

  GameEngine.prototype.nextDialogue = function() {
    if (!this.currentDialogue) return { ok: false, msg: '没有进行中的对话' };
    if (!this.currentDialogue.nextDialog) {
      this.currentDialogue = null;
      return { ok: true, msg: '对话结束' };
    }
    var next = this.dialogues[this.currentDialogue.nextDialog];
    if (!next) {
      this.currentDialogue = null;
      return { ok: false, msg: '下一段对话不存在' };
    }
    this.currentDialogue = next;
    return { ok: true, msg: next.speaker + ': ' + next.text, dialogue: next };
  };

  GameEngine.prototype.openInventory = function() {
    var result = '\n=== 背包 ===\n';
    if (this.player.inventory.length === 0) {
      result += '  背包是空的\n';
    } else {
      for (var i = 0; i < this.player.inventory.length; i++) {
        var item = this.player.inventory[i];
        result += '  ' + (i+1) + '. ' + item.name + ' x' + item.count + '\n';
      }
    }
    result += '\n=== 玩家状态 ===\n';
    result += '  等级: ' + this.player.level + '\n';
    result += '  HP: ' + this.player.hp + '/' + this.player.maxHp + '\n';
    result += '  攻击力: ' + this.player.atk + '\n';
    result += '  防御力: ' + this.player.def + '\n';
    result += '  经验值: ' + this.player.exp + '\n';

    if (Object.keys(this.player.states).length > 0) {
      result += '\n  隐藏状态:\n';
      for (var key in this.player.states) {
        result += '    ' + key + ': ' + this.player.states[key] + '\n';
      }
    }

    return { ok: true, msg: result };
  };

  // ==================== 战斗系统 ====================

  GameEngine.prototype.battle = function(monsterId) {
    var monster = this.monsters[monsterId];
    if (!monster) return { ok: false, msg: '怪物 ' + monsterId + ' 不存在' };

    var result = '\n========== 战斗开始 ==========\n';
    result += '玩家 Lv.' + this.player.level + ' VS ' + monster.name + '\n';
    result += 'HP: ' + this.player.hp + '/' + this.player.maxHp + '  VS  HP: ' + monster.hp + '\n';
    result += '================================\n\n';

    var playerHp = this.player.hp;
    var monsterHp = monster.hp;
    var round = 1;
    var maxRounds = 50;

    while (playerHp > 0 && monsterHp > 0 && round <= maxRounds) {
      // 玩家攻击
      var playerDmg = Math.max(1, this.player.atk - monster.def + Math.floor(Math.random() * 3));
      monsterHp -= playerDmg;
      result += '[回合' + round + '] 你攻击了 ' + monster.name + '，造成 ' + playerDmg + ' 点伤害！\n';

      if (monsterHp <= 0) {
        result += monster.name + ' 倒下了！\n';
        break;
      }

      // 怪物攻击
      var monsterDmg = Math.max(1, monster.atk - this.player.def + Math.floor(Math.random() * 3));
      playerHp -= monsterDmg;
      result += monster.name + ' 攻击了你，造成 ' + monsterDmg + ' 点伤害！\n';

      if (playerHp <= 0) {
        result += '你倒下了...\n';
        break;
      }

      result += '当前HP: 你 ' + playerHp + ' / ' + monster.name + ' ' + monsterHp + '\n\n';
      round++;
    }

    result += '\n========== 战斗结束 ==========\n';

    if (monsterHp <= 0) {
      // 胜利
      this.player.exp += monster.exp;
      this.player.hp = playerHp;
      result += '胜利！获得 ' + monster.exp + ' 经验值\n';
      result += '当前经验: ' + this.player.exp + '\n';

      // 检查升级
      var expToNext = this.player.level * 100;
      if (this.player.exp >= expToNext) {
        this.player.level++;
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.player.atk += 3;
        this.player.def += 2;
        this.player.exp -= expToNext;
        result += '\n🎉 升级了！当前等级: Lv.' + this.player.level + '\n';
      }
    } else {
      // 失败
      this.player.hp = Math.max(1, Math.floor(this.player.maxHp * 0.1));
      result += '失败...你被送回了起点\n';
      if (this.gameStart.mapId) {
        this.player.mapId = this.gameStart.mapId;
        this.player.x = this.gameStart.x;
        this.player.y = this.gameStart.y;
      }
    }

    return { ok: true, msg: result };
  };

  // ==================== Debug系统 ====================

  GameEngine.prototype.debugTeleport = function(mapId, x, y) {
    var map = this.maps[mapId];
    if (!map) return { ok: false, msg: '地图 ' + mapId + ' 不存在' };
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return { ok: false, msg: '坐标超出范围' };
    }
    this.player.mapId = mapId;
    this.player.x = x;
    this.player.y = y;
    return { ok: true, msg: '[DEBUG] 传送到 ' + map.name + ' (' + x + ', ' + y + ')' };
  };

  GameEngine.prototype.debugTalk = function(npcId) {
    var npc = this.npcs[npcId];
    if (!npc) return { ok: false, msg: 'NPC不存在' };
    if (npc.dialogueIds.length === 0) return { ok: false, msg: 'NPC没有对话' };
    var dlg = this.dialogues[npc.dialogueIds[0]];
    this.currentDialogue = dlg;
    return { ok: true, msg: '[DEBUG] ' + dlg.speaker + ': ' + dlg.text, dialogue: dlg };
  };

  GameEngine.prototype.debugBattle = function(monsterId) {
    return this.battle(monsterId);
  };

  GameEngine.prototype.debugGodMode = function() {
    this.player.hp = 9999;
    this.player.maxHp = 9999;
    this.player.atk = 999;
    this.player.def = 999;
    return { ok: true, msg: '[DEBUG] 无敌模式已开启！' };
  };

  // ==================== 存档系统 ====================

  GameEngine.prototype.exportSave = function() {
    return JSON.stringify({
      maps: this.maps,
      npcs: this.npcs,
      monsters: this.monsters,
      dialogues: this.dialogues,
      player: this.player,
      gameStart: this.gameStart
    }, null, 2);
  };

  GameEngine.prototype.importSave = function(json) {
    try {
      var data = JSON.parse(json);
      this.maps = data.maps || {};
      this.npcs = data.npcs || {};
      this.monsters = data.monsters || {};
      this.dialogues = data.dialogues || {};
      this.player = data.player || this.player;
      this.gameStart = data.gameStart || this.gameStart;
      return { ok: true, msg: '存档导入成功' };
    } catch (e) {
      return { ok: false, msg: '存档导入失败: ' + e.message };
    }
  };

  // ==================== 演示游戏 ====================

  GameEngine.prototype.loadDemo = function() {
    this.maps = {};
    this.npcs = {};
    this.monsters = {};
    this.dialogues = {};
    this.player = { level: 1, exp: 0, hp: 100, maxHp: 100, atk: 10, def: 5, inventory: [], states: { monstersDefeated: 0 }, mapId: null, x: 0, y: 0 };
    this.gameStart = { mapId: null, x: 0, y: 0 };

    this.createMap('garden', '皇家花园', 11, 9);
    var garden = this.maps['garden'];

    for (var y = 0; y < garden.height; y++) {
      for (var x = 0; x < garden.width; x++) {
        if (x === 0 || x === garden.width - 1 || y === 0 || y === garden.height - 1) {
          garden.grid[y][x] = 'tree';
        } else {
          garden.grid[y][x] = 'grass';
        }
      }
    }

    // 横向主路（第4行）
    for (var x2 = 1; x2 < garden.width - 1; x2++) {
      garden.grid[4][x2] = 'path';
    }
    // 纵向主路（第5列）
    for (var y2 = 1; y2 < garden.height - 1; y2++) {
      garden.grid[y2][5] = 'path';
    }

    // 公主周围的石头圈（3x3区域的外围）
    // 第3行（上）
    garden.grid[3][4] = 'stone';
    garden.grid[3][5] = 'stone';
    garden.grid[3][6] = 'stone';
    // 第4行（中）
    garden.grid[4][3] = 'stone';
    garden.grid[4][6] = 'stone';
    // 第5行（下）
    garden.grid[5][4] = 'stone';
    garden.grid[5][5] = 'stone';
    garden.grid[5][6] = 'stone';

    // 石头圈的四个入口（门）- 替换部分石头
    garden.grid[3][5] = 'door';  // 北门
    garden.grid[4][4] = 'door';  // 西门
    garden.grid[4][6] = 'door';  // 东门
    garden.grid[5][5] = 'door';  // 南门

    // 四个怪物位置 - 使用门标记（monster类型在游戏界面不显示图标）
    garden.grid[1][5] = 'door';  // 北门怪物
    garden.grid[7][5] = 'door';  // 南门怪物
    garden.grid[4][1] = 'door';  // 西门怪物
    garden.grid[4][9] = 'door';  // 东门怪物

    // 创建怪物
    this.createMonster('goblin_n', '北方哥布林', 30, 10, 3, 20, null);
    this.createMonster('goblin_s', '南方哥布林', 30, 10, 3, 20, null);
    this.createMonster('goblin_w', '西方哥布林', 30, 10, 3, 20, null);
    this.createMonster('goblin_e', '东方哥布林', 30, 10, 3, 20, null);

    // 创建公主NPC
    this.createNPC('princess', '艾琳公主', 'garden', 5, 4);
    this.addNPCDialogue('princess', 'princess_01', '救命！我被怪物包围了...勇者，你能帮我消灭这些哥布林吗？', 'princess_02', 10, []);
    this.addNPCDialogue('princess', 'princess_02', '我数了一下，一共有四个哥布林，分别在东、南、西、北四个方向。', 'princess_03', 10, []);
    this.addNPCDialogue('princess', 'princess_03', '消灭它们之后，请回来找我，我有重要的事情要告诉你。', null, 10, []);

    this.addNPCDialogue('princess', 'princess_win_01', '太棒了！你竟然真的消灭了所有怪物！', 'princess_win_02', 20, []);
    this.addNPCDialogue('princess', 'princess_win_02', '你的勇气和实力让我深深折服。作为公主，我任命你为皇家护卫团长！', 'princess_win_03', 20, []);
    this.addNPCDialogue('princess', 'princess_win_03', '从今以后，你将守护我们的王国，我相信你一定能胜任这个职位！', null, 20, []);

    this.npcs['princess'].dialogueIds = ['princess_01', 'princess_02', 'princess_03', 'princess_win_01', 'princess_win_02', 'princess_win_03'];

    // 设置起点
    this.setGameStart('garden', 1, 4);

    return {
      ok: true,
      msg: '\n🎉 公主护卫战 - 演示游戏加载完成！\n\n' +
           '剧情：艾琳公主被4个哥布林包围在皇家花园中央！\n' +
           '你的任务：消灭所有怪物，解救公主！\n\n' +
           '当前位置：皇家花园入口\n' +
           '公主位置：地图中央\n' +
           '怪物位置：东、南、西、北四个方向\n\n' +
           '操作指令：\n' +
           '  look_map        - 查看当前地图\n' +
           '  look_around     - 查看周围环境\n' +
           '  move right      - 向右移动（靠近怪物和公主）\n' +
           '  debug_battle goblin_n - 与北方哥布林战斗\n' +
           '  debug_battle goblin_s - 与南方哥布林战斗\n' +
           '  debug_battle goblin_w - 与西方哥布林战斗\n' +
           '  debug_battle goblin_e - 与东方哥布林战斗\n' +
           '  talk princess   - 与公主对话（需靠近）\n' +
           '\n提示：建议先使用 debug_battle 逐个消灭怪物，然后去找公主对话！\n' +
           '或切换到"游戏界面"页签进行直观操作！'
    };
  };

  // ==================== 工具函数 ====================

  GameEngine.prototype.getNearbyNPCs = function(cx, cy, radius) {
    var result = [];
    for (var id in this.npcs) {
      var npc = this.npcs[id];
      if (npc.mapId !== this.player.mapId) continue;
      if (this.manhattanDist(cx, cy, npc.x, npc.y) <= radius) {
        result.push(npc);
      }
    }
    return result;
  };

  GameEngine.prototype.manhattanDist = function(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  return GameEngine;
})();

// 全局游戏实例
var game = new GameEngine();

// 控制台调试辅助 - 让AI和开发者可以直接通过console操作游戏
if (typeof window !== 'undefined') {
  window.game = game;
  window.GameEngine = GameEngine;

  console.log('%c AI JRPG MAKER - 控制台调试已就绪 ', 'background: #58d5a0; color: #0d1117; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.log('%c全局对象: game', 'color: #58d5a0; font-weight: bold;');
  console.log('%c常用命令:', 'color: #56d4e0; font-weight: bold;');
  console.log('  game.loadDemo()           - 加载演示游戏');
  console.log('  game.lookMap()            - 查看当前地图');
  console.log('  game.lookAround()         - 查看周围环境');
  console.log('  game.move("right")        - 移动 (up/down/left/right)');
  console.log('  game.talk("mayor")        - 与NPC对话');
  console.log('  game.nextDialogue()       - 下一句对话');
  console.log('  game.battle("slime")      - 与怪物战斗');
  console.log('  game.debugTeleport(map, x, y) - 传送');
  console.log('  game.debugGodMode()       - 无敌模式');
  console.log('  game.openInventory()      - 查看背包');
  console.log('  game.exportSave()         - 导出存档');
  console.log('%c提示: 所有方法都返回 { ok: boolean, msg: string } 对象', 'color: #f0c868;');
}