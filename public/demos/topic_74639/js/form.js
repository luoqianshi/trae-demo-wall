// ========== 发布寻亲信息表单模块 ==========

let formPhotos = []; // 存储上传的照片 (base64)
let reunitePhotos = []; // 存储团聚照片

function renderFormPage() {
  // 重置表单状态
  formPhotos = [];
  reunitePhotos = [];
  const publishForm = document.getElementById('publish-form');
  if (publishForm) {
    publishForm.reset();
  }

  // 绑定照片上传
  setupPhotoDropzone();

  // 绑定表单提交
  if (publishForm) {
    publishForm.onsubmit = handleFormSubmit;
  }

  updatePhotoPreview();
}

function setupPhotoDropzone() {
  const dropzone = document.getElementById('photo-dropzone');
  const fileInput = document.getElementById('photo-input');

  if (!dropzone || !fileInput) return;

  // 点击上传
  dropzone.onclick = function() {
    fileInput.click();
  };

  // 文件选择
  fileInput.onchange = function(e) {
    handlePhotoUpload(e.target.files);
    fileInput.value = ''; // 重置，允许重复选择同一文件
  };

  // 拖拽
  dropzone.ondragover = function(e) {
    e.preventDefault();
    dropzone.classList.add('border-reunion', 'bg-reunion-light');
  };

  dropzone.ondragleave = function(e) {
    e.preventDefault();
    dropzone.classList.remove('border-reunion', 'bg-reunion-light');
  };

  dropzone.ondrop = function(e) {
    e.preventDefault();
    dropzone.classList.remove('border-reunion', 'bg-reunion-light');
    handlePhotoUpload(e.dataTransfer.files);
  };
}

function handlePhotoUpload(files) {
  if (!files || files.length === 0) return;

  const maxPhotos = 3;
  const remaining = maxPhotos - formPhotos.length;
  const toProcess = Array.from(files).slice(0, remaining);

  toProcess.forEach(file => {
    if (!file.type.startsWith('image/')) {
      showToast('只能上传图片文件', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      // 压缩图片
      compressImage(e.target.result, 800, function(compressedDataUrl) {
        formPhotos.push(compressedDataUrl);
        updatePhotoPreview();
      });
    };
    reader.readAsDataURL(file);
  });

  if (Array.from(files).length > remaining) {
    showToast(`最多上传 ${maxPhotos} 张照片`, 'info');
  }
}

function compressImage(dataUrl, maxWidth, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = height * (maxWidth / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', 0.8));
  };
  img.src = dataUrl;
}

function updatePhotoPreview() {
  const previewEl = document.getElementById('photo-preview');
  if (!previewEl) return;

  previewEl.innerHTML = formPhotos.map((photo, index) => `
    <div class="photo-thumb relative">
      <img src="${photo}" alt="照片 ${index + 1}" />
      <button type="button" class="photo-remove" onclick="removePhoto(${index})">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `).join('');
}

function removePhoto(index) {
  formPhotos.splice(index, 1);
  updatePhotoPreview();
}

function handleFormSubmit(e) {
  e.preventDefault();

  if (formPhotos.length === 0) {
    showToast('请至少上传一张照片', 'error');
    return;
  }

  const name = document.getElementById('form-name').value.trim();
  const gender = document.getElementById('form-gender').value;
  const birthDate = document.getElementById('form-birthdate').value;
  const missingDate = document.getElementById('form-missingdate').value;
  const location = document.getElementById('form-location').value.trim();
  const latitude = parseFloat(document.getElementById('form-latitude').value);
  const longitude = parseFloat(document.getElementById('form-longitude').value);
  const description = document.getElementById('form-description').value.trim();
  const features = document.getElementById('form-features').value.trim();
  const contactName = document.getElementById('form-contact-name').value.trim();
  const contactPhone = document.getElementById('form-contact-phone').value.trim();
  const contactEmail = document.getElementById('form-contact-email').value.trim();

  // 验证
  if (!name || !gender || !missingDate || !location || !description || !contactName || !contactPhone) {
    showToast('请填写所有必填项', 'error');
    return;
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    showToast('请填写正确的经纬度', 'error');
    return;
  }

  // 创建寻亲信息
  const newPerson = {
    id: generateUUID(),
    name: name,
    gender: gender,
    birthDate: birthDate || '',
    missingDate: missingDate,
    missingLocation: location,
    latitude: latitude,
    longitude: longitude,
    description: description,
    features: features,
    photos: [...formPhotos],
    contactName: contactName,
    contactPhone: contactPhone,
    contactEmail: contactEmail,
    status: 'missing',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    comments: []
  };

  const allPersons = getAllPersons();
  allPersons.unshift(newPerson);
  saveAllPersons(allPersons);

  showToast('寻亲信息发布成功！', 'success');

  // 跳转到详情页
  setTimeout(() => {
    navigateTo('detail', newPerson.id);
  }, 800);
}

// ========== 标记为已团聚的表单 ==========

let currentReunitePersonId = null;

function openReuniteForm(personId) {
  currentReunitePersonId = personId;
  reunitePhotos = [];

  const modalEl = document.getElementById('reunite-modal');
  if (!modalEl) {
    navigateTo('data');
    return;
  }

  // 重置表单
  const dateInput = document.getElementById('reunite-date');
  const locationInput = document.getElementById('reunite-location');
  const latInput = document.getElementById('reunite-lat');
  const lngInput = document.getElementById('reunite-lng');
  const storyInput = document.getElementById('reunite-story');
  const familyInput = document.getElementById('reunite-family-message');
  const keySelect = document.getElementById('reunite-key-comment');

  if (dateInput) dateInput.value = formatDate(new Date());
  if (locationInput) locationInput.value = '';
  if (latInput) latInput.value = '';
  if (lngInput) lngInput.value = '';
  if (storyInput) storyInput.value = '';
  if (familyInput) familyInput.value = '';

  // 填充评论下拉
  const person = getPersonById(personId);
  if (keySelect && person && person.comments && person.comments.length > 0) {
    keySelect.innerHTML = '<option value="">（可选）选择帮助团聚的关键评论</option>' +
      person.comments.map(c => `<option value="${c.id}">${c.nickname}: ${c.content.substring(0, 30)}...</option>`).join('');
  } else if (keySelect) {
    keySelect.innerHTML = '<option value="">暂无评论</option>';
  }

  // 照片上传
  const photoInput = document.getElementById('reunite-photos');
  if (photoInput) {
    photoInput.onchange = function(e) {
      handleReunitePhotoUpload(e.target.files);
      photoInput.value = '';
    };
  }

  updateReunitePhotoPreview();

  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
  modalEl.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function handleReunitePhotoUpload(files) {
  if (!files || files.length === 0) return;

  Array.from(files).slice(0, 3 - reunitePhotos.length).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      compressImage(e.target.result, 800, function(compressed) {
        reunitePhotos.push(compressed);
        updateReunitePhotoPreview();
      });
    };
    reader.readAsDataURL(file);
  });
}

