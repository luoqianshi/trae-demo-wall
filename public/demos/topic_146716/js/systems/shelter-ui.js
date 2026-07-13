// 避难所UI系统 v2.0
// ============================================================

let shelterUI = null;

// 资源名称映射
const RESOURCE_NAMES = {
  building: '建材',
  food: '食物',
  parts: '零件',
  power: '电力'
};

// 获取资源中文名
function getResName(key) {
  return RESOURCE_NAMES[key] || key;
}

// Toast通知系统
let toastContainer = null;
function initToast() {
  if (toastContainer) return;
  toastContainer = document.createElement('div');
  toastContainer.id = 'shelter-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
}

function showToast(message, type = 'info', duration = 3000) {
  initToast();
  const toast = document.createElement('div');
  const colors = {
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db'
  };
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Microsoft YaHei', sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
    pointer-events: auto;
  `;
  toast.innerHTML = `<span style="font-size: 18px;">${icons[type] || icons.info}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  // 添加动画样式
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 初始化避难所UI
function initShelterUI() {
  initToast();
  
  // 检查ShelterSystem是否已初始化
  if (typeof ShelterSystem === 'undefined' || !ShelterSystem.getData) {
    console.warn('[ShelterUI] ShelterSystem not ready, waiting...');
    setTimeout(initShelterUI, 100);
    return;
  }
  
  // 创建主界面容器
  shelterUI = document.createElement('div');
  shelterUI.id = 'shelter-ui';
  shelterUI.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    display: none;
    z-index: 1000;
    font-family: 'Microsoft YaHei', sans-serif;
    color: #fff;
    overflow: hidden;
  `;
  
  // 阻止鼠标事件穿透到游戏
  shelterUI.addEventListener('mousedown', e => e.stopPropagation());
  shelterUI.addEventListener('click', e => e.stopPropagation());
  shelterUI.addEventListener('contextmenu', e => e.stopPropagation());
  shelterUI.addEventListener('wheel', e => {
    if (typeof gameState !== 'undefined' && gameState === 'playing') {
      e.stopPropagation();
    }
  }, { passive: true });
  
  document.body.appendChild(shelterUI);
  
  // 定期更新资源显示
  setInterval(() => {
    if (shelterUI && shelterUI.style.display !== 'none') {
      updateResourceDisplay();
    }
  }, 1000);
}

// 渲染主界面
function renderShelterMain() {
  const data = ShelterSystem.getData();
  if (!data) {
    shelterUI.innerHTML = '<div style="padding: 20px; color: #fff;">加载中...</div>';
    return;
  }
  const defs = ShelterSystem.getDefs();
  const maxStorage = ShelterSystem.getMaxStorage();
  
  shelterUI.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <!-- 标题栏 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px;">
        <h1 style="margin: 0; font-size: 28px;">🏠 末日避难所</h1>
        <div style="display: flex; gap: 20px;">
          <div class="resource-item" style="display: flex; align-items: center; gap: 5px; padding: 8px 15px; background: rgba(139,69,19,0.3); border-radius: 5px;">
            <span>🧱</span>
            <span id="res-building">${Math.floor(data.resources.building)}</span>
            <span style="font-size: 12px; opacity: 0.7;">/${maxStorage.building}</span>
          </div>
          <div class="resource-item" style="display: flex; align-items: center; gap: 5px; padding: 8px 15px; background: rgba(34,139,34,0.3); border-radius: 5px;">
            <span>🍞</span>
            <span id="res-food">${Math.floor(data.resources.food)}</span>
            <span style="font-size: 12px; opacity: 0.7;">/${maxStorage.food}</span>
          </div>
          <div class="resource-item" style="display: flex; align-items: center; gap: 5px; padding: 8px 15px; background: rgba(70,130,180,0.3); border-radius: 5px;">
            <span>⚙️</span>
            <span id="res-parts">${Math.floor(data.resources.parts)}</span>
            <span style="font-size: 12px; opacity: 0.7;">/${maxStorage.parts}</span>
          </div>
          <div class="resource-item" style="display: flex; align-items: center; gap: 5px; padding: 8px 15px; background: rgba(255,215,0,0.3); border-radius: 5px;">
            <span>⚡</span>
            <span id="res-power">0</span>
            <span style="font-size: 12px; opacity: 0.7;" id="res-power-max"></span>
          </div>
          <button onclick="closeShelterUI()" style="padding: 8px 20px; background: #e74c3c; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 16px;">返回战场</button>
        </div>
      </div>
      
      <!-- 主内容区 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- 左侧: 设施列表 -->
        <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; height: 400px;">
          <h2 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
            🏭 设施
            <button onclick="showBuildMenu()" style="padding: 5px 15px; background: #27ae60; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 14px;">+ 建造新设施</button>
          </h2>
          <div id="facility-list" style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; min-height: 0;">
            ${renderFacilityList(data, defs)}
          </div>
        </div>
        
        <!-- 右侧: 幸存者列表 -->
        <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; height: 400px;">
          <h2 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
            👥 幸存者
            <span style="font-size: 14px; opacity: 0.7;">(${data.survivors.length}/${getMaxSurvivors(data)})</span>
            <button onclick="showRecruitMenu()" style="padding: 5px 15px; background: #3498db; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 14px;">招募</button>
          </h2>
          <div id="survivor-list" style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; min-height: 0;">
            ${renderSurvivorList(data, defs)}
          </div>
        </div>
      </div>
      
      <!-- 底部功能按钮 -->
      <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 10px;">
        <button onclick="showTechTree()" style="padding: 15px 30px; background: #9b59b6; border: none; border-radius: 10px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 10px;">
          🔬 科技研究
        </button>
        <button onclick="showFortResearchMenu()" style="padding: 15px 30px; background: #e67e22; border: none; border-radius: 10px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 10px;">
          🔧 工事研发
        </button>
        <button onclick="showPetMenu()" style="padding: 15px 30px; background: #2ecc71; border: none; border-radius: 10px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 10px;">
          🐕 宠物
        </button>
        <button onclick="showStats()" style="padding: 15px 30px; background: #34495e; border: none; border-radius: 10px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 10px;">
          📊 统计
        </button>
        <button onclick="showChargeMenu()" style="padding: 15px 30px; background: #f1c40f; border: none; border-radius: 10px; color: #1a1a2e; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 10px; font-weight: bold;">
          ⚡ 战场充能
          <span id="charge-indicator" style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">0/100</span>
        </button>
      </div>
    </div>
    
    <!-- 弹窗容器 -->
    <div id="shelter-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1001; justify-content: center; align-items: center;" onclick="if(event.target===this)closeModal()">
      <div style="background: #1a1a2e; border-radius: 15px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
        <div id="modal-content" style="overflow-y: auto; flex: 1; min-height: 0;"></div>
      </div>
    </div>
  `;
}

// 渲染设施列表
function renderFacilityList(data, defs) {
  if (data.facilities.length === 0) {
    return '<div style="text-align: center; opacity: 0.5; padding: 20px;">暂无设施</div>';
  }
  
  return data.facilities.map(fac => {
    const def = defs.facilities[fac.type];
    const cost = ShelterSystem.getBuildCost(fac.type, fac.level + 1);
    const canUpgrade = fac.level < def.maxLevel && 
                       (fac.type === 'command' || fac.level < ShelterSystem.getCommandLevel());
    
    return `
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 20px; margin-bottom: 5px;">${def.icon} ${def.name} Lv.${fac.level}</div>
          <div style="font-size: 12px; opacity: 0.7;">${typeof def.effect === 'function' ? def.effect(fac.level) : ''}</div>
          <div style="font-size: 11px; opacity: 0.5; margin-top: 3px;">${def.description}</div>
        </div>
        <div style="text-align: right;">
          ${canUpgrade ? `
            <button onclick="upgradeFacility('${fac.type}')" style="padding: 8px 15px; background: #27ae60; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 12px;">
              升级 (${Object.entries(cost).map(([k,v]) => `${getResName(k)}:${v}`).join(', ')})
            </button>
          ` : '<span style="font-size: 12px; opacity: 0.5;">已满级</span>'}
        </div>
      </div>
    `;
  }).join('');
}

// 工作地点名称映射
const WORKPLACE_NAMES = {
  idle: '空闲',
  scrapyard: '拆解台',
  farm: '农场',
  workshop: '工坊'
};

// 渲染幸存者列表
function renderSurvivorList(data, defs) {
  if (data.survivors.length === 0) {
    return '<div style="text-align: center; opacity: 0.5; padding: 20px;">暂无幸存者<br>建造宿舍后可招募</div>';
  }
  
  return data.survivors.map((sur, idx) => {
    const def = defs.survivors[sur.type];
    
    // 工作状态显示（严格按status判断）
    let statusText = '空闲';
    let statusColor = '#7f8c8d';
    if (sur.status === 'working') {
      statusText = sur.workplace ? `${WORKPLACE_NAMES[sur.workplace] || sur.workplace}` : '工作中';
      statusColor = '#27ae60';
    } else if (sur.status === 'resting') {
      statusText = '休息中';
      statusColor = '#e67e22';
    }
    
    // 体力条颜色
    const staminaColor = sur.stamina > 50 ? '#27ae60' : sur.stamina > 20 ? '#f39c12' : '#e74c3c';
    const moraleColor = sur.morale > 50 ? '#3498db' : sur.morale > 20 ? '#f39c12' : '#e74c3c';
    
    return `
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 22px;">${def.icon}</span>
            <div>
              <span style="font-size: 15px; font-weight: bold;">${sur.name}</span>
              <span style="font-size: 11px; opacity: 0.5; margin-left: 6px;">${def.name} Lv.${sur.skill}</span>
            </div>
          </div>
          <!-- 专长标签 -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
            <span style="font-size: 10px; padding: 2px 8px; background: rgba(155,89,182,0.3); border: 1px solid rgba(155,89,182,0.5); border-radius: 10px; color: #bb8fce;">${def.specialty}</span>
            <span style="font-size: 10px; padding: 2px 8px; background: rgba(46,204,113,0.15); border: 1px solid rgba(46,204,113,0.3); border-radius: 10px; color: #2ecc71;">${def.ability}</span>
          </div>
          <!-- 体力/士气条 -->
          <div style="display: flex; gap: 10px; align-items: center;">
            <div style="flex: 1;">
              <div style="font-size: 10px; opacity: 0.6; margin-bottom: 2px;">体力 ${Math.floor(sur.stamina)}%</div>
              <div style="background: rgba(255,255,255,0.1); border-radius: 3px; height: 5px; overflow: hidden;">
                <div style="background: ${staminaColor}; height: 100%; width: ${sur.stamina}%; border-radius: 3px; transition: width 0.5s;"></div>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 10px; opacity: 0.6; margin-bottom: 2px;">士气 ${Math.floor(sur.morale)}%</div>
              <div style="background: rgba(255,255,255,0.1); border-radius: 3px; height: 5px; overflow: hidden;">
                <div style="background: ${moraleColor}; height: 100%; width: ${sur.morale}%; border-radius: 3px; transition: width 0.5s;"></div>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align: center; min-width: 70px;">
          <div style="font-size: 11px; padding: 4px 10px; background: ${statusColor}; border-radius: 12px; color: white; margin-bottom: 6px;">
            ${statusText}
          </div>
          <button onclick="showSurvivorAssignMenu(${idx})" style="padding: 4px 10px; background: rgba(52,152,219,0.3); border: 1px solid rgba(52,152,219,0.5); border-radius: 4px; color: #5dade2; cursor: pointer; font-size: 11px;">
            管理
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 获取最大幸存者数（使用ShelterSystem统一接口）
function getMaxSurvivors(data) {
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getMaxSurvivors) {
    return ShelterSystem.getMaxSurvivors();
  }
  const dorm = data.facilities.find(f => f.type === 'dormitory');
  return dorm ? dorm.level * 2 : 0;
}

// 更新资源显示
function updateResourceDisplay() {
  const data = ShelterSystem.getData();
  const maxStorage = ShelterSystem.getMaxStorage();
  
  const buildingEl = document.getElementById('res-building');
  const foodEl = document.getElementById('res-food');
  const partsEl = document.getElementById('res-parts');
  const powerEl = document.getElementById('res-power');
  const powerMaxEl = document.getElementById('res-power-max');
  const chargeIndicator = document.getElementById('charge-indicator');
  
  if (buildingEl) buildingEl.textContent = Math.floor(data.resources.building);
  if (foodEl) foodEl.textContent = Math.floor(data.resources.food);
  if (partsEl) partsEl.textContent = Math.floor(data.resources.parts);
  if (powerEl) powerEl.textContent = Math.floor(data.resources.power);
  if (powerMaxEl) powerMaxEl.textContent = `/${maxStorage.power}`;
  
  // 更新战场充能指示器
  if (chargeIndicator) {
    const charge = ShelterSystem.getBattlefieldCharge();
    chargeIndicator.textContent = `${charge.current}/${charge.max}`;
    chargeIndicator.style.background = charge.current >= 30 ? '#27ae60' : '#e74c3c';
  }
  
  // 更新上限显示
  const items = document.querySelectorAll('.resource-item');
  items.forEach((item, idx) => {
    const maxSpan = item.querySelector('span:last-child');
    if (maxSpan) {
      const keys = ['building', 'food', 'parts'];
      if (keys[idx]) {
        maxSpan.textContent = `/${maxStorage[keys[idx]]}`;
      }
    }
  });
}

// 显示建造菜单
function showBuildMenu() {
  const defs = ShelterSystem.getDefs().facilities;
  const data = ShelterSystem.getData();
  const cmdLevel = ShelterSystem.getCommandLevel();
  
  let html = `
    <h2 style="margin-top: 0;">🏗️ 建造新设施</h2>
    <div style="display: flex; flex-direction: column; gap: 15px;">
  `;
  
  Object.keys(defs).forEach(key => {
    const def = defs[key];
    const exists = data.facilities.find(f => f.type === key);
    const unlocked = ShelterSystem.isFacilityUnlocked(key);
    const cost = ShelterSystem.getBuildCost(key);
    
    html += `
      <div style="background: ${exists ? 'rgba(255,0,0,0.1)' : unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(100,100,100,0.1)'}; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 18px; margin-bottom: 5px;">${def.icon} ${def.name}</div>
          <div style="font-size: 12px; opacity: 0.7;">${def.description}</div>
          <div style="font-size: 11px; opacity: 0.5; margin-top: 3px;">
            ${exists ? '已建造' : !unlocked ? `需要指挥中心 Lv.${def.unlockAt?.command || 0}` : `消耗: ${Object.entries(cost).map(([k,v]) => `${getResName(k)}:${v}`).join(', ')}`}
          </div>
        </div>
        ${!exists && unlocked ? `
          <button onclick="buildFacility('${key}')" style="padding: 8px 20px; background: #27ae60; border: none; border-radius: 5px; color: white; cursor: pointer;">建造</button>
        ` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  html += `<button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>`;
  
  showModal(html);
}

// 建造设施
function buildFacility(type) {
  const result = ShelterSystem.buildFacility(type);
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    renderShelterMain();
  } else {
    showToast(result.message, 'error');
  }
}

// 升级设施
function upgradeFacility(type) {
  const result = ShelterSystem.upgradeFacility(type);
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    renderShelterMain();
  } else {
    showToast(result.message, 'error');
  }
}

// 显示招募菜单
function showRecruitMenu() {
  const defs = ShelterSystem.getDefs().survivors;
  const data = ShelterSystem.getData();
  const maxSurvivors = getMaxSurvivors(data);
  
  if (maxSurvivors === 0) {
    showToast('需要先建造宿舍才能招募幸存者', 'warning');
    return;
  }
  
  if (data.survivors.length >= maxSurvivors) {
    showToast('宿舍已满，请升级宿舍', 'warning');
    return;
  }
  
  let html = `
    <h2 style="margin-top: 0;">👥 招募幸存者</h2>
    <div style="display: flex; flex-direction: column; gap: 15px;">
  `;
  
  Object.keys(defs).forEach(key => {
    const def = defs[key];
    html += `
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 18px; margin-bottom: 5px;">${def.icon} ${def.name}</div>
          <div style="font-size: 12px; opacity: 0.7;">专长: ${def.specialty} | 效率+30%</div>
          <div style="font-size: 11px; opacity: 0.5; margin-top: 3px;">能力: ${def.ability}</div>
          <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">消耗: ${Object.entries(def.recruitCost).map(([k,v]) => `${getResName(k)}:${v}`).join(', ')}</div>
        </div>
        <button onclick="recruitSurvivor('${key}')" style="padding: 8px 20px; background: #3498db; border: none; border-radius: 5px; color: white; cursor: pointer;">招募</button>
      </div>
    `;
  });
  
  html += '</div>';
  html += `<button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>`;
  
  showModal(html);
}

// 招募幸存者
function recruitSurvivor(type) {
  const result = ShelterSystem.recruitSurvivor(type);
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    renderShelterMain();
  } else {
    showToast(result.message, 'error');
  }
}

// 显示幸存者分配工作菜单
function showSurvivorAssignMenu(idx) {
  const data = ShelterSystem.getData();
  const survivor = data.survivors[idx];
  if (!survivor) return;
  
  const defs = ShelterSystem.getDefs().survivors;
  const typeDef = defs[survivor.type];
  
  // 专长匹配
  const specialtyMatch = {
    scavenger: 'scrapyard',
    farmer: 'farm',
    engineer: 'workshop'
  };
  const matchedWorkplace = specialtyMatch[survivor.type];
  
  // 技能经验条
  const expNeeded = survivor.skill * 100;
  const expPercent = Math.floor((survivor.exp / expNeeded) * 100);
  
  let html = `
    <h2 style="margin-top: 0;">👤 ${survivor.name}</h2>
    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <div style="font-size: 18px; margin-bottom: 10px;">${typeDef.icon} ${typeDef.name}</div>
      <div style="font-size: 12px; opacity: 0.8;">
        体力: <span style="color: ${survivor.stamina > 50 ? '#27ae60' : survivor.stamina > 20 ? '#f39c12' : '#e74c3c'}">${Math.floor(survivor.stamina)}%</span> | 
        士气: <span style="color: ${survivor.morale > 50 ? '#27ae60' : survivor.morale > 20 ? '#f39c12' : '#e74c3c'}">${Math.floor(survivor.morale)}%</span>
      </div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
        技能: Lv.${survivor.skill} 
        <span style="font-size: 10px; opacity: 0.6;">(${Math.floor(survivor.exp)}/${expNeeded} EXP)</span>
      </div>
      <div style="background: rgba(255,255,255,0.1); border-radius: 3px; height: 6px; margin-top: 5px; overflow: hidden;">
        <div style="background: #3498db; height: 100%; width: ${expPercent}%; border-radius: 3px; transition: width 0.3s;"></div>
      </div>
      <div style="font-size: 11px; opacity: 0.6; margin-top: 8px;">专长: ${typeDef.specialty}（推荐: ${WORKPLACE_NAMES[matchedWorkplace] || '无'}）</div>
      <div style="font-size: 11px; opacity: 0.6; margin-top: 3px;">能力: ${typeDef.ability}</div>
    </div>
    
    <h3 style="margin-top: 0;">工作分配</h3>
    <div style="display: flex; flex-direction: column; gap: 10px;">
  `;
  
  // 工作选项
  const workOptions = [
    { id: 'idle', name: '空闲', desc: '不工作，缓慢恢复体力和士气' },
    { id: 'scrapyard', name: '拆解台', desc: '产出建材' },
    { id: 'farm', name: '农场', desc: '产出食物' },
    { id: 'workshop', name: '工坊', desc: '产出零件' }
  ];
  
  workOptions.forEach(opt => {
    const isActive = survivor.workplace === opt.id;
    const isMatch = matchedWorkplace === opt.id;
    const matchTag = isMatch ? ' <span style="color: #f39c12; font-size: 10px;">★专长匹配</span>' : '';
    
    html += `
      <div onclick="assignSurvivorWork(${idx}, '${opt.id}')" style="background: ${isActive ? 'rgba(39,174,96,0.3)' : 'rgba(255,255,255,0.05)'}; border-radius: 8px; padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: bold;">${opt.name}${matchTag}${isActive ? ' ✓' : ''}</div>
          <div style="font-size: 11px; opacity: 0.7;">${opt.desc}</div>
        </div>
        ${isActive ? '<span style="color: #27ae60;">工作中</span>' : '<span style="opacity: 0.5;">点击分配</span>'}
      </div>
    `;
  });
  
  html += `
    </div>
    <button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>
  `;
  
  showModal(html);
}

// 分配幸存者工作
function assignSurvivorWork(idx, workplace) {
  const data = ShelterSystem.getData();
  if (data.survivors[idx]) {
    data.survivors[idx].workplace = workplace;
    data.survivors[idx].status = workplace === 'idle' ? 'idle' : 'working';
    ShelterSystem.save();
    showToast('工作分配成功', 'success');
    closeModal();
    renderShelterMain();
  }
}

// 显示科技树
function showTechTree() {
  const defs = ShelterSystem.getDefs().techs;
  const data = ShelterSystem.getData();
  
  let html = `
    <h2 style="margin-top: 0;">🔬 科技研究</h2>
    <div style="display: flex; flex-direction: column; gap: 15px;">
  `;
  
  Object.keys(defs).forEach(key => {
    const def = defs[key];
    const currentLevel = data.technologies[key] || 0;
    const maxed = currentLevel >= def.maxLevel;
    const cost = maxed ? null : def.cost(currentLevel);
    
    html += `
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 18px;">${def.icon} ${def.name} Lv.${currentLevel}/${def.maxLevel}</div>
          ${!maxed ? `
            <button onclick="researchTech('${key}')" style="padding: 8px 20px; background: #9b59b6; border: none; border-radius: 5px; color: white; cursor: pointer;">
              研究 (${Object.entries(cost).map(([k,v]) => `${getResName(k)}:${v}`).join(', ')})
            </button>
          ` : '<span style="color: #27ae60;">已满级</span>'}
        </div>
        <div style="font-size: 12px; opacity: 0.7;">
          ${maxed ? def.description(def.maxLevel - 1) : def.description(currentLevel)}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  html += `<button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>`;
  
  showModal(html);
}

// 研究科技
function researchTech(key) {
  const result = ShelterSystem.researchTech(key);
  if (result.success) {
    showToast(result.message, 'success');
    showTechTree(); // 刷新科技树，不关闭弹窗
  } else {
    showToast(result.message, 'error');
  }
}

// 显示工事研发菜单
function showFortResearchMenu() {
  const data = ShelterSystem.getData();
  const defs = ShelterSystem.getFortResearchDefs();
  const researched = data.researchedFortifications || [];
  
  let html = `
    <h2 style="margin-top: 0;">🔧 工事研发</h2>
    <p style="opacity: 0.7; font-size: 14px;">研发成功后可在战场上部署该工事</p>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
  `;
  
  Object.keys(defs).forEach(key => {
    const def = defs[key];
    const isResearched = researched.includes(key);
    const cost = def.researchCost;
    
    // 检查资源是否足够
    const canAfford = Object.entries(cost).every(([k, v]) => data.resources[k] >= v);
    
    html += `
      <div style="background: ${isResearched ? 'rgba(39,174,96,0.2)' : 'rgba(255,255,255,0.05)'}; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 18px; margin-bottom: 5px;">${def.icon} ${def.name} ${isResearched ? '✓' : ''}</div>
          <div style="font-size: 11px; opacity: 0.6;">${def.description}</div>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 5px;">
            消耗: ${Object.entries(cost).map(([k, v]) => {
              const hasEnough = data.resources[k] >= v;
              return `<span style="color: ${hasEnough ? '#27ae60' : '#e74c3c'}">${getResName(k)}:${v}</span>`;
            }).join(' ')}
          </div>
        </div>
        ${isResearched ? 
          '<span style="color: #27ae60; font-size: 12px;">已研发</span>' :
          `<button onclick="doFortResearch('${key}')" style="padding: 8px 20px; background: ${canAfford ? '#e67e22' : '#7f8c8d'}; border: none; border-radius: 5px; color: white; cursor: pointer; ${canAfford ? '' : 'opacity: 0.5;'}">研发</button>`
        }
      </div>
    `;
  });
  
  html += '</div>';
  html += `<button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>`;
  
  showModal(html);
}

// 执行工事研发
function doFortResearch(fortType) {
  const result = ShelterSystem.researchFortification(fortType);
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    showFortResearchMenu(); // 刷新研发列表
  } else {
    showToast(result.message, 'error');
  }
}

// 显示统计
function showStats() {
  const data = ShelterSystem.getData();
  const stats = data.stats || {};
  const maxStorage = ShelterSystem.getMaxStorage();
  const defs = ShelterSystem.getDefs();
  
  // 确保stats字段存在
  if (!stats.totalProduced) stats.totalProduced = { building: 0, food: 0, parts: 0 };
  if (!stats.totalConsumed) stats.totalConsumed = { building: 0, food: 0, parts: 0 };
  if (!stats.battleGained) stats.battleGained = { building: 0, food: 0, parts: 0 };
  if (!stats.sessionProduced) stats.sessionProduced = { building: 0, food: 0, parts: 0 };
  if (!stats.sessionStart) stats.sessionStart = Date.now();
  
  // 计算本次会话时长
  const sessionMs = Date.now() - (stats.sessionStart || Date.now());
  const sessionMin = Math.max(1, Math.floor(sessionMs / 60000));
  const sessionStr = sessionMin >= 60 ? `${Math.floor(sessionMin/60)}小时${sessionMin%60}分钟` : `${sessionMin}分钟`;
  
  // 计算每分钟产出速率
  const sessionRate = {};
  ['building', 'food', 'parts'].forEach(res => {
    const produced = stats.sessionProduced?.[res] || 0;
    sessionRate[res] = (produced / sessionMin).toFixed(1);
  });
  
  // 计算当前每秒产出（设施基础产出）
  const facilityDefs = defs.facilities;
  const baseRates = { building: 0, food: 0, parts: 0 };
  data.facilities.forEach(fac => {
    const def = facilityDefs[fac.type];
    if (def && def.production) {
      Object.keys(def.production).forEach(res => {
        const rate = typeof def.production[res] === 'function' 
          ? def.production[res](fac.level) 
          : (def.production[res] || 0);
        baseRates[res] += rate;
      });
    }
  });
  
  // 计算幸存者加成（只计算工作中的幸存者）
  const survivorRates = { building: 0, food: 0, parts: 0 };
  const survivorDefs = defs.survivors;
  data.survivors.forEach(sur => {
    if (sur.status !== 'working') return; // 只计算工作中的幸存者
    const def = survivorDefs[sur.type];
    if (!def || !def.efficiency) return;
    
    const staminaMult = 0.2 + (sur.stamina / 100) * 0.8;
    const moraleMult = 0.5 + (sur.morale / 100) * 0.5;
    const skillMult = 1 + (sur.skill - 1) * 0.10;
    
    // 专长匹配加成
    const specialtyMatch = {
      scavenger: 'scrapyard',
      farmer: 'farm',
      engineer: 'workshop',
      chef: 'farm',
      mechanic: 'workshop',
      doctor: 'farm'
    };
    const matchBonus = (specialtyMatch[sur.type] === sur.workplace) ? 1.5 : 1.0;
    
    Object.keys(def.efficiency).forEach(res => {
      const baseEff = def.efficiency[res] - 1; // 效率是1.3表示+30%
      const actualBonus = baseEff * staminaMult * moraleMult * skillMult * matchBonus;
      survivorRates[res] += baseRates[res] * actualBonus;
    });
  });
  
  // 总产出速率
  const totalRates = {
    building: baseRates.building + survivorRates.building,
    food: baseRates.food + survivorRates.food,
    parts: baseRates.parts + survivorRates.parts
  };
  
  // 幸存者工作效率
  const workingCount = data.survivors.filter(s => s.status === 'working').length;
  const restingCount = data.survivors.filter(s => s.status === 'resting').length;
  const idleCount = data.survivors.filter(s => s.status === 'idle').length;
  
  let html = `
    <h2 style="margin-top: 0;">📊 避难所报表</h2>
    
    <!-- 概览卡片 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
      <div style="background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.3); border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${stats.totalKills || 0}</div>
        <div style="font-size: 11px; opacity: 0.7;">总击杀</div>
      </div>
      <div style="background: rgba(46,204,113,0.15); border: 1px solid rgba(46,204,113,0.3); border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">${stats.highestWave || 0}</div>
        <div style="font-size: 11px; opacity: 0.7;">最高波次</div>
      </div>
      <div style="background: rgba(52,152,219,0.15); border: 1px solid rgba(52,152,219,0.3); border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #3498db;">${sessionStr}</div>
        <div style="font-size: 11px; opacity: 0.7;">本次会话</div>
      </div>
    </div>
    
    <!-- 资源详情 -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">💰 资源详情</div>
      ${['building', 'food', 'parts'].map(res => {
        const current = Math.floor(data.resources[res]);
        const max = maxStorage[res];
        const pct = max > 0 ? Math.floor(current / max * 100) : 0;
        const barColor = pct > 70 ? '#27ae60' : pct > 30 ? '#f39c12' : '#e74c3c';
        const totalProd = Math.floor(stats.totalProduced?.[res] || 0);
        const totalCons = Math.floor(stats.totalConsumed?.[res] || 0);
        const battleGain = Math.floor(stats.battleGained?.[res] || 0);
        const shelterProd = totalProd - battleGain;
        const rate = sessionRate[res];
        
        return `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 13px;">${res === 'building' ? '🧱 建材' : res === 'food' ? '🍞 食物' : '⚙️ 零件'}</span>
              <span style="font-size: 13px; font-weight: bold;">${current} / ${max}</span>
            </div>
            <div style="background: rgba(255,255,255,0.1); border-radius: 3px; height: 8px; overflow: hidden; margin-bottom: 6px;">
              <div style="background: ${barColor}; height: 100%; width: ${pct}%; border-radius: 3px; transition: width 0.5s;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; font-size: 10px; opacity: 0.7;">
              <span>总产出: <span style="color: #2ecc71;">${totalProd}</span></span>
              <span>避难所: <span style="color: #3498db;">${shelterProd}</span></span>
              <span>战场: <span style="color: #e67e22;">${battleGain}</span></span>
              <span>总消耗: <span style="color: #e74c3c;">${totalCons}</span></span>
            </div>
            <div style="font-size: 10px; opacity: 0.5; margin-top: 2px;">
              设施: ${baseRates[res].toFixed(2)}/秒 + 幸存者加成: ${survivorRates[res].toFixed(2)}/秒 = 总计: ${totalRates[res].toFixed(2)}/秒
            </div>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- 幸存者状态 -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">👥 幸存者状态</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
        <div style="text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #fff;">${data.survivors.length}</div>
          <div style="font-size: 10px; opacity: 0.6;">总人数</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #27ae60;">${workingCount}</div>
          <div style="font-size: 10px; opacity: 0.6;">工作中</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #e67e22;">${restingCount}</div>
          <div style="font-size: 10px; opacity: 0.6;">休息中</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #7f8c8d;">${idleCount}</div>
          <div style="font-size: 10px; opacity: 0.6;">空闲</div>
        </div>
      </div>
      ${data.survivors.length > 0 ? `
        <div style="margin-top: 10px; font-size: 11px; opacity: 0.7;">
          平均技能: Lv.${(data.survivors.reduce((a,s) => a + s.skill, 0) / data.survivors.length).toFixed(1)} |
          平均体力: ${Math.floor(data.survivors.reduce((a,s) => a + s.stamina, 0) / data.survivors.length)}% |
          平均士气: ${Math.floor(data.survivors.reduce((a,s) => a + s.morale, 0) / data.survivors.length)}%
        </div>
      ` : ''}
    </div>
    
    <!-- 设施概览 -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">🏗️ 设施概览</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        ${data.facilities.map(fac => {
          const def = defs.facilities[fac.type];
          return `<div style="font-size: 12px; opacity: 0.8;">${def.icon} ${def.name} Lv.${fac.level}</div>`;
        }).join('')}
      </div>
      <div style="margin-top: 8px; font-size: 11px; opacity: 0.6;">
        科技等级: ${Object.values(data.technologies).reduce((a,b) => a+b, 0)} | 已研发工事: ${data.researchedFortifications?.length || 0}/8
      </div>
    </div>
    
    <!-- 资源收支表 -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">📋 资源收支表</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
          <th style="text-align: left; padding: 6px; opacity: 0.6;">资源</th>
          <th style="text-align: right; padding: 6px; opacity: 0.6;">总产出</th>
          <th style="text-align: right; padding: 6px; opacity: 0.6;">总消耗</th>
          <th style="text-align: right; padding: 6px; opacity: 0.6;">净收入</th>
          <th style="text-align: right; padding: 6px; opacity: 0.6;">当前库存</th>
        </tr>
        ${['building', 'food', 'parts'].map(res => {
          const prod = Math.floor(stats.totalProduced?.[res] || 0);
          const cons = Math.floor(stats.totalConsumed?.[res] || 0);
          const net = prod - cons;
          const current = Math.floor(data.resources[res]);
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 6px;">${res === 'building' ? '🧱 建材' : res === 'food' ? '🍞 食物' : '⚙️ 零件'}</td>
              <td style="text-align: right; padding: 6px; color: #2ecc71;">+${prod}</td>
              <td style="text-align: right; padding: 6px; color: #e74c3c;">-${cons}</td>
              <td style="text-align: right; padding: 6px; color: ${net >= 0 ? '#2ecc71' : '#e74c3c'};">${net >= 0 ? '+' : ''}${net}</td>
              <td style="text-align: right; padding: 6px; font-weight: bold;">${current}</td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>
  `;
  
  html += `<button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>`;
  
  showModal(html);
}

// 显示弹窗
function showModal(content) {
  const modal = document.getElementById('shelter-modal');
  const modalContent = document.getElementById('modal-content');
  if (modal && modalContent) {
    // 在内容右上角添加关闭按钮
    const closeBtn = `<div style="position:absolute;top:10px;right:15px;cursor:pointer;font-size:24px;color:#aaa;line-height:1;z-index:10;" onclick="closeModal()" title="关闭">✕</div>`;
    modalContent.innerHTML = `<div style="position:relative;">${closeBtn}${content}</div>`;
    modal.style.display = 'flex';
  }
}

// 显示战场充能菜单
function showChargeMenu() {
  const charge = ShelterSystem.getBattlefieldCharge();
  const shieldCost = ShelterSystem.getShieldChargeCost();
  const empCost = ShelterSystem.getEMPCost();
  const repairCost = ShelterSystem.getFortRepairCost();
  const powerStatus = ShelterSystem.getPowerStatus();
  const effects = ShelterSystem.getTechEffects();
  
  const canShield = charge.current >= shieldCost;
  const canEMP = charge.current >= empCost;
  const canRepair = charge.current >= repairCost;
  const powerPct = powerStatus.max > 0 ? Math.floor(powerStatus.current / powerStatus.max * 100) : 0;
  const powerColor = powerStatus.surplus >= 0 ? '#27ae60' : '#e74c3c';
  
  const html = `
    <h2 style="margin-top: 0; color: #f1c40f; display: flex; align-items: center; gap: 10px;">
      ⚡ 战场充能系统
    </h2>
    
    <!-- 电力状态 -->
    <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255,215,0,0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 14px; color: #aaa;">⚡ 避难所电力</span>
        <span style="font-size: 14px; color: ${powerColor};">${powerStatus.current}/${powerStatus.max} ${powerStatus.consumption > 0 ? `(-${powerStatus.consumption}/s)` : ''}</span>
      </div>
      <div style="background: rgba(255,255,255,0.1); border-radius: 5px; height: 8px; overflow: hidden;">
        <div style="width: ${powerPct}%; height: 100%; background: ${powerColor}; transition: width 0.3s;"></div>
      </div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">
        ${powerStatus.consumption > 0 ? (powerStatus.surplus >= 0 ? `✅ 供电正常，盈余 ${powerStatus.surplus}` : `⚠️ 电力不足，工事效果减半`) : '⚡ 无工事消耗'}
      </div>
    </div>
    
    <!-- 充能点 -->
    <div style="background: rgba(241,196,15,0.1); border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(241,196,15,0.3); text-align: center;">
      <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">当前战场充能点</div>
      <div style="font-size: 32px; color: #f1c40f; font-weight: bold;">${charge.current}</div>
      <div style="font-size: 12px; color: #888;">上限 ${charge.max}</div>
      <div style="margin-top: 8px; background: rgba(255,255,255,0.05); border-radius: 5px; height: 8px;">
        <div style="width: ${charge.max > 0 ? Math.floor(charge.current/charge.max*100) : 0}%; height: 100%; background: #f1c40f; border-radius: 5px;"></div>
      </div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">
        战场击杀/波次获得充能点 | 电工加成: ${Math.floor((ShelterSystem.getChargeSpeedMult() - 1) * 100)}%
      </div>
    </div>
    
    <!-- 充能选项 -->
    <div style="display: flex; flex-direction: column; gap: 12px;">
      
      <!-- 电力护盾 -->
      <div style="background: rgba(52,152,219,0.1); border-radius: 10px; padding: 15px; border: 1px solid rgba(52,152,219,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 16px; color: #5dade2; margin-bottom: 4px;">🛡️ 电力护盾充能</div>
            <div style="font-size: 12px; color: #888;">消耗 <span style="color: #f1c40f; font-weight: bold;">${shieldCost}</span> 充能点 | 效果：战场护盾完全充能</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">被动回复：${Math.floor((effects.shieldRegenMult || 1) * 2)}/秒 | 上限：${Math.floor((effects.shieldCapacityMult || 1) * 50)}点</div>
          </div>
          <button onclick="doChargeShield()" style="padding: 10px 20px; background: ${canShield ? '#3498db' : '#555'}; border: none; border-radius: 8px; color: white; cursor: ${canShield ? 'pointer' : 'not-allowed'}; font-size: 14px; font-weight: bold; opacity: ${canShield ? 1 : 0.5};">
            ${canShield ? '激活' : `需要${shieldCost}点`}
          </button>
        </div>
      </div>
      
      <!-- 电磁脉冲 -->
      <div style="background: rgba(155,89,182,0.1); border-radius: 10px; padding: 15px; border: 1px solid rgba(155,89,182,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 16px; color: #bb8fce; margin-bottom: 4px;">💥 电磁脉冲</div>
            <div style="font-size: 12px; color: #888;">消耗 <span style="color: #f1c40f; font-weight: bold;">${empCost}</span> 充能点 | 效果：100米内所有敌人麻痹3秒</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">⚠ 麻痹期间敌人无法移动、攻击或造成伤害</div>
          </div>
          <button onclick="doTriggerEMP()" style="padding: 10px 20px; background: ${canEMP ? '#9b59b6' : '#555'}; border: none; border-radius: 8px; color: white; cursor: ${canEMP ? 'pointer' : 'not-allowed'}; font-size: 14px; font-weight: bold; opacity: ${canEMP ? 1 : 0.5};">
            ${canEMP ? '发射' : `需要${empCost}点`}
          </button>
        </div>
      </div>
      
      <!-- 工事修复 -->
      <div style="background: rgba(39,174,96,0.1); border-radius: 10px; padding: 15px; border: 1px solid rgba(39,174,96,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 16px; color: #58d68d; margin-bottom: 4px;">🔧 工事紧急修复</div>
            <div style="font-size: 12px; color: #888;">消耗 <span style="color: #f1c40f; font-weight: bold;">${repairCost}</span> 充能点 | 效果：所有友方工事回复50%耐久</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">修复有30秒冷却</div>
          </div>
          <button onclick="doFortRepair()" style="padding: 10px 20px; background: ${canRepair ? '#27ae60' : '#555'}; border: none; border-radius: 8px; color: white; cursor: ${canRepair ? 'pointer' : 'not-allowed'}; font-size: 14px; font-weight: bold; opacity: ${canRepair ? 1 : 0.5};">
            ${canRepair ? '修复' : `需要${repairCost}点`}
          </button>
        </div>
      </div>
    </div>
    
    <div style="font-size: 11px; color: #666; text-align: center; margin-top: 15px;">
      战场充能点在战斗中累积，击杀敌人或通过波次获得
    </div>
    
    <button onclick="closeModal()" style="margin-top: 15px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>
  `;
  
  showModal(html);
}

// 执行电力护盾充能
function doChargeShield() {
  const cost = ShelterSystem.getShieldChargeCost();
  const charge = ShelterSystem.getBattlefieldCharge();
  if (charge.current < cost) {
    showToast('充能点不足！', 'error');
    return;
  }
  const success = ShelterSystem.useBattlefieldCharge(cost);
  if (success) {
    // 通过全局回调通知game.js
    if (typeof window.onShieldChargeRequested === 'function') {
      window.onShieldChargeRequested();
    }
    showToast('⚡ 电力护盾充能成功！', 'success');
    closeModal();
    // 刷新显示
    updateResourceDisplay();
  } else {
    showToast('充能失败！', 'error');
  }
}

// 执行EMP
function doTriggerEMP() {
  const cost = ShelterSystem.getEMPCost();
  const charge = ShelterSystem.getBattlefieldCharge();
  if (charge.current < cost) {
    showToast('充能点不足！', 'error');
    return;
  }
  const success = ShelterSystem.useBattlefieldCharge(cost);
  if (success) {
    // 设置EMP待触发标志，等玩家返回战场时触发
    window.empPending = true;
    showToast('💥 电磁脉冲已发射！返回战场后生效', 'success');
    closeModal();
    updateResourceDisplay();
  } else {
    showToast('发射失败！', 'error');
  }
}

// 检查并触发待发的EMP（由game.js在返回战场时调用）
function checkPendingEMP() {
  if (window.empPending) {
    window.empPending = false;
    if (typeof window.onEMPRequested === 'function') {
      window.onEMPRequested();
    }
    console.log('[EMP] Pending EMP triggered');
  }
}

// 执行工事修复
function doFortRepair() {
  const cost = ShelterSystem.getFortRepairCost();
  const charge = ShelterSystem.getBattlefieldCharge();
  if (charge.current < cost) {
    showToast('充能点不足！', 'error');
    return;
  }
  const success = ShelterSystem.useBattlefieldCharge(cost);
  if (success) {
    if (typeof window.onFortRepairRequested === 'function') {
      window.onFortRepairRequested();
    }
    showToast('🔧 工事紧急修复完成！', 'success');
    closeModal();
    updateResourceDisplay();
  } else {
    showToast('修复失败！', 'error');
  }
}

// 显示宠物菜单（机器狗设置）
function showPetMenu() {
  const data = ShelterSystem.getData();
  const defs = ShelterSystem.getDefs();
  
  // 检查机器狗是否已解锁（现在从避难所直接解锁，不需要工事研发）
  const roboDogUnlocked = data.roboDogUnlocked !== false; // 默认解锁
  
  // 机器狗状态
  const dogHealth = data.roboDogHealth || 300;
  const dogMaxHealth = 300;
  const dogHealthPct = Math.floor(dogHealth / dogMaxHealth * 100);
  const isDeployed = window.deployedRoboDog !== null && window.deployedRoboDog !== undefined;
  
  const html = `
    <h2 style="margin-top: 0; color: #2ecc71; display: flex; align-items: center; gap: 10px;">
      🐕 宠物系统
    </h2>
    
    <!-- 机器狗状态 -->
    <div style="background: rgba(46,204,113,0.1); border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(46,204,113,0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">🐕</span>
          <div>
            <div style="font-size: 16px; font-weight: bold; color: #2ecc71;">机器狗</div>
            <div style="font-size: 12px; color: #888;">战场中按 P 部署/收起</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; color: ${isDeployed ? '#3498db' : '#888'};">
            ${isDeployed ? '已部署' : '未部署'}
          </div>
          <div style="font-size: 14px; color: ${dogHealthPct > 50 ? '#2ecc71' : dogHealthPct > 25 ? '#f39c12' : '#e74c3c'};">
            ${dogHealth} / ${dogMaxHealth}
          </div>
          <div style="font-size: 12px; color: #888;">耐久度</div>
        </div>
      </div>
      <div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 8px; overflow: hidden;">
        <div style="width: ${dogHealthPct}%; height: 100%; background: ${dogHealthPct > 50 ? '#2ecc71' : dogHealthPct > 25 ? '#f39c12' : '#e74c3c'}; transition: width 0.3s;"></div>
      </div>
    </div>
    
    <!-- 机器狗信息 -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 10px; color: #ddd;">📋 机器狗信息</div>
      <div style="font-size: 12px; color: #888; line-height: 1.6;">
        <div>• 耐久度: ${dogMaxHealth} 点</div>
        <div>• 拾取范围: 20米</div>
        <div>• 移动速度: 5 m/s</div>
        <div>• 部署消耗: 200 零件</div>
      </div>
    </div>
    
    <!-- 使用说明 -->
    <div style="background: rgba(52,152,219,0.1); border-radius: 10px; padding: 15px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 10px; color: #3498db;">💡 使用说明</div>
      <div style="font-size: 12px; color: #888; line-height: 1.6;">
        <div>• 战场中按 <b style="color: #fff;">P</b> 打开伙伴窗口</div>
        <div>• 在伙伴窗口中点击"部署机器狗"按钮</div>
        <div>• 再次按 P 可收起机器狗</div>
      </div>
    </div>
    
    <button onclick="closeModal()" style="margin-top: 20px; padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px; color: white; cursor: pointer; width: 100%;">关闭</button>
  `;
  
  showModal(html);
}

// 关闭弹窗
function closeModal() {
  const modal = document.getElementById('shelter-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 打开避难所UI
function openShelterUI() {
  // 关闭V部署模式（如果有）
  if (window.deploymentMode) {
    window.deploymentMode = false;
    if (window.FortificationSystem) FortificationSystem.exitDeploymentMode();
  }
  // 关闭P伙伴窗口（如果有）
  if (window.allyPanelState && typeof closeAllyPanel === 'function') {
    closeAllyPanel();
  }
  
  // 确保shelterUI已初始化
  if (!shelterUI) {
    initShelterUI();
  }
  if (shelterUI) {
    shelterUI.style.display = 'block';
    try {
      renderShelterMain();
    } catch(e) {
      console.error('[ShelterUI] Render error:', e);
    }
    document.exitPointerLock();
    // 显示光标
    document.body.style.cursor = 'default';
  }
  window.shelterPauseState = true;
}

// 关闭避难所UI
function closeShelterUI() {
  if (shelterUI) {
    shelterUI.style.display = 'none';
  }
  window.shelterPauseState = false;

  // 隐藏光标（游戏模式）
  document.body.style.cursor = 'none';

  // 恢复PointerLock
  if (typeof gameState !== 'undefined' && gameState === 'playing' &&
      typeof renderer !== 'undefined' && renderer && renderer.domElement) {
    renderer.domElement.requestPointerLock();
  }
  
  // 返回战场时检查待触发的EMP
  checkPendingEMP();
}

// 导出函数
window.ShelterUI = {
  init: initShelterUI,
  open: openShelterUI,
  close: closeShelterUI
};
