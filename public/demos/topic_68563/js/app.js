// ==================== 主应用逻辑 ====================

let currentStep = 1;
let isAnalyzing = false;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  initUpload();
  loadConfigToUI();
});

// ==================== 设置面板 ====================
function openSettings() {
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsMask').classList.add('open');
  loadConfigToUI();
}

function closeSettings() {
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsMask').classList.remove('open');
}

function loadConfigToUI() {
  document.getElementById('apiProvider').value = config.provider;
  document.getElementById('apiKey').value = config.apiKey || '';
  document.getElementById('apiBase').value = config.baseUrl || '';
  document.getElementById('visionModel').value = config.visionModel || '';
  document.getElementById('chatModel').value = config.chatModel || '';
}

function onProviderChange() {
  const provider = document.getElementById('apiProvider').value;
  const p = PROVIDERS[provider];
  if (p) {
    if (!document.getElementById('apiBase').value || document.getElementById('apiBase').value === PROVIDERS[config.provider]?.baseUrl) {
      document.getElementById('apiBase').value = p.baseUrl;
    }
    if (!document.getElementById('visionModel').value) {
      document.getElementById('visionModel').value = p.visionModel;
    }
    if (!document.getElementById('chatModel').value) {
      document.getElementById('chatModel').value = p.chatModel;
    }
  }
}

function saveSettings() {
  config.provider = document.getElementById('apiProvider').value;
  config.apiKey = document.getElementById('apiKey').value.trim();
  config.baseUrl = document.getElementById('apiBase').value.trim();
  config.visionModel = document.getElementById('visionModel').value.trim();
  config.chatModel = document.getElementById('chatModel').value.trim();
  
  saveConfigToStorage();
  closeSettings();
  
  // 更新按钮状态
  updateNextButton();
}

// ==================== 上传功能 ====================
function initUpload() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  // 点击上传
  uploadZone.addEventListener('click', () => fileInput.click());

  // 文件选择
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  });

  // 拖拽上传
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  });
}

async function handleFiles(files) {
  const count = await addPhotos(files);
  renderPreview();
  updateNextButton();
}

function renderPreview() {
  const photos = getAllPhotos();
  const preview = document.getElementById('uploadPreview');
  const grid = document.getElementById('previewGrid');
  const count = document.getElementById('photoCount');

  if (photos.length === 0) {
    preview.style.display = 'none';
    return;
  }

  preview.style.display = 'block';
  count.textContent = photos.length;

  grid.innerHTML = photos.map(p => {
    const thumbSrc = p.srcPath || `data:image/jpeg;base64,${p.thumbnail}`;
    const fullSrc = p.srcPath || `data:image/jpeg;base64,${p.fullBase64}`;
    return `
    <img src="${thumbSrc}"
         alt="${p.name}"
         title="${p.name}"
         onclick="openLightbox('${fullSrc}')">
  `;
  }).join('');
}

function doClearPhotos() {
  clearPhotos();
  renderPreview();
  updateNextButton();
  document.getElementById('fileInput').value = '';
}

function updateNextButton() {
  const btn = document.getElementById('startAnalyzeBtn');
  const hint = document.getElementById('nextHint');
  const hasPhotos = getPhotoCount() > 0;
  const hasKey = hasApiKey();
  
  btn.disabled = !hasPhotos;
  
  if (!hasPhotos) {
    hint.textContent = '请先上传或选择示例照片';
  } else if (!hasKey) {
    hint.textContent = '⚠️ 未配置API Key，将使用示例数据体验';
  } else {
    hint.textContent = '准备好了，点击开始AI分析';
  }
}

// ==================== 示例照片 ====================

async function loadSamplePhotos() {
  const samplePhotos = [
    { file: 'baby-hospital.jpg', year: 2020, month: 2, day: 15 },
    { file: 'baby-smile.jpg', year: 2020, month: 5, day: 20 },
    { file: 'baby-walking.jpg', year: 2021, month: 0, day: 8 },
    { file: 'beach-trip.jpg', year: 2022, month: 6, day: 22 },
    { file: 'birthday.jpg', year: 2023, month: 2, day: 15 },
    { file: 'kindergarten.jpg', year: 2023, month: 8, day: 1 },
    { file: 'family-dinner.jpg', year: 2023, month: 11, day: 25 },
    { file: 'old-photo.jpg', year: 1985, month: 5, day: 1 }
  ];

  clearPhotos();

  for (const sample of samplePhotos) {
    const date = new Date(sample.year, sample.month, sample.day);

    const photo = {
      id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      file: null,
      name: sample.file,
      srcPath: 'assets/sample/' + sample.file,
      thumbnail: null,
      fullBase64: null,
      width: 0,
      height: 0,
      date: date,
      year: date.getFullYear(),
      analysis: null
    };

    photoStore.photos.push(photo);
  }

  renderPreview();
  updateNextButton();
}