function updateReunitePhotoPreview() {
  const previewEl = document.getElementById('reunite-photo-preview');
  if (!previewEl) return;
  previewEl.innerHTML = reunitePhotos.map((photo, index) => `
    <div class="photo-thumb relative">
      <img src="${photo}" alt="团聚照片" />
      <button type="button" class="photo-remove" onclick="removeReunitePhoto(${index})">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `).join('');
}

function removeReunitePhoto(index) {
  reunitePhotos.splice(index, 1);
  updateReunitePhotoPreview();
}

function resetPublishForm() {
  formPhotos = [];
  const publishForm = document.getElementById('publish-form');
  if (publishForm) publishForm.reset();
  updatePhotoPreview();
}

function closeReuniteModal() {
  const modalEl = document.getElementById('reunite-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.classList.remove('flex');
  }
  document.body.style.overflow = '';
}

function submitReunite() {
  if (!currentReunitePersonId) return;

  const date = document.getElementById('reunite-date').value;
  const location = document.getElementById('reunite-location').value.trim();
  const lat = parseFloat(document.getElementById('reunite-lat').value);
  const lng = parseFloat(document.getElementById('reunite-lng').value);
  const story = document.getElementById('reunite-story').value.trim();
  const familyMessage = document.getElementById('reunite-family-message').value.trim();
  const keyCommentId = document.getElementById('reunite-key-comment').value || null;

  if (!date || !location || !story) {
    showToast('请填写团聚日期、地点和故事', 'error');
    return;
  }

  const person = getPersonById(currentReunitePersonId);
  if (!person) return;

  // 计算失踪天数
  const missingDays = calculateMissingDays(person.missingDate, date);

  // 更新状态为已团聚
  const reunionData = {
    date: date,
    location: location,
    latitude: isNaN(lat) ? person.latitude : lat,
    longitude: isNaN(lng) ? person.longitude : lng,
    reunitedPhotos: reunitePhotos.length > 0 ? [...reunitePhotos] : [person.photos[0] || ''],
    story: story,
    missingDuration: missingDays,
    keyCommentId: keyCommentId,
    familyMessage: familyMessage
  };

  const updated = updatePerson(currentReunitePersonId, {
    status: 'reunited',
    reunion: reunionData
  });

  if (updated) {
    showToast('🎉 太好了！团聚信息已记录！', 'success');
    closeReuniteModal();

    setTimeout(() => {
      // 重新渲染详情页
      if (currentPage === 'detail') {
        navigateTo('detail', currentReunitePersonId);
      } else {
        navigateTo('reunion');
      }
    }, 800);
  }
}
