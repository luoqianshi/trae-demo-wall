const photos = {
  spring: {
    id: 'spring',
    title: '春节全家福',
    img: 'assets/photos/spring-family.jpg',
    desc: '一家人围坐在年夜饭桌前，老屋里的灯、餐具和笑脸都带着过年的热闹。',
    tags: ['团圆', '年夜饭', '老屋', '一家人'],
    memoryTitle: '年夜饭桌前的团圆',
    story: '这张照片像是一场春节团聚。大家围在圆桌前，桌上的杯盏、粉色餐巾和身后的老式屏风，把那一年过年的热闹都留下来了。AI 可以轻声问老人：那年是谁最早到家？年夜饭里哪道菜最受欢迎？',
    elderText: '家人给您送来一张春节全家福。可以一起想想：那一年年夜饭是谁掌勺，谁坐在您旁边，屋里是不是特别热闹。',
    questions: ['那年年夜饭是谁掌勺？', '照片里谁最爱笑？', '春节时家里最常做哪道菜？'],
    topics: ['今晚可以问妈妈：这张全家福是哪一年春节拍的？', '可以聊聊：那时候过年家里最热闹的一个环节是什么？', '可以问问：年夜饭里哪道菜最像家的味道？'],
    reply: '妈，我刚看到这张春节全家福，特别想听您讲讲那年年夜饭的故事。今晚我给您打电话，我们慢慢聊。',
    reportTheme: '春节团圆、年夜饭、老屋里的家庭记忆'
  },
  work: {
    id: 'work',
    title: '年轻时工作照',
    img: 'assets/photos/young-work.jpg',
    desc: '年轻时认真工作的瞬间，笑容很亮，也能看见那个年代的手艺、责任和生活劲头。',
    tags: ['年轻时', '工作', '手艺', '奋斗'],
    memoryTitle: '年轻时认真做事的样子',
    story: '这张照片记录了年轻时工作的瞬间。人脸上的笑容非常自然，手边的工具和环境让人想到过去靠双手认真生活的日子。AI 可以引导老人聊：那时每天几点开工？第一次学会这门手艺时是什么心情？',
    elderText: '家人给您送来一张年轻时的工作照。可以想想：那时候每天最忙的是什么，谁教会了您这门手艺，您最得意的一次工作是什么。',
    questions: ['这份工作是从什么时候开始的？', '当年最难学的手艺是什么？', '那时下班后最想吃什么？'],
    topics: ['今晚可以问爸爸：这张工作照是在什么地方拍的？', '可以聊聊：年轻时最辛苦但最有成就感的一天。', '可以问问：那时候一起工作的人，现在还记得谁？'],
    reply: '爸，这张年轻时的工作照太有精神了。我想听您讲讲那时候学手艺的事，今晚给您打电话。',
    reportTheme: '年轻时的工作、手艺、努力生活的记忆'
  },
  courtyard: {
    id: 'courtyard',
    title: '老家院子合影',
    img: 'assets/photos/home-courtyard.jpg',
    desc: '老树下、院墙边，几位老人坐着聊天乘凉，像很多人记忆里的老家下午。',
    tags: ['老家院子', '老树', '乘凉', '老友'],
    memoryTitle: '老树下的院子时光',
    story: '这张照片里有老家的院子、大树和围坐聊天的人。这样的场景很容易唤起老人对邻里、夏天、蒲扇和家门口闲谈的记忆。AI 可以温柔地问：这棵树陪了家里多久？以前大家最常在院子里聊什么？',
    elderText: '家人给您送来一张老家院子的照片。可以想想：这棵树下以前都坐过谁，夏天乘凉时大家最爱聊什么。',
    questions: ['这棵树在院子里有多少年了？', '以前夏天大家怎么乘凉？', '邻里之间最常聊什么？'],
    topics: ['今晚可以问爷爷：这棵老树是什么时候种下的？', '可以聊聊：院子里最热闹的一次聚会。', '可以问问：小时候夏天乘凉时，家里人都坐在哪里？'],
    reply: '爷爷，我看到老家院子的照片了，感觉特别亲切。今晚我想听您讲讲那棵树和院子里的故事。',
    reportTheme: '老家院子、老树乘凉、邻里闲谈的生活记忆'
  }
};

