/* ========== actions.js — 业务操作 ========== */

const Actions = (() => {
  'use strict';

  // === 常量定义 ===
  const TAGS = ['中餐', '西餐', '日料', '韩餐', '火锅', '烧烤', '甜品', '咖啡', '小吃', '其他'];

  const TAG_EMOJI = {
    '中餐': '🥘', '西餐': '🍝', '日料': '🍣', '韩餐': '🍲',
    '火锅': '🔥', '烧烤': '🍖', '甜品': '🍰', '咖啡': '☕',
    '小吃': '🥟', '其他': '🍽️'
  };

  const FILTER = {
    ALL: 'all',
    PENDING: 'pending',
    DONE: 'done'
  };

  // === CRUD 操作 ===

  // 添加美食
  function addFood(data) {
    const { name, place, tag, note } = data;
    const food = {
      id: Store.genId(),
      name: name.trim(),
      place: (place || '').trim(),
      tag: tag || '其他',
      done: false,
      createdAt: Date.now(),
      note: (note || '').trim(),
      checkIn: null
    };
    const { foods } = Store.getState();
    Store.setState({ foods: [food, ...foods] });
    return food;
  }

  // 编辑美食
  function editFood(id, data) {
    const { name, place, tag, note } = data;
    const { foods } = Store.getState();
    const updated = foods.map(f => {
      if (f.id === id) {
        return {
          ...f,
          name: name.trim(),
          place: (place || '').trim(),
          tag: tag || '其他',
          note: (note || '').trim()
        };
      }
      return f;
    });
    Store.setState({ foods: updated });
  }

  // 删除美食
  function deleteFood(id) {
    const { foods } = Store.getState();
    Store.setState({ foods: foods.filter(f => f.id !== id) });
  }

  // 切换状态（待探索 ↔ 已尝试）
  function toggleDone(id) {
    const { foods } = Store.getState();
    const updated = foods.map(f => {
      if (f.id === id) {
        const newDone = !f.done;
        return {
          ...f,
          done: newDone,
          // 如果从已尝试切回待探索，清除打卡记录
          checkIn: newDone ? f.checkIn : null
        };
      }
      return f;
    });
    Store.setState({ foods: updated });
  }

  // 打卡
  function checkIn(id, data) {
    const { rating, photo, note } = data;
    const { foods } = Store.getState();
    const updated = foods.map(f => {
      if (f.id === id) {
        return {
          ...f,
          done: true,
          checkIn: {
            date: Date.now(),
            rating: rating || 5,
            photo: photo || '',
            note: (note || '').trim()
          }
        };
      }
      return f;
    });
    Store.setState({ foods: updated });
  }

  // 撤销打卡
  function undoCheckIn(id) {
    const { foods } = Store.getState();
    const updated = foods.map(f => {
      if (f.id === id) {
        return { ...f, done: false, checkIn: null };
      }
      return f;
    });
    Store.setState({ foods: updated });
  }

  // === 状态设置 ===

  function setFilter(filter) {
    Store.setState({ filter });
  }

  function setDiscoverCategory(category) {
    Store.setState({ discoverCategory: category });
  }

  // === 查询方法 ===

  function getFoodById(id) {
    const { foods } = Store.getState();
    return foods.find(f => f.id === id) || null;
  }

  function getFilteredFoods(filter) {
    const { foods } = Store.getState();
    const f = filter || Store.getState().filter;
    if (f === FILTER.PENDING) return foods.filter(food => !food.done);
    if (f === FILTER.DONE) return foods.filter(food => food.done);
    return foods;
  }

  function getStats() {
    const { foods } = Store.getState();
    const total = foods.length;
    const done = foods.filter(f => f.done).length;
    const pending = total - done;
    return { total, done, pending };
  }

  function getCheckInHistory() {
    const { foods } = Store.getState();
    return foods
      .filter(f => f.done && f.checkIn)
      .sort((a, b) => b.checkIn.date - a.checkIn.date);
  }

  function getCategoryCounts() {
    const { foods } = Store.getState();
    const counts = {};
    TAGS.forEach(tag => { counts[tag] = 0; });
    foods.forEach(f => {
      if (counts[f.tag] !== undefined) {
        counts[f.tag]++;
      } else {
        counts['其他']++;
      }
    });
    return counts;
  }

  function getFoodsByCategory(tag) {
    const { foods } = Store.getState();
    return foods.filter(f => f.tag === tag);
  }

  function getTagEmoji(tag) {
    return TAG_EMOJI[tag] || TAG_EMOJI['其他'];
  }

  // === 种子数据 ===
  function seedDataIfEmpty() {
    const { foods } = Store.getState();
    if (foods.length > 0) return;

    const seeds = [
      { name: '兰州牛肉面', place: '城关区张掖路', tag: '中餐', note: '朋友推荐，说是正宗汤底' },
      { name: '提拉米苏', place: '万象城 L215', tag: '甜品', note: '小红书种草，拍照好看' },
      { name: '和牛寿司', place: '太古里三楼', tag: '日料', note: '人均 300，生日去吃' },
      { name: '部队火锅', place: '韩国街 B12', tag: '韩餐', note: '冬天吃肯定暖和' },
      { name: '手冲耶加雪菲', place: '巷子里咖啡馆', tag: '咖啡', note: '咖啡博主推荐，果酸调' },
      { name: '重庆老火锅', place: '解放碑步行街', tag: '火锅', note: '微辣试试，据说很正宗' }
    ];

    const seeded = seeds.map((s, i) => ({
      id: Store.genId(),
      name: s.name,
      place: s.place,
      tag: s.tag,
      done: i >= 4, // 前两个已尝试
      createdAt: Date.now() - (seeds.length - i) * 86400000,
      note: s.note,
      checkIn: i >= 4 ? {
        date: Date.now() - (seeds.length - i) * 3600000,
        rating: 4 + (i % 2),
        photo: '',
        note: i === 4 ? '味道确实不错，值得推荐！' : '环境很好，服务也到位。'
      } : null
    }));

    Store.setState({ foods: seeded });
  }

  return {
    // constants
    TAGS,
    TAG_EMOJI,
    FILTER,
    // CRUD
    addFood,
    editFood,
    deleteFood,
    toggleDone,
    checkIn,
    undoCheckIn,
    // state
    setFilter,
    setDiscoverCategory,
    // queries
    getFoodById,
    getFilteredFoods,
    getStats,
    getCheckInHistory,
    getCategoryCounts,
    getFoodsByCategory,
    getTagEmoji,
    // seed
    seedDataIfEmpty
  };
})();
