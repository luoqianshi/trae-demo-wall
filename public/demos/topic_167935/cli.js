// AI JRPG MAKER CLI System
// 指令系统 - 构建/游玩/调试

var termBody, cmdInput;
var commandHistory = [];
var historyIndex = -1;

// ==================== 终端操作 ====================

function initTerm() {
  termBody = document.getElementById('term-body');
  cmdInput = document.getElementById('cmd-input');
  
  if (cmdInput) {
    cmdInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var cmd = cmdInput.value.trim();
        if (cmd) {
          commandHistory.push(cmd);
          historyIndex = commandHistory.length;
          executeCommand(cmd);
        }
        cmdInput.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          cmdInput.value = commandHistory[historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          cmdInput.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          cmdInput.value = '';
        }
      }
    });
  }
}

function printTerm(text, type) {
  if (!termBody) return;
  type = type || 'output';
  var line = document.createElement('div');
  line.className = type;
  if (type === 'cmd') {
    line.textContent = '$ ' + text;
  } else {
    line.textContent = text;
  }
  termBody.appendChild(line);
  termBody.scrollTop = termBody.scrollHeight;
}

function clearTerm() {
  if (termBody) {
    termBody.innerHTML = '';
  }
}

// ==================== 指令解析 ====================

function executeCommand(cmd) {
  printTerm(cmd, 'cmd');
  
  var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  if (parts.length === 0) return;
  
  // 移除引号
  parts = parts.map(function(p) {
    return p.replace(/^"|"$/g, '');
  });
  
  var command = parts[0].toLowerCase();
  var args = parts.slice(1);
  
  var result;
  
  // BUILD类指令
  switch (command) {
    // --- 地图相关 ---
    case 'create_map':
      if (args.length < 4) {
        result = { ok: false, msg: '用法: create_map [id] [name] [width] [height]\n  示例: create_map town_01 "新手村" 15 10' };
      } else {
        result = game.createMap(args[0], args[1], parseInt(args[2]), parseInt(args[3]));
      }
      break;
      
    case 'delete_map':
      if (args.length < 1) {
        result = { ok: false, msg: '用法: delete_map [id]' };
      } else {
        result = game.deleteMap(args[0]);
      }
      break;
      
    case 'edit_map':
      if (args.length < 4) {
        result = { ok: false, msg: '用法: edit_map [id] [x] [y] [type]\n  地块类型: grass, stone, water, tree, house, path, door, empty\n  示例: edit_map town_01 5 3 tree' };
      } else {
        result = game.editMap(args[0], parseInt(args[1]), parseInt(args[2]), args[3]);
      }
      break;
      
    case 'fill_map':
      if (args.length < 6) {
        result = { ok: false, msg: '用法: fill_map [id] [x1] [y1] [x2] [y2] [type]' };
      } else {
        result = game.fillMapArea(args[0], parseInt(args[1]), parseInt(args[2]), parseInt(args[3]), parseInt(args[4]), args[5]);
      }
      break;
      
    case 'list_maps':
      result = { ok: true, msg: game.listMaps() };
      break;
      
    // --- NPC相关 ---
    case 'create_npc':
      if (args.length < 5) {
        result = { ok: false, msg: '用法: create_npc [id] [name] [map_id] [x] [y]\n  示例: create_npc npc_01 "村长" town_01 7 5' };
      } else {
        result = game.createNPC(args[0], args[1], args[2], parseInt(args[3]), parseInt(args[4]));
      }
      break;
      
    case 'add_npc_state':
      if (args.length < 3) {
        result = { ok: false, msg: '用法: add_npc_state [npc_id] [state_key] [default_value]' };
      } else {
        result = game.addNPCState(args[0], args[1], args[2]);
      }
      break;
      
    case 'add_npc_dialog':
      if (args.length < 3) {
        result = { ok: false, msg: '用法: add_npc_dialog [npc_id] [dialog_id] [text] [next_dialog?]\n  示例: add_npc_dialog npc_01 dlg_01 "你好，欢迎！" dlg_02' };
      } else {
        var npcId = args[0];
        var dialogId = args[1];
        var text = args[2];
        var nextDialog = args[3] || null;
        result = game.addNPCDialogue(npcId, dialogId, text, nextDialog, 0, []);
      }
      break;
      
    case 'list_npcs':
      result = { ok: true, msg: game.listNPCs() };
      break;
      
    // --- 怪物相关 ---
    case 'create_monster':
      if (args.length < 6) {
        result = { ok: false, msg: '用法: create_monster [id] [name] [hp] [atk] [def] [exp]\n  示例: create_monster slime "史莱姆" 30 8 3 20' };
      } else {
        result = game.createMonster(args[0], args[1], parseInt(args[2]), parseInt(args[3]), parseInt(args[4]), parseInt(args[5]), null);
      }
      break;
      
    case 'list_monsters':
      result = { ok: true, msg: game.listMonsters() };
      break;
      
    // --- 玩家相关 ---
    case 'set_player_stats':
      if (args.length < 4) {
        result = { ok: false, msg: '用法: set_player_stats [level] [hp] [atk] [def]' };
      } else {
        result = game.setPlayerStats(parseInt(args[0]), parseInt(args[1]), parseInt(args[2]), parseInt(args[3]));
      }
      break;
      
    case 'add_player_state':
      if (args.length < 2) {
        result = { ok: false, msg: '用法: add_player_state [key] [default_value]' };
      } else {
        result = game.addPlayerState(args[0], args[1]);
      }
      break;
      
    case 'set_game_start':
      if (args.length < 3) {
        result = { ok: false, msg: '用法: set_game_start [map_id] [x] [y]' };
      } else {
        result = game.setGameStart(args[0], parseInt(args[1]), parseInt(args[2]));
      }
      break;
      
    // --- PLAY类指令 ---
    case 'look_map':
      result = game.lookMap();
      break;
      
    case 'look_around':
      result = game.lookAround();
      break;
      
    case 'move':
      if (args.length < 1) {
        result = { ok: false, msg: '用法: move [direction]\n  方向: up, down, left, right (或 u/d/l/r)\n  示例: move right' };
      } else {
        result = game.move(args[0]);
      }
      break;
      
    case 'talk':
      if (args.length < 1) {
        result = { ok: false, msg: '用法: talk [npc_id]\n  示例: talk npc_01' };
      } else {
        result = game.talk(args[0]);
      }
      break;
      
    case 'next':
      result = game.nextDialogue();
      break;
      
    case 'open_inventory':
    case 'inv':
      result = game.openInventory();
      break;
      
    // --- DEBUG类指令 ---
    case 'debug_teleport':
      if (args.length < 3) {
        result = { ok: false, msg: '用法: debug_teleport [map_id] [x] [y]' };
      } else {
        result = game.debugTeleport(args[0], parseInt(args[1]), parseInt(args[2]));
      }
      break;
      
    case 'debug_talk':
      if (args.length < 1) {
        result = { ok: false, msg: '用法: debug_talk [npc_id]' };
      } else {
        result = game.debugTalk(args[0]);
      }
      break;
      
    case 'debug_battle':
      if (args.length < 1) {
        result = { ok: false, msg: '用法: debug_battle [monster_id]' };
      } else {
        result = game.debugBattle(args[0]);
      }
      break;
      
    case 'debug_god':
      result = game.debugGodMode();
      break;
      
    // --- 其他指令 ---
    case 'help':
      result = { ok: true, msg: getHelpText() };
      break;
      
    case 'build_tutorial':
      result = { ok: true, msg: getTutorialText() };
      break;
      
    case 'play_demo':
      result = game.loadDemo();
      break;
      
    case 'export_save':
      {
        var save = game.exportSave();
        showModal('游戏存档 (JSON)', save);
        result = { ok: true, msg: '存档已导出，请查看弹窗，也可右键复制' };
      }
      break;
      
    case 'import_save':
      if (args.length < 1) {
        result = { ok: false, msg: '用法: import_save [json_data]' };
      } else {
        result = game.importSave(args.join(' '));
      }
      break;
      
    case 'clear':
      clearTerm();
      result = null;
      break;
      
    default:
      result = { ok: false, msg: '未知指令: ' + command + '\n输入 help 查看所有可用指令' };
  }
  
  if (result) {
    printTerm(result.msg, result.ok ? 'output' : 'error');
  }
  
  // 刷新游戏界面（如果可见）
  if (document.getElementById('page-game').classList.contains('active')) {
    try { refreshGameUI(); } catch(e) {}
  }
}

