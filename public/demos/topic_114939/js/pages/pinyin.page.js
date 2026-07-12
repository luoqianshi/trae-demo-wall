window.PinyinPage = function(container) {
  const esc = window.escapeHtml;
  const data = window.DemoData || {};
  const pinyinData = data.pinyin || {};

  const tabs = [
    { key: 'initials', label: '声母' },
    { key: 'simple', label: '单韵母' },
    { key: 'compound', label: '复韵母' },
    { key: 'nasal', label: '鼻韵母' }
  ];

  let activeTab = 'initials';

  function getAudioLetter(letter) {
    return letter.replace(/ü/g, 'v').replace(/üe/g, 've').replace(/ün/g, 'vn');
  }

  function render() {
    const initials = pinyinData.initials || [];
    const finals = pinyinData.finals || {};
    const simpleFinals = finals.simple || [];
    const compoundFinals = finals.compound || [];
    const nasalFinals = finals.nasal || [];

    let currentList = [];
    if (activeTab === 'initials') {
      currentList = initials;
    } else if (activeTab === 'simple') {
      currentList = simpleFinals;
    } else if (activeTab === 'compound') {
      currentList = compoundFinals;
    } else if (activeTab === 'nasal') {
      currentList = nasalFinals;
    }

    container.innerHTML = `
      <div class="pinyin-page page-transition">
        <div class="page-header">
          <div class="page-title">拼音学习</div>
          <div class="page-subtitle">打好识字基础，从拼音开始</div>
        </div>

        <div class="pinyin-tabs">
          ${tabs.map(tab => `
            <div class="pinyin-tab ${activeTab === tab.key ? 'active' : ''}" onclick="switchPinyinTab('${tab.key}')">
              ${tab.label}
            </div>
          `).join('')}
        </div>

        <div class="pinyin-grid">
          ${currentList.map((item, idx) => `
            <div class="pinyin-card" onclick="playPinyinLetter('${esc(getAudioLetter(item.letter))}')">
              <div class="pinyin-gif">
                <img src="assets/audio/pinyin_gif/${esc(getAudioLetter(item.letter))}.gif" alt="${esc(item.letter)}口型动图" onerror="this.parentElement.style.display='none'">
              </div>
              <div class="pinyin-char">${esc(item.letter)}</div>
              <div class="pinyin-name">${esc(item.name)}</div>
            </div>
          `).join('')}
        </div>

        <div style="height: 20px;"></div>
      </div>
    `;
  }

  window.switchPinyinTab = function(tabKey) {
    activeTab = tabKey;
    render();
  };

  window.playPinyinLetter = function(letter) {
    if (window.AudioManager && window.AudioManager.playPinyinLetter) {
      window.AudioManager.playPinyinLetter(letter, 0.7);
    }
  };

  render();
};