// ==================== 步骤导航 ====================
function goToStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById('step' + i).classList.remove('active');
    document.getElementById('dot' + i).classList.remove('active', 'done');
    if (i > 1) {
      document.getElementById('line' + (i - 1)).classList.remove('done');
    }
  }

  document.getElementById('step' + step).classList.add('active');
  document.getElementById('dot' + step).classList.add('active');

  for (let i = 1; i < step; i++) {
    document.getElementById('dot' + i).classList.add('done');
    if (i < step) {
      document.getElementById('line' + i).classList.add('done');
    }
  }

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 页面初始化
  if (step === 3) {
    initChroniclePage();
  }
  if (step === 4) {
    resetChat();
  }
}

// ==================== AI分析 ====================
async function startAnalysis() {
  if (isAnalyzing) return;
  
  if (!hasApiKey()) {
    // 没有API Key，使用内置示例数据
    useDemoData();
    return;
  }

  isAnalyzing = true;
  goToStep(2);

  // 重置步骤状态
  ['astep1', 'astep2', 'astep3', 'astep4'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (i === 0) el.classList.add('active');
  });

  document.getElementById('step1Progress').textContent = `0/${getPhotoCount()}`;
  document.getElementById('step4Progress').textContent = `0/${getPhotoCount()}`;
  document.getElementById('analyzeError').style.display = 'none';

  try {
    const storyData = await runFullAnalysis(
      (stepIdx) => {
        // 步骤切换
        const stepIds = ['astep1', 'astep2', 'astep3', 'astep4'];
        stepIds.forEach((id, i) => {
          const el = document.getElementById(id);
          el.classList.remove('active');
          if (i < stepIdx) el.classList.add('done');
          if (i === stepIdx) el.classList.add('active');
        });
      },
      (stepIdx, cur, total) => {
        // 进度更新
        if (stepIdx === 0) {
          document.getElementById('step1Progress').textContent = `${cur}/${total}`;
        }
        if (stepIdx === 3) {
          document.getElementById('step4Progress').textContent = `${cur}/${total}`;
        }
      }
    );

    // 标记最后一步完成
    document.getElementById('astep4').classList.remove('active');
    document.getElementById('astep4').classList.add('done');

    // 稍作停留后跳转
    setTimeout(() => {
      goToStep(3);
    }, 800);

  } catch (e) {
    console.error('分析失败:', e);
    document.getElementById('analyzeError').style.display = 'block';
    document.getElementById('errorMsg').textContent = e.message;
  }

  isAnalyzing = false;
}

/**
 * 使用内置演示数据（无API Key时）
 */
function useDemoData() {
  goToStep(2);
  
  // 模拟分析动画
  const stepIds = ['astep1', 'astep2', 'astep3', 'astep4'];
  let stepIdx = 0;
  
  const interval = setInterval(() => {
    if (stepIdx > 0) {
      document.getElementById(stepIds[stepIdx - 1]).classList.remove('active');
      document.getElementById(stepIds[stepIdx - 1]).classList.add('done');
    }
    
    if (stepIdx < stepIds.length) {
      document.getElementById(stepIds[stepIdx]).classList.add('active');
      if (stepIdx === 0) {
        document.getElementById('step1Progress').textContent = `${getPhotoCount()}/${getPhotoCount()}`;
      }
      if (stepIdx === 3) {
        document.getElementById('step4Progress').textContent = `${getPhotoCount()}/${getPhotoCount()}`;
      }
      stepIdx++;
    } else {
      clearInterval(interval);
      
      // 使用照片的文件名生成简单的演示故事数据
      const demoStories = generateDemoStoryData();
      setStoryData(demoStories);
      
      setTimeout(() => goToStep(3), 600);
    }
  }, 900);
}

/**
 * 生成演示用的故事数据
 */
