let currentProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startAnalysisBtn');
  const backBtn = document.getElementById('backToStep1Btn');
  const confirmBtn = document.getElementById('confirmProfileBtn');

  startBtn.addEventListener('click', startAnalysis);
  backBtn.addEventListener('click', goToStep1);
  confirmBtn.addEventListener('click', confirmProfile);

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      window.location.href = `search.html?q=${encodeURIComponent(searchInput.value)}`;
    }
  });
});

function startAnalysis() {
  const input = document.getElementById('companyInput').value.trim();
  
  if (!input) {
    Utils.showToast('请输入企业官网或名称', 'error');
    return;
  }

  switchStep(2);
  runAnalysisAnimation(input);
}

function runAnalysisAnimation(input) {
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('analysisStatus');
  const step1 = document.getElementById('analysisStep1');
  const step2 = document.getElementById('analysisStep2');
  const step3 = document.getElementById('analysisStep3');

  const statusMessages = [
    '正在读取企业信息...',
    '正在分析行业特征...',
    '正在提取核心能力...',
    '正在生成企业画像...',
    '分析完成！'
  ];

  let progress = 0;
  let messageIndex = 0;

  const animate = () => {
    if (progress < 100) {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;
      progressBar.style.width = `${progress}%`;

      if (progress >= 30 && messageIndex === 0) {
        messageIndex = 1;
        step1.className = 'w-12 h-12 mx-auto mb-2 bg-cyan-500/20 rounded-full flex items-center justify-center';
        step1.innerHTML = '<svg class="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      }
      if (progress >= 60 && messageIndex === 1) {
        messageIndex = 2;
        step2.className = 'w-12 h-12 mx-auto mb-2 bg-cyan-500/20 rounded-full flex items-center justify-center';
        step2.innerHTML = '<svg class="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      }
      if (progress >= 90 && messageIndex === 2) {
        messageIndex = 3;
        step3.className = 'w-12 h-12 mx-auto mb-2 bg-cyan-500/20 rounded-full flex items-center justify-center';
        step3.innerHTML = '<svg class="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      }

      if (messageIndex < statusMessages.length) {
        statusText.textContent = statusMessages[messageIndex];
      }

      setTimeout(animate, Utils.randomDelay(200, 400));
    } else {
      step3.className = 'w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center';
      step3.innerHTML = '<svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      
      setTimeout(() => {
        currentProfile = AIEngine.analyzeCompanyInfo(input);
        renderProfileForm(currentProfile);
        switchStep(3);
      }, 500);
    }
  };

  animate();
}

function renderProfileForm(profile) {
  const form = document.getElementById('profileForm');
  
  form.innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-zinc-300">企业名称</label>
        <span class="flex items-center space-x-1 text-xs text-cyan-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span>AI生成</span>
          <span class="px-1.5 py-0.5 bg-cyan-500/20 rounded-full text-cyan-400">${(profile.confidence.name * 100).toFixed(0)}%</span>
        </span>
      </div>
      <input type="text" id="profileName" value="${profile.name}" 
        class="w-full px-4 py-3 rounded-xl border border-white/10 bg-zinc-800 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">
    </div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-zinc-300">所属行业</label>
        <span class="flex items-center space-x-1 text-xs text-cyan-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span>AI生成</span>
          <span class="px-1.5 py-0.5 bg-cyan-500/20 rounded-full text-cyan-400">${(profile.confidence.industry * 100).toFixed(0)}%</span>
        </span>
      </div>
      <select id="profileIndustry" class="w-full px-4 py-3 rounded-xl border border-white/10 bg-zinc-800 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">
        <option value="">请选择行业</option>
        <option value="电子制造" ${profile.industry === '电子制造' ? 'selected' : ''}>电子制造</option>
        <option value="服装" ${profile.industry === '服装' ? 'selected' : ''}>服装</option>
        <option value="机械" ${profile.industry === '机械' ? 'selected' : ''}>机械</option>
        <option value="软件服务" ${profile.industry === '软件服务' ? 'selected' : ''}>软件服务</option>
        <option value="设计" ${profile.industry === '设计' ? 'selected' : ''}>设计</option>
        <option value="新能源" ${profile.industry === '新能源' ? 'selected' : ''}>新能源</option>
      </select>
    </div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-zinc-300">核心能力</label>
        <span class="flex items-center space-x-1 text-xs text-cyan-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span>AI生成</span>
          <span class="px-1.5 py-0.5 bg-cyan-500/20 rounded-full text-cyan-400">${(profile.confidence.capabilities * 100).toFixed(0)}%</span>
        </span>
      </div>
      <div class="flex flex-wrap gap-2 mb-3">
        ${profile.capabilities.map((cap, index) => `
          <span class="flex items-center space-x-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
            ${cap}
            <button onclick="removeCapability(${index})" class="hover:text-cyan-300">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </span>
        `).join('')}
      </div>
      <div class="flex space-x-2">
        <input type="text" id="newCapability" placeholder="添加能力标签" 
          class="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-zinc-800 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">
        <button onclick="addCapability()" class="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/30 transition-colors">添加</button>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-zinc-300">企业简介</label>
        <span class="flex items-center space-x-1 text-xs text-cyan-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span>AI生成</span>
          <span class="px-1.5 py-0.5 bg-cyan-500/20 rounded-full text-cyan-400">${(profile.confidence.description * 100).toFixed(0)}%</span>
        </span>
      </div>
      <textarea id="profileDescription" rows="4" 
        class="w-full px-4 py-3 rounded-xl border border-white/10 bg-zinc-800 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">${profile.description}</textarea>
    </div>
  `;
}

function addCapability() {
  const input = document.getElementById('newCapability');
  const value = input.value.trim();
  
  if (value && !currentProfile.capabilities.includes(value)) {
    currentProfile.capabilities.push(value);
    renderProfileForm(currentProfile);
  }
  
  input.value = '';
}

function removeCapability(index) {
  currentProfile.capabilities.splice(index, 1);
  renderProfileForm(currentProfile);
}

function confirmProfile() {
  const name = document.getElementById('profileName').value.trim();
  const industry = document.getElementById('profileIndustry').value;
  const description = document.getElementById('profileDescription').value.trim();

  if (!name) {
    Utils.showToast('请填写企业名称', 'error');
    return;
  }

  if (!industry) {
    Utils.showToast('请选择所属行业', 'error');
    return;
  }

  const finalProfile = {
    ...currentProfile,
    name,
    industry,
    description
  };

  Utils.storage.set('new_company_profile', finalProfile);
  
  switchStep(4);
  renderSuccessInfo(finalProfile);
  createConfetti();
}

function renderSuccessInfo(profile) {
  const container = document.getElementById('successInfo');
  
  container.innerHTML = `
    <div class="flex justify-between items-center py-3 border-b border-white/10">
      <span class="text-zinc-400">企业名称</span>
      <span class="font-medium text-cyan-400">${profile.name}</span>
    </div>
    <div class="flex justify-between items-center py-3 border-b border-white/10">
      <span class="text-zinc-400">所属行业</span>
      <span class="font-medium text-cyan-400">${profile.industry}</span>
    </div>
    <div class="flex justify-between items-start py-3 border-b border-white/10">
      <span class="text-zinc-400">核心能力</span>
      <div class="flex flex-wrap gap-2">
        ${profile.capabilities.map(cap => `<span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">${cap}</span>`).join('')}
      </div>
    </div>
    <div class="py-3">
      <span class="text-zinc-400 block mb-2">企业简介</span>
      <p class="text-zinc-300 text-sm">${profile.description}</p>
    </div>
  `;
}

function createConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
  
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'absolute animate-confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${Math.random() * -20}%`;
    confetti.style.width = `${Math.random() * 10 + 5}px`;
    confetti.style.height = `${Math.random() * 10 + 5}px`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
    container.appendChild(confetti);
  }
}

function switchStep(step) {
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.add('hidden');
  document.getElementById('step4').classList.add('hidden');

  document.getElementById(`step${step}`).classList.remove('hidden');
  document.getElementById(`step${step}`).classList.add('animate-fade-in');

  updateStepIndicators(step);
}

function updateStepIndicators(activeStep) {
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`step${i}Indicator`);
    const line = document.getElementById(`step${i}Line`);
    
    if (i === activeStep) {
      indicator.className = 'w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm';
    } else if (i < activeStep) {
      indicator.className = 'w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm';
      indicator.innerHTML = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      if (line) {
        line.className = 'w-16 h-0.5 bg-emerald-500';
      }
    } else {
      indicator.className = 'w-10 h-10 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-bold text-sm';
      indicator.innerHTML = i;
      if (line) {
        line.className = 'w-16 h-0.5 bg-zinc-700';
      }
    }
  }
}

function goToStep1() {
  switchStep(1);
}