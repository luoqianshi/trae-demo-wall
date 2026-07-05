(function () {
  'use strict';

  var STORAGE_KEY = 'programming_contest_seating_vote_v2';
  var CHANNEL_NAME = 'programming_contest_seating_vote_channel_v2';
  var ROWS = 8;
  var COLS = 3;
  var SEATS_PER_TABLE = 4;
  var TOTAL_SEATS = ROWS * COLS * SEATS_PER_TABLE;
  var seatLabels = {
    north: '上',
    east: '右',
    south: '下',
    west: '左'
  };
  var voteChoices = [1, 2, 3, 5, 10];

  var state = loadState();
  var selectedSeatId = null;
  var selectedVote = 1;
  var channel = null;
  var lastRenderSignature = '';

  var floorEl = document.getElementById('floor');
  var leaderboardEl = document.getElementById('leaderboard');
  var claimedCountEl = document.getElementById('claimedCount');
  var emptyCountEl = document.getElementById('emptyCount');
  var voteCountEl = document.getElementById('voteCount');
  var topScoreEl = document.getElementById('topScore');
  var syncTextEl = document.getElementById('syncText');
  var claimModal = document.getElementById('claimModal');
  var claimNameInput = document.getElementById('claimName');
  var claimHint = document.getElementById('claimHint');
  var claimSubmit = document.getElementById('claimSubmit');
  var voteModal = document.getElementById('voteModal');
  var voteHint = document.getElementById('voteHint');
  var voteOptionsEl = document.getElementById('voteOptions');
  var customVoteInput = document.getElementById('customVote');
  var voteSubmit = document.getElementById('voteSubmit');
  var resetBtn = document.getElementById('resetBtn');
  var exportBtn = document.getElementById('exportBtn');
  var quickFindBtn = document.getElementById('quickFindBtn');
  var toastEl = document.getElementById('toast');

  boot();

  function boot() {
    initChannel();
    buildVoteOptions();
    render();
    bindEvents();
    setSyncText('页面已就绪，数据会自动刷新。');

    setInterval(function () {
      var latest = loadState();
      if (JSON.stringify(latest) !== JSON.stringify(state)) {
        state = latest;
        render();
        setSyncText('已从本地存储同步最新数据。');
      }
    }, 1000);
  }

  function initChannel() {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = function (event) {
        if (!event.data || event.data.type !== 'state-updated') return;
        var latest = loadState();
        if (JSON.stringify(latest) !== JSON.stringify(state)) {
          state = latest;
          render();
          setSyncText('收到其他页面的实时更新。');
        }
      };
    }

    window.addEventListener('storage', function (event) {
      if (event.key !== STORAGE_KEY) return;
      state = loadState();
      render();
      setSyncText('收到浏览器 storage 同步更新。');
    });
  }

  function bindEvents() {
    floorEl.addEventListener('click', function (event) {
      var seat = event.target.closest('.seat');
      if (!seat) return;
      var seatId = seat.getAttribute('data-seat-id');
      var occupant = state.seats[seatId];
      if (occupant) {
        openVoteModal(seatId);
      } else {
        openClaimModal(seatId);
      }
    });

    claimSubmit.addEventListener('click', claimSeat);
    voteSubmit.addEventListener('click', submitVote);
    resetBtn.addEventListener('click', resetData);
    exportBtn.addEventListener('click', exportData);
    quickFindBtn.addEventListener('click', focusFirstEmptySeat);

    claimNameInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') claimSeat();
    });

    customVoteInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') submitVote();
    });

    document.addEventListener('click', function (event) {
      if (event.target.matches('[data-close]')) closeModals();
      if (event.target.classList.contains('modal')) closeModals();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeModals();
    });
  }

  function buildVoteOptions() {
    voteOptionsEl.innerHTML = '';
    voteChoices.forEach(function (value) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'vote-chip' + (value === selectedVote ? ' active' : '');
      button.textContent = '+' + value;
      button.setAttribute('data-vote', String(value));
      button.addEventListener('click', function () {
        selectedVote = value;
        customVoteInput.value = '';
        Array.prototype.forEach.call(voteOptionsEl.children, function (item) {
          item.classList.toggle('active', item === button);
        });
      });
      voteOptionsEl.appendChild(button);
    });
  }

  function openClaimModal(seatId) {
    selectedSeatId = seatId;
    claimNameInput.value = '';
    claimHint.textContent = seatIdToText(seatId) + '，请输入开发者名称。';
    claimModal.classList.add('open');
    setTimeout(function () { claimNameInput.focus(); }, 60);
  }

  function openVoteModal(seatId) {
    selectedSeatId = seatId;
    selectedVote = 1;
    customVoteInput.value = '';
    buildVoteOptions();
    var occupant = state.seats[seatId];
    voteHint.textContent = '给「' + occupant.name + '」投票，当前票数：' + occupant.votes + '。';
    voteModal.classList.add('open');
  }

  function closeModals() {
    claimModal.classList.remove('open');
    voteModal.classList.remove('open');
    selectedSeatId = null;
  }

  function claimSeat() {
    if (!selectedSeatId) return;
    var name = normalizeName(claimNameInput.value);
    if (!name) {
      showToast('请先输入开发者名称');
      claimNameInput.focus();
      return;
    }
    if (state.seats[selectedSeatId]) {
      showToast('这个座位刚刚已被认领');
      closeModals();
      render();
      return;
    }

    state.seats[selectedSeatId] = {
      name: name,
      votes: 0,
      claimedAt: new Date().toISOString()
    };
    state.updatedAt = new Date().toISOString();
    saveAndBroadcast('座位已认领：' + name);
    closeModals();
  }

  function submitVote() {
    if (!selectedSeatId || !state.seats[selectedSeatId]) {
      closeModals();
      render();
      return;
    }

    var customValue = Number(customVoteInput.value);
    var amount = Number.isInteger(customValue) && customValue > 0 ? customValue : selectedVote;
    if (amount < 1 || amount > 999) {
      showToast('票数需在 1 到 999 之间');
      return;
    }

    state.seats[selectedSeatId].votes += amount;
    state.seats[selectedSeatId].lastVotedAt = new Date().toISOString();
    state.updatedAt = new Date().toISOString();
    saveAndBroadcast('投票成功，+' + amount + ' 票');
    closeModals();
  }

  function resetData() {
    var confirmed = window.confirm('确认清空所有座位和票数吗？此操作不可撤销。');
    if (!confirmed) return;
    state = createInitialState();
    saveAndBroadcast('演示数据已清空');
  }

  function exportData() {
    var data = JSON.stringify(state, null, 2);
    var blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'programming-contest-votes-' + compactDate(new Date()) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('数据已导出');
  }

  function focusFirstEmptySeat() {
    var emptySeatId = null;
    for (var r = 1; r <= ROWS; r += 1) {
      for (var c = 1; c <= COLS; c += 1) {
        for (var i = 0; i < Object.keys(seatLabels).length; i += 1) {
          var pos = Object.keys(seatLabels)[i];
          var id = makeSeatId(r, c, pos);
          if (!state.seats[id]) {
            emptySeatId = id;
            break;
          }
        }
        if (emptySeatId) break;
      }
      if (emptySeatId) break;
    }

    if (!emptySeatId) {
      showToast('所有座位都已认领');
      return;
    }

    var seat = document.querySelector('[data-seat-id="' + emptySeatId + '"]');
    if (seat) {
      seat.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      seat.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' }
      ], { duration: 700, easing: 'ease-out' });
    }
  }

  function saveAndBroadcast(message) {
    saveState(state);
    render();
    setSyncText('最后更新：' + formatTime(new Date()));
    showToast(message);
    if (channel) channel.postMessage({ type: 'state-updated', at: Date.now() });
  }

  function render() {
    var signature = JSON.stringify(state);
    if (signature === lastRenderSignature) return;
    lastRenderSignature = signature;

    var people = getPeople();
    var topVotes = people.length ? Math.max.apply(null, people.map(function (person) { return person.votes; })) : 0;
    var claimedCount = people.length;
    var totalVotes = people.reduce(function (sum, person) { return sum + person.votes; }, 0);

    claimedCountEl.textContent = String(claimedCount);
    emptyCountEl.textContent = String(TOTAL_SEATS - claimedCount);
    voteCountEl.textContent = String(totalVotes);
    topScoreEl.textContent = String(topVotes);

    renderFloor(topVotes);
    renderLeaderboard(people, topVotes);
  }

  function renderFloor(topVotes) {
    var parts = [];
    for (var row = 1; row <= ROWS; row += 1) {
      for (var col = 1; col <= COLS; col += 1) {
        var tableId = 'R' + row + '-T' + col;
        var seatIds = Object.keys(seatLabels).map(function (position) {
          return makeSeatId(row, col, position);
        });
        var occupied = seatIds.filter(function (id) { return Boolean(state.seats[id]); }).length;
        parts.push(
          '<article class="table-card ' + (occupied === SEATS_PER_TABLE ? 'full' : '') + '" aria-label="第 ' + row + ' 排第 ' + col + ' 桌">' +
            '<div class="table-title"><span>第 ' + row + ' 排 · 第 ' + col + ' 桌</span><code>' + tableId + '</code></div>' +
            '<div class="seat-map">' +
              renderSeat(seatIds[0], 'north', topVotes) +
              renderSeat(seatIds[1], 'east', topVotes) +
              '<div class="desk">' + occupied + '/4</div>' +
              renderSeat(seatIds[2], 'south', topVotes) +
              renderSeat(seatIds[3], 'west', topVotes) +
            '</div>' +
          '</article>'
        );
      }
    }
    floorEl.innerHTML = parts.join('');
  }

  function renderSeat(seatId, position, topVotes) {
    var occupant = state.seats[seatId];
    var topClass = occupant && occupant.votes > 0 && occupant.votes === topVotes ? ' top' : '';
    var occupiedClass = occupant ? ' occupied' : '';
    var label = seatIdToText(seatId);

    if (!occupant) {
      return '<button class="seat ' + position + '" type="button" data-seat-id="' + seatId + '" aria-label="认领' + escapeHtml(label) + '">' +
        '<span class="empty">+ 认领</span>' +
      '</button>';
    }

    return '<button class="seat ' + position + occupiedClass + topClass + '" type="button" data-seat-id="' + seatId + '" aria-label="给' + escapeHtml(occupant.name) + '投票">' +
      '<span class="person">' +
        '<span class="avatar" aria-hidden="true"></span>' +
        '<span class="name" title="' + escapeHtml(occupant.name) + '">' + escapeHtml(occupant.name) + '</span>' +
        '<span class="votes">' + occupant.votes + ' 票</span>' +
      '</span>' +
    '</button>';
  }

  function renderLeaderboard(people, topVotes) {
    if (!people.length) {
      leaderboardEl.innerHTML = '<div class="note">还没有开发者认领座位。点击空座即可开始。</div>';
      return;
    }

    var sorted = people.slice().sort(function (a, b) {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    leaderboardEl.innerHTML = sorted.slice(0, 12).map(function (person, index) {
      var isTop = person.votes > 0 && person.votes === topVotes;
      return '<div class="leader ' + (isTop ? 'top' : '') + '">' +
        '<span class="rank">' + (index + 1) + '</span>' +
        '<div>' +
          '<strong>' + escapeHtml(person.name) + '</strong>' +
          '<small>' + escapeHtml(seatIdToText(person.seatId)) + '</small>' +
        '</div>' +
        '<span class="badge">' + person.votes + '</span>' +
      '</div>';
    }).join('');
  }

  function getPeople() {
    return Object.keys(state.seats).map(function (seatId) {
      return {
        seatId: seatId,
        name: state.seats[seatId].name,
        votes: Number(state.seats[seatId].votes) || 0
      };
    });
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.seats) return createInitialState();
      return parsed;
    } catch (error) {
      return createInitialState();
    }
  }

  function saveState(nextState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function createInitialState() {
    return {
      version: 1,
      seats: {},
      updatedAt: new Date().toISOString()
    };
  }

  function makeSeatId(row, col, position) {
    return 'r' + row + 'c' + col + '-' + position;
  }

  function seatIdToText(seatId) {
    var match = /^r(\d+)c(\d+)-(\w+)$/.exec(seatId);
    if (!match) return seatId;
    return '第 ' + match[1] + ' 排 · ' + match[2] + ' 桌 · ' + (seatLabels[match[3]] || match[3]) + '座';
  }

  function normalizeName(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 20);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toastEl.classList.remove('show');
    }, 1800);
  }

  function setSyncText(message) {
    syncTextEl.textContent = message;
  }

  function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function compactDate(date) {
    var pad = function (number) { return String(number).padStart(2, '0'); };
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
  }
})();