function generateDemoStoryData() {
  const photos = getAllPhotos();
  const byYear = {};
  
  const storyTemplates = {
    'baby-hospital': {
      title: '你好，小世界',
      story: '这一天，你来到了这个世界。小小的身子，皱巴巴的脸，却让整个病房都充满了阳光。爸爸小心翼翼地抱着你，妈妈温柔地看着你，那一刻，我们知道，家从此完整了。',
      tags: ['出生', '医院', '新生儿', '第一天']
    },
    'baby-smile': {
      title: '第一个微笑',
      story: '你第一次对我们笑了，没有任何预兆，就像阳光突然冲破云层。那个笑容融化了所有熬夜的疲惫，让我们相信，所有的辛苦都是值得的。',
      tags: ['微笑', '百天', '成长', '第一次']
    },
    'baby-walking': {
      title: '勇敢的第一步',
      story: '你摇摇晃晃地迈出了人生第一步，像一只小企鹅，又紧张又兴奋。妈妈在前面张开双臂，你笑着扑过来。从那天起，这个世界对你来说，又大了一点点。',
      tags: ['学走路', '成长里程碑', '第一次']
    },
    'beach-trip': {
      title: '第一次看海',
      story: '第一次看到大海，你吓得不敢踩水，后来又玩得不想走。我们一起堆了一个歪歪扭扭的沙堡，海浪一来就冲垮了，但你的笑声，比浪花还响亮。',
      tags: ['海边', '旅行', '夏天', '全家福']
    },
    'birthday': {
      title: '三岁生日快乐',
      story: '吹蜡烛的时候，你闭上眼睛，认真地许了个愿。全家人围着你，唱着生日歌。爷爷奶奶笑得最开心，他们说，你跟爸爸小时候一模一样。',
      tags: ['生日', '三岁', '全家福', '庆祝']
    },
    'kindergarten': {
      title: '幼儿园第一天',
      story: '背上小书包，你站在幼儿园门口，回头看了我们一眼。眼睛里有好奇，也有一点点紧张，但你还是勇敢地走进去了。爸爸在门口站了很久，既骄傲又舍不得。',
      tags: ['幼儿园', '开学', '三岁半', '第一次']
    },
    'family-dinner': {
      title: '团圆饭',
      story: '三代人围坐在一张桌子旁，饭菜冒着热气，大家说着笑着。爷爷奶奶的头发又白了一些，但他们看你的眼神，还是那么温柔。这就是家的味道吧。',
      tags: ['团圆', '年夜饭', '全家福', '温暖']
    },
    'old-photo': {
      title: '爷爷奶奶年轻的时候',
      story: '这张老照片已经有些泛黄了，但爷爷奶奶的笑容还是那么清晰。那时候他们也很年轻，就像现在的我们。时间在走，但有些东西，一直没变。',
      tags: ['老照片', '爷爷奶奶', '怀旧', '家族记忆']
    }
  };

  photos.forEach(photo => {
    const year = photo.year;
    if (!byYear[year]) byYear[year] = [];
    
    // 匹配文件名找模板
    let template = { title: '珍贵的时刻', story: photo.name, tags: ['回忆'] };
    for (const key in storyTemplates) {
      if (photo.name.includes(key)) {
        template = storyTemplates[key];
        break;
      }
    }
    
    byYear[year].push({
      id: photo.id,
      srcPath: photo.srcPath,
      day: photo.date.getDate(),
      month: `${year}年${photo.date.getMonth() + 1}月`,
      date: photo.date,
      thumbnail: photo.thumbnail,
      fullBase64: photo.fullBase64,
      title: template.title,
      story: template.story,
      tags: template.tags
    });
  });

  // 按日期排序
  Object.keys(byYear).forEach(year => {
    byYear[year].sort((a, b) => a.date - b.date);
  });

  return byYear;
}

// ==================== 对话功能 ====================
function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

function handleKeyPress(e) {
  if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  if (!hasApiKey()) {
    // 演示模式，使用本地模拟回复
    sendDemoReply(text);
    return;
  }

  await sendChatMessage(text);
}

/**
 * 演示模式下的模拟回复
 */
function sendDemoReply(text) {
  addChatMessage('user', text);
  showTypingIndicator();
  setSendButtonEnabled(false);

  setTimeout(() => {
    const reply = getDemoReply(text);
    hideTypingIndicator();
    addChatMessage('ai', reply.text, reply.photos);
    setSendButtonEnabled(true);
    document.getElementById('chatInput').value = '';
    document.getElementById('chatInput').focus();
  }, 800);
}

