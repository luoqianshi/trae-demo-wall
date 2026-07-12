/* ============================================================
   归位 App - 本地数据层 (store.js)
   - 5 层嵌套：House → Floor → Room → Container(自引用) → Item
   - 多态 Code 表：(ownerType, ownerId) 关联任一实体
   - Photo 表：v1.0 占位
   - 软删除：deletedAt 字段
   - XOR 不变量：item.containerId 与 item.roomId 必须有且仅有一个非空
   - 级联软删除：删上层时递归软删后代
   - Code payload 格式：guiwei://code/<uuid>
   存储：localStorage（同步、简单、容量足够）
   ============================================================ */
(function () {
  'use strict';

  // ── 存储键 ──
  var STORAGE_KEY = 'guiwei_db_v1';

  // ── 数据库结构 ──
  function emptyDb() {
    return {
      houses: [],      // {id, code, name, address?, createdAt, updatedAt, deletedAt?}
      floors: [],      // {id, code, houseId, level, name, createdAt, updatedAt, deletedAt?}
      rooms: [],       // {id, code, floorId, name, createdAt, updatedAt, deletedAt?}
      containers: [],  // {id, code, roomId, parentContainerId?, name, type?, createdAt, updatedAt, deletedAt?}
      items: [],       // {id, code, name, tags:[], note?, photoPath?, containerId?, roomId?, lastViewedAt?, createdAt, updatedAt, deletedAt?}
      codes: [],       // {id, ownerType, ownerId, format, payload, label?, createdAt}  无 deletedAt
      photos: [],      // {id, itemId, filePath, width?, height?, bytes?, createdAt, deletedAt?}
      meta: { version: 1, seededAt: null }
    };
  }

  // ── 内部加载/保存 ──
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyDb();
      var parsed = JSON.parse(raw);
      // 兼容性：补全缺失的表
      var base = emptyDb();
      Object.keys(base).forEach(function (k) {
        if (parsed[k] === undefined) parsed[k] = base[k];
      });
      return parsed;
    } catch (e) {
      console.error('[store] load failed, resetting:', e);
      return emptyDb();
    }
  }

  function save(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('[store] save failed:', e);
      throw e;
    }
  }

  // ── UUID v4 生成 ──
  function newId() {
    // 简化版 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ── 时间戳工具 ──
  function nowIso() { return new Date().toISOString(); }

  // ── CodeOwnerType 枚举 ──
  var OWNER_TYPES = ['house', 'floor', 'room', 'container', 'item'];
  function isValidOwnerType(t) { return OWNER_TYPES.indexOf(t) > -1; }

  // ── wireName（与 Flutter 一致） ──
  // payload 格式：guiwei://code/<ownerCode>
  function buildPayload(ownerCode) {
    return 'guiwei://code/' + ownerCode;
  }

  // 从 payload 或裸 UUID 提取 code
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var PAYLOAD_RE = /^guiwei:\/\/code\/(.+)$/i;
  function extractCode(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (!s) return null;
    if (UUID_RE.test(s)) return s;
    var m = s.match(PAYLOAD_RE);
    if (m) return m[1];
    return s; // 当作裸 code
  }

  // ── XOR 校验 ──
  function validateXor(containerId, roomId) {
    var hasC = containerId != null && containerId !== '';
    var hasR = roomId != null && roomId !== '';
    if (hasC === hasR) {
      throw new Error('ItemLocationInvalid: 必须且仅有一个 containerId 或 roomId');
    }
  }

  // ── 通用：过滤未删除 ──
  function active(list) { return list.filter(function (x) { return !x.deletedAt; }); }

  // ── 通用：按 id 查 ──
  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // ============================================================
  // House 仓库
  // ============================================================
  function listHouses() {
    var db = load();
    return active(db.houses).slice().sort(function (a, b) {
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }

  function getHouse(id) {
    var db = load();
    var h = findById(db.houses, id);
    return h && !h.deletedAt ? deepCopy(h) : null;
  }

  function findHouseByCode(code) {
    var db = load();
    for (var i = 0; i < db.houses.length; i++) {
      if (db.houses[i].code === code && !db.houses[i].deletedAt) return deepCopy(db.houses[i]);
    }
    return null;
  }

  function upsertHouse(house) {
    var db = load();
    var idx = -1;
    for (var i = 0; i < db.houses.length; i++) {
      if (db.houses[i].id === house.id) { idx = i; break; }
    }
    if (idx === -1) {
      // 新建：缺字段补全
      var now = nowIso();
      var newHouse = {
        id: house.id || newId(),
        code: house.code || newId(),
        name: house.name,
        address: house.address || null,
        createdAt: house.createdAt || now,
        updatedAt: house.updatedAt || now,
        deletedAt: null
      };
      db.houses.push(newHouse);
      // 同步生成 Code
      addCodeInternal(db, 'house', newHouse.id, newHouse.code, newHouse.name);
    } else {
      db.houses[idx].name = house.name;
      if (house.address !== undefined) db.houses[idx].address = house.address;
      db.houses[idx].updatedAt = nowIso();
    }
    save(db);
    return getHouse(house.id || db.houses[db.houses.length - 1].id);
  }

  function softDeleteHouse(id) {
    var db = load();
    var h = findById(db.houses, id);
    if (!h || h.deletedAt) return;
    var ts = nowIso();
    h.deletedAt = ts;
    // 级联：软删 floors → rooms → containers → items
    db.floors.filter(function (f) { return f.houseId === id && !f.deletedAt; }).forEach(function (f) {
      f.deletedAt = ts;
      db.rooms.filter(function (r) { return r.floorId === f.id && !r.deletedAt; }).forEach(function (r) {
        r.deletedAt = ts;
        db.containers.filter(function (c) { return c.roomId === r.id && !c.deletedAt; }).forEach(function (c) {
          cascadeDeleteContainer(db, c, ts);
        });
        db.items.filter(function (it) { return it.roomId === r.id && !it.deletedAt; }).forEach(function (it) {
          it.deletedAt = ts;
        });
      });
    });
    // 清理 codes
    removeCodesByOwner(db, 'house', id);
    save(db);
  }

  // ============================================================
  // Floor 仓库
  // ============================================================
  function listFloorsByHouse(houseId) {
    var db = load();
    return active(db.floors).filter(function (f) { return f.houseId === houseId; })
      .sort(function (a, b) {
        if (a.level !== b.level) return a.level - b.level;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
  }

  function getFloor(id) {
    var db = load();
    var f = findById(db.floors, id);
    return f && !f.deletedAt ? deepCopy(f) : null;
  }

  function findFloorByCode(code) {
    var db = load();
    for (var i = 0; i < db.floors.length; i++) {
      if (db.floors[i].code === code && !db.floors[i].deletedAt) return deepCopy(db.floors[i]);
    }
    return null;
  }

  function suggestFloorLevel(houseId) {
    var floors = listFloorsByHouse(houseId);
    if (!floors.length) return 0;
    var maxL = -9999;
    floors.forEach(function (f) { if (f.level > maxL) maxL = f.level; });
    return maxL + 1;
  }

  function upsertFloor(floor) {
    var db = load();
    var idx = -1;
    for (var i = 0; i < db.floors.length; i++) {
      if (db.floors[i].id === floor.id) { idx = i; break; }
    }
    if (idx === -1) {
      var now = nowIso();
      var newFloor = {
        id: floor.id || newId(),
        code: floor.code || newId(),
        houseId: floor.houseId,
        level: floor.level,
        name: floor.name,
        createdAt: floor.createdAt || now,
        updatedAt: floor.updatedAt || now,
        deletedAt: null
      };
      db.floors.push(newFloor);
      addCodeInternal(db, 'floor', newFloor.id, newFloor.code, newFloor.name);
    } else {
      db.floors[idx].name = floor.name;
      db.floors[idx].level = floor.level;
      db.floors[idx].updatedAt = nowIso();
    }
    save(db);
    var savedId = idx === -1 ? db.floors[db.floors.length - 1].id : floor.id;
    return getFloor(savedId);
  }

  function softDeleteFloor(id) {
    var db = load();
    var f = findById(db.floors, id);
    if (!f || f.deletedAt) return;
    var ts = nowIso();
    f.deletedAt = ts;
    db.rooms.filter(function (r) { return r.floorId === id && !r.deletedAt; }).forEach(function (r) {
      r.deletedAt = ts;
      db.containers.filter(function (c) { return c.roomId === r.id && !c.deletedAt; }).forEach(function (c) {
        cascadeDeleteContainer(db, c, ts);
      });
      db.items.filter(function (it) { return it.roomId === r.id && !it.deletedAt; }).forEach(function (it) {
        it.deletedAt = ts;
      });
    });
    removeCodesByOwner(db, 'floor', id);
    save(db);
  }

  // ============================================================
  // Room 仓库
  // ============================================================
  function listRoomsByFloor(floorId) {
    var db = load();
    return active(db.rooms).filter(function (r) { return r.floorId === floorId; })
      .sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  }

  function getRoom(id) {
    var db = load();
    var r = findById(db.rooms, id);
    return r && !r.deletedAt ? deepCopy(r) : null;
  }

  function findRoomByCode(code) {
    var db = load();
    for (var i = 0; i < db.rooms.length; i++) {
      if (db.rooms[i].code === code && !db.rooms[i].deletedAt) return deepCopy(db.rooms[i]);
    }
    return null;
  }

  function upsertRoom(room) {
    var db = load();
    var idx = -1;
    for (var i = 0; i < db.rooms.length; i++) {
      if (db.rooms[i].id === room.id) { idx = i; break; }
    }
    if (idx === -1) {
      var now = nowIso();
      var newRoom = {
        id: room.id || newId(),
        code: room.code || newId(),
        floorId: room.floorId,
        name: room.name,
        createdAt: room.createdAt || now,
        updatedAt: room.updatedAt || now,
        deletedAt: null
      };
      db.rooms.push(newRoom);
      addCodeInternal(db, 'room', newRoom.id, newRoom.code, newRoom.name);
    } else {
      db.rooms[idx].name = room.name;
      db.rooms[idx].updatedAt = nowIso();
    }
    save(db);
    var savedId = idx === -1 ? db.rooms[db.rooms.length - 1].id : room.id;
    return getRoom(savedId);
  }

  function softDeleteRoom(id) {
    var db = load();
    var r = findById(db.rooms, id);
    if (!r || r.deletedAt) return;
    var ts = nowIso();
    r.deletedAt = ts;
    db.containers.filter(function (c) { return c.roomId === id && !c.deletedAt; }).forEach(function (c) {
      cascadeDeleteContainer(db, c, ts);
    });
    db.items.filter(function (it) { return it.roomId === id && !it.deletedAt; }).forEach(function (it) {
      it.deletedAt = ts;
    });
    removeCodesByOwner(db, 'room', id);
    save(db);
  }

  // ============================================================
  // Container 仓库（支持自引用嵌套）
  // ============================================================
  function listContainersByRoom(roomId) {
    // 仅返回根容器（parentContainerId == null）
    var db = load();
    return active(db.containers).filter(function (c) {
      return c.roomId === roomId && !c.parentContainerId;
    }).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  }

  function listContainersByParent(parentId) {
    var db = load();
    return active(db.containers).filter(function (c) {
      return c.parentContainerId === parentId;
    }).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  }

  function getContainer(id) {
    var db = load();
    var c = findById(db.containers, id);
    return c && !c.deletedAt ? deepCopy(c) : null;
  }

  function findContainerByCode(code) {
    var db = load();
    for (var i = 0; i < db.containers.length; i++) {
      if (db.containers[i].code === code && !db.containers[i].deletedAt) return deepCopy(db.containers[i]);
    }
    return null;
  }

  function upsertContainer(container) {
    var db = load();
    var idx = -1;
    for (var i = 0; i < db.containers.length; i++) {
      if (db.containers[i].id === container.id) { idx = i; break; }
    }
    if (idx === -1) {
      var now = nowIso();
      var newC = {
        id: container.id || newId(),
        code: container.code || newId(),
        roomId: container.roomId,
        parentContainerId: container.parentContainerId || null,
        name: container.name,
        type: container.type || null,
        createdAt: container.createdAt || now,
        updatedAt: container.updatedAt || now,
        deletedAt: null
      };
      db.containers.push(newC);
      addCodeInternal(db, 'container', newC.id, newC.code, newC.name);
    } else {
      db.containers[idx].name = container.name;
      if (container.type !== undefined) db.containers[idx].type = container.type;
      if (container.parentContainerId !== undefined) db.containers[idx].parentContainerId = container.parentContainerId;
      db.containers[idx].updatedAt = nowIso();
    }
    save(db);
    var savedId = idx === -1 ? db.containers[db.containers.length - 1].id : container.id;
    return getContainer(savedId);
  }

  // 内部：递归软删容器及其子容器/物品
  function cascadeDeleteContainer(db, c, ts) {
    if (c.deletedAt) return;
    c.deletedAt = ts;
    // 子容器
    db.containers.filter(function (sub) { return sub.parentContainerId === c.id && !sub.deletedAt; })
      .forEach(function (sub) { cascadeDeleteContainer(db, sub, ts); });
    // 容器内物品
    db.items.filter(function (it) { return it.containerId === c.id && !it.deletedAt; })
      .forEach(function (it) { it.deletedAt = ts; });
    // 清理 codes
    removeCodesByOwner(db, 'container', c.id);
  }

  function softDeleteContainer(id) {
    var db = load();
    var c = findById(db.containers, id);
    if (!c || c.deletedAt) return;
    cascadeDeleteContainer(db, c, nowIso());
    save(db);
  }

  // ============================================================
  // Item 仓库
  // ============================================================
  function listItems(opts) {
    opts = opts || {};
    var limit = opts.limit || 200;
    var db = load();
    var items = active(db.items).slice();
    items.sort(function (a, b) {
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
    return items.slice(0, limit).map(deepCopy);
  }

  function listRecentViewed(limit) {
    limit = limit || 50;
    var db = load();
    return active(db.items).filter(function (it) { return !!it.lastViewedAt; })
      .sort(function (a, b) { return (b.lastViewedAt || '').localeCompare(a.lastViewedAt || ''); })
      .slice(0, limit).map(deepCopy);
  }

  function listRecentAdded(limit) {
    limit = limit || 50;
    var db = load();
    return active(db.items).slice()
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); })
      .slice(0, limit).map(deepCopy);
  }

  function listItemsByContainer(containerId) {
    var db = load();
    return active(db.items).filter(function (it) { return it.containerId === containerId; })
      .sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
      .map(deepCopy);
  }

  function listItemsByRoom(roomId) {
    // 仅 room 内"散放"物品（room_id 设置，container_id 为空）
    var db = load();
    return active(db.items).filter(function (it) { return it.roomId === roomId && !it.containerId; })
      .sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
      .map(deepCopy);
  }

  function getItem(id) {
    var db = load();
    var it = findById(db.items, id);
    return it && !it.deletedAt ? deepCopy(it) : null;
  }

  function findItemByCode(code) {
    var db = load();
    for (var i = 0; i < db.items.length; i++) {
      if (db.items[i].code === code && !db.items[i].deletedAt) return deepCopy(db.items[i]);
    }
    return null;
  }

  function upsertItem(item) {
    // XOR 校验
    validateXor(item.containerId, item.roomId);
    var db = load();
    var idx = -1;
    for (var i = 0; i < db.items.length; i++) {
      if (db.items[i].id === item.id) { idx = i; break; }
    }
    if (idx === -1) {
      var now = nowIso();
      var newItem = {
        id: item.id || newId(),
        code: item.code || newId(),
        name: item.name,
        tags: Array.isArray(item.tags) ? item.tags.slice() : [],
        note: item.note || null,
        photoPath: item.photoPath || null,
        containerId: item.containerId || null,
        roomId: item.roomId || null,
        lastViewedAt: item.lastViewedAt || null,
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now,
        deletedAt: null
      };
      db.items.push(newItem);
      addCodeInternal(db, 'item', newItem.id, newItem.code, newItem.name);
    } else {
      db.items[idx].name = item.name;
      db.items[idx].tags = Array.isArray(item.tags) ? item.tags.slice() : [];
      db.items[idx].note = item.note || null;
      if (item.containerId !== undefined) db.items[idx].containerId = item.containerId || null;
      if (item.roomId !== undefined) db.items[idx].roomId = item.roomId || null;
      db.items[idx].updatedAt = nowIso();
    }
    save(db);
    var savedId = idx === -1 ? db.items[db.items.length - 1].id : item.id;
    return getItem(savedId);
  }

  function changeItemLocation(itemId, newRoomId, newContainerId) {
    validateXor(newContainerId, newRoomId);
    var db = load();
    var it = findById(db.items, itemId);
    if (!it || it.deletedAt) throw new Error('Item not found or deleted: ' + itemId);
    it.containerId = newContainerId || null;
    it.roomId = newRoomId || null;
    it.updatedAt = nowIso();
    save(db);
  }

  function markItemViewed(itemId) {
    var db = load();
    var it = findById(db.items, itemId);
    if (!it || it.deletedAt) return;
    var ts = nowIso();
    it.lastViewedAt = ts;
    it.updatedAt = ts;
    save(db);
  }

  function softDeleteItem(itemId) {
    var db = load();
    var it = findById(db.items, itemId);
    if (!it || it.deletedAt) return;
    it.deletedAt = nowIso();
    removeCodesByOwner(db, 'item', itemId);
    save(db);
  }

  function searchItems(query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return listItems();
    var db = load();
    return active(db.items).filter(function (it) {
      var inName = (it.name || '').toLowerCase().indexOf(q) > -1;
      var inNote = (it.note || '').toLowerCase().indexOf(q) > -1;
      var inTags = (it.tags || []).some(function (t) { return (t || '').toLowerCase().indexOf(q) > -1; });
      return inName || inNote || inTags;
    }).map(deepCopy);
  }

  // ============================================================
  // Code 仓库
  // ============================================================
  function addCodeInternal(db, ownerType, ownerId, ownerCode, label) {
    var existing = db.codes.find(function (c) {
      return c.ownerType === ownerType && c.ownerId === ownerId;
    });
    if (existing) return; // 每个实体只一个 code（v1.1 单码策略）
    db.codes.push({
      id: newId(),
      ownerType: ownerType,
      ownerId: ownerId,
      format: 'qr',
      payload: buildPayload(ownerCode),
      label: label || null,
      createdAt: nowIso()
    });
  }

  function listCodesByOwner(ownerType, ownerId) {
    var db = load();
    return db.codes.filter(function (c) {
      return c.ownerType === ownerType && c.ownerId === ownerId;
    }).map(deepCopy);
  }

  function lookupByPayload(payload) {
    var code = extractCode(payload);
    if (!code) return { hit: false, payload: payload };
    var db = load();
    // 顺序扫描 5 表：house → floor → room → container → item
    var h = findHouseByCode(code);
    if (h) return { hit: true, ownerType: 'house', ownerId: h.id, owner: h, ownerDeleted: false };
    var f = findFloorByCode(code);
    if (f) {
      var parentH = getHouseInternal(db, f.houseId);
      return { hit: true, ownerType: 'floor', ownerId: f.id, owner: f, ownerDeleted: !!parentH && parentH.deletedAt };
    }
    var r = findRoomByCode(code);
    if (r) {
      var parentF = getFloorInternal(db, r.floorId);
      return { hit: true, ownerType: 'room', ownerId: r.id, owner: r, ownerDeleted: !!parentF && parentF.deletedAt };
    }
    var c = findContainerByCode(code);
    if (c) {
      var parentR = getRoomInternal(db, c.roomId);
      return { hit: true, ownerType: 'container', ownerId: c.id, owner: c, ownerDeleted: !!parentR && parentR.deletedAt };
    }
    var it = findItemByCode(code);
    if (it) return { hit: true, ownerType: 'item', ownerId: it.id, owner: it, ownerDeleted: false };
    return { hit: false, payload: payload };
  }

  function removeCodesByOwner(db, ownerType, ownerId) {
    // 物理删除（Code 无 deletedAt）
    db.codes = db.codes.filter(function (c) {
      return !(c.ownerType === ownerType && c.ownerId === ownerId);
    });
  }

  function resetOwnerCode(ownerType, ownerId, newCodeUuid) {
    var db = load();
    // 找到 owner 的 code 记录，重置 payload
    var code = db.codes.find(function (c) {
      return c.ownerType === ownerType && c.ownerId === ownerId;
    });
    if (!code) return;
    code.payload = buildPayload(newCodeUuid);
    // 同步更新主表的 code 列
    var tableName = ownerType + 's'; // houses, floors, rooms, containers, items
    var list = db[tableName];
    if (!list) return;
    var entity = findById(list, ownerId);
    if (entity) entity.code = newCodeUuid;
    save(db);
  }

  // 内部：不调用 load 的 get* 版本（用于级联场景避免重复 load）
  function getHouseInternal(db, id) { var h = findById(db.houses, id); return h; }
  function getFloorInternal(db, id) { var f = findById(db.floors, id); return f; }
  function getRoomInternal(db, id) { var r = findById(db.rooms, id); return r; }

  // ============================================================
  // 路径解析：item → {house, floor, room, container?}
  // ============================================================
  function resolveItemPath(itemId) {
    var db = load();
    var item = findById(db.items, itemId);
    if (!item || item.deletedAt) return null;
    var result = { item: deepCopy(item), house: null, floor: null, room: null, container: null };
    var roomId = null;
    if (item.containerId) {
      var c = findById(db.containers, item.containerId);
      if (c && !c.deletedAt) {
        result.container = deepCopy(c);
        roomId = c.roomId;
      }
    } else {
      roomId = item.roomId;
    }
    if (roomId) {
      var r = findById(db.rooms, roomId);
      if (r && !r.deletedAt) {
        result.room = deepCopy(r);
        var f = findById(db.floors, r.floorId);
        if (f && !f.deletedAt) {
          result.floor = deepCopy(f);
          var h = findById(db.houses, f.houseId);
          if (h && !h.deletedAt) {
            result.house = deepCopy(h);
          }
        }
      }
    }
    return result;
  }

  // pathLabel: "My home / Ground floor / Living Room / Drawer 1"
  function pathLabel(path) {
    if (!path) return '';
    var parts = [];
    if (path.house) parts.push(path.house.name);
    if (path.floor) parts.push(path.floor.name);
    if (path.room) parts.push(path.room.name);
    if (path.container) parts.push(path.container.name);
    return parts.join(' / ');
  }

  // ============================================================
  // 统计
  // ============================================================
  function stats() {
    var db = load();
    return {
      houses: active(db.houses).length,
      floors: active(db.floors).length,
      rooms: active(db.rooms).length,
      containers: active(db.containers).length,
      items: active(db.items).length,
      codes: db.codes.length,
      photos: active(db.photos).length
    };
  }

  // ============================================================
  // 数据库管理
  // ============================================================
  function isSeeded() {
    var db = load();
    return !!db.meta.seededAt;
  }

  function clearAll() {
    save(emptyDb());
  }

  // 仅用于 demo：注入示例数据
  function seedDemoData() {
    clearAll();
    var db = load();
    var now = nowIso();

    // 1 house
    var house = { id: 'demo-house', code: newId(), name: 'My home', address: '123 Demo Street', createdAt: now, updatedAt: now, deletedAt: null };
    db.houses.push(house);

    // 2 floors
    var ground = { id: 'demo-floor-ground', code: newId(), houseId: house.id, level: 0, name: 'Ground floor', createdAt: now, updatedAt: now, deletedAt: null };
    var basement = { id: 'demo-floor-basement', code: newId(), houseId: house.id, level: -1, name: 'Basement', createdAt: now, updatedAt: now, deletedAt: null };
    db.floors.push(ground, basement);

    // 3 rooms
    var living = { id: 'demo-room-living', code: newId(), floorId: ground.id, name: 'Living Room', createdAt: now, updatedAt: now, deletedAt: null };
    var bedroom = { id: 'demo-room-bedroom', code: newId(), floorId: ground.id, name: 'Bedroom', createdAt: now, updatedAt: now, deletedAt: null };
    var storage = { id: 'demo-room-storage', code: newId(), floorId: basement.id, name: 'Storage', createdAt: now, updatedAt: now, deletedAt: null };
    db.rooms.push(living, bedroom, storage);

    // 2 containers
    var cabinet = { id: 'demo-container-cabinet', code: newId(), roomId: living.id, parentContainerId: null, name: 'TV Cabinet', type: 'cabinet', createdAt: now, updatedAt: now, deletedAt: null };
    var drawer = { id: 'demo-container-drawer', code: newId(), roomId: bedroom.id, parentContainerId: null, name: 'Drawer 1', type: 'drawer', createdAt: now, updatedAt: now, deletedAt: null };
    db.containers.push(cabinet, drawer);

    // 2 items
    var airFryer = {
      id: 'demo-item-airfryer', code: newId(), name: 'Air Fryer',
      tags: ['appliance', 'kitchen'], note: null, photoPath: null,
      containerId: null, roomId: living.id, lastViewedAt: null,
      createdAt: now, updatedAt: now, deletedAt: null
    };
    var passport = {
      id: 'demo-item-passport', code: newId(), name: 'Passport',
      tags: ['important', 'travel'], note: 'In the second drawer, left side. Demo data.',
      photoPath: null, containerId: drawer.id, roomId: null, lastViewedAt: now,
      createdAt: now, updatedAt: now, deletedAt: null
    };
    db.items.push(airFryer, passport);

    // 10 codes
    [
      { t: 'house', id: house.id, c: house.code, l: '正门' },
      { t: 'floor', id: ground.id, c: ground.code, l: ground.name },
      { t: 'floor', id: basement.id, c: basement.code, l: basement.name },
      { t: 'room', id: living.id, c: living.code, l: living.name },
      { t: 'room', id: bedroom.id, c: bedroom.code, l: bedroom.name },
      { t: 'room', id: storage.id, c: storage.code, l: storage.name },
      { t: 'container', id: cabinet.id, c: cabinet.code, l: cabinet.name },
      { t: 'container', id: drawer.id, c: drawer.code, l: drawer.name },
      { t: 'item', id: airFryer.id, c: airFryer.code, l: airFryer.name },
      { t: 'item', id: passport.id, c: passport.code, l: passport.name }
    ].forEach(function (o) {
      db.codes.push({
        id: newId(), ownerType: o.t, ownerId: o.id, format: 'qr',
        payload: buildPayload(o.c), label: o.l, createdAt: now
      });
    });

    db.meta.seededAt = now;
    save(db);
  }

  // ── 工具：深拷贝（避免外部修改内部状态） ──
  function deepCopy(obj) {
    if (obj == null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepCopy);
    var copy = {};
    Object.keys(obj).forEach(function (k) { copy[k] = deepCopy(obj[k]); });
    return copy;
  }

  // ── 导出 API ──
  window.GuiweiStore = {
    // 基础
    newId: newId,
    nowIso: nowIso,
    isSeeded: isSeeded,
    clearAll: clearAll,
    seedDemoData: seedDemoData,
    stats: stats,
    extractCode: extractCode,
    buildPayload: buildPayload,
    validateXor: validateXor,
    OWNER_TYPES: OWNER_TYPES,

    // House
    listHouses: listHouses,
    getHouse: getHouse,
    findHouseByCode: findHouseByCode,
    upsertHouse: upsertHouse,
    softDeleteHouse: softDeleteHouse,

    // Floor
    listFloorsByHouse: listFloorsByHouse,
    getFloor: getFloor,
    findFloorByCode: findFloorByCode,
    suggestFloorLevel: suggestFloorLevel,
    upsertFloor: upsertFloor,
    softDeleteFloor: softDeleteFloor,

    // Room
    listRoomsByFloor: listRoomsByFloor,
    getRoom: getRoom,
    findRoomByCode: findRoomByCode,
    upsertRoom: upsertRoom,
    softDeleteRoom: softDeleteRoom,

    // Container
    listContainersByRoom: listContainersByRoom,
    listContainersByParent: listContainersByParent,
    getContainer: getContainer,
    findContainerByCode: findContainerByCode,
    upsertContainer: upsertContainer,
    softDeleteContainer: softDeleteContainer,

    // Item
    listItems: listItems,
    listRecentViewed: listRecentViewed,
    listRecentAdded: listRecentAdded,
    listItemsByContainer: listItemsByContainer,
    listItemsByRoom: listItemsByRoom,
    getItem: getItem,
    findItemByCode: findItemByCode,
    upsertItem: upsertItem,
    changeItemLocation: changeItemLocation,
    markItemViewed: markItemViewed,
    softDeleteItem: softDeleteItem,
    searchItems: searchItems,

    // Code
    listCodesByOwner: listCodesByOwner,
    lookupByPayload: lookupByPayload,
    resetOwnerCode: resetOwnerCode,

    // 路径解析
    resolveItemPath: resolveItemPath,
    pathLabel: pathLabel,

    // 内部（仅供测试使用）
    _load: load,
    _save: save,
    _STORAGE_KEY: STORAGE_KEY
  };
})();