// ==================== 帮助文档 ====================

function getHelpText() {
  return '\n' +
    '╔══════════════════════════════════════════════════════════════════════════════════╗\n' +
    '║                AI JRPG MAKER - 完整指令手册 (AI 专用)                           ║\n' +
    '╠══════════════════════════════════════════════════════════════════════════════════╣\n' +
    '║                                                                                  ║\n' +
    '║ 【AI 创作工作流程】                                                              ║\n' +
    '║  作为AI，你应该按以下步骤创建和验证游戏：                                        ║\n' +
    '║  1. 理解用户的游戏创意                                                           ║\n' +
    '║  2. 规划：地图数量与布局、NPC与对话、怪物配置                                   ║\n' +
    '║  3. 构建：依次执行 BUILD 类指令创建游戏世界                                     ║\n' +
    '║  4. 验证：使用 PLAY 类指令游玩测试，检查逻辑合理性                               ║\n' +
    '║  5. 迭代：根据测试结果调整地图、对话、数值                                       ║\n' +
    '║                                                                                  ║\n' +
    '║  重要提示：带空格的名称请用英文双引号包裹                                        ║\n' +
    '║  示例：create_npc elder "村长爷爷" village 5 3                                  ║\n' +
    '║                                                                                  ║\n' +
    '╠══════════════════════════════════════════════════════════════════════════════════╣\n' +
    '║                                                                                  ║\n' +
    '║ 【BUILD - 构建指令】创建游戏世界的一切                                           ║\n' +
    '║                                                                                  ║\n' +
    '║ ── 地图系统 ────────────────────────────────────────────────────────────────     ║\n' +
    '║                                                                                  ║\n' +
    '║  create_map [id] [name] [width] [height]                                        ║\n' +
    '║      创建一个新地图。                                                            ║\n' +
    '║      - id: 唯一标识符(小写字母+下划线，如 village_01)                           ║\n' +
    '║      - name: 显示名称(可含中文，含空格请加双引号)                               ║\n' +
    '║      - width: 地图宽度 (1-100)                                                  ║\n' +
    '║      - height: 地图高度 (1-100)                                                 ║\n' +
    '║      - 默认所有地块都是草地(grass)                                               ║\n' +
    '║      示例: create_map village "新手村" 15 12                                     ║\n' +
    '║                                                                                  ║\n' +
    '║  delete_map [id]                                                                 ║\n' +
    '║      删除指定ID的地图                                                            ║\n' +
    '║      示例: delete_map village                                                    ║\n' +
    '║                                                                                  ║\n' +
    '║  edit_map [id] [x] [y] [type]                                                   ║\n' +
    '║      修改地图上某一格的地块类型。坐标从(0,0)开始，左上角为原点。                ║\n' +
    '║      - x: 横坐标 (0 到 width-1)                                                 ║\n' +
    '║      - y: 纵坐标 (0 到 height-1)                                                ║\n' +
    '║      - type: 地块类型（见下方列表）                                             ║\n' +
    '║      示例: edit_map village 5 3 tree                                             ║\n' +
    '║                                                                                  ║\n' +
    '║  fill_map [id] [x1] [y1] [x2] [y2] [type]                                       ║\n' +
    '║      用指定类型填充矩形区域（包含两端点）。适合快速绘制大面积地形。              ║\n' +
    '║      - x1,y1: 矩形左上角坐标                                                    ║\n' +
    '║      - x2,y2: 矩形右下角坐标                                                    ║\n' +
    '║      示例: fill_map village 0 0 14 0 tree  (把顶边全部变成树)                   ║\n' +
    '║                                                                                  ║\n' +
    '║  list_maps                                                                       ║\n' +
    '║      列出所有已创建的地图及其尺寸                                               ║\n' +
    '║                                                                                  ║\n' +
    '║  地块类型清单：                                                                  ║\n' +
    '║    grass  - 草地   - 可通行，默认地形                                           ║\n' +
    '║    tree   - 树木   - 障碍物，不可通行（适合做地图边界）                         ║\n' +
    '║    stone  - 石头   - 障碍物，不可通行                                           ║\n' +
    '║    water  - 水域   - 障碍物，不可通行                                           ║\n' +
    '║    house  - 房屋   - 建筑物，不可通行                                           ║\n' +
    '║    path   - 道路   - 可通行，用于标记路径                                       ║\n' +
    '║    door   - 门/传送 - 可通行，特殊标记点                                        ║\n' +
    '║    empty  - 空地   - 可通行，空白地块                                           ║\n' +
    '║                                                                                  ║\n' +
    '║ ── NPC 系统 ───────────────────────────────────────────────────────────────      ║\n' +
    '║                                                                                  ║\n' +
    '║  create_npc [id] [name] [map_id] [x] [y]                                        ║\n' +
    '║      在指定地图的指定位置创建一个NPC。                                           ║\n' +
    '║      - id: NPC唯一标识符                                                        ║\n' +
    '║      - name: NPC显示名称                                                        ║\n' +
    '║      - map_id: 所在地图的ID                                                     ║\n' +
    '║      - x,y: 在地图上的坐标                                                      ║\n' +
    '║      示例: create_npc mayor "村长" village 7 5                                  ║\n' +
    '║                                                                                  ║\n' +
    '║  add_npc_state [npc_id] [key] [default_value]                                   ║\n' +
    '║      给NPC添加一个状态变量，用于剧情分支判断。                                   ║\n' +
    '║      示例: add_npc mayor has_met false                                          ║\n' +
    '║                                                                                  ║\n' +
    '║  add_npc_dialog [npc_id] [dialog_id] [text] [next_dialog?]                      ║\n' +
    '║      给NPC添加一段对话。对话是链表结构，通过 next_dialog 串起来。                ║\n' +
    '║      - npc_id: 目标NPC的ID                                                     ║\n' +
    '║      - dialog_id: 这段对话的唯一ID                                              ║\n' +
    '║      - text: 对话内容（含空格请加双引号）                                       ║\n' +
    '║      - next_dialog: 下一段对话的ID，可选，填null表示结束                        ║\n' +
    '║      示例: add_npc_dialog mayor d1 "你好，年轻人！" d2                           ║\n' +
    '║            add_npc_dialog mayor d2 "欢迎来到新手村。" null                       ║\n' +
    '║                                                                                  ║\n' +
    '║  list_npcs                                                                       ║\n' +
    '║      列出所有NPC及其位置和对话数量                                               ║\n' +
    '║                                                                                  ║\n' +
    '║ ── 怪物系统 ──────────────────────────────────────────────────────────────      ║\n' +
    '║                                                                                  ║\n' +
    '║  create_monster [id] [name] [hp] [atk] [def] [exp]                              ║\n' +
    '║      创建一个怪物模板（不是放在地图上，而是定义一种怪物）。                      ║\n' +
    '║      - id: 怪物唯一标识符                                                       ║\n' +
    '║      - name: 怪物名称                                                           ║\n' +
    '║      - hp: 生命值                                                               ║\n' +
    '║      - atk: 攻击力                                                              ║\n' +
    '║      - def: 防御力                                                              ║\n' +
    '║      - exp: 击败后获得的经验值                                                  ║\n' +
    '║      示例: create_monster slime "史莱姆" 30 8 3 20                               ║\n' +
    '║                                                                                  ║\n' +
    '║  list_monsters                                                                   ║\n' +
    '║      列出所有怪物模板及其属性                                                    ║\n' +
    '║                                                                                  ║\n' +
    '║ ── 玩家与起点 ────────────────────────────────────────────────────────────      ║\n' +
    '║                                                                                  ║\n' +
    '║  set_player_stats [level] [hp] [atk] [def]                                      ║\n' +
    '║      设置玩家的初始属性                                                          ║\n' +
    '║      示例: set_player_stats 1 100 10 5                                          ║\n' +
    '║                                                                                  ║\n' +
    '║  add_player_state [key] [default_value]                                          ║\n' +
    '║      添加一个玩家全局状态变量，用于记录剧情进度                                  ║\n' +
    '║      示例: add_player_state has_ring false                                       ║\n' +
    '║                                                                                  ║\n' +
    '║  set_game_start [map_id] [x] [y]                                                 ║\n' +
    '║      设置游戏开始位置，玩家初始会出现在这里。必须设置才能游玩！                  ║\n' +
    '║      示例: set_game_start village 1 6                                            ║\n' +
    '║                                                                                  ║\n' +
    '╠══════════════════════════════════════════════════════════════════════════════════╣\n' +
    '║                                                                                  ║\n' +
    '║ 【PLAY - 游玩指令】验证游戏是否合理                                               ║\n' +
    '║                                                                                  ║\n' +
    '║  look_map                                                                        ║\n' +
    '║      查看当前地图的完整俯视图。显示玩家位置[P]和所有地形。                       ║\n' +
    '║      用于快速检查地图布局是否正确。                                              ║\n' +
    '║                                                                                  ║\n' +
    '║  look_around                                                                     ║\n' +
    '║      查看玩家周围 7x7 的视野区域（中心是玩家）。                                 ║\n' +
    '║      这是 AI 友好的感知指令，模拟玩家的真实视角。                                ║\n' +
    '║      同时列出附近的NPC。                                                         ║\n' +
    '║                                                                                  ║\n' +
    '║  move [direction]                                                                ║\n' +
    '║      向指定方向移动一格。遇到障碍物或边界会失败。                                ║\n' +
    '║      方向可选：up / down / left / right                                          ║\n' +
    '║                或缩写：u / d / l / r                                             ║\n' +
    '║                或中文：上 / 下 / 左 / 右                                         ║\n' +
    '║      示例: move right                                                            ║\n' +
    '║                                                                                  ║\n' +
    '║  talk [npc_id]                                                                   ║\n' +
    '║      与NPC对话。玩家必须在NPC旁边（距离≤1格）才能对话。                          ║\n' +
    '║      示例: talk mayor                                                            ║\n' +
    '║                                                                                  ║\n' +
    '║  next                                                                            ║\n' +
    '║      继续下一句对话。对话结束后自动关闭。                                        ║\n' +
    '║                                                                                  ║\n' +
    '║  open_inventory (或 inv)                                                         ║\n' +
    '║      打开背包，查看玩家等级、HP、攻防、经验、物品和状态变量                      ║\n' +
    '║                                                                                  ║\n' +
    '╠══════════════════════════════════════════════════════════════════════════════════╣\n' +
    '║                                                                                  ║\n' +
    '║ 【DEBUG - 调试指令】快速测试，绕过正常流程                                       ║\n' +
    '║                                                                                  ║\n' +
    '║  debug_teleport [map_id] [x] [y]                                                 ║\n' +
    '║      直接传送到任意地图的任意位置。不需要走路，无视障碍物。                      ║\n' +
    '║      用于快速到达测试地点。                                                      ║\n' +
    '║      示例: debug_teleport forest 8 5                                             ║\n' +
    '║                                                                                  ║\n' +
    '║  debug_talk [npc_id]                                                             ║\n' +
    '║      强制与任何NPC对话，不需要靠近。用于快速测试对话内容。                       ║\n' +
    '║      示例: debug_talk mayor                                                      ║\n' +
    '║                                                                                  ║\n' +
    '║  debug_battle [monster_id]                                                       ║\n' +
    '║      立即与指定怪物进入战斗，测试战斗系统和数值平衡。                            ║\n' +
    '║      示例: debug_battle slime                                                    ║\n' +
    '║                                                                                  ║\n' +
    '║  debug_god                                                                       ║\n' +
    '║      开启无敌模式：HP=9999，攻击=999，防御=999。                                ║\n' +
    '║      用于快速测试高等级怪物而不会死亡。                                          ║\n' +
    '║                                                                                  ║\n' +
    '╠══════════════════════════════════════════════════════════════════════════════════╣\n' +
    '║                                                                                  ║\n' +
    '║ 【其他指令】                                                                     ║\n' +
    '║                                                                                  ║\n' +
    '║  help             显示本帮助手册                                                 ║\n' +
    '║  build_tutorial   查看分步构建教程                                               ║\n' +
    '║  play_demo        加载完整演示游戏（新手村+森林+4个NPC+3种怪物）                ║\n' +
    '║  export_save      导出当前游戏存档为JSON（弹窗显示）                            ║\n' +
    '║  import_save [json_data]   从JSON字符串导入存档                                 ║\n' +
    '║  clear            清空终端屏幕                                                   ║\n' +
    '║                                                                                  ║\n' +
    '╠══════════════════════════════════════════════════════════════════════════════════╣\n' +
    '║                                                                                  ║\n' +
    '║ 【AI 最佳实践】                                                                  ║\n' +
    '║                                                                                  ║\n' +
    '║  1. 地图设计建议：                                                               ║\n' +
    '║     - 大小建议 10x10 到 30x30 之间                                               ║\n' +
    '║     - 四周用 tree 或 stone 围起来做边界，防止玩家走出去                          ║\n' +
    '║     - 用 path 画出主要道路，连接各个兴趣点                                       ║\n' +
    '║     - 村庄里放 house + door 表示房屋入口                                        ║\n' +
    '║                                                                                  ║\n' +
    '║  2. NPC设计建议：                                                                ║\n' +
    '║     - 每个NPC至少有2-3段对话，显得更自然                                        ║\n' +
    '║     - NPC放在道路旁边或房屋前面，玩家容易找到                                    ║\n' +
    '║     - 对话ID建议有意义且有序，如 mayor_01, mayor_02                              ║\n' +
    '║                                                                                  ║\n' +
    '║  3. 怪物数值建议：                                                               ║\n' +
    '║     - 新手怪(史莱姆): HP 20-40, ATK 5-10, DEF 1-3, EXP 10-25                   ║\n' +
    '║     - 普通怪(哥布林): HP 40-80, ATK 10-20, DEF 3-8, EXP 25-50                  ║\n' +
    '║     - 精英怪(野狼): HP 80-150, ATK 15-30, DEF 5-12, EXP 50-100                 ║\n' +
    '║     - 玩家初始 Lv1: HP 100, ATK 10, DEF 5                                       ║\n' +
    '║     - 升级公式：每级经验 = level * 100                                          ║\n' +
    '║     - 升级奖励：HP+20, ATK+3, DEF+2                                              ║\n' +
    '║                                                                                  ║\n' +
    '║  4. 验证清单：                                                                   ║\n' +
    '║     - [ ] 玩家起点是否设置且位置合理（不是墙上）                                 ║\n' +
    '║     - [ ] 地图是否有边界防止玩家走出去                                           ║\n' +
    '║     - [ ] NPC是否都在可通行的地块上                                              ║\n' +
    '║     - [ ] 所有对话链最后一段的next都是null                                       ║\n' +
    '║     - [ ] 玩家是否能走到每个NPC旁边对话                                          ║\n' +
    '║     - [ ] 怪物数值是否与玩家等级匹配                                             ║\n' +
    '║                                                                                  ║\n' +
    '║  5. 控制台调试：                                                                 ║\n' +
    '║     - 在浏览器开发者工具的 Console 中可以直接访问 game 对象                      ║\n' +
    '║     - 示例：game.lookMap()     查看地图                                         ║\n' +
    '║           game.move("right")  向右移动                                          ║\n' +
    '║           game.talk("mayor")  与村长对话                                        ║\n' +
    '║           game.battle("slime") 打史莱姆                                         ║\n' +
    '║                                                                                  ║\n' +
    '╚══════════════════════════════════════════════════════════════════════════════════╝';
}

