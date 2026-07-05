/**
 * 看病记录管理页面模块
 * 支持手动填写和AI智能整理两种模式
 * 根据URL参数判断当前模式：add(添加)、edit(编辑)、detail(详情)
 */
const MedicalRecordPage = {

  /**
   * 解析当前URL，判断页面模式
   * @returns {string} 'add' | 'edit' | 'detail'
   */
  _getMode() {
    const hash = window.location.hash;
    if (hash.includes('/add')) return 'add';
    if (hash.includes('/edit')) return 'edit';
    return 'detail';
  },

  /**
   * 解析URL中的查询参数
   * @returns {URLSearchParams}
   */
  _getParams() {
    const hash = window.location.hash;
    const queryPart = hash.split('?')[1] || '';
    return new URLSearchParams(queryPart);
  },

  /**
   * 渲染看病记录页面
   * @returns {string} HTML字符串
   */
  render() {
    const mode = this._getMode();
    if (mode === 'detail') {
      return this._renderDetail();
    } else {
      return this._renderForm(mode);
    }
  },

  /**
   * 渲染表单页面（添加/编辑）
   * @param {string} mode - 'add' 或 'edit'
   * @returns {string} 表单HTML字符串
   */
  _renderForm(mode) {
    const isEdit = mode === 'edit';
    const title = isEdit ? '编辑看病记录' : '添加看病记录';

    // 编辑模式或从URL参数获取数据
    let record = {};
    let memberId = '';
    if (isEdit) {
      const params = this._getParams();
      const recordId = params.get('id');
      if (recordId) {
        record = Storage.getById(Storage.KEYS.MEDICAL_RECORDS, recordId) || {};
      }
    } else {
      // 添加模式：从URL参数获取memberId
      const params = this._getParams();
      memberId = params.get('memberId') || '';
    }

    const today = Utils.getToday();

    return `
      <div class="page">
        <!-- 顶部导航 -->
        <div class="header">
          <div class="header__nav">
            <button class="header__back" id="btnBack">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header__title">${title}</div>
            <div class="header__action"></div>
          </div>
        </div>

        <div class="content">
          <form id="recordForm">
            <input type="hidden" id="recordId" value="${record.id || ''}" />
            <input type="hidden" id="recordMemberId" value="${record.memberId || memberId}" />

            <!-- Tab切换：手动填写 / AI智能整理 -->
            <div class="tab-switcher mb-md" id="inputModeSwitcher">
              <div class="tab-switcher__item tab-switcher__item--active" data-mode="manual">手动填写</div>
              <div class="tab-switcher__item" data-mode="ai">AI智能整理</div>
            </div>

            <!-- 手动填写区域 -->
            <div id="manualInputArea">
              <!-- 就诊日期 -->
              <div class="form-group">
                <label class="form-label" for="visitDate">
                  就诊日期 <span class="text-danger">*</span>
                </label>
                <input type="date" class="form-input" id="visitDate" 
                  value="${record.visitDate || today}" required />
              </div>

              <!-- 医院 -->
              <div class="form-group">
                <label class="form-label" for="hospital">
                  医院 <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-input" id="hospital" 
                  placeholder="请输入医院名称" 
                  value="${Utils.escapeHtml(record.hospital || '')}" required />
              </div>

              <!-- 科室 -->
              <div class="form-group">
                <label class="form-label" for="department">
                  科室 <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-input" id="department" 
                  placeholder="请输入科室名称" 
                  value="${Utils.escapeHtml(record.department || '')}" required />
              </div>

              <!-- 医生 -->
              <div class="form-group">
                <label class="form-label" for="doctor">医生</label>
                <input type="text" class="form-input" id="doctor" 
                  placeholder="请输入医生姓名" 
                  value="${Utils.escapeHtml(record.doctor || '')}" />
              </div>

              <!-- 诊断结果 -->
              <div class="form-group">
                <label class="form-label" for="diagnosis">
                  诊断结果 <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-input" id="diagnosis" 
                  placeholder="请输入诊断结果" 
                  value="${Utils.escapeHtml(record.diagnosis || '')}" required />
              </div>

              <!-- 症状描述 -->
              <div class="form-group">
                <label class="form-label" for="symptoms">症状描述</label>
                <textarea class="form-textarea" id="symptoms" 
                  placeholder="请输入症状描述">${Utils.escapeHtml(record.symptoms || '')}</textarea>
              </div>

              <!-- 处方 -->
              <div class="form-group">
                <label class="form-label" for="prescription">处方</label>
                <textarea class="form-textarea" id="prescription" 
                  placeholder="请输入处方信息">${Utils.escapeHtml(record.prescription || '')}</textarea>
              </div>

              <!-- 费用 -->
              <div class="form-group">
                <label class="form-label" for="cost">费用（元）</label>
                <input type="number" class="form-input" id="cost" 
                  placeholder="请输入费用" 
                  value="${record.cost || ''}" min="0" step="0.01" />
              </div>

              <!-- 备注 -->
              <div class="form-group">
                <label class="form-label" for="notes">备注</label>
                <textarea class="form-textarea" id="notes" 
                  placeholder="请输入备注信息">${Utils.escapeHtml(record.notes || '')}</textarea>
              </div>
            </div>

            <!-- AI智能整理区域 -->
            <div id="aiInputArea" class="hidden">
              <div class="ai-input">
                <textarea class="ai-input__textarea" id="aiText" 
                  placeholder="请将看病相关的文字信息粘贴到这里，AI将自动整理填入表单...&#10;&#10;例如：&#10;2026年7月1日，在协和医院内科就诊，李医生诊断感冒，症状咳嗽发烧，开了阿莫西林，花费200元。"></textarea>
                <div class="ai-input__footer">
                  <button type="button" class="ai-input__send" id="btnAiOrganize">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7l3-7z" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                    AI整理
                  </button>
                </div>
              </div>
            </div>

            <!-- 图片上传区域 -->
            <div class="form-group">
              <label class="form-label">上传图片</label>
              <div id="imageUploadContainer" class="image-upload"></div>
              <small class="text-hint">支持上传检查报告、处方图片</small>
            </div>

            <!-- OCR识别按钮 -->
            <div class="form-group" id="ocrSection" style="display:none;">
              <button type="button" class="btn btn--outline btn--block" id="btnOcr">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;">
                  <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 12h10M7 8h6M7 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                OCR识别图片文字
              </button>
              <small class="text-hint">从上传的图片中识别文字，自动填充到表单</small>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-md mt-lg">
              <button type="button" class="btn btn--secondary flex-1" id="btnCancel">取消</button>
              <button type="submit" class="btn btn--primary flex-1" id="btnSave">保存</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  /**
   * 渲染详情页面
   * @returns {string} 详情页HTML字符串
   */
  _renderDetail() {
    const params = this._getParams();
    const recordId = params.get('id');
    const record = Storage.getById(Storage.KEYS.MEDICAL_RECORDS, recordId);

    if (!record) {
      return `
        <div class="page">
          <div class="header">
            <div class="header__nav">
              <button class="header__back" id="btnBack">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="header__title">记录详情</div>
              <div class="header__action"></div>
            </div>
          </div>
          <div class="content">
            <div class="empty-state">
              <div class="empty-state__icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path d="M20 60V30l20-10 20 10v30H20z" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
                  <path d="M32 60V42h16v18" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
                </svg>
              </div>
              <p class="empty-state__text">未找到该看病记录</p>
            </div>
          </div>
        </div>
      `;
    }

    // 构建图片区域
    const images = record.images || [];
    let imagesHtml = '';
    if (images.length > 0) {
      imagesHtml = `
        <div class="image-upload" id="detailImages">
          ${images
            .map(
              (img, idx) => `
              <div class="image-upload__item" data-img-index="${idx}" data-img-src="${img.data}">
                <img src="${img.data}" alt="${Utils.escapeHtml(img.name || '图片')}" />
              </div>
            `
            )
            .join('')}
        </div>
      `;
    }

    // 获取关联的治疗记录
    const treatments = Storage.getAll(Storage.KEYS.TREATMENTS) || [];
    const recordTreatments = treatments
      .filter((t) => t.medicalRecordId === record.id)
      .sort((a, b) => (b.startDate || b.treatmentDate || '').localeCompare(a.startDate || a.treatmentDate || ''));

    // 构建治疗记录列表
    let treatmentsHtml = '';
    if (recordTreatments.length > 0) {
      treatmentsHtml = recordTreatments
        .map((treatment) => `
          <div class="card card--treatment" data-treatment-id="${treatment.id}">
            <div class="card__header">
              <span class="card__title">${Utils.getTreatmentTypeText(treatment.treatmentType || treatment.type)}</span>
              <small class="text-hint">${Utils.formatDate(treatment.treatmentDate || treatment.startDate)}</small>
            </div>
            <div class="card__body">
              ${Utils.escapeHtml(
                (treatment.treatmentContent || treatment.description || '')
                  ? (treatment.treatmentContent || treatment.description).substring(0, 50) + ((treatment.treatmentContent || treatment.description).length > 50 ? '...' : '')
                  : '无内容'
              )}
            </div>
          </div>
        `)
        .join('');
    } else {
      treatmentsHtml = `
        <div class="empty-state">
          <p class="empty-state__text">暂无治疗记录</p>
        </div>
      `;
    }

    return `
      <div class="page">
        <!-- 顶部导航 -->
        <div class="header">
          <div class="header__nav">
            <button class="header__back" id="btnBack">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header__title">${Utils.escapeHtml(record.diagnosis || '看病记录')}</div>
            <button class="header__action" id="btnEdit" title="编辑">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="var(--text-secondary)" stroke-width="2" fill="none"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="var(--text-secondary)" stroke-width="2" fill="none"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="content">
          <!-- 详细信息区域 -->
          <div class="card">
            <div class="info-row">
              <span class="info-row__label">就诊日期</span>
              <span class="info-row__value">${Utils.formatDate(record.visitDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">医院</span>
              <span class="info-row__value">${Utils.escapeHtml(record.hospital || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">科室</span>
              <span class="info-row__value">${Utils.escapeHtml(record.department || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">医生</span>
              <span class="info-row__value">${Utils.escapeHtml(record.doctor || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">诊断结果</span>
              <span class="info-row__value">${Utils.escapeHtml(record.diagnosis || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">症状描述</span>
              <span class="info-row__value">${Utils.escapeHtml(record.symptoms || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">处方</span>
              <span class="info-row__value">${Utils.escapeHtml(record.prescription || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">费用</span>
              <span class="info-row__value">${record.cost ? record.cost + '元' : '--'}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">备注</span>
              <span class="info-row__value">${Utils.escapeHtml(record.notes || '--')}</span>
            </div>
          </div>

          <!-- 图片区域 -->
          ${images.length > 0 ? `
            <div class="section-header">
              <h3 class="section-header__title">检查报告</h3>
            </div>
            <div class="card">
              ${imagesHtml}
            </div>
          ` : ''}

          <!-- 治疗记录区域 -->
          <div class="section-header">
            <h3 class="section-header__title">治疗记录</h3>
            <button class="section-header__action" id="btnAddTreatment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              添加
            </button>
          </div>
          <div id="treatmentsList">
            ${treatmentsHtml}
          </div>

          <!-- 删除按钮 -->
          <div class="mt-lg">
            <button class="btn btn--danger btn--block" id="btnDelete">
              删除此记录
            </button>
          </div>
        </div>
      </div>

      <style>
        .card--treatment {
          cursor: pointer;
        }
        .card--treatment:active {
          background: var(--bg-tertiary);
        }
      </style>
    `;
  },

  /**
   * 初始化看病记录页面事件绑定
   */
  init() {
    const mode = this._getMode();

    // 绑定返回按钮（通用）
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        window.history.back();
      });
    }

    if (mode === 'detail') {
      this._initDetail();
    } else {
      this._initForm();
    }
  },

  /**
   * 初始化表单页面事件
   */
  _initForm() {
    // 当前图片数据（用于保存时引用）
    let currentImages = [];

    // 编辑模式：加载已有图片
    const params = this._getParams();
    const recordId = params.get('id');
    if (recordId) {
      const record = Storage.getById(Storage.KEYS.MEDICAL_RECORDS, recordId);
      if (record && record.images) {
        currentImages = record.images.slice();
      }
    }

    // 初始化图片上传组件
    const imageContainer = document.getElementById('imageUploadContainer');
    if (imageContainer && typeof ImageUpload !== 'undefined') {
      ImageUpload.init(imageContainer, currentImages, function (updatedImages) {
        currentImages = updatedImages;
        // 显示/隐藏OCR按钮
        const ocrSection = document.getElementById('ocrSection');
        if (ocrSection) {
          ocrSection.style.display = updatedImages.length > 0 ? 'block' : 'none';
        }
      });
    }

    // Tab切换：手动填写 / AI智能整理
    const tabSwitcher = document.getElementById('inputModeSwitcher');
    const manualArea = document.getElementById('manualInputArea');
    const aiArea = document.getElementById('aiInputArea');

    // OCR识别按钮
    const btnOcr = document.getElementById('btnOcr');
    if (btnOcr) {
      btnOcr.addEventListener('click', function () {
        if (currentImages.length === 0) {
          Toast.warning('请先上传图片');
          return;
        }

        // 显示加载状态
        btnOcr.disabled = true;
        btnOcr.textContent = '识别中...';

        // 调用OCR识别（使用第一张图片）
        OCR.recognizeText(currentImages[0].data)
          .then(function (result) {
            // 将OCR结果填充到表单
            if (result.extractedData) {
              if (result.extractedData.visitDate) document.getElementById('visitDate').value = result.extractedData.visitDate;
              if (result.extractedData.hospital) document.getElementById('hospital').value = result.extractedData.hospital;
              if (result.extractedData.department) document.getElementById('department').value = result.extractedData.department;
              if (result.extractedData.doctor) document.getElementById('doctor').value = result.extractedData.doctor;
              if (result.extractedData.diagnosis) document.getElementById('diagnosis').value = result.extractedData.diagnosis;
              if (result.extractedData.symptoms) document.getElementById('symptoms').value = result.extractedData.symptoms;
              if (result.extractedData.prescription) document.getElementById('prescription').value = result.extractedData.prescription;
            }

            Toast.success('OCR识别完成，请核对信息');

            // 切换到手动填写模式查看结果
            if (manualArea) manualArea.classList.remove('hidden');
            if (aiArea) aiArea.classList.add('hidden');
            if (tabSwitcher) {
              tabSwitcher.querySelectorAll('.tab-switcher__item').forEach((t) => t.classList.remove('tab-switcher__item--active'));
              tabSwitcher.querySelector('[data-mode="manual"]').classList.add('tab-switcher__item--active');
            }
          })
          .catch(function (error) {
            Toast.error('OCR识别失败，请稍后重试');
            console.error('OCR recognize error:', error);
          })
          .finally(function () {
            btnOcr.disabled = false;
            btnOcr.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;">
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 12h10M7 8h6M7 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              OCR识别图片文字
            `;
          });
      });
    }

    if (tabSwitcher) {
      tabSwitcher.addEventListener('click', function (e) {
        const tabItem = e.target.closest('.tab-switcher__item');
        if (!tabItem) return;

        // 切换active状态
        tabSwitcher.querySelectorAll('.tab-switcher__item').forEach((t) => t.classList.remove('tab-switcher__item--active'));
        tabItem.classList.add('tab-switcher__item--active');

        const mode = tabItem.dataset.mode;
        if (mode === 'manual') {
          manualArea.classList.remove('hidden');
          aiArea.classList.add('hidden');
        } else {
          manualArea.classList.add('hidden');
          aiArea.classList.remove('hidden');
        }
      });
    }

    // AI整理按钮
    const btnAiOrganize = document.getElementById('btnAiOrganize');
    if (btnAiOrganize) {
      btnAiOrganize.addEventListener('click', function () {
        const aiText = document.getElementById('aiText').value.trim();
        if (!aiText) {
          Toast.warning('请输入需要整理的文字信息');
          return;
        }

        // 显示加载状态
        btnAiOrganize.disabled = true;
        btnAiOrganize.textContent = '整理中...';

        // 调用AI接口整理
        AI.organizeMedicalRecord(aiText)
          .then(function (result) {
            // 将AI整理结果填充到表单
            if (result.visitDate) document.getElementById('visitDate').value = result.visitDate;
            if (result.hospital) document.getElementById('hospital').value = result.hospital;
            if (result.department) document.getElementById('department').value = result.department;
            if (result.doctor) document.getElementById('doctor').value = result.doctor;
            if (result.diagnosis) document.getElementById('diagnosis').value = result.diagnosis;
            if (result.symptoms) document.getElementById('symptoms').value = result.symptoms;
            if (result.prescription) document.getElementById('prescription').value = result.prescription;
            if (result.cost) document.getElementById('cost').value = result.cost;
            if (result.notes) document.getElementById('notes').value = result.notes;

            Toast.success('AI整理完成，请核对信息');

            // 切换到手动填写模式查看结果
            manualArea.classList.remove('hidden');
            aiArea.classList.add('hidden');
            tabSwitcher.querySelectorAll('.tab-switcher__item').forEach((t) => t.classList.remove('tab-switcher__item--active'));
            tabSwitcher.querySelector('[data-mode="manual"]').classList.add('tab-switcher__item--active');
          })
          .catch(function (error) {
            Toast.error('AI整理失败，请稍后重试');
            console.error('AI organize error:', error);
          })
          .finally(function () {
            btnAiOrganize.disabled = false;
            btnAiOrganize.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7l3-7z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              AI整理
            `;
          });
      });
    }

    // 表单提交保存
    const form = document.getElementById('recordForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const visitDate = document.getElementById('visitDate').value;
        const hospital = document.getElementById('hospital').value.trim();
        const department = document.getElementById('department').value.trim();
        const diagnosis = document.getElementById('diagnosis').value.trim();

        // 必填字段验证
        if (!visitDate) {
          Toast.warning('请选择就诊日期');
          return;
        }
        if (!hospital) {
          Toast.warning('请输入医院名称');
          return;
        }
        if (!department) {
          Toast.warning('请输入科室名称');
          return;
        }
        if (!diagnosis) {
          Toast.warning('请输入诊断结果');
          return;
        }

        const memberId = document.getElementById('recordMemberId').value;
        if (!memberId) {
          Toast.error('缺少关联的家庭成员');
          return;
        }

        // 获取关联成员信息以填充groupId
        const member = Storage.getById(Storage.KEYS.MEMBERS, memberId);
        if (!member) {
          Toast.error('未找到关联的家庭成员');
          return;
        }

        // 收集表单数据
        const doctor = document.getElementById('doctor').value.trim();
        const symptoms = document.getElementById('symptoms').value.trim();
        const prescription = document.getElementById('prescription').value.trim();
        const cost = document.getElementById('cost').value ? parseFloat(document.getElementById('cost').value) : null;
        const notes = document.getElementById('notes').value.trim();
        const existingId = document.getElementById('recordId').value;

        const currentUser = Storage.getCurrentUser();
        const now = Utils.getToday();

        if (existingId) {
          // 编辑模式
          const existingRecord = Storage.getById(Storage.KEYS.MEDICAL_RECORDS, existingId);
          if (existingRecord) {
            const updatedRecord = {
              ...existingRecord,
              memberId,
              groupId: member.groupId,
              visitDate,
              hospital,
              department,
              doctor,
              diagnosis,
              symptoms,
              prescription,
              cost,
              notes,
              images: currentImages,
              updatedAt: now
            };
            Storage.update(Storage.KEYS.MEDICAL_RECORDS, existingId, updatedRecord);
            Toast.success('看病记录已更新');
            window.location.hash = `#/medical-record/detail?id=${existingId}`;
          }
        } else {
          // 添加模式
          const newRecord = {
            id: Utils.generateId('record'),
            memberId,
            groupId: member.groupId,
            visitDate,
            hospital,
            department,
            doctor,
            diagnosis,
            symptoms,
            prescription,
            cost,
            notes,
            images: currentImages,
            createdBy: currentUser.id,
            editable: true,
            createdAt: now,
            updatedAt: now
          };
          Storage.add(Storage.KEYS.MEDICAL_RECORDS, newRecord);
          Toast.success('看病记录添加成功');
          // 返回到成员详情页
          window.location.hash = `#/family-member/detail?id=${memberId}`;
        }
      });
    }

    // 取消按钮
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', function () {
        window.history.back();
      });
    }
  },

  /**
   * 初始化详情页面事件
   */
  _initDetail() {
    const params = this._getParams();
    const recordId = params.get('id');
    const record = Storage.getById(Storage.KEYS.MEDICAL_RECORDS, recordId);

    // 编辑按钮
    const btnEdit = document.getElementById('btnEdit');
    if (btnEdit) {
      btnEdit.addEventListener('click', function () {
        window.location.hash = `#/medical-record/edit?id=${recordId}`;
      });
    }

    // 添加治疗记录按钮
    const btnAddTreatment = document.getElementById('btnAddTreatment');
    if (btnAddTreatment && record) {
      btnAddTreatment.addEventListener('click', function () {
        window.location.hash = `#/treatment/add?medicalRecordId=${recordId}&memberId=${record.memberId}`;
      });
    }

    // 治疗记录卡片点击
    const treatmentsList = document.getElementById('treatmentsList');
    if (treatmentsList) {
      treatmentsList.addEventListener('click', function (e) {
        const card = e.target.closest('[data-treatment-id]');
        if (card) {
          const treatmentId = card.dataset.treatmentId;
          window.location.hash = `#/treatment/detail?id=${treatmentId}`;
        }
      });
    }

    // 图片预览
    const detailImages = document.getElementById('detailImages');
    if (detailImages && record && record.images && typeof ImageUpload !== 'undefined') {
      detailImages.addEventListener('click', function (e) {
        const imgItem = e.target.closest('[data-img-index]');
        if (imgItem) {
          const startIndex = parseInt(imgItem.dataset.imgIndex, 10);
          ImageUpload.preview(record.images, startIndex);
        }
      });
    }

    // 删除按钮
    const btnDelete = document.getElementById('btnDelete');
    if (btnDelete && record) {
      btnDelete.addEventListener('click', function () {
        Modal.confirm({
          title: '删除记录',
          message: '确定要删除这条看病记录吗？关联的治疗记录也将被删除，此操作不可恢复。',
          confirmText: '删除',
          cancelText: '取消',
          danger: true,
          onConfirm: function () {
            // 级联删除关联的治疗记录
            const treatments = Storage.getAll(Storage.KEYS.TREATMENTS) || [];
            const relatedTreatments = treatments.filter((t) => t.medicalRecordId === recordId);
            relatedTreatments.forEach((treatment) => {
              Storage.remove(Storage.KEYS.TREATMENTS, treatment.id);
            });

            // 删除看病记录
            Storage.remove(Storage.KEYS.MEDICAL_RECORDS, recordId);
            Toast.success('记录已删除');

            // 返回成员详情页或记录列表页
            if (record.memberId) {
              window.location.hash = `#/family-member/detail?id=${record.memberId}`;
            } else {
              window.location.hash = '#/records';
            }
          }
        });
      });
    }
  }
};