const steps = [
  ['select', '选择照片'], ['generate', '生成回忆'], ['send', '发送老人'], ['listen', '听回忆'],
  ['safe', '报平安'], ['topic', '生成话题'], ['reply', '回复关心'], ['report', '陪伴周报']
];

const state = {
  selected: null,
  completed: new Set(),
  sent: false,
  notifications: [],
  interactionCount: 0,
  currentStep: 'select'
};

const $ = (id) => document.getElementById(id);
const qs = (sel) => document.querySelector(sel);
const photoList = $('photoList');
const memoryCard = $('memoryCard');
const elderGreeting = $('elderGreeting');
const elderMemory = $('elderMemory');
const connectionText = $('connectionText');
const eventLog = $('eventLog');
const stepper = $('stepper');
const toast = $('toast');
const topicList = $('topicList');
const reportModal = $('reportModal');
const reportContent = $('reportContent');

function addEvent(title, text){
  const item = { title, text, time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) };
  state.notifications.unshift(item);
  state.notifications = state.notifications.slice(0, 5);
  renderEventLog();
}

function renderEventLog(){
  if(!state.notifications.length){
    eventLog.innerHTML = '<div class="event-item"><strong>连接记录</strong>选择照片后，这里会显示家庭消息同步过程。</div>';
    return;
  }
  eventLog.innerHTML = state.notifications.map(n => `<div class="event-item"><strong>${n.title} · ${n.time}</strong>${n.text}</div>`).join('');
}

function mark(step){
  state.completed.add(step);
  state.currentStep = step;
  renderStepper();
}

function nextStep(step){
  state.currentStep = step;
  renderStepper();
}

function renderStepper(){
  stepper.innerHTML = steps.map(([id,label], idx) => {
    const done = state.completed.has(id);
    const active = state.currentStep === id;
    return `<div class="step ${done?'done':''} ${active?'active':''}"><b>${done?'✓':idx+1}</b>${label}</div>`;
  }).join('');
}

function renderPhotos(){
  photoList.innerHTML = Object.values(photos).map(p => `
    <button class="photo-card ${state.selected===p.id?'selected':''}" data-photo="${p.id}" aria-label="选择${p.title}">
      <img src="${p.img}" alt="${p.title}" />
      <div class="photo-info">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <div class="photo-tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>
        <em class="click-tip">点击图片选择这个记忆场景</em>
      </div>
    </button>`).join('');
  document.querySelectorAll('[data-photo]').forEach(btn => btn.addEventListener('click', () => selectPhoto(btn.dataset.photo)));
}

function selectPhoto(id){
  state.selected = id;
  const p = photos[id];
  renderPhotos();
  memoryCard.innerHTML = `<h4>${p.title}</h4><p>${p.desc}</p><ul>${p.questions.map(q=>`<li>${q}</li>`).join('')}</ul>`;
  connectionText.textContent = `已选择「${p.title}」，可以生成回忆卡。`;
  addEvent('已选择照片', `子女端选择了「${p.title}」，场景提示为：${p.tags.join('、')}。`);
  mark('select');
  nextStep('generate');
  showToast(`已选择：${p.title}`);
}