function getTutorialText() {
  return '\n' +
    '╔══════════════════════════════════════════════════════════════╗\n' +
    '║              构建游戏 - 完整教程                             ║\n' +
    '╠══════════════════════════════════════════════════════════════╣\n' +
    '║                                                              ║\n' +
    '║ 第一步：创建地图                                             ║\n' +
    '║ ─────────────────                                           ║\n' +
    '║  create_map town_01 "新手村" 12 10                          ║\n' +
    '║                                                              ║\n' +
    '║ 第二步：编辑地形                                             ║\n' +
    '║ ─────────────────                                           ║\n' +
    '║  周围放树形成边界:                                           ║\n' +
    '║    edit_map town_01 0 0 tree                                ║\n' +
    '║    ... (逐个设置)                                            ║\n' +
    '║  或者使用填充:                                               ║\n' +
    '║    fill_map town_01 0 0 11 0 tree  (顶边)                   ║\n' +
    '║                                                              ║\n' +
    '║  放置房屋和道路:                                             ║\n' +
    '║    edit_map town_01 5 3 house                               ║\n' +
    '║    edit_map town_01 6 3 house                               ║\n' +
    '║    edit_map town_01 5 4 path                                ║\n' +
    '║    edit_map town_01 6 4 door                                ║\n' +
    '║                                                              ║\n' +
    '║ 第三步：创建NPC                                             ║\n' +
    '║ ─────────────────                                           ║\n' +
    '║  create_npc mayor "村长" town_01 6 2                       ║\n' +
    '║                                                              ║\n' +
    '║  给NPC添加对话:                                              ║\n' +
    '║    add_npc_dialog mayor d1 "欢迎来到新手村！" d2            ║\n' +
    '║    add_npc_dialog mayor d2 "有什么事吗？" null              ║\n' +
    '║                                                              ║\n' +
    '║ 第四步：创建怪物                                             ║\n' +
    '║ ─────────────────                                           ║\n' +
    '║  create_monster slime "史莱姆" 30 8 3 20                    ║\n' +
    '║                                                              ║\n' +
    '║ 第五步：设置游戏起点                                         ║\n' +
    '║ ─────────────────                                           ║\n' +
    '║  set_game_start town_01 1 4                                 ║\n' +
    '║                                                              ║\n' +
    '║ 第六步：开始游玩                                             ║\n' +
    '║ ─────────────────                                           ║\n' +
    '║  look_map        查看地图                                   ║\n' +
    '║  look_around     查看周围                                   ║\n' +
    '║  move right      向右移动                                   ║\n' +
    '║  talk mayor      和村长对话                                 ║\n' +
    '║                                                              ║\n' +
    '║ 快速体验: 输入 play_demo 加载完整演示游戏！                  ║\n' +
    '║                                                              ║\n' +
    '╚══════════════════════════════════════════════════════════════╝';
}

