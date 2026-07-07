/**
 * 模块7：每日认知游戏
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    gameMenu: document.getElementById('gameMenu'),
    gameArea: document.getElementById('gameArea'),
    backToMenu: document.getElementById('backToMenu'),
    statMoves: document.getElementById('statMoves'),
    statTimer: document.getElementById('statTimer'),
    memoryGame: document.getElementById('memoryGame'),
    memoryGrid: document.getElementById('memoryGrid'),
    categoryGame: document.getElementById('categoryGame'),
    categoryZones: document.getElementById('categoryZones'),
    categoryItems: document.getElementById('categoryItems'),
    sequenceGame: document.getElementById('sequenceGame'),
    sequenceGrid: document.getElementById('sequenceGrid'),
    gameComplete: document.getElementById('gameComplete'),
    completeTime: document.getElementById('completeTime'),
    completeMoves: document.getElementById('completeMoves'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    menuBtn: document.getElementById('menuBtn'),
    recordsList: document.getElementById('recordsList')
  };

  let currentGame = null;
  let gameStartTime = null;
  let gameTimer = null;
  let moves = 0;
  let gameRecords = [];

  // 游戏数据
  const memoryIcons = ['&#127968;', '&#128118;', '&#127912;', '&#127794;', '&#127860;', '&#128021;', '&#9992;', '&#127775;'];

  const categoryData = {
    zones: [
      { id: 'animal', name: '动物', items: ['&#128049; 猫', '&#128054; 狗', '&#128045; 兔子'] },
      { id: 'food', name: '食物', items: ['&#127815; 葡萄', '&#127817; 西瓜', '&#127822; 苹果'] },
      { id: 'tool', name: '工具', items: ['&#128296; 锤子', '&#128295; 扳手', '&#9986; 剪刀'] }
    ]
  };

  /**
   * 初始化
   */
  function init() {
    loadRecords();
    bindEvents();
    renderRecords();
  }

  /**
   * 加载记录
   */
  function loadRecords() {
    gameRecords = Storage.get(StorageKeys.GAME_RECORDS, []);
  }

  /**
   * 渲染记录
   */
  function renderRecords() {
    if (!els.recordsList) return;

    const recent = gameRecords.slice(-10).reverse();

    if (recent.length === 0) {
      els.recordsList.innerHTML = '<div class="empty-state-small"><p>还没有游戏记录</p></div>';
      return;
    }

    els.recordsList.innerHTML = recent.map(record => `
      <div class="record-item">
        <div>
          <div class="record-game">${getGameName(record.game)}</div>
          <div class="record-meta">${formatDate(record.date)}</div>
        </div>
        <div class="record-meta">
          ${record.duration ? `用时 ${formatDuration(record.duration)}` : ''}
          ${record.moves ? `· ${record.moves}步` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * 开始游戏
   */
  function startGame(gameType) {
    currentGame = gameType;
    moves = 0;
    gameStartTime = Date.now();

    // 切换视图
    els.gameMenu.classList.add('hidden');
    els.gameArea.classList.remove('hidden');
    els.gameComplete.classList.add('hidden');

    // 隐藏所有游戏板
    document.querySelectorAll('.game-board').forEach(board => board.classList.add('hidden'));

    // 启动计时器
    startTimer();
    updateStats();

    // 初始化对应游戏
    switch (gameType) {
      case 'memory':
        initMemoryGame();
        break;
      case 'category':
        initCategoryGame();
        break;
      case 'sequence':
        initSequenceGame();
        break;
    }

    EventBus.emit(EVENTS.GAME_STARTED, { game: gameType });
  }

  /**
   * 返回菜单
   */
  function backMenu() {
    stopTimer();
    els.gameArea.classList.add('hidden');
    els.gameMenu.classList.remove('hidden');
    currentGame = null;
  }

  /**
   * 启动计时器
   */
  function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      if (els.statTimer) {
        els.statTimer.textContent = `时间: ${formatDuration(elapsed)}`;
      }
    }, 1000);
  }

  /**
   * 停止计时器
   */
  function stopTimer() {
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
  }

  /**
   * 更新统计
   */
  function updateStats() {
    if (els.statMoves) els.statMoves.textContent = `步数: ${moves}`;
  }

  /**
   * 完成游戏
   */
  function completeGame() {
    stopTimer();

    const duration = Math.floor((Date.now() - gameStartTime) / 1000);

    const record = {
      game: currentGame,
      moves: moves,
      duration: duration,
      date: new Date().toISOString()
    };

    gameRecords.push(record);
    Storage.set(StorageKeys.GAME_RECORDS, gameRecords);

    EventBus.emit(EVENTS.GAME_COMPLETED, record);

    // 显示完成画面
    document.querySelectorAll('.game-board').forEach(board => board.classList.add('hidden'));
    els.gameComplete.classList.remove('hidden');
    if (els.completeTime) els.completeTime.textContent = formatDuration(duration);
    if (els.completeMoves) els.completeMoves.textContent = moves;

    renderRecords();
  }

  // ===== 配对记忆游戏 =====
  let memoryCards = [];
  let flippedCards = [];
  let matchedPairs = 0;

  function initMemoryGame() {
    els.memoryGame.classList.remove('hidden');
    matchedPairs = 0;
    flippedCards = [];

    // 创建卡片对
    const pairs = [...memoryIcons, ...memoryIcons];
    pairs.sort(() => Math.random() - 0.5);

    memoryCards = pairs;

    els.memoryGrid.innerHTML = pairs.map((icon, index) => `
      <div class="memory-card" data-index="${index}" data-icon="${icon}">
        <span class="card-front">?</span>
        <span class="card-back">${icon}</span>
      </div>
    `).join('');
  }

  function flipCard(card) {
    if (flippedCards.length >= 2) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);
    moves++;
    updateStats();

    if (flippedCards.length === 2) {
      checkMatch();
    }
  }

  function checkMatch() {
    const [first, second] = flippedCards;
    const match = first.dataset.icon === second.dataset.icon;

    if (match) {
      first.classList.add('matched');
      second.classList.add('matched');
      flippedCards = [];
      matchedPairs++;

      if (matchedPairs === memoryIcons.length) {
        setTimeout(completeGame, 500);
      }
    } else {
      setTimeout(() => {
        first.classList.remove('flipped');
        second.classList.remove('flipped');
        flippedCards = [];
      }, 1000);
    }
  }

  // ===== 分类整理游戏 =====
  let placedItems = 0;
  let totalItems = 0;

  function initCategoryGame() {
    els.categoryGame.classList.remove('hidden');
    placedItems = 0;

    // 渲染分类区域
    els.categoryZones.innerHTML = categoryData.zones.map(zone => `
      <div class="category-zone" data-category="${zone.id}">
        <div class="category-zone-title">${zone.name}</div>
        <div class="zone-items"></div>
      </div>
    `).join('');

    // 收集所有物品并打乱
    let allItems = [];
    categoryData.zones.forEach(zone => {
      zone.items.forEach(item => {
        allItems.push({ text: item, category: zone.id });
      });
    });
    totalItems = allItems.length;
    allItems.sort(() => Math.random() - 0.5);

    // 渲染物品
    els.categoryItems.innerHTML = allItems.map((item, index) => `
      <div class="category-item" draggable="true" data-category="${item.category}" data-index="${index}">
        ${item.text}
      </div>
    `).join('');

    // 绑定拖拽事件
    bindDragEvents();
  }

  function bindDragEvents() {
    const items = els.categoryItems.querySelectorAll('.category-item');
    const zones = els.categoryZones.querySelectorAll('.category-zone');

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.category);
        e.dataTransfer.setData('index', item.dataset.index);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });
    });

    zones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        const itemCategory = e.dataTransfer.getData('text/plain');
        const zoneCategory = zone.dataset.category;
        const itemIndex = e.dataTransfer.getData('index');

        if (itemCategory === zoneCategory) {
          const item = els.categoryItems.querySelector(`[data-index="${itemIndex}"]`);
          if (item) {
            item.classList.add('placed');
            item.draggable = false;
            zone.querySelector('.zone-items').appendChild(item);
            placedItems++;
            moves++;
            updateStats();

            if (placedItems === totalItems) {
              setTimeout(completeGame, 500);
            }
          }
        } else {
          moves++;
          updateStats();
        }
      });
    });
  }

  // ===== 数字顺序游戏 =====
  let sequenceNumbers = [];
  let nextExpected = 1;

  function initSequenceGame() {
    els.sequenceGame.classList.remove('hidden');
    nextExpected = 1;

    // 生成1-15的数字并打乱
    sequenceNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
    sequenceNumbers.sort(() => Math.random() - 0.5);

    els.sequenceGrid.innerHTML = sequenceNumbers.map(num => `
      <div class="sequence-number" data-number="${num}">${num}</div>
    `).join('');
  }

  function clickNumber(el) {
    if (el.classList.contains('correct')) return;

    const num = parseInt(el.dataset.number);

    if (num === nextExpected) {
      el.classList.add('correct');
      nextExpected++;
      moves++;
      updateStats();

      if (nextExpected > sequenceNumbers.length) {
        setTimeout(completeGame, 500);
      }
    } else {
      el.classList.add('wrong');
      moves++;
      updateStats();
      setTimeout(() => el.classList.remove('wrong'), 500);
    }
  }

  /**
   * 获取游戏名称
   */
  function getGameName(game) {
    const names = {
      memory: '配对记忆',
      category: '分类整理',
      sequence: '数字顺序'
    };
    return names[game] || game;
  }

  /**
   * 格式化时长
   */
  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 游戏选择
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        startGame(card.dataset.game);
      });
    });

    // 返回菜单
    if (els.backToMenu) els.backToMenu.addEventListener('click', backMenu);
    if (els.menuBtn) els.menuBtn.addEventListener('click', backMenu);

    // 再玩一次
    if (els.playAgainBtn) {
      els.playAgainBtn.addEventListener('click', () => {
        startGame(currentGame);
      });
    }

    // 配对记忆点击
    if (els.memoryGrid) {
      els.memoryGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.memory-card');
        if (card) flipCard(card);
      });
    }

    // 数字顺序点击
    if (els.sequenceGrid) {
      els.sequenceGrid.addEventListener('click', (e) => {
        const num = e.target.closest('.sequence-number');
        if (num) clickNumber(num);
      });
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
