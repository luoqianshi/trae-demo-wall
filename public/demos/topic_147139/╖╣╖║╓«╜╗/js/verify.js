/**
 * 饭泛之交 - Verify 身份认证
 * 模块化拆分自单文件原型
 */

// ==================== VERIFICATION CENTER ====================
function renderVerifyPage() {
  const v = Store.verification;
  const container = document.getElementById('verify-list');
  const types = ['basic','realname','face','education','profession'];
  container.innerHTML = types.map(type => {
    const item = v[type];
    const isVerified = item.status === 'verified';
    const iconClass = isVerified ? 'verified' : 'unverified';
    const badgeClass = isVerified ? 'verified' : 'unverified';
    const badgeText = isVerified ? '已认证' : '未认证';
    let btnHtml = '';
    if(isVerified) {
      btnHtml = '<button class="verify-item-btn done">已完成</button>';
    } else {
      const btnLabel = type === 'face' ? '开始认证' : '立即认证';
      btnHtml = `<button class="verify-item-btn go" onclick="startVerify('${type}')">${btnLabel}</button>`;
    }
    return `
      <div class="verify-item">
        <div class="verify-item-icon ${iconClass}">${item.icon}</div>
        <div class="verify-item-info">
          <h4>${item.label} <span class="verify-badge-sm ${badgeClass}">${badgeText}</span></h4>
          <p>${item.desc}</p>
        </div>
        ${btnHtml}
      </div>
    `;
  }).join('');
  // Update progress
  const verifiedCount = types.filter(t => v[t].status === 'verified').length;
  const percent = (verifiedCount / types.length) * 100;
  document.getElementById('verify-progress').style.width = percent + '%';
  document.getElementById('verify-progress-text').textContent = `已完成 ${verifiedCount}/${types.length} 项认证`;
}

function startVerify(type) {
  if(type === 'face') {
    document.getElementById('face-modal').classList.add('active');
    resetFaceSim();
    return;
  }
  if(type === 'realname') {
    // 模拟实名认证流程
    showToast('正在连接公安系统...');
    setTimeout(() => {
      showToast('📷 正在进行身份证OCR识别...');
      setTimeout(() => {
        Store.setVerificationStatus('realname', 'verified');
        showToast('✅ 实名认证成功！信用分 +5');
        Store.addCreditScore(5, '实名认证');
        renderVerifyPage();
        renderProfile();
      }, 1500);
    }, 1000);
    return;
  }
  if(type === 'education') {
    showToast('正在对接学信网...');
    setTimeout(() => {
      Store.setVerificationStatus('education', 'verified');
      showToast('🎓 学历认证成功！信用分 +3');
      Store.addCreditScore(3, '学历认证');
      renderVerifyPage();
      renderProfile();
    }, 2000);
    return;
  }
  if(type === 'profession') {
    showToast('正在验证企业邮箱...');
    setTimeout(() => {
      Store.setVerificationStatus('profession', 'verified');
      showToast('💼 职业认证成功！信用分 +3');
      Store.addCreditScore(3, '职业认证');
      renderVerifyPage();
      renderProfile();
    }, 2000);
    return;
  }
}

function resetFaceSim() {
  const circle = document.getElementById('face-circle');
  const instruct = document.getElementById('face-instruct');
  const btn = document.getElementById('face-btn');
  circle.className = 'face-sim-circle';
  circle.textContent = '😊';
  instruct.innerHTML = '点击下方按钮开始检测<br>请将面部置于圆圈内，保持光线充足';
  btn.textContent = '开始检测';
  btn.onclick = startFaceScan;
}

let faceScanning = false;
function startFaceScan() {
  if(faceScanning) return;
  faceScanning = true;
  const circle = document.getElementById('face-circle');
  const instruct = document.getElementById('face-instruct');
  const btn = document.getElementById('face-btn');
  circle.className = 'face-sim-circle scanning';
  circle.textContent = '🔍';
  instruct.innerHTML = '正在检测活体...<br>请眨眨眼 😊';
  btn.textContent = '检测中...';
  btn.disabled = true;
  setTimeout(() => {
    instruct.innerHTML = '请微微转头 🔄';
  }, 1000);
  setTimeout(() => {
    instruct.innerHTML = '正在比对人脸特征...';
  }, 2000);
  setTimeout(() => {
    circle.className = 'face-sim-circle success';
    circle.textContent = '✅';
    instruct.innerHTML = '人脸认证成功！<br>已与注册信息匹配';
    btn.textContent = '完成';
    btn.disabled = false;
    btn.onclick = function() {
      document.getElementById('face-modal').classList.remove('active');
      Store.setVerificationStatus('face', 'verified');
      showToast('🤳 人脸认证成功！信用分 +5');
      Store.addCreditScore(5, '人脸认证');
      faceScanning = false;
      renderVerifyPage();
      renderProfile();
    };
    faceScanning = false;
  }, 3000);
}