// ==================== 弹窗 ====================

function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-content').textContent = content;
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

function exportSave() {
  var save = game.exportSave();
  try {
    var blob = new Blob([save], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'jrpg-save.json';
    a.click();
    URL.revokeObjectURL(url);
    printTerm('存档已下载', 'success');
  } catch (e) {
    showModal('游戏存档 (JSON)', save);
    printTerm('存档已显示在弹窗中', 'output');
  }
}

// ==================== AI 提示词 ====================

function getDefaultSystemPrompt() {
  return '你是一位专业的JRPG游戏设计师和QA测试工程师。你可以通过执行CLI指令来构建、测试和迭代游戏世界。\n\n' +
    '═══════ 你的核心工作流程 ═══════\n\n' +
    '【第一步：理解与规划】\n' +
    '仔细分析用户的游戏创意，规划以下内容：\n' +
    '1. 需要几张地图？各自的主题和大小？\n' +
    '2. 每张地图的地形布局（边界、道路、建筑物）\n' +
    '3. NPC数量、位置、性格和对话内容\n' +
    '4. 怪物种类和数值平衡\n' +
    '5. 游戏起点位置\n\n' +
    '【第二步：构建游戏】\n' +
    '按顺序执行BUILD类指令：\n' +
    '1. 创建所有地图 (create_map)\n' +
    '2. 编辑地形：先用fill_map画边界和大区域，再用edit_map微调细节\n' +
    '3. 创建NPC (create_npc)，确保放在可通行的格子上\n' +
    '4. 给NPC添加多段对话 (add_npc_dialog)，形成对话链\n' +
    '5. 创建怪物模板 (create_monster)\n' +
    '6. 设置游戏起点 (set_game_start)，确保起点在可通行的格子上\n\n' +
    '【第三步：验证测试】\n' +
    '构建完成后，必须进行测试验证：\n' +
    '1. look_map 检查地图布局是否合理\n' +
    '2. 用 move 指令四处走动，确认不会卡死在障碍物里\n' +
    '3. 走到每个NPC旁边，用 talk 测试对话是否正常\n' +
    '4. 用 debug_battle 测试怪物战斗和数值平衡\n' +
    '5. 确认玩家可以到达所有重要地点\n\n' +
    '【第四步：迭代优化】\n' +
    '根据测试结果调整：\n' +
    '- 如果有走不通的路，调整地形\n' +
    '- 如果对话不通顺，修改对话文本\n' +
    '- 如果怪物太强/太弱，调整数值\n\n' +
    '═══════ 完整指令参考 ═══════\n\n' +
    '【BUILD构建类】\n' +
    'create_map [id] [name] [width] [height]\n' +
    '  创建地图，默认填充草地。尺寸1-100。\n' +
    '  示例：create_map village "新手村" 15 12\n\n' +
    'delete_map [id] - 删除地图\n\n' +
    'edit_map [id] [x] [y] [type]\n' +
    '  修改某一格。坐标从(0,0)开始，左上角是原点。\n' +
    '  示例：edit_map village 5 3 tree\n\n' +
    'fill_map [id] [x1] [y1] [x2] [y2] [type]\n' +
    '  填充矩形区域（包含两端点）。适合快速画边界和大区域。\n' +
    '  示例：fill_map village 0 0 14 0 tree  (顶边种树做边界)\n\n' +
    'list_maps - 列出所有地图\n\n' +
    'create_npc [id] [name] [map_id] [x] [y]\n' +
    '  在地图指定位置创建NPC。注意：必须放在可通行的格子上！\n' +
    '  示例：create_npc mayor "村长" village 7 5\n\n' +
    'add_npc_state [npc_id] [key] [value] - 给NPC添加状态变量\n\n' +
    'add_npc_dialog [npc_id] [dialog_id] [text] [next_dialog?]\n' +
    '  添加对话。对话是链表结构，next_dialog是下一段ID，null表示结束。\n' +
    '  示例：add_npc_dialog mayor d1 "你好，年轻人！" d2\n' +
    '        add_npc_dialog mayor d2 "欢迎来到新手村。" null\n\n' +
    'list_npcs - 列出所有NPC\n\n' +
    'create_monster [id] [name] [hp] [atk] [def] [exp]\n' +
    '  创建怪物模板。\n' +
    '  新手怪参考：HP 20-40, ATK 5-10, DEF 1-3, EXP 10-25\n' +
    '  普通怪参考：HP 40-80, ATK 10-20, DEF 3-8, EXP 25-50\n' +
    '  示例：create_monster slime "史莱姆" 30 8 3 20\n\n' +
    'list_monsters - 列出所有怪物\n\n' +
    'set_player_stats [level] [hp] [atk] [def] - 设置玩家初始属性\n' +
    'add_player_state [key] [value] - 添加玩家全局状态\n' +
    'set_game_start [map_id] [x] [y] - 设置游戏起点（必须设置！）\n\n' +
    '【PLAY游玩类】\n' +
    'look_map - 查看当前地图全貌（俯视图）\n' +
    'look_around - 查看周围7x7区域（AI友好的感知方式）\n' +
    'move [up/down/left/right] - 移动一格（也可用u/d/l/r或上/下/左/右）\n' +
    'talk [npc_id] - 与附近的NPC对话（需距离≤1格）\n' +
    'next - 下一句对话\n' +
    'open_inventory (或inv) - 查看背包和玩家属性\n\n' +
    '【DEBUG调试类】\n' +
    'debug_teleport [map_id] [x] [y] - 直接传送到任意位置\n' +
    'debug_talk [npc_id] - 强制与NPC对话（无需靠近）\n' +
    'debug_battle [monster_id] - 立即战斗测试\n' +
    'debug_god - 无敌模式\n\n' +
    '【其他】\n' +
    'help - 查看完整帮助\n' +
    'build_tutorial - 构建教程\n' +
    'play_demo - 加载演示游戏\n' +
    'export_save - 导出存档JSON\n' +
    'import_save [json] - 导入存档\n' +
    'clear - 清空终端\n\n' +
    '═══════ 地块类型说明 ═══════\n' +
    '可通行: grass(草地) path(道路) door(门) empty(空地)\n' +
    '障碍物: tree(树) stone(石头) water(水) house(房屋)\n\n' +
    '═══════ 输出格式要求 ═══════\n\n' +
    '你的回复必须包含两部分：\n\n' +
    '第一部分：设计思路（用自然语言说明你的规划和理由）\n\n' +
    '第二部分：指令代码块（用 ``` 包裹，每行一条指令）\n' +
    '例如：\n' +
    '```\n' +
    'create_map village "新手村" 15 12\n' +
    'fill_map village 0 0 14 0 tree\n' +
    '```\n\n' +
    '重要规则：\n' +
    '- 带空格的名称必须用英文双引号包裹\n' +
    '- 每次生成的指令数量控制在合理范围内（建议一次不超过30条）\n' +
    '- 构建完成后主动建议进行测试验证\n' +
    '- 如果测试中发现问题，主动修复并重新测试\n\n' +
    '玩家初始属性：Lv1, HP 100, ATK 10, DEF 5\n' +
    '升级公式：每级经验 = level * 100，升级后 HP+20, ATK+3, DEF+2';
}

// ==================== 配置存取 ====================

function saveConfig() {
  var config = {
    apiKey: document.getElementById('cfg-apikey').value,
    endpoint: document.getElementById('cfg-endpoint').value,
    model: document.getElementById('cfg-model').value,
    startLevel: parseInt(document.getElementById('cfg-level').value),
    startHp: parseInt(document.getElementById('cfg-hp').value),
    startAtk: parseInt(document.getElementById('cfg-atk').value),
    startDef: parseInt(document.getElementById('cfg-def').value),
    systemPrompt: document.getElementById('cfg-prompt').value
  };
  localStorage.setItem('jrpg-maker-config', JSON.stringify(config));
  printTerm('配置已保存', 'success');
  alert('配置已保存！');
}

function loadConfig() {
  var saved = localStorage.getItem('jrpg-maker-config');
  if (saved) {
    try {
      var cfg = JSON.parse(saved);
      document.getElementById('cfg-apikey').value = cfg.apiKey || '';
      document.getElementById('cfg-endpoint').value = cfg.endpoint || 'https://api.deepseek.com/v1/chat/completions';
      document.getElementById('cfg-model').value = cfg.model || 'deepseek-chat';
      document.getElementById('cfg-level').value = cfg.startLevel || 1;
      document.getElementById('cfg-hp').value = cfg.startHp || 100;
      document.getElementById('cfg-atk').value = cfg.startAtk || 10;
      document.getElementById('cfg-def').value = cfg.startDef || 5;
      document.getElementById('cfg-prompt').value = cfg.systemPrompt || getDefaultSystemPrompt();
    } catch (e) {}
  } else {
    document.getElementById('cfg-prompt').value = getDefaultSystemPrompt();
  }
}

// ==================== AI对话 ====================

function sendToAI() {
  var input = document.getElementById('ai-input').value.trim();
  if (!input) return;
  
  addChatMsg(input, 'user');
  document.getElementById('ai-input').value = '';
  
  var apiKey = document.getElementById('cfg-apikey').value;
  if (!apiKey) {
    addChatMsg('请先在"配置"页面设置 DeepSeek API Key 才能使用AI创作功能。\n\n不过你仍然可以使用CLI终端手动输入指令来构建游戏！', 'ai');
    return;
  }
  
  var thinking = addChatMsg('思考中...', 'ai');
  
  try {
    var systemPrompt = document.getElementById('cfg-prompt').value || getDefaultSystemPrompt();
    var endpoint = document.getElementById('cfg-endpoint').value;
    var model = document.getElementById('cfg-model').value;
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) {
        thinking.textContent = '获取响应失败: ' + (data.error || JSON.stringify(data));
        return;
      }
      
      thinking.textContent = content;
      
      // 提取代码块中的指令
      var codeBlockMatch = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
      var commands = [];
      
      if (codeBlockMatch) {
        commands = codeBlockMatch[1].trim().split('\n').filter(function(line) {
          return line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#');
        });
      } else {
        // 尝试从文本中提取指令行
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (/^[a-z_]+\s+.+/.test(line) && !line.startsWith('http')) {
            commands.push(line);
          }
        }
      }
      
      if (commands.length > 0) {
        if (confirm('AI生成了 ' + commands.length + ' 条指令，是否执行？\n\n' + commands.join('\n'))) {
          setTimeout(function() {
            executeCommandsSequentially(commands, 0);
          }, 500);
        }
      }
    })
    .catch(function(err) {
      thinking.textContent = '请求失败: ' + err.message + '\n\n请检查API Key是否正确，或网络是否正常。';
    });
  } catch (e) {
    thinking.textContent = '错误: ' + e.message;
  }
}

