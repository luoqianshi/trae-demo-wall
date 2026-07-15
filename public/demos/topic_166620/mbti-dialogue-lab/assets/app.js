(function () {
  var tabs = document.querySelectorAll('[data-tab]');
  var screens = document.querySelectorAll('.screen');
  var tabButtons = document.querySelectorAll('.tab-btn');
  var chips = document.querySelectorAll('.type-chip');
  var chatInput = document.querySelector('#chatInput');
  var sendBtn = document.querySelector('#sendBtn');
  var chatList = document.querySelector('#chatList');
  var genderButtons = document.querySelectorAll('[data-gender]');
  var currentType = 'ENFJ';
  var currentName = '主持人';
  var currentGender = 'female';

  var genderModel = {
    female: {
      label: '女性表达模型',
      focus: '更重视情绪确认与关系安全感',
      desc: '会先判断对方是否被理解，再推动问题解决；适合恋爱沟通、朋友争吵、团队安抚类场景。',
      need: '核心需求：被回应',
      risk: '误解风险：过度照顾',
      tone: '语气：温和确认',
      replyPrefix: '按女性表达模型，我会更先确认关系温度和情绪落点。'
    },
    male: {
      label: '男性表达模型',
      focus: '更倾向先定位问题与行动路径',
      desc: '会先判断事件是否可解决，再补充情绪解释；适合职场协作、目标分歧、边界沟通类场景。',
      need: '核心需求：被信任',
      risk: '误解风险：显得冷处理',
      tone: '语气：直接推进',
      replyPrefix: '按男性表达模型，我会更先拆解问题和可执行动作。'
    }
  };

  function updateModelPanel() {
    var model = genderModel[currentGender];
    var title = document.querySelector('#modelTitle');
    var focus = document.querySelector('#modelFocus');
    var desc = document.querySelector('#modelDesc');
    var need = document.querySelector('#modelNeed');
    var risk = document.querySelector('#modelRisk');
    var tone = document.querySelector('#modelTone');
    var role = document.querySelector('#currentRole');
    if (title) title.textContent = currentType + ' ' + model.label;
    if (focus) focus.textContent = model.focus;
    if (desc) desc.textContent = descTextFor(currentType, model.desc);
    if (need) need.textContent = needTextFor(currentType, model.need);
    if (risk) risk.textContent = model.risk;
    if (tone) tone.textContent = model.tone;
    if (role) role.textContent = currentType + ' · ' + currentName + ' · ' + (currentGender === 'female' ? '女' : '男');
  }

  function descTextFor(type, fallback) {
    var special = {
      INTJ: '在女性模型中更像“冷静观察后的精准表达”，在男性模型中更像“先给结构再解释情绪”。',
      INFP: '在女性模型中更强调细腻感受与关系修复，在男性模型中更容易把真实想法藏进沉默和试探。',
      ENTJ: '在女性模型中会在推进目标时兼顾关系接受度，在男性模型中更直接强调效率、责任和结果。',
      ENFP: '在女性模型中更擅长用情绪连接破冰，在男性模型中更常用玩笑、灵感和行动提议缓和气氛。'
    };
    return special[type] || fallback;
  }

  function needTextFor(type, fallback) {
    var needs = {
      INTJ: currentGender === 'female' ? '核心需求：被尊重判断' : '核心需求：被信任能力',
      INFP: currentGender === 'female' ? '核心需求：被认真理解' : '核心需求：被允许沉默',
      ENTJ: currentGender === 'female' ? '核心需求：被认可强度' : '核心需求：被交付结果',
      ENFP: currentGender === 'female' ? '核心需求：被情绪接住' : '核心需求：被自由回应'
    };
    return needs[type] || fallback;
  }

  function setTab(target) {
    screens.forEach(function (screen) {
      screen.classList.toggle('active', screen.dataset.screen === target);
    });
    tabButtons.forEach(function (button) {
      button.classList.toggle('active', button.dataset.tab === target);
    });
    var phone = document.querySelector('.phone');
    if (phone) {
      phone.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  tabs.forEach(function (button) {
    button.addEventListener('click', function () {
      setTab(button.dataset.tab);
    });
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (item) { item.classList.remove('selected'); });
      chip.classList.add('selected');
      currentType = chip.dataset.type;
      currentName = chip.dataset.name;
      updateModelPanel();
    });
  });

  genderButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      genderButtons.forEach(function (item) { item.classList.remove('active'); });
      button.classList.add('active');
      currentGender = button.dataset.gender;
      updateModelPanel();
    });
  });

  function addBubble(text, who) {
    var bubble = document.createElement('div');
    bubble.className = 'bubble ' + who;
    bubble.textContent = text;
    chatList.appendChild(bubble);
    chatList.scrollTop = chatList.scrollHeight;
  }

  function replyFor(text) {
    var model = genderModel[currentGender];
    if (/道歉|吵架|矛盾|复盘/.test(text)) {
      return model.replyPrefix + ' 如果我是 ' + currentType + '，我会先把冲突拆成“关系安全感、事实分歧、下一步动作”。你可以说：我不是想否定你，只是希望我们一起找到更舒服的沟通方式。';
    }
    if (/恋爱|喜欢|关系/.test(text)) {
      return model.replyPrefix + ' 从 ' + currentType + ' 的角度，我会先确认对方在关系里最在意什么，再选择是直接给承诺，还是先给空间。';
    }
    if (/职场|协作|同事/.test(text)) {
      return model.replyPrefix + ' ' + currentType + ' 型角色会先明确目标、截止时间和分工，再根据对方人格调整表达强度。';
    }
    return model.replyPrefix + ' 我会根据当前人格和性别表达模型回答：先识别动机，再解释沟通风险，最后给出更适合这个角色的表达方式。';
  }

  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', function () {
      var text = chatInput.value.trim();
      if (!text) return;
      addBubble(text, 'me');
      chatInput.value = '';
      window.setTimeout(function () {
        addBubble(replyFor(text), 'ai');
      }, 360);
    });
  }

  updateModelPanel();
})();