function getDemoReply(question) {
  const q = question.toLowerCase();
  const photos = getAllPhotos();
  
  const findPhoto = (keyword) => {
    const p = photos.find(p => p.name.includes(keyword));
    return p ? (p.srcPath || `data:image/jpeg;base64,${p.fullBase64}`) : null;
  };

  if (q.includes('走路') || q.includes('第一步')) {
    const photo = findPhoto('baby-walking');
    return {
      text: '宝宝第一次走路是在<strong>2021年1月</strong>哦～<br><br>那时候才十个月大，摇摇晃晃的像个小企鹅，既紧张又兴奋。妈妈在前面张开双臂等着，最后笑着扑进妈妈怀里。<br><br>这可是人生中重要的里程碑呢！',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('海边') || q.includes('海')) {
    const photo = findPhoto('beach-trip');
    return {
      text: '你们去过海边哦～是2022年夏天的家庭旅行！<br><br>那是宝宝两岁多的时候第一次看到大海，一开始还不敢踩水，后来玩得都不想走了。一家人堆了个歪歪扭扭的沙堡，虽然很快被海浪冲垮了，但笑声特别响亮～',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('生日')) {
    const photo = findPhoto('birthday');
    return {
      text: '有生日的照片呢！是2023年的三岁生日～<br><br>那天全家人都来了，爷爷奶奶笑得最开心。宝宝闭上眼睛认真许愿的样子，特别可爱。',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('爷爷') || q.includes('奶奶') || q.includes('老照片')) {
    const photo = findPhoto('old-photo');
    return {
      text: '有一张爷爷奶奶年轻时候的老照片，大概是1980年代拍的～<br><br>虽然照片已经有些泛黄了，但他们的笑容还是那么清晰。那时候他们也很年轻，就像现在的爸爸妈妈一样。',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('幼儿园')) {
    const photo = findPhoto('kindergarten');
    return {
      text: '宝宝上幼儿园是在<strong>2023年9月</strong>！<br><br>那时候三岁半，背上小书包站在教室门口，回头看了爸爸一眼，眼睛里有好奇也有一点点紧张，但还是勇敢地走进去了。',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('出生') || q.includes('刚生') || q.includes('第一天')) {
    const photo = findPhoto('baby-hospital');
    return {
      text: '宝宝出生是在<strong>2020年3月</strong>！<br><br>小小的身子，皱巴巴的脸，却让整个病房都充满了阳光。爸爸小心翼翼地抱着她，妈妈温柔地看着她。那一天，家从此完整了。',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('笑') || q.includes('微笑')) {
    const photo = findPhoto('baby-smile');
    return {
      text: '宝宝第一个真正的微笑是在百天的时候～<br><br>没有任何预兆，就像阳光突然冲破云层。那个笑容融化了所有熬夜的疲惫。',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('全家福') || q.includes('全家')) {
    const p1 = findPhoto('birthday');
    const p2 = findPhoto('family-dinner');
    const photos = [p1, p2].filter(Boolean);
    return {
      text: '全家福有好多张哦～给你看最热闹的两张：<br><br>一张是三岁生日那天，全家人围着蛋糕唱生日歌；另一张是过年的团圆饭，三代人围坐在一起，饭菜冒着热气。<br><br>这就是最幸福的样子吧。',
      photos: photos
    };
  }

  if (q.includes('谁') || q.includes('人') || q.includes('都有')) {
    const photo = findPhoto('family-dinner');
    return {
      text: '从照片里看，这是一个三代同堂的大家庭～<br><br>有宝宝、爸爸妈妈，还有爷爷奶奶。一家人经常一起庆祝生日、过节、旅行，看起来特别温馨幸福。',
      photos: photo ? [photo] : []
    };
  }

  if (q.includes('温暖') || q.includes('感动') || q.includes('最')) {
    const p1 = findPhoto('baby-hospital');
    const p2 = findPhoto('old-photo');
    const photos = [p1, p2].filter(Boolean);
    return {
      text: '最温暖的瞬间有很多～<br><br>比如宝宝出生的那一刻，全家人第一次见面；还有爷爷奶奶的老照片，跨越几十年的时光，笑容依然那么温暖。<br><br>其实每张照片背后，都是满满的爱呀。',
      photos: photos
    };
  }

  if (q.includes('成长') || q.includes('故事')) {
    const p1 = findPhoto('baby-hospital');
    const p2 = findPhoto('kindergarten');
    const photos = [p1, p2].filter(Boolean);
    return {
      text: '宝宝的成长故事真的很动人～<br><br>从刚出生的小小一只，到百天的第一个微笑，到十个月学走路，再到三岁背上小书包上幼儿园...<br><br>每一步都充满了爱和期待，一眨眼就长这么大了。',
      photos: photos
    };
  }

  return {
    text: `我从${photos.length}张照片里找到了很多温暖的故事～<br><br>你可以问问我：<br>• 宝宝第一次走路是什么时候？<br>• 我们去过海边吗？<br>• 给我看看全家福<br>• 讲讲成长的故事<br><br>有什么想回忆的，尽管问我哦 ✨`,
    photos: []
  };
}

// ==================== Lightbox ====================
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});
