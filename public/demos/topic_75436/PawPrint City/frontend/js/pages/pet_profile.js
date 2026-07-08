// 爪印城市 - 宠物档案页
Router.register('pet_profile', () => {
  return `
    <div class="sub-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">宠物档案</span>
        <span class="add-btn" id="add-pet-btn" style="color:var(--primary);font-weight:600;cursor:pointer;font-size:13px;">+ 添加</span>
      </div>
      <div id="pets-list" style="margin-top:12px;">
        <div style="text-align:center;color:var(--text-light);padding:40px;">加载中...</div>
      </div>
    </div>
  `;
});

async function init_pet_profile() {
  await loadPets();

  document.getElementById('add-pet-btn').addEventListener('click', () => {
    openAddPetModal();
  });
}

async function loadPets() {
  const auth = getAuth();
  const userId = auth ? auth.userId : 'user_demo_001';
  const res = await api.getPets(userId);
  const pets = res.data || [];
  const list = document.getElementById('pets-list');

  if (pets.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🐕</div>
        <p>还没有添加宠物档案</p>
        <p style="font-size:12px;margin-top:4px;">添加宠物档案，让出行更便捷</p>
        <button class="btn btn-primary btn-sm mt-12" onclick="openAddPetModal()">添加宠物</button>
      </div>
    `;
    return;
  }

  const typeIcons = { '犬类': '🐕', '猫类': '🐱' };
  const sizeMap = { '小型': '迷你', '中型': '中等', '大型': '大型' };

  list.innerHTML = pets.map(p => `
    <div class="pet-card">
      <div class="pet-avatar">${typeIcons[p.type] || '🐾'}</div>
      <div class="pet-info">
        <div class="pet-name">${p.name}</div>
        <div class="pet-meta">${p.type} · ${p.breed} · ${p.age} · ${sizeMap[p.size] || p.size}</div>
        ${p.description ? `<div class="pet-desc">${p.description}</div>` : ''}
      </div>
      <div class="pet-delete" onclick="deletePet(${p.id})">删除</div>
    </div>
  `).join('');
}

function openAddPetModal() {
  Modal.show('添加宠物', `
    <div class="form-group">
      <label>宠物名称 <span class="required">*</span></label>
      <input class="form-input" id="pet-name" placeholder="给宝贝起个名字" />
    </div>
    <div class="form-group">
      <label>宠物类型 <span class="required">*</span></label>
      <select class="form-select" id="pet-type">
        <option value="犬类">🐕 犬类</option>
        <option value="猫类">🐱 猫类</option>
      </select>
    </div>
    <div class="form-group">
      <label>品种</label>
      <input class="form-input" id="pet-breed" placeholder="如：金毛、英短" />
    </div>
    <div class="form-group">
      <label>年龄</label>
      <input class="form-input" id="pet-age" placeholder="如：2岁" />
    </div>
    <div class="form-group">
      <label>体型</label>
      <select class="form-select" id="pet-size">
        <option value="小型">小型</option>
        <option value="中型" selected>中型</option>
        <option value="大型">大型</option>
      </select>
    </div>
    <div class="form-group">
      <label>简介</label>
      <textarea class="form-textarea" id="pet-desc" placeholder="介绍一下你的宝贝..." style="min-height:60px;"></textarea>
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="submitAddPet()">确认添加</button>
  `);
}

async function submitAddPet() {
  const auth = getAuth();
  const userId = auth ? auth.userId : 'user_demo_001';
  const name = document.getElementById('pet-name').value.trim();
  const type = document.getElementById('pet-type').value;
  const breed = document.getElementById('pet-breed').value.trim();
  const age = document.getElementById('pet-age').value.trim();
  const size = document.getElementById('pet-size').value;
  const description = document.getElementById('pet-desc').value.trim();

  if (!name || !type) {
    showToast('请填写宠物名称和类型');
    return;
  }

  const res = await api.addPet({ userId, name, type, breed, age, size, description });
  if (res.code === 200) {
    Modal.close();
    showToast('宠物档案添加成功！');
    loadPets();
  }
}

async function deletePet(petId) {
  Modal.show('删除宠物档案', `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:48px;margin-bottom:16px;">😢</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:8px;">确定要删除这个宠物档案吗？</div>
      <div style="font-size:13px;color:var(--text-light);">删除后将无法恢复</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      <button class="btn btn-outline btn-block" onclick="Modal.close()">取消</button>
      <button class="btn btn-primary btn-block" style="background:#E74C3C" onclick="confirmDeletePet(${petId})">确认删除</button>
    </div>
  `);
}

async function confirmDeletePet(petId) {
  const auth = getAuth();
  const userId = auth ? auth.userId : 'user_demo_001';
  const res = await api.deletePet(petId, userId);
  Modal.close();
  if (res.code === 200) {
    showToast('已删除');
    init_pet_profile();
  }
}