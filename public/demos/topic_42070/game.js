// ===== 像素骑士 · Pixel Knight（支持局域网联机）=====
// 2D 弹幕射击 Roguelite

// (() => {
  "use strict";

  // ---------- 全局错误捕获 ----------
  if (typeof window !== "undefined") {
    window.addEventListener("error", function (ev) {
      console.error("[PixelKnight] 错误:", ev.message, "行:", ev.lineno);
    });
  }

  // ---------- 网络模块 ----------
  const net = {
    ws: null,
    mode: "single",   // 'single' | 'host' | 'client'
    playerId: null,
    playerName: "玩家",
    roomCode: null,
    connected: false,
    // 客户端输入缓冲
    inputBuffer: null,
    // 其他玩家（从主机同步）
    otherPlayers: new Map(), // playerId -> player data
    // 网络统计
    ping: 0,
    lastSendTime: 0,
    // 客户端按键状态（用于同步）
    clientKeys: {},
    // 主机视角：客户端输入缓冲
    lastRoomId: -1,
    manualClose: false,
  };

  function netSend(obj) {
    if (net.ws && net.connected && net.ws.readyState === 1) {
      try { net.ws.send(JSON.stringify(obj)); } catch (e) {}
    }
  }

  function netConnect(onOpen, onError) {
    const host = window.location.hostname || "localhost";
    const port = window.location.port || "8000";
    const url = "ws://" + host + ":" + port + "/ws";
    try {
      net.ws = new WebSocket(url);
    } catch (e) {
      console.warn("WebSocket 创建失败:", e);
      if (onError) onError("WebSocket 初始化失败");
      return false;
    }
    // 超时保护：3 秒内未连接成功则认为失败
    const timeoutId = setTimeout(function () {
      if (net.connected) return;
      try { if (net.ws) net.ws.close(); } catch (e) {}
      console.warn("连接超时");
      if (onError) onError("连接超时，请检查服务器是否在端口 " + port + " 运行");
    }, 3000);
    net.ws.onopen = () => {
      net.connected = true;
      clearTimeout(timeoutId);
      console.log("WebSocket 连接成功:", url);
      if (onOpen) onOpen();
    };
    net.ws.onmessage = (ev) => {
      try {
        const msg = typeof ev.data === "string" ? JSON.parse(ev.data) : null;
        if (msg) netOnMessage(msg);
      } catch (e) {
        console.warn("消息解析失败:", e, "原始数据:", ev.data);
      }
    };
    net.ws.onerror = (e) => {
      console.warn("WebSocket 连接错误:", e, "URL:", url);
    };
    net.ws.onclose = () => {
      const wasConnected = net.connected;
      net.connected = false;
      // 如果是用户主动离开房间，不显示断开界面
      if (net.mode !== "single" && !net.manualClose && wasConnected) {
        showDisconnected("与服务器的连接已断开，请确认服务器是否运行");
      }
    };
    return true;
  }

  function netClose() {
    net.manualClose = true;
    if (net.ws) {
      try { net.ws.close(); } catch (e) {}
      net.ws = null;
    }
    net.mode = "single";
    net.connected = false;
    net.roomCode = null;
    net.playerId = null;
    net.otherPlayers.clear();
    // 稍等后重置标志，防止下次连接时误判
    setTimeout(function () { net.manualClose = false; }, 100);
  }

  function showDisconnected(reason) {
    hideAllOverlays();
    const screen = document.getElementById("disconnected-screen");
    const reasonEl = document.getElementById("disconnected-reason");
    if (reasonEl) reasonEl.textContent = reason || "连接已断开";
    if (screen) screen.classList.remove("hidden");
    netClose();
  }

  // 处理收到的服务器消息
  function netOnMessage(msg) {
    switch (msg.type) {
      case "room_created":
        net.roomCode = msg.roomCode;
        net.playerId = msg.playerId;
        net.mode = "host";
        net.playerName = String(msg.playerName || ("房主 " + msg.playerId));
        console.log("房间已创建：", msg);
        enterLobby(msg.roomCode, true);
        renderLobby([{ id: net.playerId, name: net.playerName, isHost: true }], 1);
        break;
      case "join_success":
        net.roomCode = msg.roomCode;
        net.playerId = msg.playerId;
        net.mode = "client";
        if (msg.playerName) net.playerName = String(msg.playerName);
        console.log("加入房间成功：", msg);
        enterLobby(msg.roomCode, false);
        break;
      case "join_failed":
        toast(msg.reason || "加入失败");
        const joinStatus = document.getElementById("join-status");
        if (joinStatus) joinStatus.textContent = msg.reason || "加入失败";
        break;
      case "lobby_update":
        console.log("收到大厅更新：players=", msg.players, "playerCount=", msg.playerCount);
        renderLobby(msg.players || [], msg.playerCount || 1);
        break;
      case "player_joined":
        toast((msg.playerName || "玩家") + " 加入了房间");
        break;
      case "player_left":
        toast((msg.playerName || "玩家") + " 离开了房间");
        if (net.otherPlayers.has(msg.playerId)) {
          net.otherPlayers.delete(msg.playerId);
        }
        break;
      case "game_start":
        // 开始游戏：客户端等待主机发送地图，主机已在按钮处理中调用 startNewRun()
        if (net.mode === "host") {
          // 主机：按钮处理已经调用 startNewRun()，这里只做清理
          break;
        }
        // 客户端：初始化基本状态，等待 initial_state
        hideAllOverlays();
        state.levelIndex = 1; state.subIndex = 1;
        state.player = makePlayer();
        state.upgradedWeapons = new Set();
        state.bossActive = false;
        state.currentBoss = null;
        state.elapsed = 0;
        state.doorPassCount = 0;
        state.doorPassRoomId = -1;
        state.doorPassStartTime = 0;
        bullets.length = 0;
        particles.length = 0;
        floaters.length = 0;
        break;
      case "initial_state":
        // 接收主机发送的完整初始状态（仅客户端处理）
        if (net.mode !== "client") break;
        console.log("[net] 收到初始状态");
        netApplyState(msg);
        state.scene = "play";
        enterRoom(state.currentRoomId, null);
        updateHUD();
        toast("开始冒险！");
        break;
      case "room_closed":
        showDisconnected(msg.reason || "房主已离开");
        break;

      // ---- 游戏内：主机发送的状态 ----
      case "state_update":
        if (net.mode !== "client") break;
        // 应用主机同步的状态
        netApplyState(msg);
        break;

      // ---- 游戏内：客户端发送的输入（主机端）----
      case "input_update":
        if (net.mode !== "host") break;
        netProcessClientInput(msg);
        break;
    }
  }

  function enterLobby(code, isHost) {
    hideAllOverlays();
    const lobby = document.getElementById("lobby-screen");
    if (!lobby) return;
    lobby.classList.remove("hidden");
    const codeEl = document.getElementById("lobby-code");
    if (codeEl) codeEl.textContent = code;
    // 房主按钮始终显示，可随时开始游戏
    const startBtn = document.getElementById("lobby-start-btn");
    if (startBtn) {
      if (isHost) {
        startBtn.style.display = "inline-block";
        startBtn.style.visibility = "visible";
      } else {
        startBtn.style.display = "none";
      }
    }
    const leaveBtn = document.getElementById("lobby-leave-btn");
    if (leaveBtn) {
      leaveBtn.style.display = "inline-block";
      leaveBtn.style.visibility = "visible";
    }
    const statusEl = document.getElementById("lobby-status");
    if (statusEl) {
      if (isHost) {
        statusEl.textContent = "随时可以开始游戏（2-4人）";
      } else {
        statusEl.textContent = "等待房主开始游戏…";
      }
    }
    console.log("[enterLobby] 进入大厅 code=", code, "isHost=", isHost);
  }

  function renderLobby(players, count) {
    const playersEl = document.getElementById("lobby-players");
    if (!playersEl) return;
    if (!Array.isArray(players)) players = [];
    let html = "";
    let realCount = 0;
    for (const p of players) {
      if (!p || typeof p !== "object") continue;
      realCount++;
      const pName = (typeof p.name === "string" && p.name.length > 0) ? p.name : ("玩家 " + (p.id != null ? p.id : realCount));
      const myName = (typeof net.playerName === "string" && net.playerName.length > 0) ? net.playerName : ("玩家 " + (net.playerId || ""));
      const isMe = (p.id === net.playerId);
      const displayName = isMe ? myName : pName;
      const badge = p.isHost ? "<span class='badge host'>房主</span>" : "<span class='badge'>玩家</span>";
      const meTag = isMe ? " <span class='badge me'>我</span>" : "";
      html += "<div class='lobby-player'>" + displayName + " " + badge + meTag + "</div>";
    }
    if (realCount === 0) {
      html = "<div class='lobby-player'>等待玩家加入…</div>";
      realCount = count || 1;
    }
    playersEl.innerHTML = html;
    const statusEl = document.getElementById("lobby-status");
    if (statusEl && net.mode === "host") {
      statusEl.textContent = "当前 " + realCount + " 名玩家（最多4人），随时可以开始游戏";
    }
  }

  // 远程玩家颜色池
  const REMOTE_COLORS = ["#ff6b9d", "#c44dff", "#4dffb8", "#ffd166", "#4d9fff", "#ff9f43"];
  let colorIndex = 0;
  function getNextRemoteColor() {
    const c = REMOTE_COLORS[colorIndex % REMOTE_COLORS.length];
    colorIndex++;
    return c;
  }
  // ---- 主机：处理客户端输入 ----
  function netProcessClientInput(msg) {
    const playerId = msg.playerId;
    if (!playerId) return;
    // 创建或更新这个远程玩家的输入状态
    let remote = net.otherPlayers.get(playerId);
    if (!remote) {
      // 新玩家加入，创建一个玩家对象（从当前房间生成）
      const room = currentRoom ? currentRoom() : null;
      remote = Object.assign(makePlayer(), {
        id: playerId,
        name: msg.playerName || ("玩家 " + playerId),
        isRemote: true,
        color: getNextRemoteColor(),
        keys: {},
        mouseX: W / 2, mouseY: H / 2,
        mouseDown: false, autoFire: false,
        x: ROOM_W / 2 + Math.random() * 30 - 15,
        y: ROOM_H / 2 + Math.random() * 30 - 15,
        hp: state.player ? Math.max(1, Math.floor(state.player.maxHp * 0.8)) : 10,
        maxHp: state.player ? state.player.maxHp : 12,
        fireCd: 0,
        dashCd: 0,
        dashTime: 0,
        invuln: 0,
        hurtFlash: 0,
        muzzle: 0,
        hasBounce: false,
        weapons: state.player && state.player.weapons ? [makeSlot(weaponKey(state.player.weapons[0]))] : [makeSlot("pistol")],
        backpack: [null, null, null],
      });
      net.otherPlayers.set(playerId, remote);
      toast((msg.playerName || ("玩家 " + playerId)) + " 加入游戏");
    }
    // 更新输入状态
    if (msg.keys) {
      // 处理武器切换按键
      if (msg.keys.slot1) remote.curWeapon = 0;
      if (msg.keys.slot2 && remote.weapons.length > 1) remote.curWeapon = 1;
      if (msg.keys.slot3 && remote.weapons.length > 2) remote.curWeapon = 2;
      // 其他移动/交互键
      remote.keys = msg.keys;
    }
    if (msg.mouseX != null) remote.mouseX = msg.mouseX;
    if (msg.mouseY != null) remote.mouseY = msg.mouseY;
    remote.mouseDown = !!msg.mouseDown;
    remote.autoFire = !!msg.autoFire;
    if (msg.slotIdx != null && msg.slotIdx >= 0 && msg.slotIdx < remote.weapons.length) {
      remote.curWeapon = msg.slotIdx;
    }
    // 武器同步：如果客户端发来武器槽信息，同步它
    if (msg.weapons && Array.isArray(msg.weapons)) {
      try {
        remote.weapons = msg.weapons.map(w => ({ key: w.key, stars: w.stars || 1 }));
      } catch (e) {}
    }
  }

  // ---- 主机：发送完整初始状态（包含完整地图）----
  function netSendInitialState() {
    if (!state.level || !state.player || net.mode !== "host") return;
    
    const levelData = state.level.map(room => ({
      id: room.id,
      type: room.type,
      gx: room.gx,
      gy: room.gy,
      doors: room.doors,
      cleared: room.cleared,
      visited: room.visited,
      obstacles: room.obstacles,
      chest: room.chest ? { x: room.chest.x, y: room.chest.y, opened: room.chest.opened } : null,
      shopItems: room.shopItems ? room.shopItems.map(it => ({ x: it.x, y: it.y, w: it.w, h: it.h, kind: it.kind, weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, bought: it.bought, amount: it.amount, costPercent: it.costPercent })) : [],
      portal: room.portal ? { x: room.portal.x, y: room.portal.y } : null,
      spawned: room.spawned,
    }));

    const room = currentRoom();
    const roomData = room ? {
      type: room.type,
      cleared: room.cleared,
      doors: room.doors,
      enemies: room.enemies.map(e => ({
        type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
        r: e.r, color: e.color, isBoss: e.isBoss
      })),
      chest: room.chest ? { x: room.chest.x, y: room.chest.y, opened: room.chest.opened } : null,
      shopItems: room.shopItems ? room.shopItems.map(it => ({ x: it.x, y: it.y, w: it.w, h: it.h, kind: it.kind, weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, bought: it.bought, amount: it.amount, costPercent: it.costPercent })) : [],
      portal: room.portal ? { x: room.portal.x, y: room.portal.y, spin: room.portal.spin } : null,
      drops: room.drops.map(d => ({ kind: d.kind, x: d.x, y: d.y, amount: d.amount, weapon: d.weapon, weaponStars: d.weaponStars })),
    } : null;

    // 构建所有玩家列表（主机 + 所有远程玩家）
    const p = state.player;
    const allPlayers = [];
    allPlayers.push({
      id: "host",
      name: net.playerName || "主机",
      x: p.x, y: p.y, r: p.r,
      hp: p.hp, maxHp: p.maxHp,
      energy: p.energy, maxEnergy: p.maxEnergy,
      coins: p.coins,
      weapons: p.weapons.map(w => ({ key: weaponKey(w), stars: weaponStars(w) })),
      curWeapon: p.curWeapon,
      facing: p.facing,
      color: "#6ac2ff",
      isHost: true,
      hasBounce: !!p.hasBounce,
    });
    for (const [rid, rp] of net.otherPlayers) {
      if (rp) allPlayers.push({
        id: rid,
        name: rp.name || ("玩家 " + rid),
        x: rp.x, y: rp.y, r: rp.r,
        hp: rp.hp, maxHp: rp.maxHp,
        energy: rp.energy, maxEnergy: rp.maxEnergy,
        coins: rp.coins,
        weapons: (rp.weapons || []).map(w => ({ key: weaponKey(w), stars: weaponStars(w) })),
        curWeapon: rp.curWeapon,
        facing: rp.facing,
        color: rp.color || "#ff6b9d",
        isHost: false,
        hasBounce: !!rp.hasBounce,
      });
    }

    const stateMsg = {
      type: "initial_state",
      levelIndex: state.levelIndex,
      subIndex: state.subIndex,
      currentRoomId: state.currentRoomId,
      elapsed: state.elapsed,
      level: levelData,
      room: roomData,
      players: allPlayers,
    };

    console.log("[netSendInitialState] 发送完整初始状态，房间数:", levelData.length);
    netSend(stateMsg);
  }

  // ---- 客户端：应用主机同步状态 ----
  function netApplyState(msg) {
    if (msg.levelIndex != null) state.levelIndex = msg.levelIndex;
    if (msg.subIndex != null) state.subIndex = msg.subIndex;
    if (msg.elapsed != null) state.elapsed = msg.elapsed;
    // 当前房间切换
    if (msg.currentRoomId != null) {
      if (state.currentRoomId !== msg.currentRoomId) {
        // 房间发生了切换
        state.currentRoomId = msg.currentRoomId;
      } else {
        state.currentRoomId = msg.currentRoomId;
      }
    }

    // 完整地图数据（首次同步或关卡切换）
    if (msg.level && Array.isArray(msg.level)) {
      if (!state.level || state.level.length !== msg.level.length) {
        state.level = msg.level.map(r => ({
          id: r.id, type: r.type, gx: r.gx, gy: r.gy,
          doors: r.doors, cleared: r.cleared, visited: r.visited,
          obstacles: r.obstacles || [],
          chest: r.chest ? { x: r.chest.x, y: r.chest.y, w: 36, h: 36, opened: r.chest.opened } : null,
          shopItems: r.shopItems ? r.shopItems.map(it => ({ x: it.x, y: it.y, w: it.w, h: it.h, kind: it.kind, weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, bought: it.bought, amount: it.amount, costPercent: it.costPercent })) : [],
          portal: r.portal ? { x: r.portal.x, y: r.portal.y, w: 60, h: 60, spin: 0 } : null,
          enemies: [], drops: [],
          spawned: r.spawned,
        }));
      } else {
        // 增量更新：只更新已清除/访问状态
        for (const r of msg.level) {
          const sr = state.level.find(x => x.id === r.id);
          if (sr) {
            sr.cleared = r.cleared;
            sr.visited = r.visited;
            sr.doors = r.doors;
            if (r.spawned != null) sr.spawned = r.spawned;
          }
        }
      }
    }

    // 当前房间内容（敌人、宝箱、商店、传送门、掉落物）
    if (msg.room && state.level) {
      const room = state.level[state.currentRoomId];
      if (room) {
        room.cleared = msg.room.cleared;
        room.type = msg.room.type;
        // 敌人状态同步
        if (msg.room.enemies) {
          room.enemies = msg.room.enemies.map(e => ({
            type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
            r: e.r, color: e.color, isBoss: !!e.isBoss, fireCd: 0,
          }));
        }
        // 宝箱
        if (msg.room.chest !== undefined) {
          room.chest = msg.room.chest ? { x: msg.room.chest.x, y: msg.room.chest.y, w: 36, h: 36, opened: !!msg.room.chest.opened } : null;
        }
        // 商店
        if (msg.room.shopItems) {
          room.shopItems = msg.room.shopItems.map(it => ({
            x: it.x, y: it.y, w: it.w, h: it.h, kind: it.kind, weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, bought: !!it.bought, amount: it.amount, costPercent: it.costPercent
          }));
        }
        // 传送门
        if (msg.room.portal !== undefined) {
          room.portal = msg.room.portal ? { x: msg.room.portal.x, y: msg.room.portal.y, spin: msg.room.portal.spin || 0 } : null;
        }
        // 掉落物
        if (msg.room.drops) {
          room.drops = msg.room.drops.map(d => ({ kind: d.kind, x: d.x, y: d.y, amount: d.amount, weapon: d.weapon, weaponStars: d.weaponStars, life: 60, bob: 0 }));
        }
        room.doors = msg.room.doors;
      }
    }

    // 所有玩家（主机和客户端）
    if (msg.players && Array.isArray(msg.players)) {
      if (net.mode === "client") {
        // 客户端：找到自己的条目
        let me = null;
        for (const pl of msg.players) {
          if (String(pl.id) === String(net.playerId)) { me = pl; break; }
        }
        if (me && state.player) {
          const p = state.player;
          // 位置与朝向：以插值方式平滑到权威位置，避免网络抖动造成的画面卡顿
          if (me.x != null) p._tx = me.x;
          if (me.y != null) p._ty = me.y;
          if (me.facing != null) p._tfacing = me.facing;
          // 大偏差时直接跳过去，避免插值延迟造成穿墙或长时间拉回
          if (p._tx != null && p.x != null && Math.hypot(p._tx - p.x, (p._ty ?? p.y) - p.y) > 80) {
            p.x = p._tx; p.y = p._ty;
            if (p._tfacing != null) p.facing = p._tfacing;
          }
          // HP 同步：跟随主机权威值
          if (me.hp != null) p.hp = me.hp;
          if (me.maxHp != null) p.maxHp = me.maxHp;
          // 能量和金币
          if (me.energy != null) p.energy = me.energy;
          if (me.maxEnergy != null) p.maxEnergy = me.maxEnergy;
          if (me.coins != null) p.coins = me.coins;
          if (me.hasBounce != null) p.hasBounce = !!me.hasBounce;
          // 武器槽同步
          if (me.curWeapon != null) p.curWeapon = me.curWeapon;
          if (me.weapons && me.weapons.length) {
            p.weapons = me.weapons.map(w => ({ key: w.key, stars: w.stars || 1 }));
          }
          // 同步展示字段（绘制时用）
          if (me.r != null) p.r = me.r;
        }
        // 其他玩家（联机队友）：同样记录目标位置，供 update 阶段插值
        const otherIds = new Set();
        for (const pl of msg.players) {
          if (String(pl.id) !== String(net.playerId)) {
            otherIds.add(pl.id);
            const existing = net.otherPlayers.get(pl.id);
            if (existing) {
              // 仅更新数值字段，保留渲染插值所需的目标位置
              existing._tx = pl.x; existing._ty = pl.y; existing._tfacing = pl.facing;
              existing.hp = pl.hp; existing.maxHp = pl.maxHp;
              existing.energy = pl.energy; existing.maxEnergy = pl.maxEnergy;
              existing.coins = pl.coins;
              if (pl.weapons && pl.weapons.length) existing.weapons = pl.weapons.map(w => ({ key: w.key, stars: w.stars || 1 }));
              if (pl.curWeapon != null) existing.curWeapon = pl.curWeapon;
              if (pl.color) existing.color = pl.color;
              if (pl.name) existing.name = pl.name;
              if (pl.r != null) existing.r = pl.r;
              if (pl.hasBounce != null) existing.hasBounce = !!pl.hasBounce;
              // 首次建立目标位置时，如果当前位置差距过大，直接跳过去
              if (existing.x == null || Math.hypot((pl.x ?? existing.x) - existing.x, (pl.y ?? existing.y) - existing.y) > 80) {
                existing.x = pl.x; existing.y = pl.y;
                if (pl.facing != null) existing.facing = pl.facing;
              }
            } else {
              net.otherPlayers.set(pl.id, Object.assign({}, pl, {
                keys: {}, mouseX: 0, mouseY: 0,
                _tx: pl.x, _ty: pl.y, _tfacing: pl.facing,
              }));
            }
          }
        }
        // 清除已离开的玩家
        for (const id of Array.from(net.otherPlayers.keys())) {
          if (!otherIds.has(id) && String(id) !== "host") net.otherPlayers.delete(id);
        }
      }
    }
    // 子弹同步（客户端视角）
    if (msg.bullets) {
      // 使用目标位置插值的方式合并：把已有子弹保留，然后用新收到的数据刷新位置，
      // 避免每 ~66ms 整批替换造成的视觉跳变
      const src = msg.bullets;
      // 新旧数量不一致或差距过大时，直接替换（否则保持插值）
      const countDiff = Math.abs(src.length - bullets.length);
      if (countDiff > Math.max(10, Math.floor(src.length * 0.3))) {
        bullets.length = 0;
        for (let i = 0; i < src.length; i++) {
          bullets.push(Object.assign({ life: 1, max: 1, trail: [], _fadeIn: 0.2 }, src[i]));
        }
      } else {
        // 对齐已有子弹的位置，新增/补足尾部，多余的尾部保留但做淡出
        for (let i = 0; i < src.length; i++) {
          if (bullets[i]) {
            bullets[i].x = src[i].x;
            bullets[i].y = src[i].y;
            bullets[i].size = src[i].size;
            bullets[i].color = src[i].color;
            // 记录目标位置用于 update 中的插值
            bullets[i]._tx = src[i].x;
            bullets[i]._ty = src[i].y;
          } else {
            bullets.push(Object.assign({ life: 1, max: 1, trail: [], _fadeIn: 0.2, _tx: src[i].x, _ty: src[i].y }, src[i]));
          }
        }
        // 超过新数据长度的旧子弹做淡出标记
        if (bullets.length > src.length) {
          for (let i = src.length; i < bullets.length; i++) {
            bullets[i]._fadeOut = (bullets[i]._fadeOut == null) ? 0.15 : bullets[i]._fadeOut;
          }
        }
      }
    }
  }

  // ---------- 基础工具 ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sign = Math.sign || ((n) => n > 0 ? 1 : n < 0 ? -1 : 0);
  // 线性插值（用于网络同步的位置平滑）
  function lerp(a, b, t) { return a + (b - a) * t; }
  // 角度插值（处理 2π 环绕）
  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  // ---------- 输入 ----------
  const keys = Object.create(null);
  const mouse = { x: W / 2, y: H / 2, down: false, _wasDown: false, autoFire: false };
  function handleKeyDown(e) {
    const k = e.key.toLowerCase();
    const code = e.code || "";
    // 同时支持 key 和 code
    keys[k] = true;
    if (code.startsWith("Arrow")) keys[code] = true;
    if ([" ", "w", "a", "s", "d"].includes(k)) e.preventDefault();
    if (k === "p") togglePause();
  }
  function handleKeyUp(e) {
    const k = e.key.toLowerCase();
    const code = e.code || "";
    keys[k] = false;
    if (code.startsWith("Arrow")) keys[code] = false;
  }
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  canvas.addEventListener("wheel", (e) => {
    if (state.scene !== "play") return;
    e.preventDefault();
    const p = state.player;
    if (!p || p.weapons.length < 2) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    const next = (p.curWeapon + dir + p.weapons.length) % p.weapons.length;
    if (next !== p.curWeapon) {
      p.curWeapon = next;
      sfx.swap();
      animateSlotSwap(next);
      updateHUD();
    }
  }, { passive: false });
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * W;
    mouse.y = ((e.clientY - rect.top) / rect.height) * H;
  });
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) {
      mouse.autoFire = !mouse.autoFire;
      if (mouse.autoFire) toast("连发：开启");
      else toast("连发：关闭");
      updateHUD();
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.down = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- 常量 ----------
  const TILE = 40;
  const ROOM_COLS = 24;
  const ROOM_ROWS = 15;
  const ROOM_W = ROOM_COLS * TILE;
  const ROOM_H = ROOM_ROWS * TILE;

  // ---------- 武器 ----------
  const WEAPONS = {
    pistol:   { name: "手枪",     damage: 3,  fireRate: 240, bulletSpeed: 760,  bulletLife: 0.9,  bulletSize: 4,  spread: 0.03,  bullets: 1,  energyCost: 1,  color: "#ffd166", sound: "pop" },
    shotgun:  { name: "霰弹枪",   damage: 2,  fireRate: 620, bulletSpeed: 640,  bulletLife: 0.55, bulletSize: 3,  spread: 0.28,  bullets: 7,  energyCost: 5,  color: "#ef8354", sound: "boom" },
    smg:      { name: "冲锋枪",   damage: 2,  fireRate: 80,  bulletSpeed: 820,  bulletLife: 0.7,  bulletSize: 3,  spread: 0.14,  bullets: 1,  energyCost: 1,  color: "#6ac2ff", sound: "tick" },
    laser:    { name: "激光枪",   damage: 7,  fireRate: 350, bulletSpeed: 1600, bulletLife: 1.5, bulletSize: 6,  spread: 0,     bullets: 1,  energyCost: 8,  color: "#ff5df2", sound: "zap", laser: true, pierce: true },
    rocket:   { name: "火箭筒",   damage: 10, fireRate: 950, bulletSpeed: 480,  bulletLife: 1.8,  bulletSize: 8,  spread: 0,     bullets: 1,  energyCost: 10, color: "#ff7b54", sound: "boom", explode: { radius: 60, damage: 8 } },
    // ========== 新增武器 ==========
    sniper:   { name: "狙击枪",   damage: 20, fireRate: 1800,bulletSpeed: 2200, bulletLife: 1.2,  bulletSize: 5,  spread: 0.01,  bullets: 1,  energyCost: 17, color: "#06d6a0", sound: "zap" },
    freeze:   { name: "冰冻枪",   damage: 2,  fireRate: 400, bulletSpeed: 600,  bulletLife: 0.8,  bulletSize: 5,  spread: 0.12,  bullets: 1,  energyCost: 6,  color: "#00d4ff", sound: "pop", freeze: { duration: 1.5, slowFactor: 0.4, fireRateSlow: 0.5 } },
    flame:    { name: "火焰枪",   damage: 1,  fireRate: 60,  bulletSpeed: 450,  bulletLife: 0.5,  bulletSize: 6,  spread: 0.25,  bullets: 1,  energyCost: 3,  color: "#ff4500", sound: "pop", burn: { dps: 4, duration: 2 } },
    burst:    { name: "三连发",   damage: 4,  fireRate: 350, bulletSpeed: 900,  bulletLife: 0.7,  bulletSize: 4,  spread: 0.08,  bullets: 3,  energyCost: 5,  color: "#ffd166", sound: "tick" },
    grenade:  { name: "榴弹发射器",damage: 12, fireRate: 2500,bulletSpeed: 550,  bulletLife: 3.0,  bulletSize: 8,  spread: 0,     bullets: 1,  energyCost: 16, color: "#ff6b35", sound: "boom", explode: { radius: 65, damage: 12 }, isGrenade: true },
    lightning:{ name: "闪电枪",   damage: 6,  fireRate: 450, bulletSpeed: 1200, bulletLife: 0.4,  bulletSize: 4,  spread: 0,     bullets: 1,  energyCost: 7,  color: "#ffff00", sound: "zap", chain: { targets: 2, range: 180 } },
    orb:      { name: "能量球",   damage: 5,  fireRate: 500, bulletSpeed: 500,  bulletLife: 30,  bulletSize: 10, spread: 0,     bullets: 1,  energyCost: 8,  color: "#a855f7", sound: "zap", orbit: { radius: 80, speed: 2.5 } },
    railgun:  { name: "磁轨炮",   damage: 6, fireRate: 1500, bulletSpeed: 3000, bulletLife: 0.5,  bulletSize: 4,  spread: 0,     bullets: 1,  energyCost: 20, color: "#c0c0c0", sound: "zap", pierce: true, wide: true, charge: { maxDamage: 18, maxTime: 4000, baseDamage: 6 } },
    // ========== 近战武器 ==========
    dagger:   { name: "匕首",     damage: 8,  fireRate: 280, bulletSpeed: 0,    bulletLife: 0,    bulletSize: 0,  spread: 0,     bullets: 0,  energyCost: 2,  color: "#d9d9d9", sound: "tick", melee: { style: "thrust", range: 90,  arc: 0.5, multiHit: 2 }, charge: { maxDamage: 22, maxTime: 800,  baseDamage: 10, heavyRange: 120, heavyArc: 0.7, knockback: 180, style: "thrust", combo: 3 } },
    sword:    { name: "剑",       damage: 14, fireRate: 450, bulletSpeed: 0,    bulletLife: 0,    bulletSize: 0,  spread: 0,     bullets: 0,  energyCost: 5,  color: "#b8c4ff", sound: "tick", melee: { style: "swing", range: 100, arc: 1.4 }, charge: { maxDamage: 38, maxTime: 1100, baseDamage: 16, heavyRange: 140, heavyArc: 2.2, knockback: 250, style: "swing", trail: true } },
    axe:      { name: "战斧",     damage: 22, fireRate: 700, bulletSpeed: 0,    bulletLife: 0,    bulletSize: 0,  spread: 0,     bullets: 0,  energyCost: 10, color: "#c07030", sound: "boom", melee: { style: "cleave", range: 100, arc: 1.0, quake: 30 }, charge: { maxDamage: 60, maxTime: 1400, baseDamage: 26, heavyRange: 130, heavyArc: 1.6, knockback: 320, style: "cleave", quake: 60 } },
    fireblade:{ name: "烈焰刀",   damage: 12, fireRate: 500, bulletSpeed: 0,    bulletLife: 0,    bulletSize: 0,  spread: 0,     bullets: 0,  energyCost: 7,  color: "#ff6b35", sound: "tick", melee: { style: "spin", range: 80, arc: Math.PI * 2, burn: { dps: 4, duration: 2.5 } }, charge: { maxDamage: 32, maxTime: 1100, baseDamage: 14, heavyRange: 110, heavyArc: Math.PI * 2, knockback: 220, style: "spin", burn: { dps: 10, duration: 3.5 } } },
    frostblade:{ name: "寒霜剑",  damage: 10, fireRate: 500, bulletSpeed: 800,  bulletLife: 0.6,  bulletSize: 6,  spread: 0.15,  bullets: 3,  energyCost: 8,  color: "#66e0ff", sound: "tick", pierce: true, melee: { style: "iceSpike", range: 60, arc: 0.6, freeze: { duration: 1.4, slowFactor: 0.3, fireRateSlow: 0.4 } }, charge: { maxDamage: 28, maxTime: 1100, baseDamage: 12, heavyRange: 90, heavyArc: 0.8, knockback: 220, style: "iceSpike", freeze: { duration: 3.0, slowFactor: 0.15, fireRateSlow: 0.3 } } },
  };

  // ---------- 星级武器 ----------
  // 统一获取武器定义：slot 为字符串 key 或 { key, stars } 对象
  function weaponKey(slot) {
    if (!slot) return null;
    if (typeof slot === "string") return slot;
    return slot.key;
  }
  function weaponStars(slot) {
    if (!slot) return 1;
    if (typeof slot === "string") return 1;
    return slot.stars || 1;
  }
  function getWeaponDef(slot) {
    const key = weaponKey(slot);
    if (!key) return null;
    const base = WEAPONS[key];
    if (!base) return null;
    const stars = weaponStars(slot);
    if (stars <= 1) return base;
    // 二星：伤害×1.6，子弹大小+3；三星：伤害×2.2，子弹大小+6
    const mul = 1 + (stars - 1) * 0.6;
    // 冲锋枪固定能量消耗
    const fixedCost = key === "smg" ? (stars === 2 ? 2 : stars === 3 ? 3 : 1) : Math.max(1, Math.round(base.energyCost * (1 + (stars - 1) * 0.5)));
    const nameSuffix = stars === 2 ? " 二星" : stars === 3 ? " 三星" : " +" + (stars - 1);
    const laserExtra = key === "laser" ? {
      bulletLife: base.bulletLife + (stars - 1) * 0.5,
      maxBounces: 1 + (stars - 1), // 基础 1 次弹射，每升一星 +1
      hasBounce: true,              // 激光枪自带弹射，不再依赖玩家道具
    } : {};
    const shotgunExtra = key === "shotgun" ? {
      bullets: base.bullets + (stars - 1) * 2,
    } : {};
    const flameExtra = key === "flame" && base.burn ? {
      burn: { dps: base.burn.dps + (stars - 1) * 2, duration: base.burn.duration + (stars - 1) * 0.5 },
    } : {};
    const freezeExtra = key === "freeze" && base.freeze ? {
      freeze: { duration: base.freeze.duration + (stars - 1) * 0.3, slowFactor: Math.max(0.1, base.freeze.slowFactor - (stars - 1) * 0.08), fireRateSlow: base.freeze.fireRateSlow },
    } : {};
    return Object.assign({}, base, laserExtra, shotgunExtra, flameExtra, freezeExtra, {
      stars: stars,
      name: base.name + nameSuffix,
      damage: Math.round(base.damage * mul),
      bulletSize: base.bulletSize + (stars - 1) * 3,
      energyCost: fixedCost,
      explode: base.explode ? { radius: base.explode.radius + (stars - 1) * 10, damage: Math.round(base.explode.damage * mul) } : null,
      melee: base.melee ? { style: base.melee.style, range: base.melee.range + (stars - 1) * 12, arc: base.melee.arc, multiHit: base.melee.multiHit, quake: base.melee.quake ? base.melee.quake + (stars - 1) * 10 : 0, trail: base.melee.trail, burn: base.melee.burn ? { dps: base.melee.burn.dps + (stars - 1) * 2, duration: base.melee.burn.duration + (stars - 1) * 0.5 } : null, freeze: base.melee.freeze ? { duration: base.melee.freeze.duration + (stars - 1) * 0.3, slowFactor: Math.max(0.1, base.melee.freeze.slowFactor - (stars - 1) * 0.08), fireRateSlow: base.melee.freeze.fireRateSlow } : null } : null,
      charge: base.charge ? { style: base.charge.style, maxDamage: Math.round(base.charge.maxDamage * mul), maxTime: base.charge.maxTime, baseDamage: Math.round(base.charge.baseDamage * mul), heavyRange: (base.charge.heavyRange || 0) + (stars - 1) * 15, heavyArc: base.charge.heavyArc, knockback: (base.charge.knockback || 0) + (stars - 1) * 30, combo: base.charge.combo, quake: base.charge.quake ? base.charge.quake + (stars - 1) * 15 : 0, trail: base.charge.trail, burn: base.charge.burn ? { dps: base.charge.burn.dps + (stars - 1) * 2, duration: base.charge.burn.duration + (stars - 1) * 0.5 } : null, freeze: base.charge.freeze ? { duration: base.charge.freeze.duration + (stars - 1) * 0.4, slowFactor: Math.max(0.05, base.charge.freeze.slowFactor - (stars - 1) * 0.1), fireRateSlow: base.charge.freeze.fireRateSlow } : null } : null,
    });
  }
  function makeSlot(key, stars) {
    stars = stars || 1;
    if (stars <= 1) return { key: key, stars: 1 };
    return { key: key, stars: stars };
  }

  // ---------- 简易音效 ----------
  let audioCtx = null;
  // 总音量系数（0~1），影响所有音频输出
  let masterVolume = 1.0;

  // 设置总音量：v 为 0~1，同步 master 滑条并持久化
  function setMasterVolume(v) {
    const clamped = typeof v === "number" ? Math.max(0, Math.min(1, v)) : masterVolume;
    masterVolume = clamped;
    const slider = document.getElementById("master-volume");
    const label = document.getElementById("master-volume-value");
    const percent = Math.round(clamped * 100);
    if (slider) slider.value = String(percent);
    if (label) label.textContent = String(percent);
    try { localStorage.setItem("master_volume", String(clamped)); } catch (e) {}
    // 总音量变化后，同步刷新 BGM 和 SFX 的实际输出
    applyMasterVolume();
  }

  // 将当前 masterVolume 应用到所有活跃音频（BGM audio、SFX 下一次播放）
  function applyMasterVolume() {
    // BGM audio 音量 = bgm.volume * masterVolume
    if (bgm.audio) {
      try { bgm.audio.volume = bgm.volume * masterVolume; } catch (e) {}
    }
  }

  // 音效音量子系数（0~1），受 masterVolume 乘算
  let sfxVolume = 1.0;

  // 设置音效音量：v 为 0~1，同步 UI 并持久化
  function setSfxVolume(v) {
    const clamped = typeof v === "number" ? Math.max(0, Math.min(1, v)) : sfxVolume;
    sfxVolume = clamped;
    const slider = document.getElementById("sfx-volume");
    const label = document.getElementById("sfx-volume-value");
    const percent = Math.round(clamped * 100);
    if (slider) slider.value = String(percent);
    if (label) label.textContent = String(percent);
    try { localStorage.setItem("sfx_volume", String(clamped)); } catch (e) {}
  }

  function playTone(freq, dur, type, vol) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(vol * sfxVolume * masterVolume, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  // ---------- 背景音乐 ----------
  // 使用本地 WAV 文件
  let bgm = {
    playing: false,
    audio: null,
    volume: 0.5, // 0~1，与 audio.volume 保持一致
  };

  // 设置音乐音量：v 为 0~1 的实数，自动同步到 audio 与 UI，并持久化
  function setBgmVolume(v) {
    const clamped = typeof v === "number" ? Math.max(0, Math.min(1, v)) : bgm.volume;
    bgm.volume = clamped;
    if (bgm.audio) {
      try { bgm.audio.volume = clamped * masterVolume; } catch (e) {}
    }
    // 同步 UI 滑条与数值显示
    const slider = document.getElementById("music-volume");
    const label = document.getElementById("music-volume-value");
    const percent = Math.round(clamped * 100);
    if (slider) slider.value = String(percent);
    if (label) label.textContent = String(percent);
    try { localStorage.setItem("bgm_volume", String(clamped)); } catch (e) {}
  }

  function startBgm() {
    if (bgm.playing) return;
    if (!bgm.audio) {
      bgm.audio = new Audio("music.wav");
      bgm.audio.loop = true;
    }
    bgm.audio.volume = bgm.volume * masterVolume;
    bgm.audio.play().catch(() => {});
    bgm.playing = true;
  }

  function stopBgm() {
    if (!bgm.playing) return;
    if (bgm.audio) {
      bgm.audio.pause();
      bgm.audio.currentTime = 0;
    }
    bgm.playing = false;
  }

  const sfx = {
    pop: () => playTone(760, 0.08, "square", 0.04),
    boom: () => { playTone(220, 0.2, "sawtooth", 0.08); playTone(100, 0.3, "triangle", 0.07); },
    tick: () => playTone(1200, 0.04, "square", 0.03),
    zap: () => playTone(1600, 0.14, "sawtooth", 0.05),
    hurt: () => { playTone(180, 0.18, "square", 0.06); playTone(110, 0.25, "sawtooth", 0.05); },
    pickup: () => { playTone(880, 0.06, "triangle", 0.05); setTimeout(() => playTone(1320, 0.08, "triangle", 0.05), 60); },
    portal: () => { playTone(440, 0.1, "sine", 0.06); setTimeout(() => playTone(660, 0.12, "sine", 0.06), 80); setTimeout(() => playTone(880, 0.14, "sine", 0.06), 180); },
    dash: () => playTone(520, 0.08, "sine", 0.04),
    boss: () => { playTone(60, 0.5, "sawtooth", 0.08); setTimeout(() => playTone(40, 0.6, "sawtooth", 0.06), 100); },
    swap: () => playTone(1040, 0.08, "triangle", 0.04),
  };

  // ---------- 屏幕震动 ----------
  let shakeTime = 0, shakeIntensity = 0;
  function shake(time, intensity) { shakeTime = Math.max(shakeTime, time); shakeIntensity = Math.max(shakeIntensity, intensity); }

  // ---------- 粒子 ----------
  const particles = [];
  function spawnParticles(x, y, count, color, speed, life) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.3, speed);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, size: rand(1.5, 4), shape: Math.random() < 0.4 ? "rect" : "circle" });
    }
  }
  function spawnExplosionRing(x, y, color, radius) {
    for (let i = 0; i < 3; i++) particles.push({ x, y, vx: 0, vy: 0, life: 0.3 + i * 0.08, max: 0.3 + i * 0.08, color, size: 2, ring: true, ringR: 5 + i * 8, ringMax: radius + i * 10 });
  }

  // ---------- 飘字 ----------
  const floaters = [];
  function floatText(x, y, text, color) { floaters.push({ x, y, text: String(text), color: color || "#fff", life: 0.9, max: 0.9, vy: -40 - Math.random() * 20 }); }
  function bigFloat(x, y, text, color) { floaters.push({ x, y, text: String(text), color: color || "#fff", life: 1.2, max: 1.2, vy: -30, big: true }); }

  // ---------- 房间生成 ----------
  const RT = { START: "start", NORMAL: "normal", TREASURE: "treasure", BOSS: "boss", SHOP: "shop" };

  function generateLevel(level) {
    const rooms = [];
    const used = {};
    const startX = 0, startY = 1;
    used[`${startX},${startY}`] = true;
    rooms.push({ gx: startX, gy: startY, type: RT.START, id: 0, doors: {}, visited: true, cleared: true, enemies: [], drops: [], spawned: true, obstacles: [] });

    const minRooms = 6;
    const target = 7 + randi(0, 6);
    let safetyLimit = 0;
    while (rooms.length < target && safetyLimit < 50) {
      safetyLimit++;
      const queue = [rooms[rooms.length - 1]];
      let expanded = false;
      while (rooms.length < target && queue.length) {
        const parent = queue.shift();
        const dirs = [[1, 0, "E", "W"], [-1, 0, "W", "E"], [0, 1, "S", "N"], [0, -1, "N", "S"]].sort(() => Math.random() - 0.5);
        for (const [dx, dy, dName, oppName] of dirs) {
          if (rooms.length >= target) break;
          const nx = parent.gx + dx, ny = parent.gy + dy;
          if (nx < 0 || nx >= 5 || ny < 0 || ny >= 3) continue;
          if (used[`${nx},${ny}`]) continue;
          const skipRate = rooms.length < minRooms ? 0 : 0.15;
          if (Math.random() < skipRate) continue;
          used[`${nx},${ny}`] = true;
          const room = { gx: nx, gy: ny, type: RT.NORMAL, id: rooms.length, doors: {}, visited: false, cleared: false, enemies: [], drops: [], spawned: false };
          parent.doors[dName] = room.id;
          room.doors[oppName] = parent.id;
          rooms.push(room);
          queue.push(room);
          expanded = true;
        }
      }
      if (!expanded) break;
    }
    // 防御：至少确保有 6 个房间，否则强制补充
    if (rooms.length < minRooms) {
      // 生成一条直线：0 -> 1 -> 2 -> 3 -> 4
      for (let i = rooms.length; i < minRooms; i++) {
        const px = rooms[i - 1].gx, py = rooms[i - 1].gy;
        let nx = px + 1, ny = py;
        if (nx >= 5) { nx = px; ny = py + 1; }
        if (ny >= 3) { nx = px - 1; ny = py; }
        if (nx < 0) { nx = px; ny = py - 1; }
        if (used[`${nx},${ny}`]) {
          // 尝试所有4个方向找到空位
          const candidates = [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]].sort(() => Math.random() - 0.5);
          let found = false;
          for (const [cx, cy] of candidates) {
            if (cx >= 0 && cx < 5 && cy >= 0 && cy < 3 && !used[`${cx},${cy}`]) {
              nx = cx; ny = cy; found = true; break;
            }
          }
          if (!found) break;
        }
        used[`${nx},${ny}`] = true;
        const room = { gx: nx, gy: ny, type: RT.NORMAL, id: rooms.length, doors: {}, visited: false, cleared: false, enemies: [], drops: [], spawned: false };
        const dName = (nx > px) ? "E" : (nx < px) ? "W" : (ny > py) ? "S" : "N";
        const oppName = (nx > px) ? "W" : (nx < px) ? "E" : (ny > py) ? "N" : "S";
        rooms[i - 1].doors[dName] = rooms.length;
        room.doors[oppName] = rooms[i - 1].id;
        rooms.push(room);
      }
    }
    // 找出起点房间直接相邻的房间ID，这些位置不能放Boss
    const startAdjacentIds = new Set();
    for (const adjId of Object.values(rooms[0].doors)) startAdjacentIds.add(adjId);
    // 额外检查：如果所有房间都与起点相邻，强制创建一个非相邻房间
    let hasNonAdjacent = false;
    for (let i = 1; i < rooms.length; i++) {
      if (!startAdjacentIds.has(i)) { hasNonAdjacent = true; break; }
    }
    if (!hasNonAdjacent && rooms.length > 1) {
      // 找一个最远的相邻房间，在它旁边创建一个新房间作为Boss房
      let farthestId = 1;
      let farthestDist = 0;
      for (let i = 1; i < rooms.length; i++) {
        const d = Math.abs(rooms[i].gx - startX) + Math.abs(rooms[i].gy - startY);
        if (d > farthestDist) { farthestDist = d; farthestId = i; }
      }
      const parent = rooms[farthestId];
      const dirs = [[1, 0, "E", "W"], [-1, 0, "W", "E"], [0, 1, "S", "N"], [0, -1, "N", "S"]];
      for (const [dx, dy, dName, oppName] of dirs) {
        const nx = parent.gx + dx, ny = parent.gy + dy;
        if (nx < 0 || nx >= 5 || ny < 0 || ny >= 3) continue;
        if (used[`${nx},${ny}`]) continue;
        used[`${nx},${ny}`] = true;
        const room = { gx: nx, gy: ny, type: RT.NORMAL, id: rooms.length, doors: {}, visited: false, cleared: false, enemies: [], drops: [], spawned: false };
        parent.doors[dName] = room.id;
        room.doors[oppName] = parent.id;
        rooms.push(room);
        // 更新相邻集合
        startAdjacentIds.clear();
        for (const adjId of Object.values(rooms[0].doors)) startAdjacentIds.add(adjId);
        break;
      }
    }
    // 选距离最远且不与起点相邻的房间作为Boss房；若所有房间都相邻，退回到最远房间
    let bossId = -1, bestDist = -1, fallbackId = 1, fallbackDist = -1;
    for (let i = 1; i < rooms.length; i++) {
      const d = Math.abs(rooms[i].gx - startX) + Math.abs(rooms[i].gy - startY);
      if (d > fallbackDist) { fallbackDist = d; fallbackId = i; }
      if (startAdjacentIds.has(i)) continue;
      if (d > bestDist) { bestDist = d; bossId = i; }
    }
    // 确保Boss房间不与起始房间相邻
    if (bossId < 0 || !rooms[bossId]) {
      // 如果所有房间都与起点相邻，找一个距离最远的非相邻房间（如果存在）
      if (rooms.length > 2) {
        for (let i = 1; i < rooms.length; i++) {
          if (startAdjacentIds.has(i)) continue;
          bossId = i;
          break;
        }
      }
      // 如果仍然找不到非相邻房间，使用fallback
      if (bossId < 0 || !rooms[bossId]) bossId = fallbackId;
    }
    rooms[bossId].type = RT.BOSS;
    const candidates = rooms.filter((r) => r.id !== 0 && r.id !== bossId);
    if (candidates.length) {
      candidates[randi(0, candidates.length)].type = RT.TREASURE;
      if (candidates.length > 1) candidates[randi(0, candidates.length)].type = RT.SHOP;
    }
    for (const room of rooms) {
      if (room.type === RT.SHOP) room.obstacles = [];
      else room.obstacles = generateObstacles(room);
      room.traps = generateTraps(room, level);
      if (room.type === RT.TREASURE) { room.chest = { x: ROOM_W / 2 - 18, y: ROOM_H / 2 - 18, w: 36, h: 36, opened: false }; room.hasGuardiansSpawned = false; }
      if (room.type === RT.SHOP) room.shopItems = generateShop(level);
      room.portal = null;
    }
    return rooms;
  }

  function generateObstacles(room) {
    const obs = [];
    if (room.type === RT.START) return obs;
    // Boss房间障碍物更少且避开Boss生成区域
    const count = room.type === RT.BOSS ? 2 + randi(0, 3) : 4 + randi(0, 5);
    for (let i = 0; i < count; i++) {
      const cols = randi(1, 3);
      const rows = randi(1, 3);
      const gx = randi(2, ROOM_COLS - 2 - cols);
      const gy = randi(2, ROOM_ROWS - 2 - rows);
      const cx = gx + cols / 2, cy = gy + rows / 2;
      const centerX = ROOM_COLS / 2, centerY = ROOM_ROWS / 2;
      // 避开中心区域
      if (Math.abs(cx - centerX) < 3 && Math.abs(cy - centerY) < 3) continue;
      // 避开门附近
      if (gy < 2 && Math.abs(cx - centerX) < 3) continue;
      if (gy > ROOM_ROWS - 3 && Math.abs(cx - centerX) < 3) continue;
      if (gx < 2 && Math.abs(cy - centerY) < 3) continue;
      if (gx > ROOM_COLS - 3 && Math.abs(cy - centerY) < 3) continue;
      // Boss房间额外避开Boss生成位置（顶部中央区域）
      if (room.type === RT.BOSS && cy < 4 && Math.abs(cx - centerX) < 4) continue;
      obs.push({ x: gx * TILE, y: gy * TILE, w: cols * TILE, h: rows * TILE });
    }
    return obs;
  }

  function generateTraps(room, level) {
    const traps = [];
    if (room.type === RT.START || room.type === RT.SHOP) return traps;
    const trapCount = room.type === RT.BOSS ? 2 + randi(0, 2) : 1 + randi(0, 2);
    const centerX = ROOM_COLS / 2, centerY = ROOM_ROWS / 2;
    const pool = ["spike", "spike", "flame", "laser"];

    function trapOverlapsObstacle(trapX, trapY, trapW, trapH) {
      for (const o of room.obstacles) {
        if (trapX < o.x + o.w && trapX + trapW > o.x && trapY < o.y + o.h && trapY + trapH > o.y) {
          return true;
        }
      }
      return false;
    }

    for (let i = 0; i < trapCount; i++) {
      const trapType = pool[randi(0, pool.length)];
      let x, y, w, h, direction = 0;
      let tries = 0;
      while (tries++ < 50) {
        if (trapType === "laser") {
          // 激光发射器：从墙壁发射，方向指向房间内部
          const wall = randi(0, 4); // 0=上, 1=下, 2=左, 3=右
          w = 20;
          h = 20;
          if (wall === 0) {
            x = randi(2, ROOM_COLS - 3) * TILE;
            y = TILE;
            direction = Math.PI / 2; // 向下
          } else if (wall === 1) {
            x = randi(2, ROOM_COLS - 3) * TILE;
            y = ROOM_H - TILE * 2;
            direction = -Math.PI / 2; // 向上
          } else if (wall === 2) {
            x = TILE;
            y = randi(2, ROOM_ROWS - 3) * TILE;
            direction = 0; // 向右
          } else {
            x = ROOM_W - TILE * 2;
            y = randi(2, ROOM_ROWS - 3) * TILE;
            direction = Math.PI; // 向左
          }
        } else {
          const def = TRAP_TYPES[trapType];
          w = def.width;
          h = def.height;
          x = randi(2, ROOM_COLS - 3) * TILE;
          y = randi(2, ROOM_ROWS - 3) * TILE;
        }
        const cx = x / TILE + 0.5, cy = y / TILE + 0.5;
        // 避开中心区域
        if (Math.abs(cx - centerX) < 2 && Math.abs(cy - centerY) < 2) continue;
        // 避开门附近
        if (cy < 2 && Math.abs(cx - centerX) < 2) continue;
        if (cy > ROOM_ROWS - 3 && Math.abs(cx - centerX) < 2) continue;
        if (cx < 2 && Math.abs(cy - centerY) < 2) continue;
        if (cx > ROOM_COLS - 3 && Math.abs(cy - centerY) < 2) continue;
        // Boss房间额外避开Boss生成位置（顶部中央区域）
        if (room.type === RT.BOSS && cy < 5 && Math.abs(cx - centerX) < 3) continue;
        // 避开障碍物
        if (trapOverlapsObstacle(x, y, w, h)) continue;
        break;
      }
      traps.push(makeTrap(trapType, x, y, direction));
    }
    return traps;
  }

  // ---------- 敌人定义 ----------
  const ENEMY_TYPES = {
    grunt:   { hp: 8,  r: 14, speed: 115, touchDmg: 1, color: "#ef476f", kind: "melee" },
    runner:  { hp: 4,  r: 12, speed: 215, touchDmg: 1, color: "#06d6a0", kind: "melee" },
    tank:    { hp: 28, r: 22, speed: 55, touchDmg: 1, color: "#8d6bff", kind: "melee" },
    shooter: { hp: 7,  r: 14, speed: 70, touchDmg: 1, color: "#ffd166", kind: "ranged", fireRate: 1100, bulletSpeed: 300, bulletDmg: 1 },
    blaster: { hp: 10, r: 15, speed: 65, touchDmg: 1, color: "#ff7b54", kind: "ranged", fireRate: 1600, bulletSpeed: 340, bulletDmg: 2, burst: 3 },
    splitter:{ hp: 10, r: 16, speed: 95, touchDmg: 1, color: "#f78c6b", kind: "melee", split: 2 },
  };

  const TRAP_TYPES = {
    spike: { name: "尖刺", damage: 3, interval: 1500, activeTime: 500, color: "#8b4513", width: 32, height: 8 },
    flame: { name: "火焰喷射器", damage: 2, interval: 2000, activeTime: 1000, color: "#ff4500", width: 40, height: 12 },
    laser: { name: "激光发射器", damage: 2, interval: 2500, activeTime: 800, color: "#ff00ff", width: 20, height: 20, laserLength: 600 },
  };

  function makeTrap(type, x, y, direction) {
    const def = TRAP_TYPES[type] || TRAP_TYPES.spike;
    return { type, x, y, damage: def.damage, interval: def.interval, activeTime: def.activeTime, color: def.color, width: def.width, height: def.height, laserLength: def.laserLength || 0, direction: direction || 0, active: false, timer: rand(0, def.interval) };
  }

  function makeEnemy(type, level, x, y) {
    const def = ENEMY_TYPES[type] || ENEMY_TYPES.grunt;
    const lvlScale = 1 + (level - 1) * 0.25;
    // 难度倍率
    let hpMul = 1, dmgMul = 1, speedMul = 1, fireRateMul = 1, bsMul = 1;
    if (state.difficulty === "easy") {
      hpMul = 0.65; dmgMul = 0.7; speedMul = 0.85; fireRateMul = 1.5; bsMul = 0.85;
    }
    return { type, x, y,
      hp: Math.max(1, Math.round(def.hp * lvlScale * hpMul)),
      maxHp: Math.max(1, Math.round(def.hp * lvlScale * hpMul)),
      r: def.r, speed: def.speed * speedMul,
      touchDmg: Math.max(1, Math.round(def.touchDmg * dmgMul)),
      color: def.color, kind: def.kind,
      fireRate: def.fireRate ? Math.round(def.fireRate * fireRateMul) : undefined,
      bulletSpeed: def.bulletSpeed ? def.bulletSpeed * bsMul : undefined,
      bulletDmg: def.bulletDmg ? Math.max(1, Math.round(def.bulletDmg * dmgMul)) : undefined,
      burst: def.burst, split: def.split,
      facing: 0, fireCd: rand(300, 1200),
      hurtFlash: 0, stunned: 0, knockVX: 0, knockVY: 0, isBoss: false };
  }

  const BOSS_TYPES = ["spreader", "summoner", "charger", "laser", "bomber", "necromancer", "phaser", "shielder", "multishot"];
  function makeBoss(type, level, x, y) {
    const baseHp = 140 + level * 50;
    // 难度倍率
    let hpMul = 1, dmgMul = 1, speedMul = 1, fireRateMul = 1, bsMul = 1;
    if (state.difficulty === "easy") {
      hpMul = 0.7; dmgMul = 0.7; speedMul = 0.85; fireRateMul = 1.4; bsMul = 0.85;
    }
    const base = { type: "boss_" + type, x, y, fireCd: rand(600, 1200), hurtFlash: 0, stunned: 0, knockVX: 0, knockVY: 0, isBoss: true, phase: 1, specialCd: 4000 };
    const apply = (hp) => Math.max(1, Math.round(hp * hpMul));
    const applyDmg = (d) => Math.max(1, Math.round(d * dmgMul));
    const applyFR = (f) => Math.round(f * fireRateMul);
    if (type === "spreader") return Object.assign(base, { hp: apply(baseHp), maxHp: apply(baseHp), r: 36, speed: 80 * speedMul, touchDmg: applyDmg(1), color: "#ff5df2", bulletSpeed: 340 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(700) });
    if (type === "summoner") return Object.assign(base, { hp: apply(baseHp * 1.15), maxHp: apply(baseHp * 1.15), r: 40, speed: 55 * speedMul, touchDmg: applyDmg(1), color: "#00ffff", bulletSpeed: 280 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(1600) });
    if (type === "charger") return Object.assign(base, { hp: apply(baseHp * 1.3), maxHp: apply(baseHp * 1.3), r: 44, speed: 110 * speedMul, touchDmg: applyDmg(2), color: "#ff7b54", bulletSpeed: 320 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(1400) });
    if (type === "laser") return Object.assign(base, { hp: apply(baseHp * 1.1), maxHp: apply(baseHp * 1.1), r: 38, speed: 65 * speedMul, touchDmg: applyDmg(1), color: "#ff2d55", bulletSpeed: 600 * bsMul, bulletDmg: applyDmg(3), fireRate: applyFR(900), laserWidth: 8 });
    if (type === "bomber") return Object.assign(base, { hp: apply(baseHp * 1.25), maxHp: apply(baseHp * 1.25), r: 42, speed: 70 * speedMul, touchDmg: applyDmg(1), color: "#ff9500", bulletSpeed: 200 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(1200), explodeRadius: 70, explodeDmg: applyDmg(4) });
    if (type === "necromancer") return Object.assign(base, { hp: apply(baseHp * 1.2), maxHp: apply(baseHp * 1.2), r: 40, speed: 50 * speedMul, touchDmg: applyDmg(1), color: "#a855f7", bulletSpeed: 260 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(1800), summonHpMult: 0.5 });
    if (type === "phaser") return Object.assign(base, { hp: apply(baseHp * 0.9), maxHp: apply(baseHp * 0.9), r: 34, speed: 90 * speedMul, touchDmg: applyDmg(1), color: "#ec4899", bulletSpeed: 380 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(600), teleportCd: 2000 });
    if (type === "shielder") return Object.assign(base, { hp: apply(baseHp * 1.4), maxHp: apply(baseHp * 1.4), r: 46, speed: 45 * speedMul, touchDmg: applyDmg(1), color: "#22c55e", bulletSpeed: 300 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(1000), shieldAngle: 0, shieldActive: true });
    if (type === "multishot") return Object.assign(base, { hp: apply(baseHp * 1.05), maxHp: apply(baseHp * 1.05), r: 38, speed: 75 * speedMul, touchDmg: applyDmg(1), color: "#f97316", bulletSpeed: 320 * bsMul, bulletDmg: applyDmg(1), fireRate: applyFR(800), patternIndex: 0 });
    return Object.assign(base, { hp: apply(baseHp), maxHp: apply(baseHp), r: 36, speed: 80 * speedMul, touchDmg: applyDmg(1), color: "#ff5df2", bulletSpeed: 340 * bsMul, bulletDmg: applyDmg(2), fireRate: applyFR(700) });
  }

  function pickEnemyTypeForRoom(level) {
    const pool = ["grunt", "grunt", "runner", "shooter", "tank", "splitter", "blaster"];
    return pool[randi(0, pool.length)];
  }

  function generateShop(level) {
    const keysArr = Object.keys(WEAPONS).filter((k) => k !== "pistol");
    const candidates = keysArr.map((k) => ({
      key: k,
      stars: state.upgradedWeapons && state.upgradedWeapons.has(k) ? 2 : 1
    }));
    const idx1 = randi(0, candidates.length);
    let idx2 = randi(0, candidates.length);
    if (idx2 === idx1) idx2 = (idx1 + 1) % candidates.length;
    const pick1 = candidates[idx1];
    const pick2 = candidates[idx2];
    const priceBoost = (stars) => stars > 1 ? 1.8 : 1.0;
    const itemW = 80, itemH = 80;
    const gapX = 80;
    const gapY = 70;
    const totalW = itemW * 2 + gapX;
    const totalH = itemH * 2 + gapY;
    const baseX = ROOM_W / 2 - totalW / 2;
    const baseY = ROOM_H / 2 - totalH / 2;
    // 刷新按钮位置
    const refreshX = ROOM_W / 2 - 30;
    const refreshY = baseY + totalH + 30;
    const alreadyHasBounce = state.player ? !!state.player.hasBounce : false;
    return [
      { kind: "weapon", weapon: pick1.key, weaponStars: pick1.stars, price: Math.round((12 + 4 * level) * priceBoost(pick1.stars)), x: baseX, y: baseY, w: itemW, h: itemH, bought: false },
      { kind: "weapon", weapon: pick2.key, weaponStars: pick2.stars, price: Math.round((12 + 4 * level) * priceBoost(pick2.stars)), x: baseX + itemW + gapX, y: baseY, w: itemW, h: itemH, bought: false },
      { kind: "hp", amount: 8, price: 10 + 4 * level, x: baseX, y: baseY + itemH + gapY, w: itemW, h: itemH, bought: false },
      { kind: "bounce", price: level * 50, x: baseX + itemW + gapX, y: baseY + itemH + gapY, w: itemW, h: itemH, bought: alreadyHasBounce ? true : false },
      { kind: "refresh", x: refreshX, y: refreshY, w: 60, h: 30, costPercent: 20 },
    ];
  }

  function refreshShop(room) {
    if (!room || room.type !== RT.SHOP) return;
    const p = state.player;
    if (!p) return;
    const cost = Math.floor(p.coins * 0.2);
    if (cost <= 0) { toast("金币不足"); return; }
    if (cost < 1 && p.coins > 0) { toast("金币不足"); return; }
    p.coins -= cost;
    // 生成新商品
    const newItems = generateShop(state.levelIndex);
    // 只替换武器和消耗品，不替换刷新按钮
    room.shopItems = [
      newItems[0],
      newItems[1],
      newItems[2],
      newItems[3],
      newItems[4], // refresh button
    ];
    floatText(ROOM_W / 2, ROOM_H / 2, "-" + cost + " 金币", "#ffd166");
    shake(0.2, 4);
    updateHUD();
    saveGame();
  }

  // ---------- 玩家 ----------
  function makePlayer() {
    return { x: ROOM_W / 2, y: ROOM_H / 2, r: 12, speed: 270, hp: 12, maxHp: 12, energy: 100, maxEnergy: 100, coins: 0, kills: 0, facing: 0, weapons: [makeSlot("pistol")], curWeapon: 0, fireCd: 0, dashCd: 0, dashTime: 0, dashDirX: 0, dashDirY: 0, invuln: 0, hurtFlash: 0, muzzle: 0, hasBounce: false, backpack: [null, null, null] };
  }

  // ---------- 子弹 ----------
  const bullets = [];
  function spawnBullet(opts) { bullets.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 1, max: 1, size: 4, damage: 1, team: "player", color: "#ffd166", explode: null, trail: [] }, opts)); }

  // ---------- 游戏状态 ----------
  let state = { scene: "title", player: null, level: null, levelIndex: 1, subIndex: 1, currentRoomId: 0, timeLast: 0, elapsed: 0, bossActive: false, currentBoss: null, upgradedWeapons: new Set(), selectedBackpackIdx: -1, difficulty: "hell", doorPassCount: 0, doorPassRoomId: -1, doorPassStartTime: 0 };
  const SAVE_KEY = "pixelKnight.save.v1";

  function saveGame() {
    try {
      if (state.scene !== "play" && state.scene !== "paused") return;
      if (!state.player || !state.level) return;
      const p = state.player;
      const levelSave = state.level.map(room => ({
        id: room.id, type: room.type, gx: room.gx, gy: room.gy,
        doors: room.doors, visited: room.visited, cleared: room.cleared,
        spawned: room.spawned, hasGuardiansSpawned: room.hasGuardiansSpawned,
        chest: room.chest ? { opened: room.chest.opened } : null,
        shopItems: room.shopItems ? room.shopItems.map(it => ({ weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, bought: it.bought, x: it.x, y: it.y, w: it.w, h: it.h, kind: it.kind, amount: it.amount, costPercent: it.costPercent })) : null,
        obstacles: room.obstacles || [],
        portal: room.portal || null,
        drops: (room.drops || []).map(d => ({ kind: d.kind, x: d.x, y: d.y, weapon: d.weapon, weaponStars: d.weaponStars, amount: d.amount })),
        enemies: (room.enemies || []).map(e => ({
          type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
          isBoss: !!e.isBoss, color: e.color, speed: e.speed
        }))
      }));
      const data = {
        version: 1,
        savedAt: Date.now(),
        levelIndex: state.levelIndex,
        subIndex: state.subIndex,
        currentRoomId: state.currentRoomId,
        elapsed: state.elapsed,
        difficulty: state.difficulty,
        upgradedWeapons: Array.from(state.upgradedWeapons || []),
        player: {
          x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
          energy: p.energy, maxEnergy: p.maxEnergy, coins: p.coins, kills: p.kills,
          weapons: p.weapons.map(w => ({ key: weaponKey(w), stars: weaponStars(w) })),
          curWeapon: p.curWeapon, facing: p.facing, speed: p.speed,
          hasBounce: p.hasBounce || false,
          backpack: (p.backpack || [null, null, null]).map(b => b ? { key: weaponKey(b), stars: weaponStars(b) } : null)
        },
        level: levelSave
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("保存失败:", e);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return false;
      state.levelIndex = data.levelIndex;
      state.subIndex = data.subIndex;
      state.currentRoomId = data.currentRoomId;
      state.elapsed = data.elapsed || 0;
      state.difficulty = data.difficulty || "hell";
      state.upgradedWeapons = new Set(data.upgradedWeapons || []);
      const dp = data.player;
      state.player = Object.assign(makePlayer(), {
        x: dp.x, y: dp.y, hp: dp.hp, maxHp: dp.maxHp,
        energy: dp.energy, maxEnergy: dp.maxEnergy, coins: dp.coins, kills: dp.kills,
        weapons: (dp.weapons || []).map(w => makeSlot(w.key, w.stars || 1)),
        curWeapon: dp.curWeapon || 0, facing: dp.facing || 0, speed: dp.speed || 270,
        hasBounce: dp.hasBounce || false,
        backpack: (dp.backpack || [null, null, null]).map(b => b ? makeSlot(b.key, b.stars || 1) : null)
      });
      state.level = data.level.map(roomData => ({
        id: roomData.id, type: roomData.type, gx: roomData.gx, gy: roomData.gy,
        doors: roomData.doors, visited: roomData.visited, cleared: roomData.cleared,
        spawned: roomData.spawned, hasGuardiansSpawned: roomData.hasGuardiansSpawned,
        chest: roomData.chest ? { x: 0, y: 0, w: 36, h: 36, opened: roomData.chest.opened } : null,
        shopItems: roomData.shopItems ? roomData.shopItems.map(it => ({ kind: it.kind, weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, x: it.x, y: it.y, w: it.w, h: it.h, bought: it.bought, amount: it.amount, costPercent: it.costPercent })) : null,
        obstacles: roomData.obstacles || [],
        portal: roomData.portal || null,
        drops: (roomData.drops || []).map(d => ({ kind: d.kind, x: d.x, y: d.y, weapon: d.weapon, weaponStars: d.weaponStars, amount: d.amount, life: 60, bob: 0 })),
        enemies: (roomData.enemies || []).map(es => {
          if (es.isBoss) {
            const rawType = (es.type || "").replace("boss_", "");
            const bossType = BOSS_TYPES.includes(rawType) ? rawType : BOSS_TYPES[0];
            const b = makeBoss(bossType, state.levelIndex, es.x, es.y);
            if (es.hp != null) b.hp = es.hp;
            if (es.maxHp != null) b.maxHp = es.maxHp;
            return b;
          } else {
            const rawType = es.type || "grunt";
            const e = makeEnemy(rawType, state.levelIndex, es.x, es.y);
            if (es.hp != null) e.hp = es.hp;
            if (es.maxHp != null) e.maxHp = es.maxHp;
            return e;
          }
        })
      }));
      for (const r of state.level) {
        if (r.type === RT.TREASURE && r.chest) {
          r.chest.x = ROOM_W / 2 - 18; r.chest.y = ROOM_H / 2 - 18;
        }
      }
      state.scene = "play";
      state.bossActive = false;
      state.currentBoss = null;
      state.doorPassCount = 0;
      state.doorPassRoomId = -1;
      state.doorPassStartTime = 0;
      const curRoom = state.level[state.currentRoomId];
      if (curRoom) {
        curRoom.visited = true;
        for (const e of curRoom.enemies) if (e.isBoss) {
          state.currentBoss = e;
          state.bossActive = true;
        }
        // 回退：若当前是 boss 房但没找到 boss 且没传送门（老存档），重新生成一个 boss
        if (curRoom.type === "boss" && !state.currentBoss && !curRoom.portal) {
          const b = makeBoss(BOSS_TYPES[0], state.levelIndex, ROOM_W / 2, 120);
          curRoom.enemies.push(b);
          state.currentBoss = b;
          state.bossActive = true;
        }
      }
      updateHUD();
      return true;
    } catch (e) {
      console.warn("读取存档失败:", e);
      return false;
    }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { console.warn(e); }
  }

  // 复活函数：消耗100金币复活，恢复HP并获得1.5秒护盾
  function respawnPlayer() {
    const p = state.player;
    if (!p || p.hp > 0) return;
    if (p.coins < 100) { toast("金币不足！"); return; }
    p.coins -= 100;
    p.hp = Math.max(1, Math.round(p.maxHp * 0.5)); // 恢复50%最大生命
    p.invuln = 1.5; // 1.5秒无敌
    p.roomShield = 1.5; // 额外1.5秒护盾（免疫所有伤害）
    p.dashCd = 0;
    p.fireCd = 0;
    state.scene = "play";
    hideAllOverlays();
    startBgm();
    updateHUD();
    saveGame();
    toast("复活成功！");
    floatText(p.x, p.y, "复活！", "#06d6a0");
  }

  // 页面关闭/刷新前保存
  window.addEventListener("beforeunload", saveGame);
  // 给定武器池，根据已合成的武器情况选择掉落的武器（带星级）
  // 规则：若武器已被合成过（在 upgradedWeapons 中），只能作为二星版出现，不会出现基础版
  // 未合成过的武器始终是一星
  function pickWeaponFromPool(pool, starChance) {
    starChance = starChance == null ? 0.55 : starChance;
    // 为池中的每个武器分配星级：已合成 → 2星，未合成 → 1星
    const candidates = pool.map((k) => ({
      key: k,
      stars: state.upgradedWeapons && state.upgradedWeapons.has(k) ? 2 : 1
    }));
    // 随机选一个
    const pick = candidates[randi(0, candidates.length)];
    return pick;
  }
  function currentRoom() { return state.level[state.currentRoomId]; }

  // ---------- 游戏流程 ----------
  function startNewRun(difficulty) {
    try {
      state.difficulty = difficulty || state.difficulty || "hell";
      console.log("[startNewRun] 开始新游戏，难度=", state.difficulty);
      clearSave();
      mouse.autoFire = false;
      state.player = makePlayer();
      state.levelIndex = 1;
      state.subIndex = 1;
      state.upgradedWeapons = new Set();
      console.log("[startNewRun] 正在生成关卡");
      state.level = generateLevel(1);
      state.currentRoomId = 0;
      state.scene = "play";
      state.bossActive = false;
      state.currentBoss = null;
      state.elapsed = 0;
      state.doorPassCount = 0;
      state.doorPassRoomId = -1;
      state.doorPassStartTime = 0;
      bullets.length = 0;
      particles.length = 0;
      floaters.length = 0;
      console.log("[startNewRun] 进入第一个房间");
      enterRoom(0, null);
      hideAllOverlays();
      updateHUD();
      toast("开始冒险！");
      // 启动背景音乐
      startBgm();
      // 联机模式：主机发送完整初始状态给所有客户端
      if (net.mode === "host") {
        console.log("[startNewRun] 主机发送初始状态");
        netSendInitialState();
      }
      console.log("[startNewRun] 完成");
    } catch (e) {
      console.error("[startNewRun] 执行失败:", e);
      toast("游戏启动失败: " + e.message);
    }
  }
  function loadLevel(idx) {
    state.levelIndex = idx;
    state.subIndex = 1;
    state.level = generateLevel(idx);
    state.currentRoomId = 0;
    state.bossActive = false;
    state.currentBoss = null;
    state.doorPassCount = 0;
    state.doorPassRoomId = -1;
    state.doorPassStartTime = 0;
    bullets.length = 0;
    particles.length = 0;
    floaters.length = 0;
    updateHUD();
  }
  function enterRoom(roomId, fromDir) {
    state.currentRoomId = roomId;
    const room = state.level[roomId];
    room.visited = true;
    bullets.length = 0;
    // 进入新房间的1秒护盾：仅当房间尚未攻略（有敌人威胁）
    if (state.player && room.type !== "start" && !room.cleared) {
      state.player.roomShield = 1.0;
    } else if (state.player) {
      state.player.roomShield = 0;
    }
    if (room.type === "boss" && !room.spawned) {
      room.spawned = true;
      // Boss按关卡难度分布（从简单到困难）
      const BOSS_BY_LEVEL = [
        "charger",     // 关卡1 - 简单：直线冲撞，躲避简单
        "spreader",     // 关卡2 - 简单：扩散弹幕，有规律可循
        "bomber",       // 关卡3 - 简单：爆炸有预警，范围有限
        "laser",        // 关卡4 - 中等：激光速度快，需快速反应
        "shielder",     // 关卡5 - 中等：护盾阻挡子弹，需绕后攻击
        "multishot",    // 关卡6 - 中等：多种弹幕模式轮换
        "phaser",       // 关卡7 - 困难：瞬移难预判，位置多变
        "summoner",     // 关卡8 - 困难：召唤小怪增加压力
        "necromancer"   // 关卡9 - 极难：最强召唤能力，需快速击杀
      ];
      const bossType = BOSS_BY_LEVEL[Math.min(state.levelIndex - 1, BOSS_BY_LEVEL.length - 1)] || BOSS_TYPES[0];
      // 找到安全的Boss生成位置（避开障碍物）
      let bossX = ROOM_W / 2, bossY = 120;
      let tries = 0;
      while (tries++ < 20) {
        if (!hitsObstacleCircle(bossX, bossY, 45, room)) break;
        // 如果初始位置有障碍物，尝试附近位置
        bossX = ROOM_W / 2 + randi(-60, 60);
        bossY = 120 + randi(-40, 40);
      }
      const boss = makeBoss(bossType, state.levelIndex, bossX, bossY);
      boss.facing = Math.PI / 2;
      room.enemies.push(boss);
      state.bossActive = true;
      state.currentBoss = boss;
      sfx.boss(); toast("首领出现！"); shake(0.6, 10);
    }
    if (!room.spawned && room.type === "normal") {
      room.spawned = true;
      // 敌人数量随关卡数持续增长：基础 3 + 关卡数 × 1.2 + 随机 0~2
      const enemyCount = 3 + Math.floor(state.levelIndex * 1.2) + randi(0, 2);
      // 控制上限（避免后期房间过度拥挤）
      const n = Math.min(enemyCount, 14);
      for (let i = 0; i < n; i++) {
        let tries = 0;
        while (tries++ < 40) {
          const x = rand(TILE * 2, ROOM_W - TILE * 2);
          const y = rand(TILE * 2, ROOM_H - TILE * 2);
          if (Math.hypot(x - ROOM_W / 2, y - ROOM_H / 2) < 160) continue;
          if (hitsObstacleCircle(x, y, 18, room)) continue;
          room.enemies.push(makeEnemy(pickEnemyTypeForRoom(state.levelIndex), state.levelIndex, x, y));
          break;
        }
      }
    }
    if (room.type === "treasure" && !room.hasGuardiansSpawned) {
      room.hasGuardiansSpawned = true;
      room.spawned = true;
      const spots = [{ x: ROOM_W / 2 - 120, y: ROOM_H / 2 - 80 }, { x: ROOM_W / 2 + 120, y: ROOM_H / 2 - 80 }, { x: ROOM_W / 2, y: ROOM_H / 2 + 120 }];
      for (const s of spots) if (!hitsObstacleCircle(s.x, s.y, 18, room)) room.enemies.push(makeEnemy("grunt", state.levelIndex, s.x, s.y));
    }
    const p = state.player;
    if (fromDir === "E") p.x = ROOM_W - TILE * 1.5;
    else if (fromDir === "W") p.x = TILE * 1.5;
    else p.x = ROOM_W / 2;
    if (fromDir === "S") p.y = ROOM_H - TILE * 1.5;
    else if (fromDir === "N") p.y = TILE * 1.5;
    else p.y = ROOM_H / 2;
    p.invuln = 0.4;
    state.currentBoss = null;
    for (const e of room.enemies) if (e.isBoss) state.currentBoss = e;
    state.bossActive = !!state.currentBoss;
    updateHUD();
    saveGame();
  }

  // ---------- 碰撞 ----------
  function hitsObstacleCircle(x, y, r, room) {
    for (const o of room.obstacles) {
      const nx = clamp(x, o.x, o.x + o.w);
      const ny = clamp(y, o.y, o.y + o.h);
      const dx = x - nx, dy = y - ny;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }
  // 射线检测：从 (x, y) 沿 ang 走 dist 距离，期间是否会撞到障碍物
  function castRay(x, y, ang, dist, r, room) {
    const steps = Math.max(3, Math.floor(dist / 12));
    const sx = Math.cos(ang) * (dist / steps);
    const sy = Math.sin(ang) * (dist / steps);
    let cx = x, cy = y;
    for (let i = 0; i < steps; i++) {
      cx += sx; cy += sy;
      if (hitsObstacleCircle(cx, cy, r, room)) return false;
    }
    return true;
  }
  // 获取朝向玩家的绕行方向：如果直线被阻挡，尝试左右偏转选择更通畅的一侧
  // 改进版：动态检测距离 + 大范围角度候选 + 切线绕行策略 + 墙跟随
  function seekTargetAngle(e, targetX, targetY, room) {
    const baseAng = Math.atan2(targetY - e.y, targetX - e.x);
    // 检测距离设为到玩家的距离（略大一点），确保中途不被遮挡
    const distToTarget = Math.hypot(targetX - e.x, targetY - e.y) + 30;
    const lookDist = Math.min(distToTarget, 350);
    
    // 阶段1：先尝试直线和小幅偏转（优先选择接近目标的方向）
    if (castRay(e.x, e.y, baseAng, lookDist, e.r, room)) return baseAng;
    const smallCand = [0.2, -0.2, 0.4, -0.4, 0.6, -0.6, 0.8, -0.8];
    for (const off of smallCand) {
      if (castRay(e.x, e.y, baseAng + off, lookDist, e.r, room)) return baseAng + off;
    }
    
    // 阶段2：尝试中等偏转（绕过障碍物的常见角度）
    const mediumCand = [1.0, -1.0, 1.25, -1.25, 1.5, -1.5, 1.75, -1.75];
    for (const off of mediumCand) {
      if (castRay(e.x, e.y, baseAng + off, lookDist, e.r, room)) return baseAng + off;
    }
    
    // 阶段3：尝试大角度偏转（大幅绕行）
    const largeCand = [2.0, -2.0, 2.3, -2.3, 2.6, -2.6, 2.9, -2.9];
    for (const off of largeCand) {
      if (castRay(e.x, e.y, baseAng + off, lookDist, e.r, room)) return baseAng + off;
    }
    
    // 阶段4：尝试近180度转向（几乎反方向，用于绕过大型障碍物）
    const nearBackCand = [3.0, -3.0, 3.1, -3.1];
    for (const off of nearBackCand) {
      if (castRay(e.x, e.y, baseAng + off, lookDist * 0.6, e.r, room)) return baseAng + off;
    }
    
    // 阶段5：尝试短距离切线方向（沿墙滑动）
    const shortDist = Math.min(60, distToTarget * 0.3);
    const tangentCand = [0.785, -0.785, 1.57, -1.57, 2.356, -2.356];
    for (const off of tangentCand) {
      if (castRay(e.x, e.y, baseAng + off, shortDist, e.r, room)) return baseAng + off;
    }
    
    // 阶段6：尝试正交方向（纯水平或垂直，用于摆脱角落）
    const orthoCand = [0, Math.PI, Math.PI/2, -Math.PI/2];
    for (const ang of orthoCand) {
      if (castRay(e.x, e.y, ang, shortDist * 1.5, e.r, room)) return ang;
    }
    
    // 最后手段：如果当前方向被阻挡，尝试90度转向
    // 使用敌人的当前朝向（e.facing）来实现墙跟随
    if (e.facing != null) {
      // 尝试保持当前朝向（墙跟随）
      if (castRay(e.x, e.y, e.facing, 40, e.r, room)) return e.facing;
      // 否则尝试左右转90度
      if (castRay(e.x, e.y, e.facing + Math.PI/2, 40, e.r, room)) return e.facing + Math.PI/2;
      if (castRay(e.x, e.y, e.facing - Math.PI/2, 40, e.r, room)) return e.facing - Math.PI/2;
    }
    
    // 终极兜底：随机选一个方向，防止完全卡住
    return baseAng + (Math.random() < 0.5 ? 1.57 : -1.57);
  }
  function doorRect(room, dir) {
    const dw = 70, dh = 22;
    if (dir === "N") return { x: ROOM_W / 2 - dw / 2, y: 2, w: dw, h: dh };
    if (dir === "S") return { x: ROOM_W / 2 - dw / 2, y: ROOM_H - dh - 2, w: dw, h: dh };
    if (dir === "W") return { x: 2, y: ROOM_H / 2 - dh / 2 - 10, w: dh, h: dw };
    if (dir === "E") return { x: ROOM_W - dh - 2, y: ROOM_H / 2 - dh / 2 - 10, w: dh, h: dw };
  }

  // ---------- 开火 ----------
  function tryFire(weapon, originX, originY, targetX, targetY, player, isHeavyMelee, chargeTimeMs) {
    const p = player || state.player;
    // 近战武器：独特攻击方式
    if (weapon.melee) {
      if (p.fireCd > 0) return;
      if (p.energy < weapon.energyCost) return;
      const baseAng = Math.atan2(targetY - originY, targetX - originX);
      const isHeavy = !!isHeavyMelee;
      const meleeStyle = isHeavy ? (weapon.charge && weapon.charge.style) : weapon.melee.style;
      let range = isHeavy ? (weapon.charge ? weapon.charge.heavyRange : weapon.melee.range) : weapon.melee.range;
      let arc = isHeavy ? (weapon.charge ? weapon.charge.heavyArc : weapon.melee.arc) : weapon.melee.arc;
      let dmg = isHeavy ? (weapon.charge ? weapon.charge.baseDamage : weapon.damage) : weapon.damage;
      let energyCost = weapon.energyCost;
      let fireCd = weapon.fireRate;
      let swingTime = 0.22;
      let burnData = isHeavy ? (weapon.charge ? weapon.charge.burn : null) : weapon.melee.burn;
      let freezeData = isHeavy ? (weapon.charge ? weapon.charge.freeze : null) : weapon.melee.freeze;
      let knockback = 0;
      let multiHit = weapon.melee.multiHit || 1;
      let quake = weapon.melee.quake || 0;
      let hasTrail = weapon.melee.trail || false;
      // 蓄力重击
      if (isHeavy && weapon.charge) {
        const ct = chargeTimeMs || 0;
        const chargeRatio = Math.min(1, ct / weapon.charge.maxTime);
        range = weapon.charge.heavyRange;
        arc = weapon.charge.heavyArc;
        dmg = Math.round(weapon.charge.baseDamage + (weapon.charge.maxDamage - weapon.charge.baseDamage) * chargeRatio);
        energyCost = Math.round(weapon.energyCost * 1.8);
        fireCd = Math.round(weapon.fireRate * 1.6);
        swingTime = 0.32;
        knockback = weapon.charge.knockback || 0;
        burnData = weapon.charge.burn || burnData;
        freezeData = weapon.charge.freeze || freezeData;
        multiHit = weapon.charge.multiHit || multiHit;
        quake = weapon.charge.quake || quake;
        hasTrail = weapon.charge.trail || hasTrail;
        if (p.energy < energyCost) {
          toast("能量不足");
          return;
        }
      }
      p.fireCd = fireCd;
      p.energy = Math.max(0, p.energy - energyCost);
      p.muzzle = isHeavy ? 0.25 : 0.15;
      // 冰霜剑特殊处理：发射冰刺
      if (meleeStyle === "iceSpike") {
        const numSpikes = isHeavy ? 5 : 3;
        for (let i = 0; i < numSpikes; i++) {
          const offsetAng = baseAng + (i - (numSpikes - 1) / 2) * 0.2;
          spawnBullet({
            x: originX, y: originY,
            vx: Math.cos(offsetAng) * 900, vy: Math.sin(offsetAng) * 900,
            size: 8, life: 0.5, max: 0.5,
            damage: dmg, team: "player", color: "#66e0ff",
            pierce: true, freeze: freezeData, isShotgun: false,
          });
        }
        spawnParticles(originX, originY, 12, "#66e0ff", 200, 0.3);
        sfx["zap"] && sfx["zap"]();
        return;
      }
      // 记录挥砍动画
      p.meleeSwing = { angle: baseAng, range: range, arc: arc, time: swingTime, maxTime: swingTime, color: weapon.color, heavy: isHeavy, style: meleeStyle, trail: hasTrail };
      // 获取房间敌人
      const curRoom = state.level ? state.level[state.currentRoomId] : null;
      const enemyList = curRoom && curRoom.enemies ? curRoom.enemies : [];
      // 突刺风格：直线穿透攻击
      if (meleeStyle === "thrust") {
        for (const e of enemyList) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > range + e.r) continue;
          let angDiff = Math.atan2(dy, dx) - baseAng;
          while (angDiff > Math.PI) angDiff -= Math.PI * 2;
          while (angDiff < -Math.PI) angDiff += Math.PI * 2;
          if (Math.abs(angDiff) > arc / 2) continue;
          damageEnemy(e, dmg);
          if (freezeData) applyFreeze(e, freezeData);
          if (knockback > 0) applyKnockback(e, dx, dy, dist, knockback);
          spawnParticles(e.x, e.y, isHeavy ? 14 : 8, weapon.color, isHeavy ? 250 : 180, isHeavy ? 0.35 : 0.22);
        }
        // 突刺特效：发射虚拟子弹显示轨迹
        const trailBullet = {
          x: originX, y: originY,
          vx: Math.cos(baseAng) * 1800, vy: Math.sin(baseAng) * 1800,
          size: isHeavy ? 14 : 10, life: 0.15, max: 0.15,
          damage: 0, team: "player", color: weapon.color,
          isThrustTrail: true, pierce: true
        };
        spawnBullet(trailBullet);
      }
      // 横扫风格：扇形攻击带轨迹
      else if (meleeStyle === "swing") {
        for (const e of enemyList) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > range + e.r) continue;
          let angDiff = Math.atan2(dy, dx) - baseAng;
          while (angDiff > Math.PI) angDiff -= Math.PI * 2;
          while (angDiff < -Math.PI) angDiff += Math.PI * 2;
          if (Math.abs(angDiff) > arc / 2) continue;
          damageEnemy(e, dmg);
          if (freezeData) applyFreeze(e, freezeData);
          if (knockback > 0) applyKnockback(e, dx, dy, dist, knockback);
          spawnParticles(e.x, e.y, isHeavy ? 16 : 10, weapon.color, isHeavy ? 280 : 200, isHeavy ? 0.38 : 0.25);
        }
        // 剑气轨迹
        if (hasTrail) {
          for (let i = 0; i < 3; i++) {
            const trailAng = baseAng + (i - 1) * 0.15;
            spawnBullet({
              x: originX + Math.cos(trailAng) * 20, y: originY + Math.sin(trailAng) * 20,
              vx: Math.cos(trailAng) * 1200, vy: Math.sin(trailAng) * 1200,
              size: 6, life: 0.2, max: 0.2,
              damage: 0, team: "player", color: weapon.color,
              isSwordTrail: true, pierce: true
            });
          }
        }
      }
      // 下劈风格：强力扇形+震地
      else if (meleeStyle === "cleave") {
        for (const e of enemyList) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > range + e.r) continue;
          let angDiff = Math.atan2(dy, dx) - baseAng;
          while (angDiff > Math.PI) angDiff -= Math.PI * 2;
          while (angDiff < -Math.PI) angDiff += Math.PI * 2;
          if (Math.abs(angDiff) > arc / 2) continue;
          damageEnemy(e, dmg);
          if (freezeData) applyFreeze(e, freezeData);
          if (knockback > 0) applyKnockback(e, dx, dy, dist, knockback * 1.5);
          spawnParticles(e.x, e.y, isHeavy ? 20 : 14, weapon.color, isHeavy ? 350 : 250, isHeavy ? 0.45 : 0.3);
        }
        // 震地效果：对范围内所有敌人造成额外伤害
        if (quake > 0) {
          for (const e of enemyList) {
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist > quake * 2.5 && dist > range + e.r) continue;
            if (dist <= range + e.r) continue; // 已在上方处理
            damageEnemy(e, Math.round(dmg * 0.4));
            spawnParticles(e.x, e.y, 8, "#c07030", 180, 0.2);
          }
          shake(isHeavy ? 0.8 : 0.4, isHeavy ? 15 : 8);
        }
      }
      // 旋转风格：360度攻击
      else if (meleeStyle === "spin") {
        const spinArc = arc; // Math.PI * 2
        for (const e of enemyList) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > range + e.r) continue;
          damageEnemy(e, dmg);
          if (burnData) {
            e.burning = (e.burning || 0) + burnData.duration;
            e.burnDps = burnData.dps;
          }
          if (freezeData) applyFreeze(e, freezeData);
          if (knockback > 0) applyKnockback(e, dx, dy, dist, knockback);
          spawnParticles(e.x, e.y, isHeavy ? 18 : 12, weapon.color, isHeavy ? 320 : 220, isHeavy ? 0.4 : 0.28);
        }
        // 旋转特效粒子
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          spawnBullet({
            x: originX + Math.cos(ang) * 30, y: originY + Math.sin(ang) * 30,
            vx: Math.cos(ang) * 600, vy: Math.sin(ang) * 600,
            size: isHeavy ? 12 : 8, life: 0.25, max: 0.25,
            damage: 0, team: "player", color: weapon.color,
            isSpinTrail: true, pierce: true
          });
        }
      }
      // 默认扇形攻击（兼容）
      else {
        for (const e of enemyList) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > range + e.r) continue;
          let angDiff = Math.atan2(dy, dx) - baseAng;
          while (angDiff > Math.PI) angDiff -= Math.PI * 2;
          while (angDiff < -Math.PI) angDiff += Math.PI * 2;
          if (Math.abs(angDiff) > arc / 2) continue;
          damageEnemy(e, dmg);
          if (burnData) {
            e.burning = (e.burning || 0) + burnData.duration;
            e.burnDps = burnData.dps;
          }
          if (freezeData) applyFreeze(e, freezeData);
          if (knockback > 0) applyKnockback(e, dx, dy, dist, knockback);
          spawnParticles(e.x, e.y, isHeavy ? 12 : 6, weapon.color, isHeavy ? 220 : 160, isHeavy ? 0.32 : 0.2);
        }
      }
      // 消除敌方子弹（所有近战风格）
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.team !== "enemy") continue;
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > range + b.size) continue;
        let angDiff = Math.atan2(dy, dx) - baseAng;
        while (angDiff > Math.PI) angDiff -= Math.PI * 2;
        while (angDiff < -Math.PI) angDiff += Math.PI * 2;
        if (Math.abs(angDiff) > arc / 2) continue;
        spawnParticles(b.x, b.y, isHeavy ? 10 : 5, weapon.color, isHeavy ? 220 : 150, 0.15);
        bullets.splice(i, 1);
      }
      sfx[weapon.sound] && sfx[weapon.sound]();
      if (isHeavy) p.muzzle = 0.3;
      return;
    }
    // 辅助函数：应用冰冻效果
    function applyFreeze(e, freezeData) {
      e.frozen = (e.frozen || 0) + freezeData.duration;
      e.speedMult = (e.speedMult || 1) * freezeData.slowFactor;
      e.fireRateMult = Math.min(e.fireRateMult || 1, freezeData.fireRateSlow || 1);
      spawnParticles(e.x, e.y, 8, "#66e0ff", 150, 0.28);
    }
    // 辅助函数：应用击退
    function applyKnockback(e, dx, dy, dist, kb) {
      if (dist > 0) {
        e.x += (dx / dist) * kb * 0.18;
        e.y += (dy / dist) * kb * 0.18;
      }
    }
    // 磁轨炮蓄力机制：蓄力/释放在 update 循环中通过边缘触发管理
    // 这里只处理实际射击（由 update 循环主动调用 fireChargeShot）
    if (weapon.charge) {
      // 冷却中：静默取消蓄力，不消耗能量不发射
      if (p.fireCd > 0) {
        p.isCharging = false;
        p.chargeStartTime = 0;
        p.chargeWeaponKey = null;
        return;
      }
      const baseAng = Math.atan2(targetY - originY, targetX - originX);
      const chargeTime = Date.now() - p.chargeStartTime;
      const chargeRatio = Math.min(1, chargeTime / weapon.charge.maxTime);
      const chargeDamage = Math.round(weapon.charge.baseDamage + (weapon.charge.maxDamage - weapon.charge.baseDamage) * chargeRatio);
      if (p.energy < weapon.energyCost) {
        p.isCharging = false;
        p.chargeStartTime = 0;
        p.chargeWeaponKey = null;
        toast("能量不足");
        return;
      }
      p.energy = Math.max(0, p.energy - weapon.energyCost);
      p.isCharging = false;
      p.chargeStartTime = 0;
      p.chargeWeaponKey = null;
      p.fireCd = weapon.fireRate;
      p.muzzle = 0.08;
      const chargeSize = weapon.bulletSize + chargeRatio * 8;
      const a = baseAng + rand(-weapon.spread, weapon.spread);
      const bulletOpts = {
        x: originX + Math.cos(a) * 18, y: originY + Math.sin(a) * 18,
        vx: Math.cos(a) * weapon.bulletSpeed, vy: Math.sin(a) * weapon.bulletSpeed,
        size: chargeSize, life: weapon.bulletLife, max: weapon.bulletLife,
        damage: chargeDamage, team: "player", color: weapon.color,
        hasBounce: !!p.hasBounce || !!weapon.hasBounce, maxBounces: weapon.maxBounces || 0,
        pierce: weapon.pierce || null,
        wide: weapon.wide || null,
        chargeRatio: chargeRatio,
      };
      spawnBullet(bulletOpts);
      if (chargeRatio >= 1) {
        spawnParticles(originX + Math.cos(baseAng) * 22, originY + Math.sin(baseAng) * 22, 20, weapon.color, 300, 0.3);
        shake(0.5, 10);
        floatText(originX, originY - 30, "MAX!", "#ff5df2");
      } else {
        spawnParticles(originX + Math.cos(baseAng) * 22, originY + Math.sin(baseAng) * 22, 8, weapon.color, 160, 0.15);
      }
      sfx[weapon.sound] && sfx[weapon.sound]();
      return;
    }
    
    // 普通武器射击逻辑
    if (p.fireCd > 0) return;
    if (p.energy < weapon.energyCost) return;
    p.fireCd = weapon.fireRate;
    p.energy = Math.max(0, p.energy - weapon.energyCost);
    p.muzzle = 0.08;
    const baseAng = Math.atan2(targetY - originY, targetX - originX);
    for (let i = 0; i < weapon.bullets; i++) {
      let a;
      if (weapon.bullets > 1) a = baseAng + (-weapon.spread + (weapon.spread * 2 * i) / (weapon.bullets - 1)) + rand(-0.04, 0.04);
      else a = baseAng + rand(-weapon.spread, weapon.spread);
      // 新武器特效属性
      const sx = originX + Math.cos(a) * 18;
      const sy = originY + Math.sin(a) * 18;
      const bulletOpts = {
        x: sx, y: sy,
        startX: sx, startY: sy,
        vx: Math.cos(a) * weapon.bulletSpeed, vy: Math.sin(a) * weapon.bulletSpeed,
        size: weapon.bulletSize, life: weapon.bulletLife, max: weapon.bulletLife,
        damage: weapon.damage, team: "player", color: weapon.color,
        explode: weapon.explode || null, hasBounce: !!p.hasBounce || !!weapon.hasBounce, maxBounces: weapon.maxBounces || 0, isShotgun: weapon.bullets > 3,
        // 新特效
        pierce: weapon.pierce || null,
        freeze: weapon.freeze || null,
        burn: weapon.burn || null,
        chain: weapon.chain || null,
        homing: weapon.homing || null,
        gravity: weapon.gravity || null,
        wide: weapon.wide || null,
        laser: weapon.laser || null,
        isGrenade: weapon.isGrenade || null,
        orbit: weapon.orbit ? { radius: weapon.orbit.radius, speed: weapon.orbit.speed, angle: a } : null,
      };
      spawnBullet(bulletOpts);
    }
    // 狙击枪后坐力：反向推动玩家
    if (weapon.name && weapon.name.includes("狙击枪")) {
      p.vx = (p.vx || 0) - Math.cos(baseAng) * 180;
      p.vy = (p.vy || 0) - Math.sin(baseAng) * 180;
    }
    spawnParticles(originX + Math.cos(baseAng) * 22, originY + Math.sin(baseAng) * 22, 4, weapon.color, 160, 0.15);
    sfx[weapon.sound] && sfx[weapon.sound]();
  }

  // ---------- 伤害 ----------
  function damagePlayer(amount, player) {
    const p = player || state.player;
    if (p.invuln > 0) return;
    // 房间护盾：进入房间的前1秒免疫所有伤害
    if (p.roomShield && p.roomShield > 0) {
      spawnParticles(p.x, p.y, 8, "#5deaff", 200, 0.3);
      floatText(p.x, p.y - 22, "护盾!", "#5deaff");
      return;
    }
    p.hp -= amount;
    p.invuln = 1.2;
    p.hurtFlash = 0.3;
    sfx.hurt();
    spawnParticles(p.x, p.y, 14, "#ef476f", 280, 0.6);
    floatText(p.x, p.y - 22, "-" + amount, "#ef476f");
    // 只有主机玩家才触发屏幕震动和红屏
    if (p === state.player) {
      shake(0.2, 6);
      const flash = document.getElementById("hurt-flash");
      if (flash) { flash.classList.add("show"); setTimeout(() => flash.classList.remove("show"), 180); }
    }
    if (p.hp <= 0) {
      p.hp = 0;
      if (p === state.player) {
        state.scene = "gameover";
        mouse.autoFire = false;
        stopBgm();
        clearSave();
        shake(1.2, 18);
        const g = document.getElementById("gameover-stats");
        const visitedCount = state.level ? state.level.filter((r) => r.visited).length : 1;
        if (g) g.textContent = `到达 ${state.levelIndex}-${visitedCount} · 击杀 ${p.kills} · 金币 ${p.coins}`;
        const s = document.getElementById("gameover-screen");
        if (s) s.classList.remove("hidden");
        // 更新复活按钮状态
        const reviveBtn = document.getElementById("revive-btn");
        if (reviveBtn) {
          if (p.coins >= 100) {
            reviveBtn.disabled = false;
            reviveBtn.textContent = "💰 复活（100金币）";
          } else {
            reviveBtn.disabled = true;
            reviveBtn.textContent = "💰 复活（金币不足）";
          }
        }
      }
    }
    if (p === state.player) updateHUD();
  }
  // 获取所有玩家（主机玩家 + 远程玩家）
  function getAllPlayers() {
    const players = [state.player];
    if (net.mode === "host") {
      for (const [, rp] of net.otherPlayers) {
        if (rp && rp.hp > 0) players.push(rp);
      }
    }
    return players;
  }
  // 从某个位置找最近的存活玩家
  function findNearestPlayer(x, y) {
    const players = getAllPlayers();
    let nearest = state.player;
    let best = Infinity;
    for (const p of players) {
      if (!p || p.hp <= 0) continue;
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < best) { best = d; nearest = p; }
    }
    return nearest;
  }
  function findNearestEnemy(x, y) {
    const cur = currentRoom && currentRoom();
    if (!cur || !cur.enemies || cur.enemies.length === 0) return null;
    let nearest = null;
    let best = Infinity;
    for (const e of cur.enemies) {
      if (!e || e.hp <= 0) continue;
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < best) { best = d; nearest = e; }
    }
    return nearest;
  }
  function damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    enemy.hurtFlash = 0.1;
    enemy.stunned = Math.max(enemy.stunned, 0.03);
    spawnParticles(enemy.x, enemy.y, 4, "#fff", 150, 0.22);
    floatText(enemy.x, enemy.y - enemy.r - 6, amount, "#ffffff");
    if (enemy.hp <= 0) killEnemy(enemy);
  }
  function killEnemy(enemy) {
    const room = currentRoom();
    const idx = room.enemies.indexOf(enemy);
    if (idx >= 0) room.enemies.splice(idx, 1);
    spawnParticles(enemy.x, enemy.y, enemy.isBoss ? 60 : 22, enemy.color, enemy.isBoss ? 450 : 280, enemy.isBoss ? 0.9 : 0.55);
    spawnExplosionRing(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 80 : 30);
    state.player.kills += 1;
    if (enemy.isBoss) {
      shake(1.0, 16);
      state.bossActive = false;
      state.currentBoss = null;
      for (let i = 0; i < 5; i++) room.drops.push({ kind: "coin", x: enemy.x + rand(-30, 30), y: enemy.y + rand(-30, 30), amount: 3 + randi(0, 4), life: 30, bob: Math.random() * 6 });
      room.drops.push({ kind: "hp", x: enemy.x - 30, y: enemy.y, amount: 8, life: 30, bob: 0 });
      // Boss掉落所有武器池中的随机武器
      const pool = Object.keys(WEAPONS).filter(k => k !== "pistol");
      const dropObj = pickWeaponFromPool(pool);
      room.drops.push({ kind: "weapon", weapon: dropObj.key, weaponStars: dropObj.stars, x: enemy.x + 30, y: enemy.y, life: 40, bob: 0 });
      room.portal = { x: ROOM_W / 2 - 30, y: ROOM_H / 2 - 30, w: 60, h: 60, spin: 0 };
      toast("击败首领！");
      sfx.portal();
      saveGame();
    } else {
      shake(0.08, 3);
      if (enemy.split && enemy.split > 0) {
        for (let i = 0; i < 2; i++) {
          room.enemies.push(makeEnemy("runner", state.levelIndex, enemy.x + rand(-18, 18), enemy.y + rand(-18, 18)));
          spawnExplosionRing(enemy.x, enemy.y, "#f78c6b", 22);
        }
      }
      if (Math.random() < 0.7) room.drops.push({ kind: "coin", x: enemy.x + rand(-8, 8), y: enemy.y + rand(-8, 8), amount: 1 + randi(0, 3), life: 30, bob: Math.random() * 6 });
      if (Math.random() < 0.15) room.drops.push({ kind: "hp", x: enemy.x, y: enemy.y + 10, amount: 3, life: 25, bob: 0 });
      if (Math.random() < 0.04) room.drops.push({ kind: "energy", x: enemy.x + 10, y: enemy.y, amount: 25, life: 25, bob: 0 });
    }
    maybeOpenDoors(room);
    updateHUD();
  }
  function maybeOpenDoors(room) {
    if (room.enemies.length === 0 && !room.cleared) {
      room.cleared = true;
      if (room.type !== "boss") toast("房间清理！");
      sfx.portal();
      if (room.type === "normal" && Math.random() < 0.4) room.drops.push({ kind: "coin", x: ROOM_W / 2 + rand(-20, 20), y: ROOM_H / 2 + rand(-20, 20), amount: 2 + randi(0, 3), life: 30, bob: 0 });
    }
  }

  // ---------- 爆炸 ----------
  function doExplosion(x, y, radius, damage, team, color) {
    spawnParticles(x, y, 40, color, 400, 0.55);
    playTone(90, 0.3, "sawtooth", 0.1);
    const room = currentRoom();
    if (team === "player") {
      // 玩家武器的爆炸只伤害敌人，绝对不伤害自己
      for (const e of room.enemies) {
        if (Math.hypot(e.x - x, e.y - y) < radius + e.r) damageEnemy(e, damage);
      }
    } else {
      // 敌方爆炸伤害玩家
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - x, p.y - y) < radius + p.r) damagePlayer(damage, p);
      }
    }
  }

  // 闪电链效果
  const lightningBolts = [];
  function chainLightning(x, y, numTargets, range, damage, remaining, excludeEnemy, alreadyHit) {
    if (remaining <= 0) return;
    const room = currentRoom();
    const hitSet = alreadyHit || new Set();
    // 只要房间里只有一个敌方单位（普通怪或 boss），就用 150% 伤害
    const singleEnemy = room.enemies.length === 1;
    // 筛选候选目标
    const candidates = [];
    for (const e of room.enemies) {
      if (singleEnemy) {
        // 单敌：只排除已被本链击中过的敌人（允许链回打这名敌人）
        if (hitSet.has(e)) continue;
      } else {
        // 多敌：排除被子弹直接命中的敌人 + 已被本链击中过的敌人
        if (e === excludeEnemy || hitSet.has(e)) continue;
      }
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < range) candidates.push({ e, d });
    }
    candidates.sort((a, b) => a.d - b.d);
    const singleBonus = singleEnemy ? 1.5 : 1;
    const targets = candidates.slice(0, numTargets);
    for (const { e } of targets) {
      hitSet.add(e);
      const finalDmg = Math.round(damage * singleBonus);
      lightningBolts.push({ x1: x, y1: y, x2: e.x, y2: e.y, life: 0.15 });
      damageEnemy(e, finalDmg);
      spawnParticles(e.x, e.y, 6, "#ffff00", 180, 0.25);
    }
    // 递归跳跃：下一跳从最后一名命中的敌人位置出发
    if (targets.length > 0 && remaining > 1) {
      const last = targets[targets.length - 1].e;
      chainLightning(last.x, last.y, numTargets, range, damage * 0.7, remaining - 1, null, hitSet);
    }
  }

  // ---------- 交互 ----------
  function interactNear(player) {
    const p = player || state.player;
    const room = currentRoom();
    if (!room) return;
    // 开启宝箱（按E）
    if (room.chest && !room.chest.opened) {
      if (Math.hypot(p.x - (room.chest.x + room.chest.w / 2), p.y - (room.chest.y + room.chest.h / 2)) < 70) {
        room.chest.opened = true;
        const keysArr = Object.keys(WEAPONS).filter((k) => k !== "pistol");
        const dropObj = pickWeaponFromPool(keysArr);
        room.drops.push({ kind: "weapon", weapon: dropObj.key, weaponStars: dropObj.stars, x: room.chest.x + room.chest.w / 2, y: room.chest.y - 10, life: 45, bob: 0 });
        for (let i = 0; i < 5; i++) room.drops.push({ kind: "coin", x: room.chest.x + rand(-15, 15) + 18, y: room.chest.y + 18, amount: 3 + randi(0, 3), life: 30, bob: Math.random() * 6 });
        room.drops.push({ kind: "hp", x: room.chest.x + room.chest.w / 2 + 40, y: room.chest.y + 18, amount: 6, life: 30, bob: 0 });
        spawnExplosionRing(room.chest.x + 18, room.chest.y + 18, "#ffd166", 60);
        spawnParticles(room.chest.x + 18, room.chest.y + 18, 28, "#ffd166", 320, 0.6);
        toast("打开宝箱！"); sfx.pickup(); shake(0.25, 6);
        return;
      }
    }
    // 拾取武器掉落（按E）
    for (let i = room.drops.length - 1; i >= 0; i--) {
      const d = room.drops[i];
      if (d.kind === "weapon") {
        if (Math.hypot(p.x - d.x, p.y - d.y) < 70) {
          pickupDrop(d, p);
          room.drops.splice(i, 1);
          return;
        }
      }
    }
    // 进入传送门（按E）
    if (room.portal) {
      if (Math.hypot(p.x - (room.portal.x + 30), p.y - (room.portal.y + 30)) < 70) {
        state.levelIndex += 1;
        if (state.levelIndex > 9) {
          state.scene = "victory";
          stopBgm();
          clearSave();
          const diff = state.difficulty || "hell";
          const msg = diff === "easy"
            ? "哦~ 小菜鸡，你敢挑战地狱模式吗？！"
            : "这位同志，愿你在未来披荆斩棘，抵达巅峰！";
          const vTitle = document.getElementById("victory-title");
          if (vTitle) {
            vTitle.textContent = diff === "easy" ? "通关" : "征服地狱";
            vTitle.setAttribute("data-diff", diff);
          }
          const v = document.getElementById("victory-stats");
          if (v) v.textContent = msg;
          const vk = document.getElementById("victory-kills");
          if (vk) vk.textContent = "击杀 " + p.kills + " · 金币 " + p.coins;
          const s = document.getElementById("victory-screen");
          if (s) {
            s.classList.remove("hidden");
            s.setAttribute("data-diff", diff);
          }
        } else {
          loadLevel(state.levelIndex); enterRoom(0, null);
          toast("第 " + state.levelIndex + " 大关");
          sfx.portal(); shake(0.4, 8);
        }
        return;
      }
    }
    // 购买商店物品（自动，靠近即可）
    if (room.shopItems) {
      for (const it of room.shopItems) {
        if (it.bought) continue;
        // 刷新按钮
        if (it.kind === "refresh") {
          if (Math.hypot(p.x - (it.x + it.w / 2), p.y - (it.y + it.h / 2)) < 54) {
            refreshShop(room);
            return;
          }
          continue;
        }
        if (Math.hypot(p.x - (it.x + it.w / 2), p.y - (it.y + it.h / 2)) < 54) {
          if (p.coins >= it.price) {
            p.coins -= it.price;
            if (it.kind === "weapon") addWeapon(it.weapon, it.weaponStars || 1, p);
            else if (it.kind === "hp") p.hp = Math.min(p.maxHp, p.hp + it.amount);
            else if (it.kind === "bounce") { p.hasBounce = true; floatText(it.x + it.w / 2, it.y + it.h / 2, "弹射已激活", "#06d6a0"); }
            it.bought = true;
            sfx.pickup(); toast("购买成功");
            spawnExplosionRing(it.x + it.w / 2, it.y + it.h / 2, "#ffd166", 30);
            updateHUD();
            saveGame();
          } else toast("金币不足");
          return;
        }
      }
    }
  }
  function addWeapon(key, stars, player) {
    stars = stars || 1;
    const p = player || state.player;
    if (!p.backpack) p.backpack = [null, null, null];

    // ===== 通用工具：从装备 / 背包中找到匹配武器的索引 =====
    // 返回: { eqIdxList: [...], bpIdxList: [...] }
    function findMatches(k, s) {
      const eqIdx = [];
      const bpIdx = [];
      for (let i = 0; i < p.weapons.length; i++) {
        if (weaponKey(p.weapons[i]) === k && weaponStars(p.weapons[i]) === s) eqIdx.push(i);
      }
      for (let i = 0; i < p.backpack.length; i++) {
        const w = p.backpack[i];
        if (w && weaponKey(w) === k && weaponStars(w) === s) bpIdx.push(i);
      }
      return { eqIdx: eqIdx, bpIdx: bpIdx };
    }

    // ===== 合成通用逻辑：stars -> stars + 1 =====
    // 参数：
    //   k: 武器key
    //   fromStars: 原始星级
    //   preferSlot: 可选，指定合成结果放置位置 (null/"weapon"/"backpack")
    // 策略：
    //   1) 如果preferSlot为"weapon"，放入手持武器槽
    //   2) 如果preferSlot为"backpack"，放入背包第一个空位
    //   3) 默认：优先从背包移除，保持装备位稳定，合成结果放入背包
    function doCombine(k, fromStars, preferSlot) {
      const m = findMatches(k, fromStars);
      const total = m.eqIdx.length + m.bpIdx.length;
      if (total < 2) return false;

      // 检查手持武器是否参与合成
      const curEqIdx = m.eqIdx.indexOf(p.curWeapon);
      const curWeaponParticipates = curEqIdx >= 0;

      // 收集要移除的 2 把同星级武器的位置
      // 先从背包取
      let removeFromBp = [];
      let removeFromEq = [];
      let need = 2;
      for (let i = 0; i < m.bpIdx.length && need > 0; i++) {
        removeFromBp.push(m.bpIdx[i]);
        need--;
      }
      for (let i = 0; i < m.eqIdx.length && need > 0; i++) {
        removeFromEq.push(m.eqIdx[i]);
        need--;
      }
      if (removeFromBp.length + removeFromEq.length < 2) return false;

      // 当手持武器参与合成时，直接替换curWeapon槽位，不移除它
      // 只移除其他需要移除的武器（背包中的和另一个装备位的）
      const curInEq = removeFromEq.indexOf(p.curWeapon);
      let curWeaponReplaced = false;
      if (curWeaponParticipates && curInEq >= 0) {
        // 从removeFromEq中移除curWeapon的索引，改为直接替换
        removeFromEq.splice(curInEq, 1);
        curWeaponReplaced = true;
      }

      // 从装备位移除其他武器（从大到小以避免索引偏移）
      removeFromEq.sort(function (a, b) { return b - a; });
      for (let j = 0; j < removeFromEq.length; j++) {
        const idx = removeFromEq[j];
        p.weapons.splice(idx, 1);
        if (p.curWeapon > idx) p.curWeapon--;
      }
      // 从背包移除（从大到小以避免索引偏移）
      removeFromBp.sort(function (a, b) { return b - a; });
      for (let j = 0; j < removeFromBp.length; j++) {
        p.backpack[removeFromBp[j]] = null;
      }
      // 修正 curWeapon
      if (p.weapons.length === 0) p.curWeapon = 0;
      else if (p.curWeapon >= p.weapons.length) p.curWeapon = 0;

      // 合成结果放置位置
      const newStars = fromStars + 1;
      let resultSlot = "backpack"; // 默认放背包

      if (preferSlot === "weapon" || curWeaponParticipates) {
        // 手持武器参与合成或明确指定，优先放手持槽
        resultSlot = "weapon";
      }

      if (resultSlot === "weapon") {
        // 放入手持武器槽
        p.weapons[p.curWeapon] = makeSlot(k, newStars);
      } else {
        // 放入背包第一个空位
        const bpEmpty = p.backpack.indexOf(null);
        if (bpEmpty >= 0) {
          p.backpack[bpEmpty] = makeSlot(k, newStars);
        } else {
          // 背包满：如果装备位未满，放装备位；否则覆盖一个装备位（当前手持）
          if (p.weapons.length < 2) {
            p.weapons.push(makeSlot(k, newStars));
          } else {
            p.weapons[p.curWeapon] = makeSlot(k, newStars);
          }
        }
      }

      // 视觉反馈
      if (!state.upgradedWeapons) state.upgradedWeapons = new Set();
      state.upgradedWeapons.add(k);
      const bigText = newStars === 2 ? "★ 合成成功！" : "★★ 合成成功！";
      bigFloat(p.x, p.y - 20, bigText, newStars === 2 ? "#ff5df2" : "#ffd166");
      const starText = newStars === 2 ? " 二星" : " 三星";
      const slotText = resultSlot === "weapon" ? "（装备中）" : "（存入背包）";
      toast("合成：" + WEAPONS[k].name + starText + slotText);
      shake(0.3, 8);
      sfx.pickup(); updateHUD(); saveGame();
      return true;
    }

    // ===== 二星合成（1星 + 1星 → 2星） =====
    if (stars === 1) {
      if (doCombine(key, 1)) return;
    }

    // ===== 三星合成（2星 + 2星 → 3星） =====
    if (stars === 2) {
      if (doCombine(key, 2)) return;
    }

    // ===== 正常拾取（不触发合成）：优先放入背包，其次装备位 =====
    // 策略：如果装备位有2把且背包有空格 → 直接放入背包
    //       如果装备位未满 → 放入装备位
    //       如果装备位满且背包满 → 替换当前手持武器（与原逻辑一致）
    const weaponDef = getWeaponDef(makeSlot(key, stars));
    if (!weaponDef) {
      console.error("[addWeapon] 无效武器定义：key=", key, "stars=", stars);
      toast("获取武器失败");
      return;
    }
    const newWeaponName = weaponDef.name;

    const bpEmptyIdx = p.backpack.indexOf(null);

    if (p.weapons.length < 2) {
      // 装备位未满：放入装备位
      p.weapons.push(makeSlot(key, stars));
      toast("获得武器：" + newWeaponName);
      sfx.pickup(); updateHUD(); saveGame();
      return;
    }

    if (bpEmptyIdx >= 0) {
      // 装备位满但背包有空：放入背包
      p.backpack[bpEmptyIdx] = makeSlot(key, stars);
      toast("获得武器：" + newWeaponName + "（存入背包）");
      sfx.pickup(); updateHUD(); saveGame();
      return;
    }

    // 装备位满且背包满：替换当前手持武器，旧武器掉地上
    const oldSlot = p.weapons[p.curWeapon];
    const oldDef = getWeaponDef(oldSlot);
    const oldName = oldDef ? oldDef.name : "未知武器";
    p.weapons[p.curWeapon] = makeSlot(key, stars);
    const room = currentRoom();
    if (room) {
      room.drops.push({ kind: "weapon", weapon: weaponKey(oldSlot), weaponStars: weaponStars(oldSlot), x: p.x, y: p.y + 20, life: 60, bob: 0 });
      floatText(p.x, p.y, "↓ " + oldName, "#ef476f");
    }
    toast("替换：" + oldName + " → " + newWeaponName);
    sfx.pickup(); updateHUD(); saveGame();
  }
  function pickupDrop(d, player) {
    const p = player || state.player;
    if (d.kind === "coin") { p.coins += d.amount; floatText(d.x, d.y, "+" + d.amount + "金", "#ffd166"); }
    else if (d.kind === "hp") { p.hp = Math.min(p.maxHp, p.hp + d.amount); floatText(d.x, d.y, "+" + d.amount + " HP", "#06d6a0"); }
    else if (d.kind === "energy") { p.energy = Math.min(p.maxEnergy, p.energy + d.amount); floatText(d.x, d.y, "+" + d.amount + " 能量", "#6ac2ff"); }
    else if (d.kind === "weapon") addWeapon(d.weapon, d.weaponStars || 1, p);
    updateHUD();
  }

  // ---------- 主更新 ----------
  function update(dt) {
    if (state.scene !== "play") return;
    state.elapsed += dt;
    const p = state.player;
    if (!p) return;
    const room = currentRoom();
    if (!room) return;
    // B 键打开 / 关闭背包；Esc 关闭背包
    if (keys["b"]) {
      keys["b"] = false;
      toggleBackpack();
    }
    if (keys["escape"]) {
      keys["escape"] = false;
      closeBackpack();
    }
    // 若背包已打开，暂停其它操作，处理背包内按键
    const bpScreen = document.getElementById("backpack-screen");
    if (bpScreen && !bpScreen.classList.contains("hidden")) {
      const p2 = p;
      // Tab 键：循环选择下一个有武器的背包格子
      if (keys["tab"]) {
        keys["tab"] = false;
        let next = -1;
        for (let i = 1; i <= 3; i++) {
          const idx = (state.selectedBackpackIdx + i) % 3;
          if (p2.backpack[idx]) { next = idx; break; }
        }
        state.selectedBackpackIdx = next;
        renderBackpackUI();
      }
      // Q 键：丢弃选中的背包武器到地面
      if (keys["q"]) {
        keys["q"] = false;
        if (isInCombat()) { toast("战斗中无法丢弃"); }
        else if (state.selectedBackpackIdx >= 0 && p2.backpack[state.selectedBackpackIdx]) {
          const item = p2.backpack[state.selectedBackpackIdx];
          const room = currentRoom();
          if (room) {
            room.drops.push({ kind: "weapon", weapon: weaponKey(item), weaponStars: weaponStars(item), x: p2.x + 20, y: p2.y, life: 60, bob: 0 });
            const wName = (getWeaponDef(item) || {}).name || "未知武器";
            floatText(p2.x, p2.y - 20, "↓ " + wName, "#ef476f");
            toast("丢弃：" + wName);
          }
          p2.backpack[state.selectedBackpackIdx] = null;
          state.selectedBackpackIdx = -1;
          updateHUD();
          renderBackpackUI();
          saveGame();
        }
      }
      return;
    }
    if (keys["1"]) { keys["1"] = false; if (p.curWeapon !== 0 && p.weapons[0]) { p.isCharging = false; p.chargeStartTime = 0; p.chargeWeaponKey = null; p.curWeapon = 0; sfx.swap(); animateSlotSwap(0); updateHUD(); } }
    if (keys["2"]) { keys["2"] = false; if (p.weapons[1]) { p.isCharging = false; p.chargeStartTime = 0; p.chargeWeaponKey = null; p.curWeapon = 1; sfx.swap(); animateSlotSwap(1); updateHUD(); } }
    let mx = 0, my = 0;
    if (keys["w"] || keys["arrowup"]) my -= 1;
    if (keys["s"] || keys["arrowdown"]) my += 1;
    if (keys["a"] || keys["arrowleft"]) mx -= 1;
    if (keys["d"] || keys["arrowright"]) mx += 1;
    if (mx || my) { const l = Math.hypot(mx, my); mx /= l; my /= l; }
    p.dashCd = Math.max(0, p.dashCd - dt * 1000);
    if (keys[" "] && p.dashCd <= 0 && (mx || my)) {
      p.dashTime = 170; p.dashCd = 800; p.invuln = Math.max(p.invuln, 0.25); p.dashDirX = mx; p.dashDirY = my;
      keys[" "] = false; sfx.dash(); shake(0.1, 4);
      for (let i = 0; i < 12; i++) particles.push({ x: p.x, y: p.y, vx: -mx * rand(80, 200) + rand(-60, 60), vy: -my * rand(80, 200) + rand(-60, 60), life: 0.3, max: 0.3, color: "#6ac2ff", size: rand(2, 4), shape: "circle" });
    }
    let speedMul = 1;
    if (p.dashTime > 0) { speedMul = 2.3; mx = p.dashDirX; my = p.dashDirY; p.dashTime -= dt * 1000; }
    const dx = mx * p.speed * speedMul * dt;
    const dy = my * p.speed * speedMul * dt;
    if (!hitsObstacleCircle(p.x + dx, p.y, p.r, room)) p.x += dx;
    else if (!hitsObstacleCircle(p.x + dx, p.y + sign(my) * Math.abs(dx) * 0.3, p.r, room)) { p.x += dx; p.y += sign(my) * Math.abs(dx) * 0.3; }
    if (!hitsObstacleCircle(p.x, p.y + dy, p.r, room)) p.y += dy;
    // 后坐力速度应用
    if (p.vx || p.vy) {
      const rvx = p.vx * 0.88;
      const rvy = p.vy * 0.88;
      if (!hitsObstacleCircle(p.x + rvx * dt, p.y, p.r, room)) p.x += rvx * dt;
      if (!hitsObstacleCircle(p.x, p.y + rvy * dt, p.r, room)) p.y += rvy * dt;
      p.vx = Math.abs(rvx) < 1 ? 0 : rvx;
      p.vy = Math.abs(rvy) < 1 ? 0 : rvy;
    }
    p.x = clamp(p.x, p.r + 8, ROOM_W - p.r - 8);
    p.y = clamp(p.y, p.r + 8, ROOM_H - p.r - 8);
    p.facing = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    p.fireCd = Math.max(0, p.fireCd - dt * 1000);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    p.roomShield = Math.max(0, (p.roomShield || 0) - dt);
    p.muzzle = Math.max(0, p.muzzle - dt);
    if (p.meleeSwing) {
      p.meleeSwing.time -= dt;
      if (p.meleeSwing.time <= 0) p.meleeSwing = null;
    }
    p.energy = Math.min(p.maxEnergy, p.energy + 16 * dt);
    const wdef = getWeaponDef(p.weapons[p.curWeapon]);
    // 武器射击：charge 武器边缘触发（按下蓄力、松开发射）；其他武器按住射击
    if (wdef) {
      if (wdef.melee && wdef.charge) {
        // 近战 + 蓄力：按下开始蓄力，松开释放
        const mouseFiring = mouse.down || mouse.autoFire;
        if (mouseFiring && !mouse._wasDown) {
          p.isCharging = true;
          p.chargeStartTime = Date.now();
          p.chargeWeaponKey = weaponKey(p.weapons[p.curWeapon]);
        } else if (!mouseFiring && mouse._wasDown && p.isCharging) {
          const chargeTime = Date.now() - p.chargeStartTime;
          const chargeThreshold = 200;
          p.isCharging = false;
          p.chargeStartTime = 0;
          p.chargeWeaponKey = null;
          if (chargeTime < chargeThreshold) {
            tryFire(wdef, p.x, p.y, mouse.x, mouse.y, p, false);
          } else {
            tryFire(wdef, p.x, p.y, mouse.x, mouse.y, p, true, chargeTime);
          }
        }
        mouse._wasDown = mouseFiring;
      } else if (wdef.charge) {
        const mouseFiring = mouse.down || mouse.autoFire;
        // 按下边缘：开始蓄力（不检查 fireCd，发射后可立即重新蓄力）
        if (mouseFiring && !mouse._wasDown) {
          p.isCharging = true;
          p.chargeStartTime = Date.now();
          p.chargeWeaponKey = weaponKey(p.weapons[p.curWeapon]);
        }
        // 松开边缘：发射子弹
        else if (!mouseFiring && mouse._wasDown && p.isCharging) {
          tryFire(wdef, p.x, p.y, mouse.x, mouse.y);
        }
        mouse._wasDown = mouseFiring;
      } else {
        // 普通武器：按住持续射击
        if ((mouse.down || mouse.autoFire) && p.fireCd <= 0) tryFire(wdef, p.x, p.y, mouse.x, mouse.y);
        mouse._wasDown = mouse.down || mouse.autoFire;
      }
    }
    if (keys["e"]) { keys["e"] = false; interactNear(); }

    // ---- 局域网联机：客户端自己的位置平滑校正 ----
    // 客户端视角下，本地物理仍然会跑（手感优先），但服务器给的权威位置会通过
    // 目标值 _tx/_ty/_tfacing 温和地拉回，避免位置跳变
    if (net.mode === "client" && p._tx != null) {
      // 移动按键或冲刺时，给玩家输入更多权重（更小的 lerp），避免跟手冲突
      const hasInput = keys["w"] || keys["a"] || keys["s"] || keys["d"] || (p.dashTime > 0);
      const t = hasInput ? Math.min(1, dt * 8) : Math.min(1, dt * 14);
      p.x = lerp(p.x, p._tx, t);
      if (p._ty != null) p.y = lerp(p.y, p._ty, t);
      if (p._tfacing != null) {
        // 玩家自己在对着鼠标，所以朝向只在瞄准静止时做轻微平滑
        p.facing = lerpAngle(p.facing, p._tfacing, Math.min(1, dt * 6));
      }
    }

    // ---- 局域网联机：远程玩家模拟 / 插值 ----
    if (net.mode === "host") {
      for (const [rid, rp] of net.otherPlayers) {
        if (!rp) continue;
        // 死亡玩家：处于重生倒计时，减短
        if (rp.hp <= 0) {
          rp.respawnTimer = (rp.respawnTimer || 0) - dt;
          if (rp.respawnTimer <= 0) {
            // 重生：恢复到主机玩家位置附近
            rp.hp = Math.max(6, Math.floor(rp.maxHp * 0.5));
            rp.invuln = 2.0;
            rp.x = state.player ? state.player.x + (Math.random() - 0.5) * 40 : ROOM_W / 2;
            rp.y = state.player ? state.player.y + (Math.random() - 0.5) * 40 : ROOM_H / 2;
            toast((rp.name || "玩家") + " 重生了");
          }
          continue;
        }
        rp.fireCd = Math.max(0, (rp.fireCd || 0) - dt * 1000);
        rp.dashCd = Math.max(0, (rp.dashCd || 0) - dt * 1000);
        rp.invuln = Math.max(0, (rp.invuln || 0) - dt);
        rp.hurtFlash = Math.max(0, (rp.hurtFlash || 0) - dt);
        rp.muzzle = Math.max(0, (rp.muzzle || 0) - dt);
        if (rp.meleeSwing) {
          rp.meleeSwing.time -= dt;
          if (rp.meleeSwing.time <= 0) rp.meleeSwing = null;
        }
        let rmx = 0, rmy = 0;
        if (rp.keys && rp.keys["w"]) rmy -= 1;
        if (rp.keys && rp.keys["s"]) rmy += 1;
        if (rp.keys && rp.keys["a"]) rmx -= 1;
        if (rp.keys && rp.keys["d"]) rmx += 1;
        // 冲刺
        if (rp.keys && rp.keys["space"] && rp.dashCd <= 0 && (rmx || rmy)) {
          rp.dashTime = 170; rp.dashCd = 800; rp.invuln = Math.max(rp.invuln, 0.25);
          rp.dashDirX = rmx; rp.dashDirY = rmy;
          spawnParticles(rp.x, rp.y, 8, rp.color || "#ff6b9d", 240, 0.2);
        }
        if (rmx || rmy) { const l = Math.hypot(rmx, rmy); rmx /= l; rmy /= l; }
        let rSpeed = (rp.speed || 250);
        if (rp.dashTime > 0) { rSpeed = rSpeed * 2.3; rmx = rp.dashDirX; rmy = rp.dashDirY; rp.dashTime -= dt * 1000; }
        const rdx = rmx * rSpeed * dt;
        const rdy = rmy * rSpeed * dt;
        if (!hitsObstacleCircle(rp.x + rdx, rp.y, rp.r, room)) rp.x += rdx;
        if (!hitsObstacleCircle(rp.x, rp.y + rdy, rp.r, room)) rp.y += rdy;
        rp.x = clamp(rp.x, rp.r + 8, ROOM_W - rp.r - 8);
        rp.y = clamp(rp.y, rp.r + 8, ROOM_H - rp.r - 8);
        rp.facing = Math.atan2((rp.mouseY - rp.y) || 0, (rp.mouseX - rp.x) || 1);
        rp.energy = Math.min(rp.maxEnergy || 100, (rp.energy || 100) + 16 * dt);
        const rwdef = getWeaponDef(rp.weapons[rp.curWeapon]);
        if ((rp.mouseDown || rp.autoFire) && rwdef) tryFire(rwdef, rp.x, rp.y, rp.mouseX, rp.mouseY, rp);
        // 远程玩家交互
        if (rp.keys && rp.keys["e"]) {
          rp.keys["e"] = false;
          interactNear(rp);
        }
      }
    } else if (net.mode === "client") {
      // 客户端视角下，远程玩家位置 / 朝向由主机权威驱动，只做插值：
      // 1. 动画字段（invuln / hurtFlash / muzzle）继续按 dt 衰减，保证过渡自然
      // 2. 位置朝向用目标值 lerp，避免每 ~66ms 的位置跳变
      for (const [rid, rp] of net.otherPlayers) {
        if (!rp) continue;
        rp.invuln = Math.max(0, (rp.invuln || 0) - dt);
        rp.hurtFlash = Math.max(0, (rp.hurtFlash || 0) - dt);
        rp.muzzle = Math.max(0, (rp.muzzle || 0) - dt);
        if (rp.meleeSwing) {
          rp.meleeSwing.time -= dt;
          if (rp.meleeSwing.time <= 0) rp.meleeSwing = null;
        }
        if (rp._tx != null) {
          const t = Math.min(1, dt * 12);
          rp.x = lerp(rp.x, rp._tx, t);
          if (rp._ty != null) rp.y = lerp(rp.y, rp._ty, t);
          if (rp._tfacing != null) rp.facing = lerpAngle(rp.facing, rp._tfacing, t);
        }
      }
    }

    // ---- 局域网联机：状态同步 ----
    if (net.mode === "host") {
      net.lastSendTime = (net.lastSendTime || 0) + dt;
      if (net.lastSendTime > 0.066) {
        net.lastSendTime = 0;
        // 数值截断：保留 2 位小数，大幅减少 JSON 体积
        const f2 = (v) => Math.round((+v || 0) * 100) / 100;
        // 是否需要发送地图 / 关卡结构（房间切换时才重发，否则心跳每 5 秒同步一次）
        const roomChanged = net._lastSentRoomId !== state.currentRoomId;
        const levelDue = !net._lastLevelTime || (state.elapsed - net._lastLevelTime) > 5;
        if (roomChanged || levelDue) {
          net._lastSentRoomId = state.currentRoomId;
          net._lastLevelTime = state.elapsed;
        }
        const sendLevel = roomChanged || levelDue;
        // 构建所有玩家列表（主机 + 所有远程玩家）
        const allPlayers = [];
        allPlayers.push({
          id: "host",
          name: net.playerName || "主机",
          x: f2(p.x), y: f2(p.y), r: p.r,
          hp: f2(p.hp), maxHp: p.maxHp,
          energy: f2(p.energy), maxEnergy: p.maxEnergy,
          coins: p.coins,
          weapons: p.weapons.map(w => ({ key: weaponKey(w), stars: weaponStars(w) })),
          curWeapon: p.curWeapon,
          facing: f2(p.facing),
          color: "#6ac2ff",
          isHost: true,
          hasBounce: !!p.hasBounce,
        });
        for (const [rid, rp] of net.otherPlayers) {
          if (!rp) continue;
          allPlayers.push({
            id: rid,
            name: rp.name || ("玩家 " + rid),
            x: f2(rp.x), y: f2(rp.y), r: rp.r,
            hp: f2(rp.hp), maxHp: rp.maxHp,
            energy: f2(rp.energy || 0), maxEnergy: rp.maxEnergy,
            coins: rp.coins,
            weapons: (rp.weapons || []).map(w => ({ key: weaponKey(w), stars: weaponStars(w) })),
            curWeapon: rp.curWeapon,
            facing: f2(rp.facing || 0),
            color: rp.color || "#ff6b9d",
            isHost: false,
            hasBounce: !!rp.hasBounce,
          });
        }
        // 基本消息：永远发送
        const msg = {
          type: "state_update",
          levelIndex: state.levelIndex,
          subIndex: state.subIndex,
          currentRoomId: state.currentRoomId,
          elapsed: f2(state.elapsed),
          players: allPlayers,
          // 子弹：只保留关键字段，并限制数量
          bullets: bullets.slice(0, 100).map(b => ({ x: f2(b.x), y: f2(b.y), startX: b.startX != null ? f2(b.startX) : undefined, startY: b.startY != null ? f2(b.startY) : undefined, size: b.size, color: b.color, laser: b.laser || null })),
        };
        // 关卡结构：只在房间切换或心跳时发送
        if (sendLevel) {
          msg.level = state.level ? state.level.map(r => ({ id: r.id, type: r.type, gx: r.gx, gy: r.gy, doors: r.doors, cleared: r.cleared, visited: r.visited, spawned: r.spawned })) : [];
        }
        // room 内的动态内容：敌人 / 宝箱 / 商店 / 传送门 / 掉落物
        if (room) {
          const roomData = {
            type: room.type,
            cleared: room.cleared,
            enemies: room.enemies.slice(0, 60).map(e => ({ type: e.type, x: f2(e.x), y: f2(e.y), hp: f2(e.hp), maxHp: e.maxHp, r: e.r, color: e.color, isBoss: !!e.isBoss })),
            doors: room.doors,
          };
          if (room.chest) roomData.chest = { x: f2(room.chest.x), y: f2(room.chest.y), opened: room.chest.opened };
          if (room.portal) roomData.portal = { x: f2(room.portal.x), y: f2(room.portal.y), spin: f2(room.portal.spin || 0) };
          if (room.shopItems && room.shopItems.length) {
            roomData.shopItems = room.shopItems.map(it => ({ x: f2(it.x), y: f2(it.y), w: it.w, h: it.h, kind: it.kind, weapon: it.weapon, weaponStars: it.weaponStars, price: it.price, bought: it.bought, amount: it.amount, costPercent: it.costPercent }));
          }
          if (room.drops && room.drops.length) {
            roomData.drops = room.drops.slice(0, 40).map(d => ({ kind: d.kind, x: f2(d.x), y: f2(d.y), amount: d.amount, weapon: d.weapon, weaponStars: d.weaponStars }));
          }
          msg.room = roomData;
        }
        netSend(msg);
      }
    } else if (net.mode === "client") {
      net.lastSendTime = (net.lastSendTime || 0) + dt;
      if (net.lastSendTime > 0.033) {
        net.lastSendTime = 0;
        // 客户端输入同步
        const sendMsg = {
          type: "input_update",
          playerId: net.playerId,
          playerName: net.playerName,
          keys: {
            w: !!keys["w"], a: !!keys["a"], s: !!keys["s"], d: !!keys["d"],
            e: !!keys["e"],
            space: !!keys[" "],
            slot1: !!keys["1"], slot2: !!keys["2"], slot3: !!keys["3"],
          },
          mouseX: Math.round(mouse.x), mouseY: Math.round(mouse.y),
          mouseDown: mouse.down,
          autoFire: mouse.autoFire,
          slotIdx: state.player ? state.player.curWeapon : 0,
        };
        if (!net._lastWeaponSync || (state.elapsed - net._lastWeaponSync) > 0.2) {
          net._lastWeaponSync = state.elapsed;
          if (state.player && state.player.weapons) {
            sendMsg.weapons = state.player.weapons.map(w => ({ key: weaponKey(w), stars: weaponStars(w) }));
          }
        }
        netSend(sendMsg);
      }
    }

    // ---- 客户端：子弹插值与淡入淡出生命周期 ----
    if (net.mode === "client") {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        // 淡入 / 淡出计时
        if (b._fadeIn && b._fadeIn > 0) b._fadeIn = Math.max(0, b._fadeIn - dt);
        if (b._fadeOut != null) {
          b._fadeOut -= dt;
          if (b._fadeOut <= 0) { bullets.splice(i, 1); continue; }
        }
        // 向目标位置插值（只在有 _tx/_ty 标记时）
        if (b._tx != null && b._ty != null) {
          const t = Math.min(1, dt * 12);
          b.x = lerp(b.x, b._tx, t);
          b.y = lerp(b.y, b._ty, t);
        }
      }
    }

    outerLoop: for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.team === "player") {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 5) b.trail.shift();
      }
      // 环绕轨道子弹：环绕玩家
      if (b.orbit) {
        b.orbit.angle += b.orbit.speed * dt;
        // 找到发射该子弹的玩家
        const p = state.player;
        if (p) {
          b.x = p.x + Math.cos(b.orbit.angle) * b.orbit.radius;
          b.y = p.y + Math.sin(b.orbit.angle) * b.orbit.radius;
        }
      } else {
        // 追踪子弹效果（改进：动态转向 + 平滑速度插值）
        if (b.homing) {
          let tp = null;
          if (b.team === "player") tp = findNearestEnemy(b.x, b.y);
          else tp = findNearestPlayer(b.x, b.y);
          if (tp) {
            const dx = tp.x - b.x, dy = tp.y - b.y;
            const distToTarget = Math.hypot(dx, dy) + 0.01;
            const desiredVX = (dx / distToTarget);
            const desiredVY = (dy / distToTarget);
            const speed = Math.hypot(b.vx, b.vy);
            // 动态转向系数：距离越近转得越快；小炮弹追踪更激进
            let turnFactor = b._subGrenade ? 10 : 6;
            // 距离越近，转向越快（保证命中）
            turnFactor += Math.max(0, 200 - distToTarget) * 0.03;
            const lerpRatio = Math.min(1, turnFactor * dt);
            const curVX = b.vx / speed;
            const curVY = b.vy / speed;
            const newDirX = curVX + (desiredVX - curVX) * lerpRatio;
            const newDirY = curVY + (desiredVY - curVY) * lerpRatio;
            const norm = Math.hypot(newDirX, newDirY) + 0.001;
            b.vx = (newDirX / norm) * speed;
            b.vy = (newDirY / norm) * speed;
          }
        }
        // 重力子弹效果（抛物线）
        if (b.gravity) {
          b.vy += 400 * dt;
        }
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.life -= dt;
        // 榴弹分裂：isGrenade 子弹飞行超过 140 像素后分裂为 3 枚追踪小炮弹
        if (b.isGrenade && !b._splitDone && b.startX != null && b.startY != null) {
          const travelDist = Math.hypot(b.x - b.startX, b.y - b.startY);
          if (travelDist >= 140) {
            b._splitDone = true;
            const baseAng = Math.atan2(b.vy, b.vx);
            const curSpeed = Math.hypot(b.vx, b.vy);
            // 小炮弹伤害/爆炸范围跟随母弹（即随星级增长）
            const parentDamage = b.damage;
            const parentExplode = b.explode || { radius: 65, damage: 12 };
            const subDamage = Math.max(3, Math.round(parentDamage * 0.5));
            const subRadius = Math.max(25, Math.round(parentExplode.radius * 0.54));
            const subExplodeDamage = Math.max(3, Math.round(parentExplode.damage * 0.5));
            // 3 枚小炮弹：瞄准最近敌人，以扇形发射
            const subTarget = findNearestEnemy(b.x, b.y);
            const aimAng = subTarget ? Math.atan2(subTarget.y - b.y, subTarget.x - b.x) : baseAng;
            for (let k = 0; k < 3; k++) {
              const off = (k - 1) * 0.22; // ≈ 12.6°
              const sa = aimAng + off;
              spawnBullet({
                x: b.x, y: b.y,
                startX: b.x, startY: b.y,
                vx: Math.cos(sa) * Math.max(curSpeed, 550),
                vy: Math.sin(sa) * Math.max(curSpeed, 550),
                size: 5, life: 1.8, max: 1.8,
                damage: subDamage, team: "player", color: "#ff9500",
                explode: { radius: subRadius, damage: subExplodeDamage },
                homing: true, hasBounce: false,
                _subGrenade: true,
              });
            }
            spawnParticles(b.x, b.y, 12, "#ff9500", 180, 0.3);
            bullets.splice(i, 1);
            continue outerLoop;
          }
        }
        // 导弹尾焰粒子（homing + explode 子弹）
        if (b.homing && b.explode && Math.random() < 0.8) {
          const ang = Math.atan2(b.vy, b.vx);
          const tx = b.x - Math.cos(ang) * (b.size + rand(0, 4));
          const ty = b.y - Math.sin(ang) * (b.size + rand(0, 4));
          spawnParticles(tx, ty, 1, Math.random() < 0.5 ? "#ff9500" : "#ff4500", 80, 0.2);
        }
      }
      let hit = false;
      // 先检查敌人碰撞，再检查障碍物
      if (b.team === "player") {
        // 护盾Boss护盾阻挡检测
        for (const e of room.enemies) {
          if (e.type === "boss_shielder" && e.shieldActive && e.shieldAngle != null) {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            const shieldRadius = e.r + (e.phase === 2 ? 35 : 25);
            if (dist < shieldRadius) {
              // 检查子弹是否从护盾前方射来
              const bulletAng = Math.atan2(b.vy, b.vx);
              const angleDiff = Math.abs(bulletAng - e.shieldAngle);
              const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
              const shieldWidth = e.phase === 2 ? 1.2 : 0.9; // 护盾扇形宽度（弧度）
              if (normalizedDiff < shieldWidth) {
                // 子弹被护盾阻挡
                spawnParticles(b.x, b.y, 8, "#30d158", 150, 0.2);
                bullets.splice(i, 1);
                continue outerLoop;
              }
            }
          }
        }
        for (let ei = 0; ei < room.enemies.length; ei++) {
          const e = room.enemies[ei];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.size) {
            // 穿透子弹对同一敌人只造成一次伤害
            if (b.pierce) {
              if (!b.hitEnemies) b.hitEnemies = new Set();
              if (b.hitEnemies.has(ei)) continue;
              b.hitEnemies.add(ei);
            }
            damageEnemy(e, b.damage);
            // 霰弹枪命中效果：统计同批次命中子弹数量
            if (b.isShotgun) {
              e.shotgunHits = (e.shotgunHits || 0) + 1;
              e.shotgunLastHit = Date.now();
            }
            if (b.explode) { doExplosion(b.x, b.y, b.explode.radius, b.explode.damage, b.team, b.color); spawnExplosionRing(b.x, b.y, b.color, b.explode.radius); shake(0.3, 8); }
            // 冰冻效果
            if (b.freeze) {
              e.frozen = (e.frozen || 0) + b.freeze.duration;
              e.speedMult = (e.speedMult || 1) * b.freeze.slowFactor;
              e.fireRateMult = Math.min(e.fireRateMult || 1, b.freeze.fireRateSlow || 1);
              spawnParticles(e.x, e.y, 8, "#00d4ff", 120, 0.3);
            }
            // 燃烧效果
            if (b.burn) {
              e.burning = (e.burning || 0) + b.burn.duration;
              e.burnDps = b.burn.dps;
            }
            // 闪电链效果
            if (b.chain && b.chain.targets > 0) {
              chainLightning(e.x, e.y, b.chain.targets, b.chain.range, b.damage * 0.6, b.chain.targets - 1, e);
            }
            // 穿透子弹不消失
            if (!b.pierce) { hit = true; break; }
            else {
              // 穿透子弹减速
              b.vx *= 0.85;
              b.vy *= 0.85;
              spawnParticles(b.x, b.y, 6, "#fff", 200, 0.2);
            }
          }
        }
        if (hit) { spawnParticles(b.x, b.y, 6, b.color, 200, 0.25); bullets.splice(i, 1); continue; }
      } else {
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + b.size) { damagePlayer(b.damage, p); spawnParticles(b.x, b.y, 10, b.color, 220, 0.25); bullets.splice(i, 1); continue outerLoop; }
        }
      }
      // 检查边界和障碍物弹射（仅玩家子弹可弹射，且需要该子弹发射玩家已激活弹射）
      const canBounce = (b.team === "player") && b.hasBounce && (!b.bounces || b.bounces < (b.maxBounces || 0));
      // 弹射冷却时间，防止连续多帧触发
      b.bounceCd = Math.max(0, (b.bounceCd || 0) - dt);
      let bounced = false;
      // 先检查是否需要弹射（边界或障碍物）
      const hitWall = b.x < b.size || b.x > ROOM_W - b.size || b.y < b.size || b.y > ROOM_H - b.size;
      const hitObstacle = hitsObstacleCircle(b.x, b.y, b.size, room);
      if ((hitWall || hitObstacle) && canBounce && b.bounceCd <= 0) {
        // 增加弹射次数和冷却时间
        b.bounces = (b.bounces || 0) + 1;
        b.bounceCd = 0.08; // 80ms 冷却
        const speed = Math.hypot(b.vx, b.vy);
        const pushDist = b.size + 15;
        // 边界处理：先把子弹推出边界
        if (b.x < b.size) b.x = b.size;
        if (b.x > ROOM_W - b.size) b.x = ROOM_W - b.size;
        if (b.y < b.size) b.y = b.size;
        if (b.y > ROOM_H - b.size) b.y = ROOM_H - b.size;
        // 计算反射方向
        let newVx = b.vx, newVy = b.vy;
        if (hitWall) {
          if (b.x <= b.size + 1 || b.x >= ROOM_W - b.size - 1) newVx = -b.vx;
          if (b.y <= b.size + 1 || b.y >= ROOM_H - b.size - 1) newVy = -b.vy;
        }
        if (hitObstacle) {
          // 尝试找到一个不会撞障碍物的方向
          const curAng = Math.atan2(b.vy, b.vx);
          const tryAngles = [Math.PI, -Math.PI, Math.PI * 0.8, -Math.PI * 0.8, Math.PI / 2, -Math.PI / 2, Math.PI * 0.6, -Math.PI * 0.6, Math.PI * 0.4, -Math.PI * 0.4];
          let found = false;
          for (const da of tryAngles) {
            const testAng = curAng + da;
            const nx = Math.cos(testAng) * speed;
            const ny = Math.sin(testAng) * speed;
            // 多次测试，逐步增加距离
            for (let dist = pushDist; dist >= pushDist * 0.5; dist -= 3) {
              const testX = b.x + (nx / speed) * dist;
              const testY = b.y + (ny / speed) * dist;
              if (!hitsObstacleCircle(testX, testY, b.size, room)) {
                newVx = nx; newVy = ny;
                b.x = testX; b.y = testY;
                found = true; break;
              }
            }
            if (found) break;
          }
          if (!found) {
            newVx = -b.vx; newVy = -b.vy;
            b.x += (newVx / speed) * pushDist;
            b.y += (newVy / speed) * pushDist;
          }
        }
        b.vx = newVx; b.vy = newVy;
        bounced = true;
        // 弹射后清空穿透子弹的已命中列表，允许新弹道再次伤害同一敌人
        if (b.pierce && b.hitEnemies) b.hitEnemies.clear();
        if (b.laser) {
          b.bouncePoints = b.bouncePoints || [];
          b.bouncePoints.push({ x: b.x, y: b.y });
        }
        spawnParticles(b.x, b.y, 5, b.color, 100, 0.15);
      } else if (!b.orbit && (hitWall || hitObstacle)) {
        // 不能弹射，子弹消失（轨道子弹除外）
        if (b.explode) { doExplosion(b.x, b.y, b.explode.radius, b.explode.damage, b.team, b.color); spawnExplosionRing(b.x, b.y, b.color, b.explode.radius); }
        spawnParticles(b.x, b.y, 5, b.color, 150, 0.2); bullets.splice(i, 1); continue;
      }
      if (!b.orbit && b.life <= 0) {
        if (b.explode) { doExplosion(b.x, b.y, b.explode.radius, b.explode.damage, b.team, b.color); spawnExplosionRing(b.x, b.y, b.color, b.explode.radius); }
        spawnParticles(b.x, b.y, 5, b.color, 150, 0.2); bullets.splice(i, 1);
      }
    }
    for (const e of room.enemies) {
      e.hurtFlash = Math.max(0, e.hurtFlash - dt);
      e.stunned = Math.max(0, e.stunned - dt);
      // 冰冻效果更新
      if (e.frozen > 0) {
        e.frozen -= dt;
        e.speedMult = Math.min(e.speedMult || 1, 0.3);
        if (e.frozen <= 0) { e.speedMult = 1; e.fireRateMult = 1; }
      }
      // 燃烧效果更新
      if (e.burning > 0) {
        e.burning -= dt;
        e.hp -= (e.burnDps || 4) * dt;
        if (Math.random() < 0.3) spawnParticles(e.x + rand(-10, 10), e.y + rand(-10, 10), 2, "#ff4500", 80, 0.3);
        if (e.hp <= 0) killEnemy(e);
      }
      if (e.stunned > 0) continue;
      // 找最近的存活玩家作为目标
      const tp = findNearestPlayer(e.x, e.y);
      const ang = Math.atan2(tp.y - e.y, tp.x - e.x);
      const seekAng = seekTargetAngle(e, tp.x, tp.y, room);
      e.facing = ang;
      // 应用速度倍率（冰冻效果）
      const speedFactor = e.speedMult || 1;
      if (e.isBoss) bossAI(e, dt, ang, seekAng, room, tp);
      else if (e.kind === "melee") {
        moveEnemy(e, Math.cos(seekAng) * e.speed * speedFactor * dt, Math.sin(seekAng) * e.speed * speedFactor * dt, room);
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
        }
      } else if (e.kind === "ranged") {
        const targetDist = 240;
        const curD = Math.hypot(tp.x - e.x, tp.y - e.y);
        let moveAng = seekAng;
        if (curD < targetDist - 50) moveAng = seekAng + Math.PI;
        else if (Math.abs(curD - targetDist) < 20) moveAng = seekAng + Math.PI / 2;
        moveEnemy(e, Math.cos(moveAng) * e.speed * speedFactor * dt, Math.sin(moveAng) * e.speed * speedFactor * dt, room);
        e.fireCd -= dt * 1000 * (e.fireRateMult || 1);
        if (e.fireCd <= 0) {
          e.fireCd = e.fireRate;
          const burst = e.burst || 1;
          for (let k = 0; k < burst; k++) setTimeout(() => {
            if (!state.level || !room.enemies.includes(e)) return;
            const ang2 = Math.atan2(tp.y - e.y, tp.x - e.x);
            spawnBullet({ x: e.x + Math.cos(ang2) * 18, y: e.y + Math.sin(ang2) * 18, vx: Math.cos(ang2) * e.bulletSpeed, vy: Math.sin(ang2) * e.bulletSpeed, size: 5, life: 2.5, max: 2.5, damage: e.bulletDmg, team: "enemy", color: e.color });
            playTone(320, 0.05, "sawtooth", 0.03);
          }, k * 110);
        }
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
        }
      }
    }
    for (let pi = room.drops.length - 1; pi >= 0; pi--) {
      const d = room.drops[pi];
      d.life -= dt; d.bob = (d.bob || 0) + dt * 4;
      if (d.life <= 0) { room.drops.splice(pi, 1); continue; }
      // 武器掉落不吸附，只在靠近时按E拾取
      if (d.kind !== "weapon") {
        // ---- 磁铁吸附：查找最近玩家 ----
        const MAGNET_RADIUS = 160;  // 磁铁吸附半径
        const PICKUP_RADIUS = 24;   // 自动拾取半径
        let nearestP = null;
        let nearestD2 = Infinity;
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          const dx = p.x - d.x;
          const dy = p.y - d.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < nearestD2) { nearestD2 = d2; nearestP = p; }
        }
        if (nearestP) {
          const dist = Math.sqrt(nearestD2);
          // 进入磁铁范围：朝玩家加速
          if (dist < MAGNET_RADIUS) {
            const speed = 220 + (MAGNET_RADIUS - dist) * 2.0;  // 越近越快
            const nx = (nearestP.x - d.x) / (dist || 1);
            const ny = (nearestP.y - d.y) / (dist || 1);
            if (d.vx == null) d.vx = 0;
            if (d.vy == null) d.vy = 0;
            // 平滑加速
            d.vx = d.vx * 0.78 + nx * speed * 0.22;
            d.vy = d.vy * 0.78 + ny * speed * 0.22;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
          } else {
            // 不在磁铁范围，减速/停止
            if (d.vx) d.vx *= 0.9;
            if (d.vy) d.vy *= 0.9;
          }
          // 自动拾取（进入非常近的范围）
          if (dist < PICKUP_RADIUS + nearestP.r) {
            if (d.kind === "coin") { nearestP.coins += d.amount; floatText(d.x, d.y, "+" + d.amount + "金", "#ffd166"); }
            else if (d.kind === "hp") { nearestP.hp = Math.min(nearestP.maxHp, nearestP.hp + d.amount); floatText(d.x, d.y, "+" + d.amount + " HP", "#06d6a0"); }
            else if (d.kind === "energy") { nearestP.energy = Math.min(nearestP.maxEnergy, nearestP.energy + d.amount); floatText(d.x, d.y, "+" + d.amount + " 能量", "#6ac2ff"); }
            sfx.pickup();
            room.drops.splice(pi, 1);
            continue;
          }
        }
      }
    }
    // 陷阱更新
    for (const t of room.traps || []) {
      t.timer -= dt * 1000;
      if (t.timer <= 0) {
        t.active = !t.active;
        t.timer = t.active ? t.activeTime : t.interval;
        if (t.active) {
          // 陷阱激活时产生粒子效果
          const count = t.type === "laser" ? 15 : 8;
          for (let i = 0; i < count; i++) {
            if (t.type === "laser") {
              const px = t.x + Math.cos(t.direction) * rand(0, 30);
              const py = t.y + Math.sin(t.direction) * rand(0, 30);
              spawnParticles(px, py, 3, t.color, 100, 0.3);
            } else {
              const px = t.x + rand(0, t.width);
              const py = t.y + rand(-5, t.height + 5);
              spawnParticles(px, py, 3, t.color, 100, 0.3);
            }
          }
        }
      }
      // 陷阱伤害玩家
      if (t.active) {
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          let hit = false;
          if (t.type === "laser") {
            // 激光发射器：检测玩家是否在激光射线上
            const laserEndX = t.x + Math.cos(t.direction) * t.laserLength;
            const laserEndY = t.y + Math.sin(t.direction) * t.laserLength;
            // 计算玩家到激光射线的距离
            const dx = laserEndX - t.x;
            const dy = laserEndY - t.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
              // 点到线段的距离
              const tParam = Math.max(0, Math.min(1, ((p.x - t.x) * dx + (p.y - t.y) * dy) / (len * len)));
              const closestX = t.x + tParam * dx;
              const closestY = t.y + tParam * dy;
              const distToLine = Math.hypot(p.x - closestX, p.y - closestY);
              hit = distToLine < 25;
            }
          } else if (t.type === "spike") {
            hit = p.x > t.x && p.x < t.x + t.width && p.y > t.y - 15 && p.y < t.y + t.height + 15;
          } else if (t.type === "flame") {
            hit = p.x > t.x && p.x < t.x + t.width && p.y > t.y - 50 && p.y < t.y + t.height + 10;
          }
          if (hit) {
            damagePlayer(t.damage, p);
            spawnParticles(p.x, p.y, 6, t.color, 150, 0.3);
          }
        }
      }
    }
    if (room.portal) {
      room.portal.spin += dt * 2;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const pa = particles[i];
      pa.x += pa.vx * dt; pa.y += pa.vy * dt;
      pa.vx *= 0.9; pa.vy *= 0.9;
      pa.life -= dt;
      if (pa.life <= 0) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y += f.vy * dt; f.vy *= 0.92; f.life -= dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
    if (room.cleared || room.type === "start" || room.type === "shop") {
      const dirs = ["N", "S", "E", "W"];
      for (const dirName of dirs) {
        if (room.doors[dirName] === undefined) continue;
        const rect = doorRect(room, dirName);
        // 检查任何存活玩家是否进入该门
        let entering = null;
        for (const pl of getAllPlayers()) {
          if (!pl || pl.hp <= 0) continue;
          if (pl.x - pl.r < rect.x + rect.w && pl.x + pl.r > rect.x && pl.y - pl.r < rect.y + rect.h && pl.y + pl.r > rect.y) {
            entering = pl;
            break;
          }
        }
        if (entering) {
          state.subIndex += 1;
          const now = Date.now();
          // 彩蛋：在同一房间1分钟内来回穿门20次，播放彩蛋音频
          // 比较"当前房间ID"和"上次进入的房间ID"，来回穿梭时会相等
          const prevRoomId = state.doorPassRoomId;
          const curRoomId = state.currentRoomId;
          const nextRoomId = room.doors[dirName];
          if (nextRoomId === prevRoomId) {
            // 来回穿同一扇门
            if (state.doorPassStartTime === 0) state.doorPassStartTime = now;
            if (now - state.doorPassStartTime <= 60000) {
              state.doorPassCount++;
              if (state.doorPassCount >= 20) {
                try {
                  const egg = new Audio("coloregg1.wav");
                  egg.volume = sfxVolume * masterVolume;
                  egg.play();
                } catch (e) {}
                state.doorPassCount = 0;
                state.doorPassStartTime = 0;
                state.doorPassRoomId = -1;
                toast("🎉 彩蛋触发！");
              }
            } else {
              state.doorPassCount = 1;
              state.doorPassStartTime = now;
            }
          } else {
            // 换了一扇门穿，重置计数
            state.doorPassCount = 1;
            state.doorPassStartTime = now;
          }
          // 记录当前房间ID（下次穿门时作为"上次房间"使用）
          state.doorPassRoomId = curRoomId;
          enterRoom(nextRoomId, { N: "S", S: "N", E: "W", W: "E" }[dirName]);
          return;
        }
      }
    }
  }

  function moveEnemy(e, dx, dy, room) {
    const origX = e.x, origY = e.y;
    const moveMag = Math.hypot(dx, dy);
    // ---- 轴方向移动，带滑动 ----
    // X 轴
    if (dx !== 0 && !hitsObstacleCircle(e.x + dx, e.y, e.r, room)) e.x += dx;
    else if (dx !== 0 && dy !== 0) {
      const slideY = sign(dy) * Math.min(Math.abs(dx) * 0.8, Math.abs(dy));
      if (!hitsObstacleCircle(e.x + dx, e.y + slideY, e.r, room)) { e.x += dx; e.y += slideY; }
      else if (!hitsObstacleCircle(e.x + dx * 0.7, e.y + sign(dy) * Math.abs(dx) * 0.5, e.r, room)) {
        e.x += dx * 0.7; e.y += sign(dy) * Math.abs(dx) * 0.5;
      }
    }
    // Y 轴
    if (dy !== 0 && !hitsObstacleCircle(e.x, e.y + dy, e.r, room)) e.y += dy;
    else if (dy !== 0 && dx !== 0) {
      const slideX = sign(dx) * Math.min(Math.abs(dy) * 0.8, Math.abs(dx));
      if (!hitsObstacleCircle(e.x + slideX, e.y + dy, e.r, room)) { e.x += slideX; e.y += dy; }
      else if (!hitsObstacleCircle(e.x + sign(dx) * Math.abs(dy) * 0.5, e.y + dy * 0.7, e.r, room)) {
        e.x += sign(dx) * Math.abs(dy) * 0.5; e.y += dy * 0.7;
      }
    }
    // ---- 卡住检测与补救：如果几乎没移动，尝试纯侧向移动（沿障碍物边缘滑）----
    const actualMoved = Math.hypot(e.x - origX, e.y - origY);
    if (actualMoved < moveMag * 0.15 && moveMag > 0.2) {
      // 尝试纯垂直方向（左右滑）
      const perpX = -dy / (moveMag || 1) * moveMag;
      const perpY = dx / (moveMag || 1) * moveMag;
      // 先试正向
      if (!hitsObstacleCircle(e.x + perpX, e.y + perpY, e.r, room)) {
        e.x += perpX * 0.8; e.y += perpY * 0.8;
      } else if (!hitsObstacleCircle(e.x - perpX, e.y - perpY, e.r, room)) {
        e.x -= perpX * 0.8; e.y -= perpY * 0.8;
      } else {
        // 再试只沿 X 或 Y 的单轴推
        const tryStep = Math.max(Math.abs(dx), Math.abs(dy)) * 1.5 || 2;
        if (Math.abs(dx) >= Math.abs(dy)) {
          // 主导方向是 X，试只沿 Y 走
          const sy = sign(dy) * tryStep || 2;
          if (!hitsObstacleCircle(e.x, e.y + sy, e.r, room)) e.y += sy;
          else if (!hitsObstacleCircle(e.x, e.y - sy, e.r, room)) e.y -= sy;
        } else {
          const sx = sign(dx) * tryStep || 2;
          if (!hitsObstacleCircle(e.x + sx, e.y, e.r, room)) e.x += sx;
          else if (!hitsObstacleCircle(e.x - sx, e.y, e.r, room)) e.x -= sx;
        }
      }
    }
    // 敌人之间避免重叠
    for (const other of room.enemies) {
      if (other === e) continue;
      const dd = Math.hypot(e.x - other.x, e.y - other.y);
      const min = e.r + other.r;
      if (dd < min && dd > 0.01) {
        const push = (min - dd) * 0.5;
        const ang = Math.atan2(e.y - other.y, e.x - other.x);
        const tx = e.x + Math.cos(ang) * push;
        const ty = e.y + Math.sin(ang) * push;
        if (!hitsObstacleCircle(tx, ty, e.r, room)) { e.x = tx; e.y = ty; }
      }
    }
    e.x = clamp(e.x, e.r + 8, ROOM_W - e.r - 8);
    e.y = clamp(e.y, e.r + 8, ROOM_H - e.r - 8);
  }

  function bossAI(e, dt, ang, seekAng, room, tp) {
    const p = tp || state.player;
    const fireRateFactor = e.fireRateMult || 1;
    e.fireCd -= dt * 1000 * fireRateFactor;
    e.specialCd = (e.specialCd || 4000) - dt * 1000 * fireRateFactor;
    // 愤怒状态：血量低于 50% 时触发，攻击频率大幅增加
    if (e.hp < e.maxHp * 0.5 && e.phase === 1) {
      e.phase = 2; toast("首领狂怒！"); shake(0.8, 12); spawnExplosionRing(e.x, e.y, e.color, 120);
      e.fireCd = 0; // 立即触发一次攻击
    }
    const type = e.type;
    // 愤怒状态下的攻击冷却倍率（0.55 = 冷却减少45%，攻击频率增加约82%）
    const fireRateMult = e.phase === 2 ? 0.55 : 1;
    if (type === "boss_spreader") {
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.8 : 0.6) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.8 : 0.6) * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        const total = e.phase === 2 ? 22 : 14;
        for (let i = 0; i < total; i++) {
          const a = (i / total) * Math.PI * 2 + state.elapsed * 0.5;
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 6, life: 2.8, max: 2.8, damage: e.bulletDmg, team: "enemy", color: "#ff5df2" });
        }
        for (let k = -1; k <= 1; k++) {
          const a = ang + k * 0.2;
          spawnBullet({ x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: Math.cos(a) * (e.bulletSpeed + 40), vy: Math.sin(a) * (e.bulletSpeed + 40), size: 7, life: 2.6, max: 2.6, damage: e.bulletDmg, team: "enemy", color: "#ffd166" });
        }
        playTone(180, 0.18, "sawtooth", 0.06);
      }
    } else if (type === "boss_summoner") {
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.9 : 0.7) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.9 : 0.7) * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        const summonCount = e.phase === 2 ? 4 : 2;
        for (let i = 0; i < summonCount; i++) {
          const ox = clamp(e.x + rand(-90, 90), 80, ROOM_W - 80);
          const oy = clamp(e.y + rand(-90, 90), 80, ROOM_H - 80);
          if (!hitsObstacleCircle(ox, oy, 14, room)) {
            const small = makeEnemy("shooter", state.levelIndex, ox, oy);
            small.hp = Math.round(small.hp * 0.6); small.maxHp = small.hp;
            room.enemies.push(small); spawnExplosionRing(ox, oy, "#6ac2ff", 24);
          }
        }
        const count = e.phase === 2 ? 9 : 5;
        for (let k = 0; k < count; k++) {
          const a = ang - 0.6 + (1.2 * k) / (count - 1);
          spawnBullet({ x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 6, life: 2.6, max: 2.6, damage: e.bulletDmg, team: "enemy", color: "#6ac2ff" });
        }
        playTone(260, 0.15, "triangle", 0.05);
      }
    } else if (type === "boss_charger") {
      e.chargeCd = (e.chargeCd || 1800) - dt * 1000;
      if (e.charging) {
        moveEnemy(e, Math.cos(e.chargeAng) * e.speed * (e.phase === 2 ? 3.0 : 2.4) * dt, Math.sin(e.chargeAng) * e.speed * (e.phase === 2 ? 3.0 : 2.4) * dt, room);
        e.chargeTime -= dt * 1000;
        if (e.chargeTime <= 0 || Math.abs(e.x - ROOM_W / 2) > ROOM_W / 2 - 40) { e.charging = false; e.chargeCd = e.phase === 2 ? 800 : 1800; shake(0.3, 7); }
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
        }
      } else {
        moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.7 : 0.5) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.7 : 0.5) * dt, room);
        if (e.chargeCd <= 0) { e.charging = true; e.chargeAng = ang; e.chargeTime = e.phase === 2 ? 600 : 800; }
        if (e.fireCd <= 0) {
          e.fireCd = e.fireRate * fireRateMult;
          const spreadCount = e.phase === 2 ? 7 : 5;
          for (let k = -Math.floor(spreadCount/2); k <= Math.floor(spreadCount/2); k++) {
            const a = ang + k * 0.18;
            spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 6, life: 2.4, max: 2.4, damage: e.bulletDmg, team: "enemy", color: "#ff7b54" });
          }
          playTone(160, 0.14, "sawtooth", 0.05);
        }
        for (const p of getAllPlayers()) {
          if (!p || p.hp <= 0) continue;
          if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
        }
      }
    } else if (type === "boss_laser") {
      // 激光Boss：发射高速直线激光弹，愤怒时发射多条
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.85 : 0.65) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.85 : 0.65) * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        const laserCount = e.phase === 2 ? 5 : 3;
        for (let k = 0; k < laserCount; k++) {
          const offsetAng = (k - Math.floor(laserCount / 2)) * 0.15;
          const a = ang + offsetAng;
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: e.phase === 2 ? 10 : 8, life: 1.8, max: 1.8, damage: e.bulletDmg, team: "enemy", color: "#ff2d55" });
        }
        playTone(400, 0.12, "sine", 0.08);
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    } else if (type === "boss_bomber") {
      // 爆炸Boss：发射爆炸弹，愤怒时爆炸范围更大
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.8 : 0.7) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.8 : 0.7) * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        const bombCount = e.phase === 2 ? 4 : 2;
        for (let k = 0; k < bombCount; k++) {
          const a = ang + (k - Math.floor(bombCount / 2)) * 0.3;
          const radius = e.phase === 2 ? 90 : 70;
          const dmg = e.phase === 2 ? 5 : 4;
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 12, life: 2.2, max: 2.2, damage: e.bulletDmg, team: "enemy", color: "#ff9500", explode: { radius: radius, damage: dmg } });
        }
        playTone(120, 0.18, "sawtooth", 0.06);
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    } else if (type === "boss_necromancer") {
      // 死灵Boss：召唤大量小怪，愤怒时召唤更强敌人
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.6 : 0.5) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.6 : 0.5) * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        const summonCount = e.phase === 2 ? 5 : 3;
        const enemyTypes = e.phase === 2 ? ["shooter", "tank", "runner"] : ["grunt", "shooter"];
        for (let i = 0; i < summonCount; i++) {
          const ox = clamp(e.x + rand(-120, 120), 60, ROOM_W - 60);
          const oy = clamp(e.y + rand(-120, 120), 60, ROOM_H - 60);
          if (!hitsObstacleCircle(ox, oy, 14, room)) {
            const etype = enemyTypes[randi(0, enemyTypes.length)];
            const small = makeEnemy(etype, state.levelIndex, ox, oy);
            small.hp = Math.round(small.hp * (e.phase === 2 ? 0.7 : 0.5));
            small.maxHp = small.hp;
            room.enemies.push(small);
            spawnExplosionRing(ox, oy, "#5856d6", 30);
          }
        }
        // 发射追踪弹
        const trackCount = e.phase === 2 ? 6 : 4;
        for (let k = 0; k < trackCount; k++) {
          const a = ang + (k - Math.floor(trackCount / 2)) * 0.25;
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 7, life: 3.0, max: 3.0, damage: e.bulletDmg, team: "enemy", color: "#5856d6" });
        }
        playTone(180, 0.16, "triangle", 0.05);
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    } else if (type === "boss_phaser") {
      // 穿梭Boss：随机瞬移并发射弹幕
      e.teleportCd = (e.teleportCd || 2000) - dt * 1000;
      if (e.teleportCd <= 0 && !e.teleporting) {
        e.teleporting = true;
        e.teleportTime = 300;
        spawnParticles(e.x, e.y, 20, "#af52de", 200, 0.4);
        playTone(600, 0.1, "sine", 0.04);
      }
      if (e.teleporting) {
        e.teleportTime -= dt * 1000;
        if (e.teleportTime <= 0) {
          // 瞬移到新位置
          const newX = clamp(rand(100, ROOM_W - 100), 60, ROOM_W - 60);
          const newY = clamp(rand(100, ROOM_H - 100), 60, ROOM_H - 60);
          if (!hitsObstacleCircle(newX, newY, e.r, room)) {
            spawnParticles(e.x, e.y, 15, "#af52de", 150, 0.3);
            e.x = newX;
            e.y = newY;
            spawnParticles(e.x, e.y, 15, "#af52de", 150, 0.3);
            // 瞬移后发射环形弹幕
            const ringCount = e.phase === 2 ? 16 : 12;
            for (let i = 0; i < ringCount; i++) {
              const a = (i / ringCount) * Math.PI * 2;
              spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 6, life: 2.4, max: 2.4, damage: e.bulletDmg, team: "enemy", color: "#af52de" });
            }
          }
          e.teleporting = false;
          e.teleportCd = e.phase === 2 ? 1500 : 2000;
        }
      } else {
        moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 1.0 : 0.9) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 1.0 : 0.9) * dt, room);
      }
      if (e.fireCd <= 0 && !e.teleporting) {
        e.fireCd = e.fireRate * fireRateMult;
        const burstCount = e.phase === 2 ? 8 : 5;
        for (let k = 0; k < burstCount; k++) {
          const a = ang + rand(-0.4, 0.4);
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 5, life: 2.0, max: 2.0, damage: e.bulletDmg, team: "enemy", color: "#af52de" });
        }
        playTone(350, 0.1, "square", 0.03);
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    } else if (type === "boss_shielder") {
      // 护盾Boss：前方有护盾阻挡子弹，愤怒时护盾更大
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.55 : 0.45) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.55 : 0.45) * dt, room);
      e.shieldAngle = ang;
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        const shotCount = e.phase === 2 ? 12 : 8;
        for (let i = 0; i < shotCount; i++) {
          const a = (i / shotCount) * Math.PI * 2 + state.elapsed;
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 6, life: 2.5, max: 2.5, damage: e.bulletDmg, team: "enemy", color: "#30d158" });
        }
        playTone(220, 0.12, "triangle", 0.04);
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    } else if (type === "boss_multishot") {
      // 多射Boss：多种弹幕模式轮换
      moveEnemy(e, Math.cos(seekAng) * e.speed * (e.phase === 2 ? 0.85 : 0.75) * dt, Math.sin(seekAng) * e.speed * (e.phase === 2 ? 0.85 : 0.75) * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate * fireRateMult;
        e.patternIndex = ((e.patternIndex || 0) + 1) % 4;
        const pattern = e.patternIndex;
        const mult = e.phase === 2 ? 1.5 : 1;
        if (pattern === 0) {
          // 模式1：扇形弹幕
          const count = Math.floor(7 * mult);
          for (let k = 0; k < count; k++) {
            const a = ang - 0.5 + (1.0 * k) / (count - 1);
            spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 5, life: 2.2, max: 2.2, damage: e.bulletDmg, team: "enemy", color: "#64d2ff" });
          }
        } else if (pattern === 1) {
          // 模式2：环形弹幕
          const count = Math.floor(12 * mult);
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed * 0.8, vy: Math.sin(a) * e.bulletSpeed * 0.8, size: 4, life: 2.8, max: 2.8, damage: e.bulletDmg, team: "enemy", color: "#64d2ff" });
          }
        } else if (pattern === 2) {
          // 模式3：追踪弹
          const count = Math.floor(4 * mult);
          for (let k = 0; k < count; k++) {
            const a = ang + rand(-0.3, 0.3);
            spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed * 1.2, vy: Math.sin(a) * e.bulletSpeed * 1.2, size: 7, life: 2.0, max: 2.0, damage: e.bulletDmg, team: "enemy", color: "#64d2ff" });
          }
        } else {
          // 模式4：螺旋弹幕
          const count = Math.floor(16 * mult);
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 4 + state.elapsed * 2;
            const r = 30 + i * 5;
            spawnBullet({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, vx: Math.cos(a) * e.bulletSpeed * 0.6, vy: Math.sin(a) * e.bulletSpeed * 0.6, size: 4, life: 2.5, max: 2.5, damage: e.bulletDmg, team: "enemy", color: "#64d2ff" });
          }
        }
        playTone(280, 0.12, "square", 0.04);
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    } else {
      // 默认Boss行为（未知类型）
      moveEnemy(e, Math.cos(seekAng) * e.speed * 0.5 * dt, Math.sin(seekAng) * e.speed * 0.5 * dt, room);
      if (e.fireCd <= 0) {
        e.fireCd = e.fireRate;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * e.bulletSpeed, vy: Math.sin(a) * e.bulletSpeed, size: 6, life: 2.6, max: 2.6, damage: e.bulletDmg, team: "enemy", color: "#ff5df2" });
        }
      }
      for (const p of getAllPlayers()) {
        if (!p || p.hp <= 0) continue;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) damagePlayer(e.touchDmg, p);
      }
    }
  }

  // ---------- HUD ----------
  function updateHUD() {
    const p = state.player;
    if (!p) return;
    const hpBar = document.getElementById("hp-bar");
    if (hpBar) {
      hpBar.style.width = (p.hp / p.maxHp * 100) + "%";
      hpBar.style.animation = p.hp / p.maxHp < 0.3 ? "pulseLow 0.7s ease-in-out infinite" : "";
    }
    const hpText = document.getElementById("hp-text");
    if (hpText) hpText.textContent = Math.max(0, p.hp) + " / " + p.maxHp;
    const energyBar = document.getElementById("energy-bar");
    if (energyBar) energyBar.style.width = (p.energy / p.maxEnergy * 100) + "%";
    const energyText = document.getElementById("energy-text");
    if (energyText) energyText.textContent = Math.floor(p.energy) + " / " + p.maxEnergy;
    const coinText = document.getElementById("coin-text");
    if (coinText) coinText.textContent = p.coins;
    const levelText = document.getElementById("level-text");
    if (levelText) {
      const visitedCount = state.level ? state.level.filter((r) => r.visited).length : 1;
      levelText.textContent = state.levelIndex + "-" + visitedCount;
    }
    const slotsEl = document.getElementById("weapon-slots");
    if (slotsEl) {
      slotsEl.innerHTML = "";
      for (let i = 0; i < 2; i++) {
        const slot = p.weapons[i];
        const div = document.createElement("div");
        div.className = "slot" + (i === p.curWeapon ? " active" : "");
        if (slot) {
          const w = getWeaponDef(slot);
          const stars = weaponStars(slot);
          const starsHtml = stars > 1 ? "<span class='w-stars'>" + "★".repeat(stars) + "</span>" : "";
          div.innerHTML = "<div><span class='w-key'>" + (i + 1) + "</span> <span class='w-name'>" + w.name + "</span> " + starsHtml + "</div><div class='w-info'>伤害 " + w.damage + " · 耗能 " + w.energyCost + "</div>";
        } else {
          div.innerHTML = "<div><span class='w-key'>" + (i + 1) + "</span> <span class='w-name' style='color:#5a6478'>空</span></div><div class='w-info' style='color:#5a6478'>—</div>";
        }
        slotsEl.appendChild(div);
      }
    }
    const dashChip = document.getElementById("dash-chip");
    if (dashChip) {
      if (p.dashCd > 0) dashChip.innerHTML = "冲刺 <b style='color:#8892b0'>" + (p.dashCd / 1000).toFixed(1) + "s</b>";
      else dashChip.innerHTML = "冲刺 <b>就绪</b>";
    }
    const bossBar = document.getElementById("boss-bar");
    if (bossBar) {
      if (state.currentBoss) {
        bossBar.classList.remove("hidden");
        const bf = document.getElementById("boss-fill");
        if (bf) bf.style.width = Math.max(0, (state.currentBoss.hp / state.currentBoss.maxHp) * 100) + "%";
      } else {
        bossBar.classList.add("hidden");
      }
    }
    updateBackpackButton();
  }

  function animateSlotSwap(idx) {
    const slot = document.querySelectorAll("#weapon-slots .slot")[idx];
    if (slot) {
      slot.classList.remove("just-swap");
      void slot.offsetWidth;
      slot.classList.add("just-swap");
    }
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById("floating-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1500);
  }

  // ---------- 难度提示（醒目大字） ----------
  let diffTipTimer = null;
  function showDifficultyTip(difficulty) {
    const el = document.getElementById("difficulty-tip");
    if (!el) return;
    if (difficulty === "easy") {
      el.textContent = "你好鸭，小菜鸡，咯咯哒~";
      el.style.color = "#06d6a0";
      el.style.textShadow = "0 0 20px rgba(6,214,160,0.8), 0 0 40px rgba(6,214,160,0.4)";
    } else {
      el.textContent = "哦吼吼，亲爱的勇士，欢迎来到地狱";
      el.style.color = "#ef476f";
      el.style.textShadow = "0 0 20px rgba(239,71,111,0.8), 0 0 40px rgba(239,71,111,0.4)";
    }
    el.classList.add("show");
    if (diffTipTimer) clearTimeout(diffTipTimer);
    diffTipTimer = setTimeout(() => el.classList.remove("show"), 3000);
  }

  // ---------- 背包 ----------
  // 战斗状态：当前房间未清场且存在敌人
  function isInCombat() {
    if (state.scene !== "play" || !state.level) return false;
    const room = state.level[state.currentRoomId];
    if (!room) return false;
    return !room.cleared && Array.isArray(room.enemies) && room.enemies.length > 0;
  }

  function updateBackpackButton() {
    const bpBtn = document.getElementById("backpack-btn");
    if (!bpBtn) return;
    if (state.scene !== "play") {
      bpBtn.classList.add("locked");
      bpBtn.disabled = true;
      return;
    }
    // 联机模式下，只有主机玩家可打开背包（简化：所有玩家都能打开）
    if (isInCombat()) {
      bpBtn.classList.add("locked");
      bpBtn.disabled = true;
    } else {
      bpBtn.classList.remove("locked");
      bpBtn.disabled = false;
    }
  }

  function renderBackpackUI() {
    const p = state.player;
    if (!p) return;
    const equippedEl = document.getElementById("bp-equipped");
    const slotsEl = document.getElementById("bp-slots");
    if (!equippedEl || !slotsEl) return;

    // 装备中（最多 2 格）
    equippedEl.innerHTML = "";
    for (let i = 0; i < 2; i++) {
      const slot = p.weapons[i];
      const div = document.createElement("div");
      div.className = "bp-equipped-slot" + (i === p.curWeapon ? " active" : "");
      if (slot) {
        const w = getWeaponDef(slot);
        const stars = weaponStars(slot);
        const starHtml = stars > 1 ? "<div class='bp-w-stars'>" + "★".repeat(stars) + "</div>" : "";
        div.innerHTML =
          "<div class='bp-w-name'>" + w.name + "</div>" +
          starHtml +
          "<div class='bp-w-info'>伤害 " + w.damage + "</div>" +
          "<div class='bp-action'>点击 存入背包</div>";
        (function (idx) {
          div.addEventListener("click", function () {
            if (isInCombat()) { toast("战斗中无法操作"); return; }
            if (p.weapons.length <= 1) { toast("至少保留一把武器"); return; }
            const emptyIdx = p.backpack.findIndex(function (x) { return x === null; });
            if (emptyIdx === -1) { toast("背包已满"); return; }
            const removed = p.weapons.splice(idx, 1)[0];
            p.backpack[emptyIdx] = removed;
            if (p.curWeapon >= p.weapons.length) p.curWeapon = 0;
            sfx.swap && sfx.swap();
            updateHUD();
            renderBackpackUI();
          });
        })(i);
      } else {
        div.innerHTML = "<div class='bp-w-name' style='color:#5a6478'>空</div>";
      }
      equippedEl.appendChild(div);
    }

    // 背包格子（3 个）—— 直接重建 DOM，不依赖动态列表
    slotsEl.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const item = p.backpack[i];
      const div = document.createElement("div");
      const isSelected = (state.selectedBackpackIdx === i);
      if (item) {
        const w = getWeaponDef(item);
        const stars = weaponStars(item);
        const starHtml = stars > 1 ? "<div class='bp-w-stars'>" + "★".repeat(stars) + "</div>" : "";
        div.className = "bp-slot filled" + (isSelected ? " selected" : "");
        div.innerHTML =
          "<div class='bp-w-name'>" + w.name + "</div>" +
          starHtml +
          "<div class='bp-w-info'>伤害 " + w.damage + "</div>" +
          "<div class='bp-action'>" + (isSelected ? "已选中 · Q丢弃" : "点击 装备 / 选中") + "</div>";
        (function (idx) {
          div.addEventListener("click", function () {
            if (isInCombat()) { toast("战斗中无法操作"); return; }
            // 点击已选中的格子 → 装备
            if (state.selectedBackpackIdx === idx) {
              if (p.weapons.length < 2) {
                p.weapons.push(p.backpack[idx]);
                p.backpack[idx] = null;
                p.curWeapon = p.weapons.length - 1;
              } else {
                const cur = p.weapons[p.curWeapon];
                p.weapons[p.curWeapon] = p.backpack[idx];
                p.backpack[idx] = cur;
              }
              state.selectedBackpackIdx = -1;
              sfx.swap && sfx.swap();
              updateHUD();
              renderBackpackUI();
            } else {
              // 选中该格子
              state.selectedBackpackIdx = idx;
              renderBackpackUI();
            }
          });
        })(i);
      } else {
        div.className = "bp-slot";
        div.innerHTML = "<div class='bp-empty'>空格 " + (i + 1) + "</div>";
      }
      slotsEl.appendChild(div);
    }
  }

  function openBackpack() {
    if (state.scene !== "play" || !state.player) return;
    if (isInCombat()) { toast("战斗中无法打开背包"); return; }
    const bpScreen = document.getElementById("backpack-screen");
    if (!bpScreen) return;
    // 自动选中第一个有武器的背包格子
    state.selectedBackpackIdx = -1;
    const p = state.player;
    if (p && p.backpack) {
      for (let i = 0; i < p.backpack.length; i++) {
        if (p.backpack[i]) { state.selectedBackpackIdx = i; break; }
      }
    }
    bpScreen.classList.remove("hidden");
    renderBackpackUI();
  }

  function closeBackpack() {
    const bpScreen = document.getElementById("backpack-screen");
    if (bpScreen) bpScreen.classList.add("hidden");
    state.selectedBackpackIdx = -1;
  }

  function toggleBackpack() {
    const bpScreen = document.getElementById("backpack-screen");
    if (bpScreen && !bpScreen.classList.contains("hidden")) {
      closeBackpack();
    } else {
      openBackpack();
    }
  }

  // ---------- 暂停 ----------
  function togglePause() {
    if (state.scene === "play") {
      state.scene = "paused";
      const s = document.getElementById("pause-screen");
      if (s) s.classList.remove("hidden");
    } else if (state.scene === "paused") {
      state.scene = "play";
      const s = document.getElementById("pause-screen");
      if (s) s.classList.add("hidden");
    }
  }

  function hideAllOverlays() {
    ["title-screen", "gameover-screen", "victory-screen", "pause-screen",
     "multiplayer-screen", "join-room-screen", "lobby-screen", "disconnected-screen",
     "backpack-screen"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
  }

  // ---------- 渲染 ----------
  function render() {
    ctx.clearRect(0, 0, W, H);
    // 震屏偏移
    let sx = 0, sy = 0;
    if (shakeTime > 0) {
      shakeTime -= 1 / 60;
      const s = shakeIntensity * (shakeTime > 0 ? 1 : 0);
      sx = (Math.random() - 0.5) * 2 * s;
      sy = (Math.random() - 0.5) * 2 * s;
      shakeIntensity *= 0.92;
    }
    ctx.save();
    ctx.translate(sx, sy);

    // 房间背景
    const room = state.level ? currentRoom() : null;
    if (room) {
      drawFloor(room);
      drawObstacles(room);
      drawTraps(room);
      drawDoors(room);
      if (room.type === "start") drawStartDeco(room);
      if (room.chest) drawChest(room);
      if (room.shopItems) drawShop(room);
      if (room.portal) drawPortal(room.portal);
      for (const d of room.drops) drawDrop(d);
      for (const e of room.enemies) drawEnemy(e);
      if (state.player) drawPlayer(state.player);
      // 绘制其他联机玩家
      for (const [rid, rp] of net.otherPlayers) {
        if (!rp || rp.hp <= 0) continue;
        drawRemotePlayer(rp);
      }
      for (const b of bullets) drawBullet(b);
      drawLightningBolts(); // 闪电链效果
      for (const pa of particles) drawParticle(pa);
      for (const f of floaters) drawFloater(f);
    }
    ctx.restore();

    // 小地图（不受震屏影响）
    drawMinimap();
  }

  function drawFloor(room) {
    // 深色背景
    ctx.fillStyle = room.type === "boss" ? "#231530" : (room.type === "treasure" ? "#15302a" : (room.type === "shop" ? "#302a15" : "#151a2a"));
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    // 格子瓷砖
    for (let y = 0; y < ROOM_ROWS; y++) {
      for (let x = 0; x < ROOM_COLS; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = room.type === "boss" ? "#2c1b3d" : (room.type === "treasure" ? "#1b3d35" : (room.type === "shop" ? "#3d351b" : "#1b2035"));
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    // 边框
    ctx.strokeStyle = "#3a4568";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, ROOM_W - 3, ROOM_H - 3);
    // 角落装饰
    ctx.fillStyle = "rgba(255,209,102,0.08)";
    ctx.beginPath(); ctx.arc(40, 40, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ROOM_W - 40, 40, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(40, ROOM_H - 40, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ROOM_W - 40, ROOM_H - 40, 12, 0, Math.PI * 2); ctx.fill();
  }

  function drawObstacles(room) {
    for (const o of room.obstacles) {
      ctx.fillStyle = "#3a4568";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#55609a";
      ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 4);
      ctx.strokeStyle = "#2a3550";
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
    }
  }

  function drawTraps(room) {
    for (const t of room.traps || []) {
      ctx.save();
      if (t.type === "spike") {
        // 尖刺陷阱
        const spikeCount = Math.floor(t.width / 10);
        const spikeW = t.width / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          const sx = t.x + i * spikeW;
          const sy = t.y;
          if (t.active) {
            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.moveTo(sx, sy + t.height);
            ctx.lineTo(sx + spikeW / 2, sy);
            ctx.lineTo(sx + spikeW, sy + t.height);
            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = "#5c4033";
            ctx.beginPath();
            ctx.moveTo(sx, sy + t.height);
            ctx.lineTo(sx + spikeW / 2, sy + t.height * 0.6);
            ctx.lineTo(sx + spikeW, sy + t.height);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (t.type === "flame") {
        // 火焰喷射器
        const baseY = t.y + t.height;
        ctx.fillStyle = t.active ? "#3d2817" : "#5c4033";
        ctx.fillRect(t.x, baseY - 6, t.width, 6);
        if (t.active) {
          ctx.fillStyle = "#ff4500";
          ctx.shadowColor = "#ff4500";
          ctx.shadowBlur = 15;
          for (let i = 0; i < 5; i++) {
            const fx = t.x + t.width / 2 + rand(-15, 15);
            const fy = baseY - rand(10, 25);
            ctx.beginPath();
            ctx.arc(fx, fy, rand(5, 10), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (t.type === "laser") {
        // 激光发射器
        ctx.translate(t.x, t.y);
        ctx.rotate(t.direction);
        // 发射器本体
        ctx.fillStyle = t.active ? "#5c3d5c" : "#3d2d3d";
        ctx.fillRect(-t.width / 2, -t.height / 2, t.width, t.height);
        ctx.strokeStyle = "#2a1a2a";
        ctx.lineWidth = 2;
        ctx.strokeRect(-t.width / 2, -t.height / 2, t.width, t.height);
        // 发射口
        ctx.fillStyle = t.active ? t.color : "#4a3a4a";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        // 激光射线
        if (t.active) {
          ctx.strokeStyle = t.color;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 15;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(t.laserLength, 0);
          ctx.stroke();
          // 激光光晕
          ctx.strokeStyle = `rgba(255, 0, 255, 0.3)`;
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(t.laserLength, 0);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawDoors(room) {
    const dirs = [
      { name: "N", x: ROOM_W / 2 - 35, y: 0, w: 70, h: 18 },
      { name: "S", x: ROOM_W / 2 - 35, y: ROOM_H - 18, w: 70, h: 18 },
      { name: "W", x: 0, y: ROOM_H / 2 - 35, w: 18, h: 70 },
      { name: "E", x: ROOM_W - 18, y: ROOM_H / 2 - 35, w: 18, h: 70 },
    ];
    for (const d of dirs) {
      if (room.doors[d.name] === undefined) continue;
      const open = room.cleared || room.type === "start";
      ctx.fillStyle = open ? "#ffd166" : "#ef476f";
      ctx.fillRect(d.x, d.y, d.w, d.h);
      if (open) {
        ctx.fillStyle = "rgba(255,209,102,0.35)";
        ctx.fillRect(d.x - 3, d.y - 3, d.w + 6, d.h + 6);
      }
      // 门框
      ctx.strokeStyle = "#2a3550";
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
    }
  }

  function drawStartDeco(room) {
    ctx.save();
    ctx.fillStyle = "rgba(255,209,102,0.1)";
    ctx.beginPath();
    ctx.arc(ROOM_W / 2, ROOM_H / 2, 80 + Math.sin(state.elapsed * 2) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 20px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("起点房间", ROOM_W / 2, ROOM_H / 2 - 30);
    ctx.font = "14px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#8892b0";
    ctx.fillText("清除敌人后通过发光房间门前进", ROOM_W / 2, ROOM_H / 2 - 8);
    ctx.fillText("WASD 移动 · 鼠标瞄准并点击射击 · 空格冲刺 · E 交互", ROOM_W / 2, ROOM_H / 2 + 14);
    ctx.restore();
  }

  function drawChest(room) {
    const c = room.chest;
    if (c.opened) {
      ctx.fillStyle = "#55609a";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#ffd166";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("已开启", c.x + c.w / 2, c.y + c.h / 2 + 4);
    } else {
      // 闪烁宝箱
      const pulse = (Math.sin(state.elapsed * 4) + 1) / 2;
      ctx.fillStyle = "#55609a";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, 6);
      ctx.fillRect(c.x + c.w / 2 - 3, c.y + c.h / 2 - 3, 6, 6);
      ctx.strokeStyle = "rgba(255,209,102," + (0.5 + pulse * 0.5) + ")";
      ctx.lineWidth = 2 + pulse * 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      const p = state.player;
      if (Math.hypot(p.x - (c.x + c.w / 2), p.y - (c.y + c.h / 2)) < 80) {
        ctx.fillStyle = "#ffd166";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("按 E 开启", c.x + c.w / 2, c.y - 10);
      }
    }
  }

  function drawShop(room) {
    for (const it of room.shopItems) {
      ctx.save();
      if (it.kind === "refresh") {
        // 刷新按钮
        const p = state.player;
        const cost = p ? Math.floor(p.coins * 0.2) : 0;
        const canAfford = p && p.coins >= 1;
        ctx.fillStyle = canAfford ? "#2a4a6a" : "#1a2a3a";
        roundRect(ctx, it.x, it.y, it.w, it.h, 6, true, false);
        ctx.strokeStyle = canAfford ? "#6ac2ff" : "#3a4568";
        ctx.lineWidth = 2;
        roundRect(ctx, it.x, it.y, it.w, it.h, 6, false, true);
        ctx.fillStyle = canAfford ? "#6ac2ff" : "#55609a";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("刷新", it.x + it.w / 2, it.y + it.h / 2 - 2);
        ctx.font = "9px sans-serif";
        ctx.fillText("-" + it.costPercent + "%", it.x + it.w / 2, it.y + it.h / 2 + 10);
        // 交互提示
        if (canAfford && p) {
          if (Math.hypot(p.x - (it.x + it.w / 2), p.y - (it.y + it.h / 2)) < 100) {
            ctx.fillStyle = "#6ac2ff";
            ctx.font = "11px sans-serif";
            ctx.fillText("按 E 刷新 (" + cost + "金币)", it.x + it.w / 2, it.y - 8);
          }
        }
        ctx.restore();
        continue;
      }
      if (it.bought) ctx.globalAlpha = 0.35;
      // 根据商品种类选择不同颜色的底色和边框
      let boxFill = "#2a3550";
      let boxStroke = "#ffd166";
      let iconColor = "#ffd166";
      if (it.kind === "hp") { boxFill = "rgba(239,71,111,0.18)"; boxStroke = "#ef476f"; iconColor = "#ef476f"; }
      else if (it.kind === "bounce") { boxFill = "rgba(6,214,160,0.18)"; boxStroke = "#06d6a0"; iconColor = "#06d6a0"; }
      else if (it.kind === "weapon") {
        const stars = it.weaponStars || 1;
        if (stars > 1) { boxFill = "rgba(255,93,242,0.18)"; boxStroke = "#ff5df2"; }
        else { boxFill = "rgba(255,209,102,0.18)"; boxStroke = "#ffd166"; }
      }
      // 圆角背景 + 内层边框
      ctx.fillStyle = boxFill;
      roundRect(ctx, it.x, it.y, it.w, it.h, 8, true, false);
      ctx.strokeStyle = boxStroke;
      ctx.lineWidth = 2;
      roundRect(ctx, it.x, it.y, it.w, it.h, 8, false, true);
      // 图标
      ctx.fillStyle = iconColor;
      ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      let icon = "?";
      if (it.kind === "weapon") icon = "⚔";
      else if (it.kind === "hp") icon = "♥";
      else if (it.kind === "bounce") icon = "⟲";
      ctx.fillText(icon, it.x + it.w / 2, it.y + it.h / 2 + 10);
      let nameY = it.y + it.h + 14;
      let descY = it.y + it.h + 28;
      let priceY = it.y + it.h + 44;
      ctx.textAlign = "center";
      if (it.kind === "weapon" && it.weapon) {
        const stars = it.weaponStars || 1;
        const w = getWeaponDef({ key: it.weapon, stars: stars });
        if (w) {
          ctx.fillStyle = stars > 1 ? "#ff5df2" : "#ffd166";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText(w.name + (stars > 1 ? " ★★" : ""), it.x + it.w / 2, nameY);
          ctx.fillStyle = "#8892b0";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText("伤害 " + w.damage + " · 耗能 " + w.energyCost, it.x + it.w / 2, descY);
        }
      } else if (it.kind === "hp") {
        ctx.fillStyle = "#ef476f";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("生命药剂", it.x + it.w / 2, nameY);
        ctx.fillStyle = "#8892b0";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("+ " + it.amount + " HP", it.x + it.w / 2, descY);
      } else if (it.kind === "bounce") {
        ctx.fillStyle = "#06d6a0";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("子弹弹射", it.x + it.w / 2, nameY);
        ctx.fillStyle = "#8892b0";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("子弹最多弹射2次", it.x + it.w / 2, descY);
      }
      // 价格 / 已拥有
      if (it.kind === "bounce" && it.bought && state.player && state.player.hasBounce) {
        ctx.fillStyle = "#06d6a0";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("已拥有", it.x + it.w / 2, priceY);
      } else {
        ctx.fillStyle = it.bought ? "#55609a" : "#ffd166";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(it.price + " 金币", it.x + it.w / 2, priceY);
      }
      // 交互提示
      if (!it.bought && state.player) {
        const p = state.player;
        if (Math.hypot(p.x - (it.x + it.w / 2), p.y - (it.y + it.h / 2)) < 100) {
          ctx.fillStyle = "#ffd166";
          ctx.font = "12px sans-serif";
          ctx.fillText("按 E 购买", it.x + it.w / 2, it.y - 8);
        }
      }
      ctx.restore();
    }
  }

  function drawPortal(portal) {
    const cx = portal.x + 30, cy = portal.y + 30;
    // 先绘制旋转部分
    ctx.save();
    ctx.translate(cx, cy);
    // 外圈
    for (let i = 0; i < 3; i++) {
      ctx.rotate(portal.spin * (i % 2 === 0 ? 1 : -1));
      ctx.strokeStyle = "rgba(106,194,255," + (0.5 - i * 0.15) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2;
        const r = 30 + i * 6 + (i === 2 ? Math.sin(state.elapsed * 3) * 4 : 0);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    // 中心发光
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    grad.addColorStop(0, "rgba(106,194,255,0.8)");
    grad.addColorStop(1, "rgba(106,194,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 按E进入提示（不旋转，使用绝对坐标）
    if (state.player) {
      const p = state.player;
      if (Math.hypot(p.x - cx, p.y - cy) < 100) {
        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("按 E 进入下一关", cx, cy - 55);
      }
    }
  }

  function drawDrop(d) {
    ctx.save();
    const bobY = Math.sin(d.bob) * 2;
    ctx.translate(d.x, d.y + bobY);
    // 阴影
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    if (d.kind === "coin") {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#b38b3a"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#fff3c7";
      ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("¥", 0, 3);
    } else if (d.kind === "hp") {
      ctx.fillStyle = "#ef476f";
      ctx.fillRect(-6, -4, 12, 8);
      ctx.fillRect(-4, -6, 8, 12);
      ctx.strokeStyle = "#7c1f32"; ctx.lineWidth = 1; ctx.strokeRect(-6, -4, 12, 8);
    } else if (d.kind === "energy") {
      ctx.fillStyle = "#6ac2ff";
      ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(3, -1); ctx.lineTo(-1, -1); ctx.lineTo(2, 7); ctx.lineTo(-3, 1); ctx.lineTo(1, 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#2a5a8a"; ctx.lineWidth = 1; ctx.stroke();
    } else if (d.kind === "weapon") {
      const stars = d.weaponStars || 1;
      ctx.fillStyle = stars > 1 ? "#ff5df2" : "#ff5df2";
      ctx.fillRect(-10, -4, 20, 8);
      ctx.fillStyle = stars > 1 ? "#ffd166" : "#ffd166";
      ctx.fillRect(-12, -2, 4, 4);
      ctx.strokeStyle = "#a044a0"; ctx.lineWidth = 1; ctx.strokeRect(-10, -4, 20, 8);
      if (stars > 1) {
        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("★".repeat(stars), 0, 2);
      }
      // 武器名称
      const wName = WEAPONS[d.weapon] ? WEAPONS[d.weapon].name : "武器";
      ctx.fillStyle = stars > 1 ? "#ffd166" : "#ff5df2";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(wName + (stars > 1 ? " " + "★".repeat(stars) : ""), 0, 18);
      // 按E拾取/合成提示
      if (state.player) {
        const p = state.player;
        if (Math.hypot(p.x - d.x, p.y - d.y) < 80) {
          // 检查是否可以合成（身上有两把相同星级的武器，且星级未达上限）
          let sameCount = 0;
          for (let i = 0; i < p.weapons.length; i++) {
            if (weaponKey(p.weapons[i]) === d.weapon && weaponStars(p.weapons[i]) === stars) sameCount++;
          }
          const canMerge = sameCount >= 2 && stars < 3;
          if (canMerge) {
            ctx.fillStyle = stars === 1 ? "#ff5df2" : "#ffd166";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText("按 E 合成 " + (stars === 1 ? "★★" : "★★★"), 0, -2);
          } else {
            // 检查背包是否有空格
            const bpEmpty = p.backpack ? p.backpack.some(b => b === null || b === undefined) : false;
            const equipFull = p.weapons.length >= 2;
            if (!equipFull || bpEmpty) {
              // 装备位未满 或 背包有空格 → 直接拾取
              ctx.fillStyle = "#ffd166";
              ctx.font = "bold 12px sans-serif";
              ctx.fillText("按 E 拾取", 0, -2);
            } else {
              // 装备位满且背包满 → 替换当前手持武器
              const oldSlot = p.weapons[p.curWeapon];
              const oldName = (getWeaponDef(oldSlot) || {}).name || "未知武器";
              ctx.fillStyle = "#ef476f";
              ctx.font = "10px sans-serif";
              ctx.fillText("替换: " + oldName, 0, -14);
              ctx.fillStyle = "#ffd166";
              ctx.font = "bold 12px sans-serif";
              ctx.fillText("按 E 拾取", 0, -2);
            }
          }
        }
      }
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    // 阴影
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, e.r * 0.7, e.r * 0.9, e.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    const flashWhite = e.hurtFlash > 0;
    if (e.isBoss) {
      const rotAng = e.facing || 0;
      // 身体主色
      const bodyColor = flashWhite ? "#fff" : e.color;
      // 光晕 / 核心
      ctx.save();
      ctx.rotate(rotAng);
      // 外层大身体
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      // 胸甲
      ctx.fillStyle = flashWhite ? "#fff" : "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.ellipse(6, 0, e.r * 0.7, e.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // 角
      ctx.fillStyle = flashWhite ? "#fff" : "#ffd166";
      ctx.beginPath(); ctx.moveTo(e.r * 0.7, -e.r * 0.5); ctx.lineTo(e.r + 12, -e.r * 0.35); ctx.lineTo(e.r * 0.7, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(e.r * 0.7, e.r * 0.5); ctx.lineTo(e.r + 12, e.r * 0.35); ctx.lineTo(e.r * 0.7, 0); ctx.closePath(); ctx.fill();
      // 顶部天线/刺
      ctx.fillStyle = flashWhite ? "#fff" : "#2a1a3a";
      ctx.beginPath(); ctx.moveTo(0, -e.r); ctx.lineTo(-5, -e.r - 8); ctx.lineTo(5, -e.r - 8); ctx.closePath(); ctx.fill();
      // 眼睛
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(e.r * 0.35, -e.r * 0.28, e.r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.r * 0.35, e.r * 0.28, e.r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff2040";
      ctx.beginPath(); ctx.arc(e.r * 0.42, -e.r * 0.28, e.r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.r * 0.42, e.r * 0.28, e.r * 0.1, 0, Math.PI * 2); ctx.fill();
      // phase2 光环
      if (e.phase === 2) {
        ctx.strokeStyle = "rgba(255,93,242,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, e.r + 6 + Math.sin(state.elapsed * 5) * 3, 0, Math.PI * 2); ctx.stroke();
      }
      // 护盾Boss的护盾渲染
      if (e.type === "boss_shielder" && e.shieldActive && e.shieldAngle != null) {
        const shieldR = e.r + (e.phase === 2 ? 35 : 25);
        const shieldWidth = e.phase === 2 ? 1.2 : 0.9;
        ctx.save();
        ctx.rotate(e.shieldAngle);
        ctx.strokeStyle = e.phase === 2 ? "rgba(48,209,88,0.8)" : "rgba(48,209,88,0.6)";
        ctx.lineWidth = e.phase === 2 ? 6 : 4;
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, -shieldWidth, shieldWidth);
        ctx.stroke();
        // 护盾光晕
        ctx.strokeStyle = e.phase === 2 ? "rgba(48,209,88,0.4)" : "rgba(48,209,88,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, shieldR + 5, -shieldWidth * 1.2, shieldWidth * 1.2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else {
      ctx.rotate(e.facing || 0);
      const bodyColor = flashWhite ? "#fff" : e.color;
      // 身体 + 阴影/纹理
      if (e.kind === "melee") {
        // 近战：带尖刺的菱形身体 + 两只爪子
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(e.r, 0);
        ctx.lineTo(0, -e.r * 0.85);
        ctx.lineTo(-e.r * 0.75, 0);
        ctx.lineTo(0, e.r * 0.85);
        ctx.closePath();
        ctx.fill();
        // 尖刺
        ctx.fillStyle = flashWhite ? "#fff" : "#4a2a2a";
        for (let s = 0; s < 6; s++) {
          const sa = (s / 6) * Math.PI * 2;
          const sx1 = Math.cos(sa) * (e.r * 0.6);
          const sy1 = Math.sin(sa) * (e.r * 0.6);
          const sx2 = Math.cos(sa) * (e.r * 1.15);
          const sy2 = Math.sin(sa) * (e.r * 1.15);
          const sx3 = Math.cos(sa + 0.3) * (e.r * 0.6);
          const sy3 = Math.sin(sa + 0.3) * (e.r * 0.6);
          ctx.beginPath();
          ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.lineTo(sx3, sy3);
          ctx.closePath(); ctx.fill();
        }
        // 爪子（前方）
        ctx.fillStyle = flashWhite ? "#fff" : "#ffd166";
        ctx.fillRect(e.r - 2, -e.r * 0.5 - 2, 10, 4);
        ctx.fillRect(e.r - 2, e.r * 0.5 - 2, 10, 4);
        // 眼睛
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(0, -e.r * 0.2, e.r * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, e.r * 0.2, e.r * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff2040";
        ctx.beginPath(); ctx.arc(e.r * 0.08, -e.r * 0.2, e.r * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.r * 0.08, e.r * 0.2, e.r * 0.1, 0, Math.PI * 2); ctx.fill();
      } else {
        // 远程：圆形身体 + 发射器 + 护盾
        ctx.fillStyle = bodyColor;
        ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
        // 护盾纹理（边缘高亮）
        ctx.strokeStyle = flashWhite ? "#fff" : "rgba(106,194,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, e.r * 0.92, 0, Math.PI * 2); ctx.stroke();
        // 武器发射器（前方）
        ctx.fillStyle = flashWhite ? "#fff" : "#2a3550";
        ctx.fillRect(e.r - 2, -4, 14, 8);
        ctx.fillStyle = flashWhite ? "#fff" : "#ff5df2";
        ctx.fillRect(e.r + 6, -2, 4, 4);
        // 眼睛（朝向玩家方向）
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(0, -e.r * 0.2, e.r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, e.r * 0.2, e.r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0f2040";
        ctx.beginPath(); ctx.arc(e.r * 0.05, -e.r * 0.2, e.r * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.r * 0.05, e.r * 0.2, e.r * 0.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.rotate(-(e.facing || 0));
    }
    // HP 条
    if (!e.isBoss && e.hp < e.maxHp) {
      const bw = e.r * 2.2, bh = 3;
      ctx.fillStyle = "#2a3550";
      ctx.fillRect(-bw / 2, -e.r - 10, bw, bh);
      ctx.fillStyle = "#ef476f";
      ctx.fillRect(-bw / 2, -e.r - 10, bw * (e.hp / e.maxHp), bh);
    }
    // 霰弹枪命中数量显示
    if (e.shotgunHits && e.shotgunHits > 1 && Date.now() - e.shotgunLastHit < 500) {
      const timePassed = Date.now() - e.shotgunLastHit;
      const alpha = 1 - (timePassed / 500);
      const offsetY = -e.r - 18 - (timePassed / 500) * 20;
      const scale = 1 + (timePassed / 500) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold " + (14 * scale) + "px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("x" + e.shotgunHits, 0, offsetY);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawPlayer(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // 阴影
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.ellipse(0, p.r * 0.6, p.r * 0.95, p.r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    const flashWhite = p.hurtFlash > 0;
    ctx.rotate(p.facing);
    // 身体主色
    const bodyColor = flashWhite ? "#fff" : "#6ac2ff";
    // 身体阴影（下半）
    ctx.fillStyle = flashWhite ? "#fff" : "#4a8ac2";
    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI, false); ctx.fill();
    // 身体主体（上半）
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    // 头盔顶甲
    ctx.fillStyle = flashWhite ? "#fff" : "#3a6a9a";
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.85, -Math.PI * 0.65, -Math.PI * 0.35);
    ctx.lineTo(Math.cos(-Math.PI * 0.35) * p.r * 0.7, Math.sin(-Math.PI * 0.35) * p.r * 0.7);
    ctx.lineTo(Math.cos(-Math.PI * 0.5) * p.r * 0.5, Math.sin(-Math.PI * 0.5) * p.r * 0.5);
    ctx.lineTo(Math.cos(-Math.PI * 0.65) * p.r * 0.7, Math.sin(-Math.PI * 0.65) * p.r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.85, Math.PI * 0.35, Math.PI * 0.65);
    ctx.lineTo(Math.cos(Math.PI * 0.65) * p.r * 0.7, Math.sin(Math.PI * 0.65) * p.r * 0.7);
    ctx.lineTo(Math.cos(Math.PI * 0.5) * p.r * 0.5, Math.sin(Math.PI * 0.5) * p.r * 0.5);
    ctx.lineTo(Math.cos(Math.PI * 0.35) * p.r * 0.7, Math.sin(Math.PI * 0.35) * p.r * 0.7);
    ctx.closePath();
    ctx.fill();
    // 肩甲
    ctx.fillStyle = flashWhite ? "#fff" : "#2a5a8a";
    ctx.beginPath(); ctx.arc(-p.r * 0.1, -p.r * 0.7, p.r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-p.r * 0.1, p.r * 0.7, p.r * 0.35, 0, Math.PI * 2); ctx.fill();
    // 胸甲高光
    ctx.fillStyle = flashWhite ? "#fff" : "rgba(255,255,255,0.2)";
    ctx.beginPath(); ctx.ellipse(2, 0, p.r * 0.5, p.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    // 武器 / 枪管
    const curWeapon = getWeaponDef(p.weapons[p.curWeapon]);
    const isMelee = !!(curWeapon && curWeapon.melee);
    if (isMelee) {
      // 近战武器：剑刃
      ctx.fillStyle = curWeapon.color;
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      const bladeLen = 20;
      const bladeW = 6;
      // 剑柄
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(p.r - 2, -4, 6, 8);
      // 剑刃
      ctx.fillStyle = curWeapon.color;
      ctx.beginPath();
      ctx.moveTo(p.r + 4, -bladeW / 2);
      ctx.lineTo(p.r + 4 + bladeLen, 0);
      ctx.lineTo(p.r + 4, bladeW / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(p.r - 2, -4, 14, 8);
      ctx.strokeStyle = "#7c5e1c"; ctx.lineWidth = 1; ctx.strokeRect(p.r - 2, -4, 14, 8);
      // 枪管纹理
      ctx.fillStyle = "#c29a3a";
      ctx.fillRect(p.r + 1, -4, 1, 8);
      ctx.fillRect(p.r + 6, -4, 1, 8);
    }
    // 枪口闪光
    if (p.muzzle > 0) {
      ctx.fillStyle = "rgba(255,240,150," + Math.min(p.muzzle * 50, 1) + ")";
      ctx.beginPath(); ctx.arc(p.r + 14, 0, 6 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255," + Math.min(p.muzzle * 60, 1) + ")";
      ctx.beginPath(); ctx.arc(p.r + 14, 0, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.rotate(-p.facing);
    // 无敌闪烁环
    if (p.invuln > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 2 + Math.sin(state.elapsed * 20) * 1, 0, Math.PI * 2); ctx.stroke();
    }
    // 冲刺尾迹/光环
    if (p.dashTime > 0) {
      ctx.strokeStyle = "rgba(106,194,255,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 5 + Math.sin(state.elapsed * 30) * 2, 0, Math.PI * 2); ctx.stroke();
    }
    // 蓄力进度条
    if (p.isCharging && p.chargeStartTime) {
      const weapon = getWeaponDef(p.weapons[p.curWeapon]);
      if (weapon && weapon.charge) {
        const chargeTime = Date.now() - p.chargeStartTime;
        const chargeRatio = Math.min(1, chargeTime / weapon.charge.maxTime);
        const isMelee = !!weapon.melee;
        const barWidth = 50;
        const barHeight = 6;
        const barY = -p.r - 15;
        // 进度条背景
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        // 进度条填充
        const fullColor = isMelee ? weapon.color : "#ff5df2";
        const baseColor = isMelee ? weapon.color : "#c0c0c0";
        const fillColor = chargeRatio >= 1 ? fullColor : baseColor;
        ctx.fillStyle = fillColor;
        ctx.fillRect(-barWidth / 2, barY, barWidth * chargeRatio, barHeight);
        // 进度条边框
        ctx.strokeStyle = chargeRatio >= 1 ? fullColor : "#888";
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
        // 蓄力满时发光效果
        if (chargeRatio >= 1) {
          ctx.shadowColor = fullColor;
          ctx.shadowBlur = 12;
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }
      }
    }
    // 眼睛（在旋转坐标系之外画，因为眼睛要始终朝向玩家方向——实际我们随朝向旋转）
    ctx.save();
    ctx.rotate(p.facing);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(p.r * 0.3, -p.r * 0.25, p.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.r * 0.3, p.r * 0.25, p.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f2040";
    ctx.beginPath(); ctx.arc(p.r * 0.4, -p.r * 0.25, p.r * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.r * 0.4, p.r * 0.25, p.r * 0.11, 0, Math.PI * 2); ctx.fill();
    // 眼睛高光
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(p.r * 0.44, -p.r * 0.28, p.r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.r * 0.44, p.r * 0.22, p.r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 挥砍扇形（在全局坐标空间绘制，基于挥砍角度和风格）
    if (p.meleeSwing && p.meleeSwing.time > 0) {
      const s = p.meleeSwing;
      const isHeavy = !!s.heavy;
      const progress = 1 - s.time / s.maxTime;
      const style = s.style || "swing";
      ctx.save();
      // 突刺风格：发射线效果
      if (style === "thrust") {
        const thrustLen = s.range * (0.3 + progress * 0.7);
        const grad = ctx.createLinearGradient(0, 0, Math.cos(s.angle) * thrustLen, Math.sin(s.angle) * thrustLen);
        grad.addColorStop(0, s.color + (isHeavy ? "ff" : "dd"));
        grad.addColorStop(1, s.color + "00");
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHeavy ? 18 : 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(s.angle) * thrustLen, Math.sin(s.angle) * thrustLen);
        ctx.stroke();
        // 尖端光点
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(Math.cos(s.angle) * thrustLen, Math.sin(s.angle) * thrustLen, isHeavy ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // 横扫风格：扇形攻击
      else if (style === "swing" || style === "cleave") {
        const startA = s.angle - s.arc / 2;
        const endA = startA + s.arc * Math.max(0.2, progress);
        const gradR = s.range;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, gradR);
        grad.addColorStop(0, s.color + (isHeavy ? "ee" : "cc"));
        grad.addColorStop(0.5, s.color + (isHeavy ? "88" : "66"));
        grad.addColorStop(1, s.color + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, gradR, startA, endA);
        ctx.closePath();
        ctx.fill();
        // 剑刃弧线
        ctx.strokeStyle = s.color;
        ctx.lineWidth = isHeavy ? 5 : 3;
        ctx.beginPath();
        ctx.arc(0, 0, gradR * 0.92, startA, endA);
        ctx.stroke();
        // 剑气轨迹
        if (s.trail && isHeavy) {
          ctx.strokeStyle = s.color + "66";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, gradR * 0.7, startA, endA);
          ctx.stroke();
        }
        // 重击冲击环
        if (isHeavy && progress < 0.7) {
          ctx.strokeStyle = s.color + "88";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, gradR * (0.5 + progress * 0.5), startA, endA);
          ctx.stroke();
        }
      }
      // 旋转风格：360度光环
      else if (style === "spin") {
        const gradR = s.range;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, gradR);
        const alphaHex = Math.floor(255 * progress).toString(16).padStart(2, "0");
        grad.addColorStop(0, s.color + alphaHex);
        grad.addColorStop(0.6, s.color + Math.floor(128 * progress).toString(16).padStart(2, "0"));
        grad.addColorStop(1, s.color + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, gradR, 0, Math.PI * 2);
        ctx.fill();
        // 旋转光芒
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + progress * Math.PI * 4;
          const rayLen = gradR * 0.8;
          ctx.strokeStyle = s.color + Math.floor(180 * progress).toString(16).padStart(2, "0");
          ctx.lineWidth = isHeavy ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * rayLen, Math.sin(ang) * rayLen);
          ctx.stroke();
        }
      }
      // 冰刺风格：锥形光芒
      else if (style === "iceSpike") {
        const startA = s.angle - s.arc / 2;
        const endA = s.angle + s.arc / 2;
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, s.range);
        grad.addColorStop(0, "#ffffff" + "ff");
        grad.addColorStop(0.3, s.color + "dd");
        grad.addColorStop(1, s.color + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, s.range, startA, endA);
        ctx.closePath();
        ctx.fill();
        // 冰晶边缘
        ctx.strokeStyle = "#66e0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(startA) * s.range * 0.9, Math.sin(startA) * s.range * 0.9);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(endA) * s.range * 0.9, Math.sin(endA) * s.range * 0.9);
        ctx.stroke();
      }
      ctx.restore();
    }
    // 房间护盾光环（进入房间的第一秒）
    if (p.roomShield && p.roomShield > 0) {
      const pulse = Math.sin(state.elapsed * 15) * 0.15 + 0.85;
      const alpha = Math.min(1, p.roomShield);
      ctx.shadowColor = "#5deaff";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "rgba(93,234,255," + (0.7 * alpha) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 6 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // 内层光点
      ctx.fillStyle = "rgba(93,234,255," + (0.25 * alpha) + ")";
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 绘制联机中的其他玩家
  function drawRemotePlayer(rp) {
    ctx.save();
    ctx.translate(rp.x, rp.y);
    const flashWhite = (rp.hurtFlash || 0) > 0;
    // 阴影
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.ellipse(0, rp.r * 0.6, rp.r * 0.95, rp.r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(rp.facing || 0);
    // 身体主色
    const baseColor = rp.color || "#ff6b9d";
    const darkColor = shadeColor(baseColor, -30);
    const bodyColor = flashWhite ? "#fff" : baseColor;
    // 身体阴影（下半）
    ctx.fillStyle = flashWhite ? "#fff" : darkColor;
    ctx.beginPath(); ctx.arc(0, 0, rp.r, 0, Math.PI, false); ctx.fill();
    // 身体主体（上半）
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.arc(0, 0, rp.r, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    // 头部装饰（王冠样式）
    ctx.fillStyle = flashWhite ? "#fff" : darkColor;
    ctx.beginPath();
    ctx.moveTo(-rp.r * 0.5, -rp.r * 0.85);
    ctx.lineTo(-rp.r * 0.3, -rp.r * 1.1);
    ctx.lineTo(-rp.r * 0.1, -rp.r * 0.85);
    ctx.lineTo(rp.r * 0.1, -rp.r * 1.1);
    ctx.lineTo(rp.r * 0.3, -rp.r * 0.85);
    ctx.lineTo(rp.r * 0.5, -rp.r * 1.1);
    ctx.lineTo(rp.r * 0.5, -rp.r * 0.85);
    ctx.closePath();
    ctx.fill();
    // 肩甲
    ctx.fillStyle = flashWhite ? "#fff" : darkColor;
    ctx.beginPath(); ctx.arc(-rp.r * 0.1, -rp.r * 0.7, rp.r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-rp.r * 0.1, rp.r * 0.7, rp.r * 0.35, 0, Math.PI * 2); ctx.fill();
    // 胸甲高光
    ctx.fillStyle = flashWhite ? "#fff" : "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.ellipse(2, 0, rp.r * 0.5, rp.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    // 武器 / 枪管（判断是否是近战武器）
    const rWeaponKey = weaponKey((rp.weapons && rp.weapons[rp.curWeapon]) ? rp.weapons[rp.curWeapon] : null);
    const rWeaponDef = rWeaponKey ? WEAPONS[rWeaponKey] : null;
    const isRangedMelee = rWeaponDef && rWeaponDef.melee;
    if (isRangedMelee) {
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(rp.r - 2, -4, 6, 8);
      ctx.fillStyle = rWeaponDef.color || "#d9d9d9";
      ctx.beginPath();
      ctx.moveTo(rp.r + 4, -6);
      ctx.lineTo(rp.r + 14, 0);
      ctx.lineTo(rp.r + 4, 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(rp.r - 2, -4, 14, 8);
      ctx.strokeStyle = "#7c5e1c"; ctx.lineWidth = 1; ctx.strokeRect(rp.r - 2, -4, 14, 8);
      // 枪管纹理
      ctx.fillStyle = "#c29a3a";
      ctx.fillRect(rp.r + 1, -4, 1, 8);
      ctx.fillRect(rp.r + 6, -4, 1, 8);
    }
    // 枪口闪光
    if ((rp.muzzle || 0) > 0) {
      ctx.fillStyle = "rgba(255,240,150," + Math.min((rp.muzzle || 0) * 50, 1) + ")";
      ctx.beginPath(); ctx.arc(rp.r + 14, 0, 6 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255," + Math.min((rp.muzzle || 0) * 60, 1) + ")";
      ctx.beginPath(); ctx.arc(rp.r + 14, 0, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.rotate(-(rp.facing || 0));
    // 近战攻击动画（根据风格渲染）
    if (rp.meleeSwing && rp.meleeSwing.time > 0) {
      const ms = rp.meleeSwing;
      const progress = 1 - ms.time / (ms.maxTime || 0.22);
      const rng = ms.range || 80;
      const arcAngle = ms.arc || 1.0;
      const swingColor = ms.color || "#d9d9d9";
      const style = ms.style || "swing";
      ctx.save();
      // 突刺风格
      if (style === "thrust") {
        const thrustLen = rng * (0.3 + progress * 0.7);
        const grad = ctx.createLinearGradient(0, 0, Math.cos(ms.angle) * thrustLen, Math.sin(ms.angle) * thrustLen);
        grad.addColorStop(0, swingColor + "dd");
        grad.addColorStop(1, swingColor + "00");
        ctx.strokeStyle = grad;
        ctx.lineWidth = ms.heavy ? 16 : 10;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ms.angle) * thrustLen, Math.sin(ms.angle) * thrustLen);
        ctx.stroke();
      }
      // 横扫/下劈风格
      else if (style === "swing" || style === "cleave") {
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, rng);
        grad.addColorStop(0, swingColor + "99");
        grad.addColorStop(0.5, swingColor + "55");
        grad.addColorStop(1, swingColor + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rng, ms.angle - arcAngle / 2, ms.angle - arcAngle / 2 + arcAngle * Math.max(0.2, progress));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = swingColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, rng * 0.9, ms.angle - arcAngle / 2, ms.angle - arcAngle / 2 + arcAngle * Math.max(0.2, progress));
        ctx.stroke();
      }
      // 旋转风格
      else if (style === "spin") {
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, rng);
        const alpha = Math.floor(180 * progress).toString(16).padStart(2, "0");
        grad.addColorStop(0, swingColor + alpha);
        grad.addColorStop(0.6, swingColor + Math.floor(100 * progress).toString(16).padStart(2, "0"));
        grad.addColorStop(1, swingColor + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, rng, 0, Math.PI * 2);
        ctx.fill();
      }
      // 冰刺风格
      else if (style === "iceSpike") {
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, rng);
        grad.addColorStop(0, "#ffffffdd");
        grad.addColorStop(0.3, swingColor + "cc");
        grad.addColorStop(1, swingColor + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rng, ms.angle - arcAngle / 2, ms.angle + arcAngle / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // 玩家名字（带背景）
    if (rp.name) {
      ctx.font = "bold 12px sans-serif";
      const textWidth = ctx.measureText(rp.name).width;
      const nameBg = rp.r * 2 + 10;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(-nameBg / 2, -rp.r - 28, nameBg, 16);
      ctx.fillStyle = baseColor;
      ctx.textAlign = "center";
      ctx.fillText(rp.name, 0, -rp.r - 16);
    }
    // 血条
    if (rp.hp != null && rp.maxHp) {
      const bw = rp.r * 2.2;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(-bw / 2, -rp.r - 12, bw, 5);
      const hpRatio = rp.hp / rp.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? "#06d6a0" : hpRatio > 0.25 ? "#ffd166" : "#ff6b6b";
      ctx.fillRect(-bw / 2, -rp.r - 12, bw * hpRatio, 5);
    }
    // 无敌闪烁环
    if ((rp.invuln || 0) > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, rp.r + 2 + Math.sin(state.elapsed * 20) * 1, 0, Math.PI * 2); ctx.stroke();
    }
    // 颜色光晕效果
    ctx.strokeStyle = baseColor + "80";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, rp.r + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // 颜色加深/变亮辅助函数
  function shadeColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  function drawBullet(b) {
    ctx.save();
    // 淡入淡出 alpha（网络同步带来的视觉过渡）
    let alpha = 1;
    if (b._fadeIn && b._fadeIn > 0) alpha = Math.max(0.1, 1 - b._fadeIn * 4);
    else if (b._fadeOut != null && b._fadeOut > 0) alpha = Math.max(0, b._fadeOut * 5);

    // 激光束特效（基于 bulletSize 动态缩放，确保星级增长时视觉效果同步增强）
    if (b.laser) {
      const sx = (b.startX != null) ? b.startX : b.x - b.vx * 0.05;
      const sy = (b.startY != null) ? b.startY : b.y - b.vy * 0.05;
      // 以 b.size 为基准（默认 6）计算缩放比例，使星级增长时激光束变粗
      const sz = (b.size != null && b.size > 0) ? b.size : 6;
      const laserScale = sz / 6;
      // 构建路径点：枪口 → 各弹射点 → 当前位置
      const pts = [{ x: sx, y: sy }];
      if (b.bouncePoints && b.bouncePoints.length > 0) {
        for (const bp of b.bouncePoints) pts.push({ x: bp.x, y: bp.y });
      }
      pts.push({ x: b.x, y: b.y });
      const drawSegments = (lw, color, shadowBlur, a) => {
        ctx.globalAlpha = a;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.shadowBlur = shadowBlur;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      };
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = b.color;
      // 外层辉光线（粗）
      drawSegments(8 * laserScale, b.color, 22 * laserScale, alpha * 0.6);
      // 中层线
      drawSegments(4 * laserScale, b.color, 12 * laserScale, alpha * 0.85);
      // 内核白线（最亮）
      drawSegments(1.5 * laserScale, "#ffffff", 6 * laserScale, alpha);
      // 终点亮点
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4 * laserScale, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 20 * laserScale;
      ctx.fill();
      // 弹射点亮点
      if (b.bouncePoints && b.bouncePoints.length > 0) {
        for (const bp of b.bouncePoints) {
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, 3 * laserScale, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.shadowBlur = 16 * laserScale;
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    // 导弹/榴弹特殊渲染（homing + explode）
    if (b.homing && b.explode) {
      const ang = Math.atan2(b.vy, b.vx);
      // 火焰尾迹（椭圆渐变，向后延伸）
      for (let i = 0; i < 6; i++) {
        const fLen = b.size * (2.2 - i * 0.3);
        const fW = b.size * (1.2 - i * 0.15);
        const fx = b.x - Math.cos(ang) * (b.size + i * 3);
        const fy = b.y - Math.sin(ang) * (b.size + i * 3);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(ang);
        ctx.globalAlpha = alpha * (0.55 - i * 0.08);
        ctx.fillStyle = i < 2 ? "#fff2b3" : i < 4 ? "#ff9500" : "#ff4500";
        ctx.shadowColor = "#ff6b35";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(0, 0, fLen, fW, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // 弹体主圆柱（沿飞行方向）
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.size * 1.4, b.size * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      // 弹头高光（尖锐前端）
      ctx.fillStyle = "#ffd1a8";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(b.size * 0.5, 0, b.size * 0.5, b.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // 弹尾深色环
      ctx.fillStyle = "rgba(60,30,10,0.85)";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(-b.size * 0.7, 0, b.size * 0.25, b.size * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
      return;
    }

    // 拖尾
    if (b.trail && b.trail.length > 1) {
      for (let i = 0; i < b.trail.length - 1; i++) {
        const t = b.trail[i];
        ctx.fillStyle = "rgba(" + (b.color === "#ffd166" ? "255,209,102" : b.color === "#6ac2ff" ? "106,194,255" : "255,93,242") + "," + (i / b.trail.length) * 0.4 * alpha + ")";
        ctx.beginPath(); ctx.arc(t.x, t.y, b.size * 0.7, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
    // 追踪子弹光晕
    if (b.homing) {
      ctx.shadowBlur = 20;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size + 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // 闪电链渲染
  function drawLightningBolts() {
    for (let i = lightningBolts.length - 1; i >= 0; i--) {
      const lb = lightningBolts[i];
      const alpha = lb.life / 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
      ctx.lineWidth = 3 * alpha;
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      // 画折线代替直线
      const steps = 4;
      const dx = lb.x2 - lb.x1, dy = lb.y2 - lb.y1;
      ctx.moveTo(lb.x1, lb.y1);
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        const px = lb.x1 + dx * t + rand(-15, 15);
        const py = lb.y1 + dy * t + rand(-15, 15);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(lb.x2, lb.y2);
      ctx.stroke();
      ctx.restore();
      lb.life -= 1 / 60;
      if (lb.life <= 0) lightningBolts.splice(i, 1);
    }
  }

  function drawParticle(pa) {
    ctx.save();
    const alpha = clamp(pa.life / Math.max(0.01, pa.max || 1), 0, 1);
    ctx.globalAlpha = alpha;
    if (pa.ring) {
      // 爆炸环
      ctx.strokeStyle = pa.color;
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath();
      const radius = pa.ringR + (1 - alpha) * (pa.ringMax - pa.ringR);
      ctx.arc(pa.x, pa.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pa.color;
      if (pa.shape === "rect") {
        ctx.translate(pa.x, pa.y);
        ctx.fillRect(-pa.size / 2, -pa.size / 2, pa.size, pa.size);
      } else {
        ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawFloater(f) {
    ctx.save();
    ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
    ctx.fillStyle = f.color;
    ctx.font = (f.big ? "bold 18px " : "bold 13px ") + "PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }

  function drawMinimap() {
    if (!state.level) return;
    const mm = document.getElementById("minimap");
    if (!mm || !mm.getContext) return;
    const mctx = mm.getContext("2d");
    const mw = mm.width, mh = mm.height;
    // 背景
    mctx.clearRect(0, 0, mw, mh);
    const bgGrad = mctx.createLinearGradient(0, 0, 0, mh);
    bgGrad.addColorStop(0, "rgba(20,28,48,0.55)");
    bgGrad.addColorStop(1, "rgba(10,14,26,0.55)");
    mctx.fillStyle = bgGrad;
    roundRect(mctx, 2, 2, mw - 4, mh - 4, 8, true, false);
    mctx.strokeStyle = "rgba(88,110,160,0.6)";
    mctx.lineWidth = 1.5;
    roundRect(mctx, 2, 2, mw - 4, mh - 4, 8, false, true);

    const cellW = 40, cellH = 34;

    // 构建 room.id -> room 的索引
    const byId = {};
    for (const room of state.level) byId[room.id] = room;

    // 计算需要渲染的房间集合：
    //   - fullyShown：已访问/当前房间/当前房间相邻 boss
    //   - hinted：未访问但与任意已访问房间相邻的房间（用雾化轮廓展示）
    const visitedIds = new Set();
    for (const room of state.level) if (room.visited || room.id === state.currentRoomId) visitedIds.add(room.id);

    const curRoom = state.level[state.currentRoomId];
    const adjacentBossIds = new Set();
    if (curRoom) {
      for (const dirName of ["N", "S", "E", "W"]) {
        const adjId = curRoom.doors[dirName];
        if (adjId !== undefined && state.level[adjId] && state.level[adjId].type === "boss") {
          adjacentBossIds.add(adjId);
        }
      }
    }

    const fullyShownIds = new Set();
    for (const id of visitedIds) fullyShownIds.add(id);
    for (const id of adjacentBossIds) fullyShownIds.add(id);

    const hintedIds = new Set();
    for (const room of state.level) {
      if (!visitedIds.has(room.id) && !adjacentBossIds.has(room.id)) {
        for (const dirName of ["N", "S", "E", "W"]) {
          const adjId = room.doors[dirName];
          if (adjId !== undefined && visitedIds.has(adjId)) {
            hintedIds.add(room.id);
            break;
          }
        }
      }
    }

    // 计算地图边界：以所有将显示的房间为准（fullyShown + hinted）
    let minGx = Infinity, maxGx = -Infinity, minGy = Infinity, maxGy = -Infinity;
    for (const id of fullyShownIds) {
      const r = byId[id];
      if (r) {
        if (r.gx < minGx) minGx = r.gx;
        if (r.gx > maxGx) maxGx = r.gx;
        if (r.gy < minGy) minGy = r.gy;
        if (r.gy > maxGy) maxGy = r.gy;
      }
    }
    for (const id of hintedIds) {
      const r = byId[id];
      if (r) {
        if (r.gx < minGx) minGx = r.gx;
        if (r.gx > maxGx) maxGx = r.gx;
        if (r.gy < minGy) minGy = r.gy;
        if (r.gy > maxGy) maxGy = r.gy;
      }
    }
    if (minGx === Infinity) { minGx = 0; maxGx = 2; minGy = 0; maxGy = 2; }

    const mapW = (maxGx - minGx + 1) * cellW;
    const mapH = (maxGy - minGy + 1) * cellH;
    const ox = (mw - mapW) / 2 - minGx * cellW;
    const oy = (mh - mapH) / 2 - minGy * cellH;

    const roomCenter = (room) => ({
      cx: ox + room.gx * cellW + cellW / 2,
      cy: oy + room.gy * cellH + cellH / 2
    });

    // 先画线：包括已访问房间之间的实线，以及已访问房间到 hinted 房间的虚线
    mctx.lineCap = "round";

    // 1) 已访问房间之间的连线
    const drawnLines = new Set();
    for (const room of state.level) {
      if (!fullyShownIds.has(room.id)) continue;
      const rc = roomCenter(room);
      for (const dirName of ["N", "S", "E", "W"]) {
        const adjId = room.doors[dirName];
        if (adjId === undefined) continue;
        if (!byId[adjId]) continue;
        if (!fullyShownIds.has(adjId)) continue;
        const pairKey = room.id < adjId ? room.id + "_" + adjId : adjId + "_" + room.id;
        if (drawnLines.has(pairKey)) continue;
        drawnLines.add(pairKey);
        const ac = roomCenter(byId[adjId]);
        const isActive = room.id === state.currentRoomId || adjId === state.currentRoomId;
        mctx.lineWidth = 2.5;
        mctx.strokeStyle = isActive ? "#8fa5d6" : "#55609a";
        mctx.beginPath();
        mctx.moveTo(rc.cx, rc.cy);
        mctx.lineTo(ac.cx, ac.cy);
        mctx.stroke();
      }
    }

    // 2) 已访问房间到 hinted 房间的虚线（表示"那边有房间"）
    for (const room of state.level) {
      if (!hintedIds.has(room.id)) continue;
      const rc = roomCenter(room);
      for (const dirName of ["N", "S", "E", "W"]) {
        const adjId = room.doors[dirName];
        if (adjId === undefined) continue;
        if (!visitedIds.has(adjId)) continue;
        if (!byId[adjId]) continue;
        const ac = roomCenter(byId[adjId]);
        mctx.lineWidth = 2;
        mctx.strokeStyle = "rgba(110,125,160,0.55)";
        mctx.setLineDash([3, 4]);
        mctx.beginPath();
        mctx.moveTo(rc.cx, rc.cy);
        mctx.lineTo(ac.cx, ac.cy);
        mctx.stroke();
        mctx.setLineDash([]);
      }
    }

    // 再画 hinted 房间（雾化的轮廓），先于实色房间绘制
    for (const room of state.level) {
      if (!hintedIds.has(room.id)) continue;
      const rx = ox + room.gx * cellW + 5;
      const ry = oy + room.gy * cellH + 5;
      const rw = cellW - 10;
      const rh = cellH - 10;
      // 很淡的外轮廓（虚线矩形）
      mctx.strokeStyle = "rgba(100,115,150,0.55)";
      mctx.lineWidth = 1;
      mctx.setLineDash([2, 3]);
      mctx.strokeRect(rx, ry, rw, rh);
      mctx.setLineDash([]);
      // 中心用 "?" 表示未知
      mctx.fillStyle = "rgba(150,165,200,0.6)";
      mctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      mctx.fillText("?", rx + rw / 2, ry + rh / 2);
    }

    // 最后画实色房间
    const now = performance.now();
    for (const room of state.level) {
      const isAdjacentBoss = adjacentBossIds.has(room.id);
      const isShown = fullyShownIds.has(room.id);
      if (!isShown) continue;
      const rx = ox + room.gx * cellW + 3;
      const ry = oy + room.gy * cellH + 3;
      const rw = cellW - 6;
      const rh = cellH - 6;
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;

      if (room.id === state.currentRoomId) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 300);
        mctx.fillStyle = `rgba(255,209,102,${0.25 + 0.15 * pulse})`;
        roundRect(mctx, rx - 2, ry - 2, rw + 4, rh + 4, 5, true, false);
        mctx.fillStyle = "#ffd166";
      } else if (isAdjacentBoss && !room.visited) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 250);
        mctx.fillStyle = `rgba(255,93,242,${0.2 + 0.2 * pulse})`;
        roundRect(mctx, rx - 2, ry - 2, rw + 4, rh + 4, 5, true, false);
        mctx.fillStyle = "#ff5df2";
      } else if (room.cleared) {
        mctx.fillStyle = "#4a5a8a";
      } else {
        mctx.fillStyle = "#2a3550";
      }
      roundRect(mctx, rx, ry, rw, rh, 4, true, false);

      // 房间类型图标
      if (room.type === "boss") {
        mctx.fillStyle = room.id === state.currentRoomId || isAdjacentBoss ? "#ffffff" : "#ff5df2";
        drawDiamond(mctx, cx, cy, 6);
        mctx.fillStyle = "#ff3366";
        drawDiamond(mctx, cx, cy, 3);
      } else if (room.type === "treasure") {
        mctx.fillStyle = "#06d6a0";
        mctx.beginPath();
        mctx.arc(cx, cy, 6, 0, Math.PI * 2);
        mctx.fill();
        mctx.fillStyle = "#ffffff";
        mctx.beginPath();
        mctx.arc(cx - 1, cy - 1, 1.5, 0, Math.PI * 2);
        mctx.fill();
      } else if (room.type === "shop") {
        mctx.fillStyle = "#ef476f";
        mctx.beginPath();
        mctx.arc(cx, cy, 6, 0, Math.PI * 2);
        mctx.fill();
        mctx.fillStyle = "#ffd166";
        mctx.fillRect(cx - 3, cy - 0.5, 6, 1);
        mctx.fillRect(cx - 0.5, cy - 3, 1, 6);
      } else if (room.type === "start") {
        mctx.strokeStyle = "#8fa5d6";
        mctx.lineWidth = 2;
        mctx.strokeRect(cx - 5, cy - 5, 10, 10);
      }
    }
  }

  // 小地图辅助：圆角矩形
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // 小地图辅助：菱形
  function drawDiamond(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
  }

  // ---------- 主循环 ----------
  function loop(now) {
    const dt = Math.min(0.05, (now - state.timeLast) / 1000 || 0);
    state.timeLast = now;
    if (state.scene === "play") update(dt);
    if (state.scene === "play" || state.scene === "paused" || state.scene === "gameover" || state.scene === "victory") render();
    if (state.scene === "play") updateHUD();
    requestAnimationFrame(loop);
  }

  // ---------- 启动 ----------
  function initUI() {
    // 标题屏幕显示
    const title = document.getElementById("title-screen");
    if (title) title.classList.remove("hidden");
    // 继续游戏按钮：有存档时显示可用
    const btnContinue = document.getElementById("continue-btn");
    if (btnContinue) {
      if (hasSave()) {
        btnContinue.classList.remove("hidden");
      } else {
        btnContinue.classList.add("hidden");
      }
      btnContinue.addEventListener("click", function () {
        if (loadGame()) {
          hideAllOverlays();
          startBgm();
          toast("已恢复进度");
        } else {
          toast("无法读取存档");
          btnContinue.classList.add("hidden");
        }
      });
    }
    // 开始按钮（简单 / 地狱）
    const btnEasy = document.getElementById("start-easy-btn");
    if (btnEasy) {
      btnEasy.addEventListener("click", function () {
        try {
          state.levelIndex = 1; state.subIndex = 1; state.difficulty = "easy"; startNewRun("easy");
          showDifficultyTip("easy");
        } catch (e) { console.error("startNewRun failed:", e); }
      });
    }
    const btnHell = document.getElementById("start-hell-btn");
    if (btnHell) {
      btnHell.addEventListener("click", function () {
        try {
          state.levelIndex = 1; state.subIndex = 1; state.difficulty = "hell"; startNewRun("hell");
          showDifficultyTip("hell");
        } catch (e) { console.error("startNewRun failed:", e); }
      });
    }
    const btnResume = document.getElementById("resume-btn");
    if (btnResume) btnResume.addEventListener("click", togglePause);
    const btnQuit = document.getElementById("quit-btn");
    if (btnQuit) {
      btnQuit.addEventListener("click", function () {
        stopBgm();
        state.scene = "title";
        hideAllOverlays();
        const ts = document.getElementById("title-screen");
        if (ts) ts.classList.remove("hidden");
      });
    }
    const btnRetryOver = document.getElementById("restart-btn");
    if (btnRetryOver) {
      btnRetryOver.addEventListener("click", function () {
        hideAllOverlays();
        const title = document.getElementById("title-screen");
        if (title) title.classList.remove("hidden");
        state.scene = "title";
      });
    }
    // 复活按钮
    const btnRevive = document.getElementById("revive-btn");
    if (btnRevive) {
      btnRevive.addEventListener("click", function () {
        respawnPlayer();
      });
    }
    const btnRetryVictory = document.getElementById("victory-btn");
    if (btnRetryVictory) {
      btnRetryVictory.addEventListener("click", function () {
        hideAllOverlays();
        const title = document.getElementById("title-screen");
        if (title) title.classList.remove("hidden");
        state.scene = "title";
      });
    }
    // --- 联机通用：显示网络状态 ---
    function updateNetStatus(text) {
      const netStatus = document.getElementById("net-status");
      if (!netStatus) return;
      if (text === null || text === undefined || text === "") {
        netStatus.classList.add("hidden");
      } else {
        netStatus.classList.remove("hidden");
        const info = document.getElementById("net-info");
        if (info) info.textContent = text;
      }
    }

    // --- 打开联机菜单 ---
    const btnMulti = document.getElementById("multiplayer-btn");
    if (btnMulti) {
      btnMulti.addEventListener("click", function () {
        hideAllOverlays();
        const mp = document.getElementById("multiplayer-screen");
        if (mp) mp.classList.remove("hidden");
      });
    }

    const mpBtnBack = document.getElementById("mp-back-btn");
    if (mpBtnBack) {
      mpBtnBack.addEventListener("click", function () {
        try {
          console.log("[返回按钮] 点击返回主菜单");
          updateNetStatus("");
          hideAllOverlays();
          const title = document.getElementById("title-screen");
          if (title) {
            title.classList.remove("hidden");
            console.log("[返回按钮] 已显示主菜单");
          } else {
            console.error("[返回按钮] 找不到 title-screen");
          }
        } catch (e) {
          console.error("[返回按钮] 执行失败:", e);
        }
      });
    }
    // --- 创建房间 ---
    const btnCreate = document.getElementById("mp-create-btn");
    if (btnCreate) {
      btnCreate.addEventListener("click", function () {
        const nameEl = document.getElementById("mp-name");
        const pname = (nameEl && nameEl.value.trim()) || "房主";
        btnCreate.disabled = true;
        const oldText = btnCreate.textContent;
        btnCreate.textContent = "连接中...";
        netConnect(
          function onOpen() {
            net.mode = "host";
            net.playerName = pname;
            btnCreate.disabled = false;
            btnCreate.textContent = oldText;
            netSend({ type: "create_room", playerName: pname });
            updateNetStatus("房主模式");
          },
          function onError(msg) {
            btnCreate.disabled = false;
            btnCreate.textContent = oldText;
            toast("连接服务器失败，请运行 server.js 启动后重试");
            updateNetStatus("");
          }
        );
        // 超时保护（3秒后还没连上就算失败）
        setTimeout(function () {
          if (!net.connected) {
            btnCreate.disabled = false;
            btnCreate.textContent = oldText;
            if (!net.mode || net.mode === "single") {
              toast("连接超时，请确认服务器是否在端口 8000 运行");
              updateNetStatus("");
            }
          }
        }, 3000);
      });
    }
    // --- 打开加入房间界面 ---
    const btnJoin = document.getElementById("mp-join-btn");
    if (btnJoin) {
      btnJoin.addEventListener("click", function () {
        hideAllOverlays();
        const join = document.getElementById("join-room-screen");
        if (join) join.classList.remove("hidden");
        const codeInput = document.getElementById("join-code");
        if (codeInput) codeInput.focus();
      });
    }
    // --- 确认加入房间 ---
    const btnJoinConfirm = document.getElementById("join-confirm-btn");
    if (btnJoinConfirm) {
      btnJoinConfirm.addEventListener("click", function () {
        const codeInput = document.getElementById("join-code");
        const nameInput = document.getElementById("mp-name");
        const code = codeInput ? codeInput.value.trim() : "";
        const pname = (nameInput && nameInput.value.trim()) || "玩家";
        if (code.length < 1) {
          toast("请输入房间码");
          return;
        }
        btnJoinConfirm.disabled = true;
        const oldText = btnJoinConfirm.textContent;
        btnJoinConfirm.textContent = "连接中...";
        netConnect(
          function onOpen() {
            net.mode = "client";
            net.playerName = pname;
            btnJoinConfirm.disabled = false;
            btnJoinConfirm.textContent = oldText;
            netSend({ type: "join_room", roomCode: code, playerName: pname });
            updateNetStatus("客户端模式");
          },
          function onError(msg) {
            btnJoinConfirm.disabled = false;
            btnJoinConfirm.textContent = oldText;
            toast("连接失败，请确认服务器是否运行");
            updateNetStatus("");
          }
        );
        setTimeout(function () {
          if (!net.connected) {
            btnJoinConfirm.disabled = false;
            btnJoinConfirm.textContent = oldText;
            toast("连接超时，请确认服务器是否在端口 8000 运行");
            updateNetStatus("");
          }
        }, 3000);
      });
    }
    const btnJoinBack = document.getElementById("join-back-btn");
    if (btnJoinBack) {
      btnJoinBack.addEventListener("click", function () {
        updateNetStatus("");
        hideAllOverlays();
        const mp = document.getElementById("multiplayer-screen");
        if (mp) mp.classList.remove("hidden");
      });
    }
    // --- 大厅：开始游戏 ---
    const btnLobbyStart = document.getElementById("lobby-start-btn");
    if (btnLobbyStart) {
      btnLobbyStart.addEventListener("click", function () {
        try {
          console.log("[大厅] 开始游戏，难度=", state.difficulty);
          if (net.mode === "host") {
            netSend({ type: "start_game" });
          }
          hideAllOverlays();
          state.levelIndex = 1;
          state.subIndex = 1;
          startNewRun(state.difficulty);
        } catch (e) {
          console.error("[大厅] 开始游戏失败:", e);
          toast("开始游戏失败: " + e.message);
        }
      });
    }
    // --- 大厅：离开房间 ---
    const btnLobbyLeave = document.getElementById("lobby-leave-btn");
    if (btnLobbyLeave) {
      btnLobbyLeave.addEventListener("click", function () {
        try {
          console.log("[大厅] 点击离开房间");
          if (net.ws && net.ws.readyState === 1) {
            netSend({ type: "leave_room" });
          }
          netClose();
          updateNetStatus("");
          hideAllOverlays();
          const title = document.getElementById("title-screen");
          if (title) title.classList.remove("hidden");
        } catch (e) {
          console.error("[大厅] 离开房间失败:", e);
          // 即使出错，也确保能回到主菜单
          netClose();
          hideAllOverlays();
          const title = document.getElementById("title-screen");
          if (title) title.classList.remove("hidden");
        }
      });
    }
    // --- 断线界面 ---
    const btnDisconnected = document.getElementById("disconnected-ok-btn");
    if (btnDisconnected) {
      btnDisconnected.addEventListener("click", function () {
        netClose();
        updateNetStatus("");
        hideAllOverlays();
        const title = document.getElementById("title-screen");
        if (title) title.classList.remove("hidden");
      });
    }
  }

  // 将界面按钮的处理函数挂到全局作用域，作为 HTML onclick 的后备
  if (typeof window !== "undefined") {
    window.goBackToTitle = function () {
      try {
        console.log("[goBackToTitle] 返回主菜单");
        updateNetStatus("");
        hideAllOverlays();
        const title = document.getElementById("title-screen");
        if (title) {
          title.classList.remove("hidden");
          console.log("[goBackToTitle] 已显示主菜单");
        } else {
          console.error("[goBackToTitle] 找不到 title-screen");
        }
      } catch (e) {
        console.error("[goBackToTitle] 执行失败:", e);
      }
    };
    window.lobbyStart = function () {
      try {
        console.log("[lobbyStart] 开始游戏", "mode=", net.mode, "connected=", net.connected);
        if (net.mode === "host") {
          netSend({ type: "start_game" });
        }
        hideAllOverlays();
        state.levelIndex = 1;
        state.subIndex = 1;
        startNewRun();
      } catch (e) {
        console.error("[lobbyStart] 执行失败:", e);
        toast("开始游戏失败: " + e.message);
      }
    };
    window.lobbyLeave = function () {
      try {
        console.log("[lobbyLeave] 离开房间");
        if (net.ws && net.ws.readyState === 1) {
          netSend({ type: "leave_room" });
        }
        netClose();
        hideAllOverlays();
        const title = document.getElementById("title-screen");
        if (title) title.classList.remove("hidden");
      } catch (e) {
        console.error("[lobbyLeave] 执行失败:", e);
        netClose();
        hideAllOverlays();
        const title = document.getElementById("title-screen");
        if (title) title.classList.remove("hidden");
      }
    };
    // --- 背包按钮 ---
    const bpBtn = document.getElementById("backpack-btn");
    if (bpBtn) {
      bpBtn.addEventListener("click", function () {
        toggleBackpack();
      });
    }
    const bpClose = document.getElementById("bp-close-btn");
    if (bpClose) {
      bpClose.addEventListener("click", function () {
        closeBackpack();
      });
    }
  }
  state.timeLast = performance.now();
  initUI();
  // 读取音量设置：默认 0.5；同时更新 UI 滑条
  try {
    const sv = localStorage.getItem("bgm_volume");
    if (sv != null && sv !== "") {
      const n = parseFloat(sv);
      if (!isNaN(n)) bgm.volume = Math.max(0, Math.min(1, n));
    }
  } catch (e) {}
  // 读取音效音量设置：默认 1.0
  try {
    const sv2 = localStorage.getItem("sfx_volume");
    if (sv2 != null && sv2 !== "") {
      const n2 = parseFloat(sv2);
      if (!isNaN(n2)) sfxVolume = Math.max(0, Math.min(1, n2));
    }
  } catch (e) {}
  // 读取总音量设置：默认 1.0
  try {
    const sv3 = localStorage.getItem("master_volume");
    if (sv3 != null && sv3 !== "") {
      const n3 = parseFloat(sv3);
      if (!isNaN(n3)) masterVolume = Math.max(0, Math.min(1, n3));
    }
  } catch (e) {}
  // 总音量滑条
  const masterSlider = document.getElementById("master-volume");
  if (masterSlider) {
    const applyMasterSlider = function () {
      const val = parseInt(masterSlider.value, 10);
      if (isNaN(val)) return;
      setMasterVolume(val / 100);
    };
    masterSlider.addEventListener("input", applyMasterSlider);
    masterSlider.addEventListener("change", applyMasterSlider);
  }
  // 音量滑条：拖动时实时调节音量，并持久化
  const volSlider = document.getElementById("music-volume");
  if (volSlider) {
    const applySlider = function () {
      const val = parseInt(volSlider.value, 10);
      if (isNaN(val)) return;
      setBgmVolume(val / 100);
    };
    volSlider.addEventListener("input", applySlider);
    volSlider.addEventListener("change", applySlider);
  }
  // 音效滑条
  const sfxSlider = document.getElementById("sfx-volume");
  if (sfxSlider) {
    const applySfxSlider = function () {
      const val = parseInt(sfxSlider.value, 10);
      if (isNaN(val)) return;
      setSfxVolume(val / 100);
    };
    sfxSlider.addEventListener("input", applySfxSlider);
    sfxSlider.addEventListener("change", applySfxSlider);
  }
  // UI 初始化：把三个滑条拉到当前值
  // 先 setMasterVolume（会同步 bgm audio 音量），再 setBgmVolume（只用它更新 bgm.volume 和 UI），最后 setSfxVolume
  setMasterVolume(masterVolume);
  setBgmVolume(bgm.volume);
  setSfxVolume(sfxVolume);
  console.log("[init] 游戏初始化完成");
  requestAnimationFrame(loop);
// })();
