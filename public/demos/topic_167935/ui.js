// AI JRPG MAKER UI System
// 游戏界面渲染与交互

var gameMapEl;

function initNav() {
  var navItems = document.querySelectorAll('.nav-item');
  var pages = document.querySelectorAll('.page');

  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var pageName = item.getAttribute('data-page');

      navItems.forEach(function(nav) { nav.classList.remove('active'); });
      pages.forEach(function(p) { p.classList.remove('active'); });

      item.classList.add('active');
      var pageEl = document.getElementById('page-' + pageName);
      if (pageEl) {
        pageEl.classList.add('active');
      }

      if (pageName === 'game') {
        refreshGameUI();
      }
    });
  });
}

function initHelp() {
  var container = document.getElementById('help-container');
  if (!container) return;

  var sections = [
    {
      title: '🚀 快速开始',
      items: [
        { name: 'play_demo', desc: '加载完整演示游戏，立即体验所有功能', ex: 'play_demo' },
        { name: 'build_tutorial', desc: '查看游戏构建教程', ex: 'build_tutorial' },
        { name: 'help', desc: '显示指令帮助文档', ex: 'help' }
      ]
    },
    {
      title: '🏗️ BUILD - 构建指令 (用于创建游戏世界)',
      items: [
        { name: 'create_map [id] [name] [width] [height]', desc: '创建新地图。id为唯一标识符，name为显示名称，width和height为尺寸(1-100)。默认填充草地。', ex: 'create_map town_01 "新手村" 15 10' },
        { name: 'delete_map [id]', desc: '删除指定地图', ex: 'delete_map town_01' },
        { name: 'edit_map [id] [x] [y] [type]', desc: '编辑地图上某一格的地块类型。坐标从(0,0)开始。', ex: 'edit_map town_01 5 3 tree' },
        { name: 'fill_map [id] [x1] [y1] [x2] [y2] [type]', desc: '用指定类型填充矩形区域，适合快速绘制大面积地形。', ex: 'fill_map town_01 0 0 14 0 tree' },
        { name: 'list_maps', desc: '列出所有已创建的地图', ex: 'list_maps' }
      ]
    },
    {
      title: '🗺️ 地块类型说明',
      items: [
        { name: 'grass', desc: '草地 - 可通行，默认地形', ex: '' },
        { name: 'tree', desc: '树木 - 障碍物，不可通行', ex: '' },
        { name: 'stone', desc: '石头 - 障碍物，不可通行', ex: '' },
        { name: 'water', desc: '水域 - 障碍物，不可通行', ex: '' },
        { name: 'house', desc: '房屋 - 建筑物，不可通行', ex: '' },
        { name: 'path', desc: '道路 - 可通行，用于标记路径', ex: '' },
        { name: 'door', desc: '门/传送点 - 可通行，特殊标记', ex: '' },
        { name: 'empty', desc: '空地 - 可通行，空白地块', ex: '' }
      ]
    },
    {
      title: '👤 NPC系统',
      items: [
        { name: 'create_npc [id] [name] [map_id] [x] [y]', desc: '在指定地图的指定位置创建NPC。id为唯一标识，name为显示名称。', ex: 'create_npc mayor "村长" town_01 7 5' },
        { name: 'add_npc_state [npc_id] [key] [value]', desc: '给NPC添加一个状态变量，用于剧情分支判断。', ex: 'add_npc_state mayor talked false' },
        { name: 'add_npc_dialog [npc_id] [dialog_id] [text] [next_dialog?]', desc: '给NPC添加一段对话。dialog_id是对话的唯一ID，text是对话内容，next_dialog是下一段对话的ID（可选，null表示结束）。', ex: 'add_npc_dialog mayor d1 "你好，年轻人！" d2' },
        { name: 'list_npcs', desc: '列出所有NPC及其位置和对话数', ex: 'list_npcs' }
      ]
    },
    {
      title: '👹 怪物系统',
      items: [
        { name: 'create_monster [id] [name] [hp] [atk] [def] [exp]', desc: '创建怪物模板。hp生命值，atk攻击力，def防御力，exp击败获得的经验值。', ex: 'create_monster slime "史莱姆" 30 8 3 20' },
        { name: 'list_monsters', desc: '列出所有怪物模板', ex: 'list_monsters' }
      ]
    },
    {
      title: '⚔️ 玩家与起点设置',
      items: [
        { name: 'set_player_stats [level] [hp] [atk] [def]', desc: '设置玩家初始属性', ex: 'set_player_stats 1 100 10 5' },
        { name: 'add_player_state [key] [value]', desc: '添加玩家全局状态变量，用于剧情记录', ex: 'add_player_state has_quest false' },
        { name: 'set_game_start [map_id] [x] [y]', desc: '设置游戏开始位置，玩家将在这里出生', ex: 'set_game_start town_01 1 4' }
      ]
    },
    {
      title: '🎮 PLAY - 游玩指令',
      items: [
        { name: 'look_map', desc: '查看当前地图的完整俯视图，显示玩家位置和NPC位置', ex: 'look_map' },
        { name: 'look_around', desc: '查看玩家周围7x7的区域（AI友好模式，适合感知环境）', ex: 'look_around' },
        { name: 'move [direction]', desc: '向指定方向移动一格。方向: up(上), down(下), left(左), right(右)，也可用u/d/l/r或上/下/左/右', ex: 'move right' },
        { name: 'talk [npc_id]', desc: '与附近的NPC对话。需要先靠近NPC（距离不超过1格）', ex: 'talk mayor' },
        { name: 'next', desc: '继续下一句对话', ex: 'next' },
        { name: 'open_inventory (或 inv)', desc: '打开背包，查看玩家属性和物品', ex: 'inv' }
      ]
    },
    {
      title: '🔧 DEBUG - 调试指令',
      items: [
        { name: 'debug_teleport [map_id] [x] [y]', desc: '直接传送到指定地图的指定位置，无视距离和障碍物', ex: 'debug_teleport forest 5 5' },
        { name: 'debug_talk [npc_id]', desc: '强制与NPC对话，不需要靠近（用于测试对话）', ex: 'debug_talk mayor' },
        { name: 'debug_battle [monster_id]', desc: '立即与指定怪物进入战斗，测试战斗系统', ex: 'debug_battle slime' },
        { name: 'debug_god', desc: '开启无敌模式，HP/攻击/防御大幅提升', ex: 'debug_god' }
      ]
    },
    {
      title: '💾 存档与其他',
      items: [
        { name: 'export_save', desc: '导出当前游戏存档为JSON格式（弹窗显示）', ex: 'export_save' },
        { name: 'import_save [json_data]', desc: '从JSON数据导入存档', ex: 'import_save {...}' },
        { name: 'clear', desc: '清空终端输出', ex: 'clear' }
      ]
    },
    {
      title: '💡 AI创作最佳实践',
      items: [
        { name: '规划流程', desc: '1. 先创建地图 → 2. 编辑地形 → 3. 创建NPC → 4. 添加对话 → 5. 创建怪物 → 6. 设置起点 → 7. 测试游玩', ex: '' },
        { name: '命名规范', desc: 'ID使用小写字母和下划线，名称含空格时用双引号包裹。例如: create_npc elder "村长爷爷" town 5 3', ex: '' },
        { name: '地图设计', desc: '建议地图大小10-30格，周围用tree或stone围边做边界，用path做道路连接各区域', ex: '' },
        { name: '对话设计', desc: '对话ID建议按顺序编号，如 dlg_01, dlg_02。最后一段的next设为null表示结束', ex: '' },
        { name: '验证游戏', desc: '创建完成后，使用look_map查看效果，用move移动测试，用talk测试NPC对话', ex: '' }
      ]
    }
  ];

  var html = '';
  sections.forEach(function(section) {
    html += '<div class="help-section">';
    html += '<h3>' + section.title + '</h3>';
    section.items.forEach(function(item) {
      html += '<div class="help-cmd">';
      html += '<div class="cmd-name">' + item.name + '</div>';
      html += '<div class="cmd-desc">' + item.desc + '</div>';
      if (item.ex) {
        html += '<div class="cmd-ex">示例: ' + item.ex + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  });

  container.innerHTML = html;
}

function renderGameMap() {
  gameMapEl = document.getElementById('game-map');
  if (!gameMapEl) return;

  var map = game.maps[game.player.mapId];
  if (!map) {
    gameMapEl.innerHTML = '<div style="color:#8b949e;padding:20px;text-align:center;">暂无地图<br>请先在CLI终端创建地图或输入 play_demo</div>';
    gameMapEl.style.gridTemplateColumns = '1fr';
    return;
  }

  gameMapEl.style.gridTemplateColumns = 'repeat(' + map.width + ', 28px)';
  gameMapEl.innerHTML = '';

  for (var y = 0; y < map.height; y++) {
    for (var x = 0; x < map.width; x++) {
      var cell = document.createElement('div');
      cell.className = 'cell ' + map.grid[y][x];
      cell.title = '(' + x + ',' + y + ') ' + map.grid[y][x];

      if (x === game.player.x && y === game.player.y) {
        cell.className = 'cell player';
        cell.textContent = 'P';
        cell.title = '玩家 (' + x + ',' + y + ')';
      } else {
        var npcHere = findNPCAt(map.id, x, y);
        if (npcHere) {
          cell.className = 'cell npc';
          cell.textContent = '👸';
          cell.title = npcHere.name + ' (' + x + ',' + y + ')';
        } else if (isMonsterPosition(x, y)) {
          cell.className = 'cell monster';
          cell.textContent = '👹';
          cell.title = '怪物 - 点击战斗';
        } else {
          cell.textContent = getCellIcon(map.grid[y][x]);
        }
      }

      gameMapEl.appendChild(cell);
    }
  }
}

function getCellIcon(type) {
  var icons = {
    'grass': '🌿',
    'stone': '🪨',
    'water': '💧',
    'tree': '🌲',
    'house': '🏠',
    'path': '🛤️',
    'door': '🚪',
    'empty': '·',
    'npc': 'N',
    'monster': '👹'
  };
  return icons[type] || '?';
}

function findNPCAt(mapId, x, y) {
  for (var id in game.npcs) {
    var npc = game.npcs[id];
    if (npc.mapId === mapId && npc.x === x && npc.y === y) {
      return npc;
    }
  }
  return null;
}

function isMonsterPosition(x, y) {
  var monsterPositions = [
    { x: 5, y: 1 },
    { x: 5, y: 7 },
    { x: 2, y: 4 },
    { x: 9, y: 4 }
  ];
  return monsterPositions.some(function(pos) {
    return pos.x === x && pos.y === y;
  });
}

function refreshGameUI() {
  renderGameMap();

  var map = game.maps[game.player.mapId];
  document.getElementById('ui-pos').textContent = map ?
    '(' + game.player.x + ', ' + game.player.y + ')' : '---';
  document.getElementById('ui-map').textContent = map ? map.name : '---';
  document.getElementById('ui-lv').textContent = game.player.level;
  document.getElementById('ui-hp').textContent = game.player.hp + '/' + game.player.maxHp;
  document.getElementById('ui-atk').textContent = game.player.atk;
  document.getElementById('ui-def').textContent = game.player.def;
  document.getElementById('ui-exp').textContent = game.player.exp;
}

function uiMove(direction) {
  var result = game.move(direction);
  refreshGameUI();
  if (!result.ok) {
    showDialog('系统', result.msg, []);
  } else {
    if (result.msg.indexOf('附近有') > -1) {
      var lines = result.msg.split('\n');
      var npcLine = lines.find(function(l) { return l.indexOf('附近有') > -1; });
      if (npcLine) {
        showDialog('提示', npcLine + '\n点击"交互"按钮与NPC对话', []);
      }
    }
  }
}

function uiInteract() {
  var map = game.maps[game.player.mapId];
  if (!map) {
    showDialog('提示', '当前没有地图', []);
    return;
  }

  var nearby = game.getNearbyNPCs(game.player.x, game.player.y, 1);
  if (nearby.length === 0) {
    showDialog('提示', '周围没有可交互的对象', []);
    return;
  }

  var npc = nearby[0];
  var result = game.talk(npc.id);
  if (result.ok && result.dialogue) {
    showDialog(result.dialogue.speaker, result.dialogue.text, [
      { label: '继续', action: function() { continueDialogue(); } }
    ]);
  } else {
    showDialog('提示', result.msg, []);
  }
}

function continueDialogue() {
  var result = game.nextDialogue();
  if (result.ok && result.dialogue) {
    showDialog(result.dialogue.speaker, result.dialogue.text, [
      { label: '继续', action: function() { continueDialogue(); } }
    ]);
  } else {
    hideDialog();
  }
}

function showDialog(speaker, text, choices) {
  var box = document.getElementById('dialog-box');
  var speakerEl = document.getElementById('dialog-speaker');
  var textEl = document.getElementById('dialog-text');
  var choicesEl = document.getElementById('dialog-choices');

  box.style.display = 'block';
  speakerEl.textContent = speaker;
  textEl.textContent = text;
  choicesEl.innerHTML = '';

  choices.forEach(function(choice) {
    var btn = document.createElement('div');
    btn.className = 'dialog-choice';
    btn.textContent = choice.label;
    btn.onclick = choice.action;
    choicesEl.appendChild(btn);
  });
}

function hideDialog() {
  document.getElementById('dialog-box').style.display = 'none';
}

document.addEventListener('keydown', function(e) {
  var gamePage = document.getElementById('page-game');
  if (!gamePage || !gamePage.classList.contains('active')) return;

  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W':
      e.preventDefault();
      uiMove('up');
      break;
    case 'ArrowDown': case 's': case 'S':
      e.preventDefault();
      uiMove('down');
      break;
    case 'ArrowLeft': case 'a': case 'A':
      e.preventDefault();
      uiMove('left');
      break;
    case 'ArrowRight': case 'd': case 'D':
      e.preventDefault();
      uiMove('right');
      break;
    case ' ': case 'Enter':
      e.preventDefault();
      uiInteract();
      break;
  }
});
