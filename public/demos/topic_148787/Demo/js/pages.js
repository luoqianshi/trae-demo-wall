let currentStoryIndex = -1;
let isStoryPlaying = false;

function simulatePhotoUpload() {
  const initialState = document.getElementById('upload-initial');
  const repairingState = document.getElementById('upload-repairing');
  const doneState = document.getElementById('upload-done');

  if (initialState) initialState.style.display = 'none';
  if (repairingState) repairingState.style.display = 'block';
  if (doneState) doneState.style.display = 'none';

  const progressBar = document.getElementById('repair-progress-bar');
  const progressText = document.getElementById('repair-progress-text');
  const statusText = document.getElementById('repair-status-text');
  const repairingImg = document.getElementById('repairing-img');

  const stages = [
    { progress: 20, text: '正在分析照片...', filter: 'blur(2px) grayscale(0.5)', delay: 800 },
    { progress: 45, text: '正在修复模糊...', filter: 'blur(1px) grayscale(0.3)', delay: 1200 },
    { progress: 70, text: '正在上色还原...', filter: 'blur(0) grayscale(0.1)', delay: 1000 },
    { progress: 90, text: '正在增强细节...', filter: 'blur(0) grayscale(0) brightness(1.05)', delay: 800 },
    { progress: 100, text: '修复完成', filter: 'blur(0) grayscale(0)', delay: 500 },
  ];

  let currentStage = 0;

  function runStage() {
    if (currentStage >= stages.length) {
      setTimeout(() => {
        if (repairingState) repairingState.style.display = 'none';
        if (doneState) doneState.style.display = 'block';
      }, 500);
      return;
    }

    const stage = stages[currentStage];
    if (progressBar) progressBar.style.width = stage.progress + '%';
    if (progressText) progressText.textContent = stage.progress + '%';
    if (statusText) statusText.textContent = stage.text;
    if (repairingImg) repairingImg.style.filter = stage.filter;

    currentStage++;
    setTimeout(runStage, stage.delay);
  }

  setTimeout(runStage, 500);
}

function resetPhotoUpload() {
  const initialState = document.getElementById('upload-initial');
  const repairingState = document.getElementById('upload-repairing');
  const doneState = document.getElementById('upload-done');

  if (initialState) initialState.style.display = 'block';
  if (repairingState) repairingState.style.display = 'none';
  if (doneState) doneState.style.display = 'none';

  const progressBar = document.getElementById('repair-progress-bar');
  if (progressBar) progressBar.style.width = '0%';
}

function showStoryDetail(index) {
  const story = mockData.stories[index];
  if (!story) return;

  currentStoryIndex = index;
  isStoryPlaying = false;

  const coverImg = document.getElementById('story-detail-cover');
  const titleEl = document.getElementById('story-detail-title');
  const dateEl = document.getElementById('story-detail-date');
  const durationEl = document.getElementById('story-detail-duration');
  const contentEl = document.getElementById('story-detail-content');

  if (coverImg) coverImg.src = story.cover;
  if (titleEl) titleEl.textContent = story.title;
  if (dateEl) dateEl.textContent = story.date;
  if (durationEl) durationEl.textContent = story.duration;
  if (contentEl) {
    const fullContent = story.content + '这是一个真实而珍贵的回忆，记录了' + AppState.settings.elderName + '生命中的一段美好时光。每一个细节都值得被铭记，每一个故事都值得被传承。这些回忆不仅是个人的财富，更是整个家族的珍宝，将一代又一代地流传下去。';
    const formattedContent = fullContent.split(/[。！？]/).filter(p => p.trim()).map(p => '<p>' + p.trim() + '。</p>').join('');
    contentEl.innerHTML = formattedContent;
  }

  updatePlayButton();
  showPage('story-detail');
}

function toggleStoryPlay() {
  isStoryPlaying = !isStoryPlaying;
  updatePlayButton();
}

function updatePlayButton() {
  const playBtn = document.getElementById('story-play-btn');
  if (!playBtn) return;

  if (isStoryPlaying) {
    playBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="margin-right: 8px;">
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
      </svg>
      暂停
    `;
  } else {
    playBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="margin-right: 8px;">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      播放
    `;
  }
}

function startGenerateMemoir() {
  const previewState = document.getElementById('memoir-preview-state');
  const generatingState = document.getElementById('memoir-generating-state');
  const doneState = document.getElementById('memoir-done-state');

  if (previewState) previewState.style.display = 'none';
  if (generatingState) generatingState.style.display = 'block';
  if (doneState) doneState.style.display = 'none';

  const progressBar = document.getElementById('memoir-progress-bar');
  const progressText = document.getElementById('memoir-progress-text');
  const stepTitle = document.getElementById('generating-step-title');
  const stepDesc = document.getElementById('generating-step-desc');
  const stepIcon = document.querySelector('#memoir-generating-state .generate-step-icon');

  const stages = [
    { progress: 25, title: '正在编排章节...', desc: 'AI正在整理故事时间线', delay: 1000 },
    { progress: 50, title: '正在润色文字...', desc: '让故事更加生动流畅', delay: 1500 },
    { progress: 75, title: '正在搭配照片...', desc: '将照片与故事关联', delay: 1200 },
    { progress: 95, title: '正在生成封面...', desc: '设计专属回忆录封面', delay: 1000 },
    { progress: 100, title: '生成完成', desc: '您的回忆录已准备好', delay: 800 },
  ];

  let currentStage = 0;

  function runStage() {
    if (currentStage >= stages.length) {
      setTimeout(() => {
        if (generatingState) generatingState.style.display = 'none';
        if (doneState) doneState.style.display = 'block';
        if (stepIcon) {
          stepIcon.classList.remove('active');
          stepIcon.classList.add('done');
          stepIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>';
        }
      }, 500);
      return;
    }

    const stage = stages[currentStage];
    if (progressBar) progressBar.style.width = stage.progress + '%';
    if (progressText) progressText.textContent = stage.progress + '%';
    if (stepTitle) stepTitle.textContent = stage.title;
    if (stepDesc) stepDesc.textContent = stage.desc;

    currentStage++;
    setTimeout(runStage, stage.delay);
  }

  setTimeout(runStage, 500);
}

function simulateVoiceClone() {
  alert('声音复刻功能演示：\n\n在实际应用中，这里会引导用户录制10段语音样本，AI会学习并复刻用户的声音。\n\nDemo中已模拟完成声音复刻，之后播放故事时将使用复刻的声音。');
}

window.simulatePhotoUpload = simulatePhotoUpload;
window.resetPhotoUpload = resetPhotoUpload;
window.showStoryDetail = showStoryDetail;
window.toggleStoryPlay = toggleStoryPlay;
window.startGenerateMemoir = startGenerateMemoir;
window.simulateVoiceClone = simulateVoiceClone;