function generateMemory(){
  if(!state.selected){ showToast('请先点击一张照片进行选择。'); return; }
  const p = photos[state.selected];
  memoryCard.innerHTML = `<h4>正在生成回忆卡...</h4><p>AI 正在根据照片和旁边的文字提示整理适合老人收听的回忆文案。</p>`;
  connectionText.textContent = '正在把照片转成温柔的回忆卡。';
  setTimeout(()=>{
    memoryCard.innerHTML = `<h4>${p.memoryTitle}</h4><p>${p.story}</p><strong>适合继续聊的问题</strong><ul>${p.questions.map(q=>`<li>${q}</li>`).join('')}</ul>`;
    addEvent('回忆卡已生成', `AI 生成了「${p.memoryTitle}」，可一键发送给老人端。`);
    connectionText.textContent = '回忆卡已生成，等待发送给老人。';
    mark('generate'); nextStep('send'); showToast('回忆卡生成完成');
  },650);
}

function sendToElder(){
  if(!state.selected){ showToast('请先选择照片并生成回忆卡。'); return; }
  const p = photos[state.selected];
  state.sent = true;
  elderGreeting.innerHTML = `<strong>王奶奶，家人给您送来一段回忆</strong><p>这是一张「${p.title}」，可以点下面的大按钮听一听。</p>`;
  elderMemory.innerHTML = `<div class="memory-cover" style="background-image:url('${p.img}')"></div><div><strong>${p.memoryTitle}</strong><p>${p.elderText}</p></div>`;
  connectionText.textContent = `「${p.title}」已经送到老人端。`;
  addEvent('已发送给老人', `老人端收到「${p.memoryTitle}」，可以点击大按钮收听。`);
  mark('send'); nextStep('listen'); showToast('已发送到老人端');
}

function listenMemory(){
  if(!state.sent){ showToast('家人还没有发送回忆卡，先在左侧发送。'); return; }
  const p = photos[state.selected];
  const wave = $('voiceWave');
  wave.classList.add('active');
  elderGreeting.innerHTML = `<strong>正在为您读这段回忆</strong><p>${p.elderText}</p>`;
  connectionText.textContent = '老人端正在收听回忆，子女端同步记录了一次陪伴互动。';
  addEvent('老人听了回忆', `老人端播放了「${p.memoryTitle}」。`);
  state.interactionCount += 1;
  mark('listen'); nextStep('safe');
  if('speechSynthesis' in window){
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(p.elderText);
    utter.lang = 'zh-CN'; utter.rate = .86; utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }
  setTimeout(()=> wave.classList.remove('active'), 3200);
}

function elderAction(type){
  const textMap = {
    safe: ['老人报平安', '妈妈刚刚告诉家人：我很好。今晚可以继续打个电话问候一下。', '王奶奶，已经帮您告诉家人：我很好。'],
    miss: ['老人表达想念', '妈妈刚刚说想孩子了。建议今晚发一句关心，再打个电话慢慢聊。', '王奶奶，已经帮您告诉家人：我想你们了。'],
    water: ['温柔提醒已设置', '妈妈点了提醒喝水，系统已记录为一次生活照护提醒。', '王奶奶，已经为您记下喝水提醒。'],
    meal: ['生活状态已记录', '妈妈告诉家人今天已经吃过饭了，子女端收到一条安心消息。', '王奶奶，已经帮您告诉家人：今天吃过饭了。']
  };
  const [title, log, elder] = textMap[type];
  elderGreeting.innerHTML = `<strong>${elder}</strong><p>家人看到后，会更容易接上一句温柔的问候。</p>`;
  addEvent(title, log);
  state.interactionCount += 1;
  connectionText.textContent = '老人端的大按钮消息已同步给子女端。';
  if(type === 'safe') mark('safe');
  else state.completed.add('safe');
  nextStep('topic'); renderStepper(); showToast('已同步给子女端');
}

function generateTopics(){
  if(!state.selected){ showToast('先选择一张照片，话题会更具体。'); return; }
  const p = photos[state.selected];
  topicList.innerHTML = `<ol>${p.topics.map(t=>`<li>${t}</li>`).join('')}</ol><p><strong>可直接发送：</strong>${p.reply}</p>`;
  addEvent('通话话题已生成', `系统基于「${p.title}」生成了今晚可以聊的话题。`);
  connectionText.textContent = '子女端已经有了今晚通话的开场话题。';
  mark('topic'); nextStep('reply'); showToast('今晚话题已生成');
}