function executeCommandsSequentially(commands, index) {
  if (index >= commands.length) {
    printTerm('所有指令执行完毕', 'success');
    return;
  }
  
  executeCommand(commands[index]);
  setTimeout(function() {
    executeCommandsSequentially(commands, index + 1);
  }, 300);
}

function playDemoGame() {
  var result = game.loadDemo();
  printTerm('play_demo', 'cmd');
  printTerm(result.msg, result.ok ? 'success' : 'error');
  
  var gameNav = document.querySelector('.nav-item[data-page="game"]');
  if (gameNav) gameNav.click();
  
  setTimeout(function() {
    refreshGameUI();
  }, 200);
}

function addChatMsg(text, type) {
  var chatBox = document.getElementById('chat-box');
  var msg = document.createElement('div');
  msg.className = 'chat-msg ' + type;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function clearChat() {
  document.getElementById('chat-box').innerHTML = '<div class="chat-msg ai">你好！我是 AI JRPG MAKER 智能助手。\n\n你可以用自然语言描述你的游戏创意，我会通过执行CLI指令来帮你构建游戏世界。\n\n例如：\n- "创建一个叫新手村的地图，有草地、树木和几座房子"\n- "添加一个村长NPC，给玩家任务"\n- "创建史莱姆怪物"\n\n试试看吧！</div>';
}