const fs = require('fs');

const jsContent = `
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.dataset.tab;
    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
});

const filterTabs = document.querySelectorAll('.filter-tab');
const topicCards = document.querySelectorAll('.topic-card');

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    topicCards.forEach(card => {
      if (filter === 'all' || card.dataset.filter === filter) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

function startCall() {
  showToast('正在拨打电话...');
}

function goToTopics() {
  document.querySelector('.nav-item[data-tab="topics"]').click();
}

function goToRecords() {
  document.querySelector('.nav-item[data-tab="records"]').click();
}

function goToReminder() {
  document.querySelector('.nav-item[data-tab="reminder"]').click();
}

function goToSettings() {
  showToast('设置功能开发中');
}

function markReminderDone(btn) {
  btn.textContent = '已完成';
  btn.classList.add('outline');
  btn.classList.remove('primary');
  showToast('提醒已标记完成');
}

function copyTopic(btn) {
  const topicText = btn.parentElement.querySelector('.topic-content p').textContent;
  navigator.clipboard.writeText(topicText).then(() => {
    showToast('话题已复制到剪贴板');
  });
}

function generateTopics() {
  showToast('正在生成新话题...');
}

function addRecord() {
  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  stopVoiceRecognition();
}

function toggleTag(btn) {
  btn.classList.toggle('active');
}

function saveRecord() {
  const contact = document.getElementById('record-contact').value;
  const time = document.getElementById('record-time').value;
  const content = document.getElementById('record-content').value;
  if (!content.trim()) {
    showToast('请填写通话要点');
    return;
  }
  showToast('记录已保存');
  closeModal();
  document.getElementById('record-contact').value = '妈妈';
  document.getElementById('record-time').value = '';
  document.getElementById('record-content').value = '';
  document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
}

function editRecord(btn) {
  showToast('编辑功能开发中');
}

function deleteRecord(btn) {
  if (confirm('确定要删除这条记录吗？')) {
    btn.closest('.record-card').remove();
    showToast('记录已删除');
  }
}

let recognition = null;
let isRecording = false;

function toggleVoiceRecognition() {
  const voiceBtn = document.getElementById('voice-btn');
  const voiceStatus = document.getElementById('voice-status');
  if (isRecording) {
    stopVoiceRecognition();
    return;
  }
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('您的浏览器不支持语音识别功能');
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';
  recognition.onstart = function() {
    isRecording = true;
    voiceBtn.classList.add('active');
    voiceBtn.textContent = '\\u23F9';
    voiceStatus.style.display = 'flex';
    document.getElementById('voice-status-text').textContent = '正在录音...';
    showToast('开始录音，请说话');
  };
  recognition.onresult = function(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    const textarea = document.getElementById('record-content');
    textarea.value = finalTranscript + interimTranscript;
  };
  recognition.onerror = function(event) {
    showToast('语音识别出错，请重试');
    stopVoiceRecognition();
  };
  recognition.onend = function() {
    if (isRecording) {
      recognition.start();
    }
  };
  recognition.start();
}

function stopVoiceRecognition() {
  const voiceBtn = document.getElementById('voice-btn');
  const voiceStatus = document.getElementById('voice-status');
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isRecording = false;
  voiceBtn.classList.remove('active');
  voiceBtn.textContent = '\\uD83C\\uDFA4';
  voiceStatus.style.display = 'none';
  const textarea = document.getElementById('record-content');
  if (textarea.value.trim()) {
    showToast('语音转文字完成');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const dateTimeStr = now.toISOString().slice(0, 16);
  document.getElementById('record-time').value = dateTimeStr;
});
`;

fs.writeFileSync('js/app.js', jsContent, 'utf8');
console.log('File written successfully');