function replyCare(){
  const p = state.selected ? photos[state.selected] : photos.spring;
  $('familyReply').innerHTML = `<span>家人回复</span><p>${p.reply}</p>`;
  addEvent('子女发送关心', '老人端收到一条来自家人的温柔回复。');
  connectionText.textContent = '家人的关心已经送到老人端。';
  state.interactionCount += 1;
  mark('reply'); nextStep('report'); showToast('已发送一句关心');
}

function showReport(){
  const p = state.selected ? photos[state.selected] : photos.spring;
  reportContent.innerHTML = `
    <div class="report-box"><strong>本周记忆主题</strong><p>${p.reportTheme}</p></div>
    <div class="report-box"><strong>互动摘要</strong><p>本次体验中，家庭完成了 ${Math.max(state.interactionCount, 3)} 次陪伴互动：选择照片、收听回忆、报平安或发送关心。</p></div>
    <div class="report-box"><strong>陪伴建议</strong><p>今晚可以围绕「${p.title}」打一个 10 分钟电话，不追问、不催促，只从照片里的一个细节开始聊。</p></div>
  `;
  addEvent('陪伴周报已生成', '子女端整理出本周可继续陪伴的话题和建议。');
  mark('report');
  if(typeof reportModal.showModal === 'function') reportModal.showModal();
  else alert(reportContent.textContent);
}

function resetAll(){
  state.selected = null; state.completed = new Set(); state.sent = false; state.notifications = []; state.interactionCount = 0; state.currentStep = 'select';
  renderPhotos(); renderEventLog(); renderStepper();
  memoryCard.innerHTML = '<p class="empty-title">尚未选择照片</p><p>请先点击上方任意照片，AI 会根据照片旁的场景提示生成一张温柔的家庭回忆卡。</p>';
  elderGreeting.innerHTML = '<strong>王奶奶，下午好</strong><p>家人还没有发送新的回忆卡。</p>';
  elderMemory.innerHTML = '<div class="memory-cover blank"></div><div><strong>等待一段回忆</strong><p>收到后可点击大按钮收听。</p></div>';
  topicList.innerHTML = '<p>生成后会出现 3 个适合今晚打电话的开场话题。</p>';
  $('familyReply').innerHTML = '<span>家人回复</span><p>等待子女发送一句关心。</p>';
  connectionText.textContent = '等待子女选择一张老照片。';
  showToast('体验已重置');
}

function showToast(msg){
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(()=>toast.classList.remove('show'), 1900);
}

document.addEventListener('DOMContentLoaded', () => {
  renderPhotos(); renderEventLog(); renderStepper();
  qs('[data-scroll-demo]')?.addEventListener('click', () => $('demo').scrollIntoView({behavior:'smooth'}));
  qs('[data-scroll-value]')?.addEventListener('click', () => $('value').scrollIntoView({behavior:'smooth'}));
  $('generateBtn').addEventListener('click', generateMemory);
  $('sendBtn').addEventListener('click', sendToElder);
  $('listenBtn').addEventListener('click', listenMemory);
  $('topicBtn').addEventListener('click', generateTopics);
  $('replyBtn').addEventListener('click', replyCare);
  $('reportBtn').addEventListener('click', showReport);
  $('resetBtn').addEventListener('click', resetAll);
  $('closeReport').addEventListener('click', () => reportModal.close());
  $('finishBtn').addEventListener('click', () => { reportModal.close(); showToast('完整体验已完成，可以录屏或截图提交'); });
  document.querySelectorAll('[data-elder-action]').forEach(btn => btn.addEventListener('click', () => elderAction(btn.dataset.elderAction)));
});
