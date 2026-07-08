// 爪印城市 - 商家入驻页
Router.register('publish', () => {
  return `
    <div class="publish-page">
      <div class="nav-header">
        <div class="page-title">📝 商家入驻</div>
      </div>
      <div class="notice">
        <h4>🐾 入驻须知</h4>
        <p>欢迎加入爪印城市宠物友好商家联盟！请如实填写以下信息，我们将在3个工作日内完成审核。审核通过后，您的店铺将出现在爪印城市地图上，被全城宠主发现。</p>
      </div>
      <div id="apply-form">
        <div class="form-group">
          <label>店铺名称 <span class="required">*</span></label>
          <input class="form-input" id="apply-name" placeholder="请输入店铺名称" />
        </div>
        <div class="form-group">
          <label>场所类型 <span class="required">*</span></label>
          <select class="form-select" id="apply-type">
            <option value="">请选择类型</option>
            <option value="餐饮">餐饮</option>
            <option value="住宿">住宿</option>
            <option value="公共空间">公共空间</option>
            <option value="商业">商业</option>
          </select>
        </div>
        <div class="form-group">
          <label>详细地址 <span class="required">*</span></label>
          <input class="form-input" id="apply-address" placeholder="请输入详细地址" />
        </div>
        <div class="form-group">
          <label>营业时间</label>
          <input class="form-input" id="apply-hours" placeholder="如：09:00-22:00" />
        </div>
        <div class="form-group">
          <label>联系电话</label>
          <input class="form-input" id="apply-phone" placeholder="请输入联系电话" />
        </div>
        <div class="form-group">
          <label>是否允许宠物入内</label>
          <select class="form-select" id="apply-allow">
            <option value="true">是，允许宠物入内</option>
            <option value="false">否，仅限室外区域</option>
          </select>
        </div>
        <div class="form-group">
          <label>支持宠物类型</label>
          <div class="checkbox-group" id="apply-pet-types">
            <label class="checkbox-item checked" data-value="犬类"><input type="checkbox" checked />🐕 犬类</label>
            <label class="checkbox-item" data-value="猫类"><input type="checkbox" />🐱 猫类</label>
          </div>
        </div>
        <div class="form-group">
          <label>支持体型</label>
          <div class="checkbox-group" id="apply-sizes">
            <label class="checkbox-item checked" data-value="小型"><input type="checkbox" checked />小型</label>
            <label class="checkbox-item" data-value="中型"><input type="checkbox" />中型</label>
            <label class="checkbox-item" data-value="大型"><input type="checkbox" />大型</label>
          </div>
        </div>
        <div class="form-group">
          <label>配套设施</label>
          <div class="checkbox-group" id="apply-facilities">
            <label class="checkbox-item" data-value="宠物水碗"><input type="checkbox" />💧 宠物水碗</label>
            <label class="checkbox-item" data-value="拾便袋"><input type="checkbox" />🪣 拾便袋</label>
            <label class="checkbox-item" data-value="宠物专区"><input type="checkbox" />🏠 宠物专区</label>
            <label class="checkbox-item" data-value="免费宠物零食"><input type="checkbox" />🍪 免费零食</label>
          </div>
        </div>
        <div class="form-group">
          <label>携带要求</label>
          <input class="form-input" id="apply-requirements" placeholder="如：宠物需佩戴牵引绳，大型犬需戴嘴套" />
        </div>
        <div class="form-group">
          <label>补充说明</label>
          <textarea class="form-textarea" id="apply-description" placeholder="请描述您的店铺特色和宠物友好设施..."></textarea>
        </div>
        <div class="form-group">
          <label>店铺图片</label>
          <div class="shop-upload-area" onclick="document.getElementById('shop-file-input').click()">
            <input type="file" id="shop-file-input" accept="image/*" multiple style="display:none" onchange="handleShopImageUpload(event)" />
            <span class="upload-icon">📷</span>
            <span class="upload-text">点击上传店铺照片</span>
            <span class="upload-hint">最多5张，每张不超过2MB</span>
          </div>
          <div class="shop-images-preview" id="shop-images-preview"></div>
        </div>
        <button class="btn btn-primary btn-block mt-16" onclick="submitApply()" style="margin-bottom:30px;">提交入驻申请</button>
      </div>
      <div id="apply-success" style="display:none;text-align:center;padding:40px 20px;">
        <div style="font-size:64px;margin-bottom:16px;">🎉</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">入驻申请提交成功！</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;">申请单号：<span id="apply-no-display" style="color:var(--primary);font-weight:600;"></span></div>
        <div style="font-size:13px;color:var(--text-light);margin-bottom:20px;">我们将在3个工作日内完成审核，您可以在「我的 → 我提交的商家」中查看进度</div>
        <button class="btn btn-primary" onclick="Router.navigate('profile')">查看申请进度</button>
      </div>
    </div>
  `;
});

let uploadedShopImages = [];

function init_publish() {
  // 绑定checkbox点击
  document.querySelectorAll('.checkbox-group').forEach(group => {
    group.querySelectorAll('.checkbox-item').forEach(item => {
      item.addEventListener('click', function(e) {
        if (e.target.tagName === 'INPUT') return;
        const checkbox = this.querySelector('input');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('checked', checkbox.checked);
      });
    });
  });

  uploadedShopImages = [];
}

function handleShopImageUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const previewContainer = document.getElementById('shop-images-preview');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件');
      continue;
    }

    // 检查文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      showToast('图片大小不能超过2MB');
      continue;
    }

    // 检查数量限制
    if (uploadedShopImages.length >= 5) {
      showToast('最多上传5张图片');
      break;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const imageUrl = e.target.result;
      uploadedShopImages.push(imageUrl);

      // 添加预览图片
      const imgIndex = uploadedShopImages.length - 1;
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'shop-image-item';
      imgWrapper.innerHTML = `
        <img src="${imageUrl}" alt="店铺图片" />
        <div class="shop-image-delete" onclick="removeShopImage(${imgIndex})">×</div>
      `;
      previewContainer.appendChild(imgWrapper);

      showToast(`已添加第${uploadedShopImages.length}张图片`);
    };
    reader.readAsDataURL(file);
  }

  // 清空input以便再次选择
  event.target.value = '';
}

function removeShopImage(index) {
  Modal.show('删除图片', `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:48px;margin-bottom:16px;">📷</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:8px;">确定要删除这张图片吗？</div>
      <div style="font-size:13px;color:var(--text-light);">删除后可重新上传其他图片</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      <button class="btn btn-outline btn-block" onclick="Modal.close()">取消</button>
      <button class="btn btn-primary btn-block" style="background:#E74C3C" onclick="confirmRemoveShopImage(${index})">确认删除</button>
    </div>
  `);
}

function confirmRemoveShopImage(index) {
  uploadedShopImages.splice(index, 1);

  // 重新渲染预览
  const previewContainer = document.getElementById('shop-images-preview');
  previewContainer.innerHTML = '';

  uploadedShopImages.forEach((url, i) => {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'shop-image-item';
    imgWrapper.innerHTML = `
      <img src="${url}" alt="店铺图片" />
      <div class="shop-image-delete" onclick="removeShopImage(${i})">×</div>
    `;
    previewContainer.appendChild(imgWrapper);
  });

  Modal.close();
  showToast('已删除图片');
}

async function submitApply() {
  const name = document.getElementById('apply-name').value.trim();
  const type = document.getElementById('apply-type').value;
  const address = document.getElementById('apply-address').value.trim();

  if (!name || !type || !address) {
    showToast('请填写店铺名称、场所类型和详细地址');
    return;
  }

  const getChecked = (groupId) => {
    const items = document.querySelectorAll(`#${groupId} .checkbox-item.checked`);
    return Array.from(items).map(i => i.dataset.value);
  };

  const data = {
    name,
    type,
    address,
    hours: document.getElementById('apply-hours').value.trim(),
    phone: document.getElementById('apply-phone').value.trim(),
    petPolicy: {
      allowed: document.getElementById('apply-allow').value === 'true',
      petTypes: getChecked('apply-pet-types'),
      sizeLimit: getChecked('apply-sizes'),
      requirements: document.getElementById('apply-requirements').value.trim()
    },
    description: document.getElementById('apply-description').value.trim(),
    facilities: getChecked('apply-facilities'),
    images: uploadedShopImages
  };

  const res = await api.submitMerchantApply(data);
  if (res.code === 200) {
    document.getElementById('apply-form').style.display = 'none';
    document.getElementById('apply-success').style.display = 'block';
    document.getElementById('apply-no-display').textContent = res.data.applyNo;
    uploadedShopImages = [];
    // 更新用户统计数据（刷新申请数量）
    const auth = getAuth();
    if (auth) refreshUserStats(auth.userId);
  } else {
    showToast(res.msg || '提交失败，请稍后重试');
  }
}