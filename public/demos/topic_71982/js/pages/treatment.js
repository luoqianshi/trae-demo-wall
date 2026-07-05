/**
 * 治疗记录管理页面模块
 * 支持添加、编辑、查看治疗记录详情
 * 根据URL参数判断当前模式：add(添加)、edit(编辑)、detail(详情)
 */
const TreatmentPage = {

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
   * 渲染治疗记录页面
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
    const title = isEdit ? '编辑治疗记录' : '添加治疗记录';

    // 编辑模式：加载已有数据
    let treatment = {};
    let medicalRecordId = '';
    let memberId = '';
    if (isEdit) {
      const params = this._getParams();
      const treatmentId = params.get('id');
      if (treatmentId) {
        treatment = Storage.getById(Storage.KEYS.TREATMENTS, treatmentId) || {};
      }
    } else {
      // 添加模式：从URL参数获取关联信息
      const params = this._getParams();
      medicalRecordId = params.get('medicalRecordId') || '';
      memberId = params.get('memberId') || '';
    }

    const today = Utils.getToday();

    // 构建治疗类型下拉选项
    const treatmentTypes = [
      { value: 'medication', label: '药物治疗' },
      { value: 'physical', label: '物理治疗' },
      { value: 'surgery', label: '手术治疗' },
      { value: 'tcm', label: '中医治疗' },
      { value: 'rehabilitation', label: '康复训练' },
      { value: 'psychological', label: '心理治疗' },
      { value: 'other', label: '其他' }
    ];
    const treatmentTypeOptions = treatmentTypes
      .map(
        (t) =>
          `<option value="${t.value}" ${treatment.treatmentType === t.value ? 'selected' : ''}>${t.label}</option>`
      )
      .join('');

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
          <form id="treatmentForm">
            <input type="hidden" id="treatmentId" value="${treatment.id || ''}" />
            <input type="hidden" id="treatmentMedicalRecordId" value="${treatment.medicalRecordId || medicalRecordId}" />
            <input type="hidden" id="treatmentMemberId" value="${treatment.memberId || memberId}" />

            <!-- 治疗日期 -->
            <div class="form-group">
              <label class="form-label" for="treatmentDate">
                治疗日期 <span class="text-danger">*</span>
              </label>
              <input type="date" class="form-input" id="treatmentDate" 
                value="${treatment.treatmentDate || today}" required />
            </div>

            <!-- 治疗类型 -->
            <div class="form-group">
              <label class="form-label" for="treatmentType">
                治疗类型 <span class="text-danger">*</span>
              </label>
              <select class="form-select" id="treatmentType" required>
                <option value="">请选择治疗类型</option>
                ${treatmentTypeOptions}
              </select>
            </div>

            <!-- 治疗内容 -->
            <div class="form-group">
              <label class="form-label" for="treatmentContent">
                治疗内容 <span class="text-danger">*</span>
              </label>
              <textarea class="form-textarea" id="treatmentContent" 
                placeholder="请输入具体的治疗方案和内容" required>${Utils.escapeHtml(treatment.treatmentContent || '')}</textarea>
            </div>

            <!-- 治疗周期 -->
            <div class="form-group">
              <label class="form-label" for="duration">治疗周期</label>
              <input type="text" class="form-input" id="duration" 
                placeholder="例如：7天、1个月" 
                value="${Utils.escapeHtml(treatment.duration || '')}" />
            </div>

            <!-- 治疗效果 -->
            <div class="form-group">
              <label class="form-label" for="effect">治疗效果</label>
              <textarea class="form-textarea" id="effect" 
                placeholder="请描述治疗效果">${Utils.escapeHtml(treatment.effect || '')}</textarea>
            </div>

            <!-- 备注 -->
            <div class="form-group">
              <label class="form-label" for="treatmentNotes">备注</label>
              <textarea class="form-textarea" id="treatmentNotes" 
                placeholder="请输入备注信息">${Utils.escapeHtml(treatment.notes || '')}</textarea>
            </div>

            <!-- 图片上传区域 -->
            <div class="form-group">
              <label class="form-label">上传图片</label>
              <div id="treatmentImageUploadContainer" class="image-upload"></div>
              <small class="text-hint">支持上传治疗相关图片</small>
            </div>

            <!-- OCR识别按钮 -->
            <div class="form-group" id="treatmentOcrSection" style="display:none;">
              <button type="button" class="btn btn--outline btn--block" id="btnTreatmentOcr">
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
    const treatmentId = params.get('id');
    const treatment = Storage.getById(Storage.KEYS.TREATMENTS, treatmentId);

    if (!treatment) {
      return `
        <div class="page">
          <div class="header">
            <div class="header__nav">
              <button class="header__back" id="btnBack">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="header__title">治疗详情</div>
              <div class="header__action"></div>
            </div>
          </div>
          <div class="content">
            <div class="empty-state">
              <div class="empty-state__icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path d="M30 25v30M25 30v20M35 28v24" stroke="var(--text-hint)" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="40" cy="40" r="25" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
                </svg>
              </div>
              <p class="empty-state__text">未找到该治疗记录</p>
            </div>
          </div>
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
            <div class="header__title">${Utils.getTreatmentTypeText(treatment.treatmentType)}</div>
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
              <span class="info-row__label">治疗日期</span>
              <span class="info-row__value">${Utils.formatDate(treatment.treatmentDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">治疗类型</span>
              <span class="info-row__value">${Utils.getTreatmentTypeText(treatment.treatmentType)}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">治疗内容</span>
              <span class="info-row__value">${Utils.escapeHtml(treatment.treatmentContent || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">治疗周期</span>
              <span class="info-row__value">${Utils.escapeHtml(treatment.duration || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">治疗效果</span>
              <span class="info-row__value">${Utils.escapeHtml(treatment.effect || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">备注</span>
              <span class="info-row__value">${Utils.escapeHtml(treatment.notes || '--')}</span>
            </div>
          </div>

          <!-- 删除按钮 -->
          <div class="mt-lg">
            <button class="btn btn--danger btn--block" id="btnDelete">
              删除此治疗记录
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 初始化治疗记录页面事件绑定
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
    const treatmentId = params.get('id');
    if (treatmentId) {
      const treatment = Storage.getById(Storage.KEYS.TREATMENTS, treatmentId);
      if (treatment && treatment.images) {
        currentImages = treatment.images.slice();
      }
    }

    // 初始化图片上传组件
    const imageContainer = document.getElementById('treatmentImageUploadContainer');
    if (imageContainer && typeof ImageUpload !== 'undefined') {
      ImageUpload.init(imageContainer, currentImages, function (updatedImages) {
        currentImages = updatedImages;
        // 显示/隐藏OCR按钮
        const ocrSection = document.getElementById('treatmentOcrSection');
        if (ocrSection) {
          ocrSection.style.display = updatedImages.length > 0 ? 'block' : 'none';
        }
      });
    }

    // OCR识别按钮
    const btnTreatmentOcr = document.getElementById('btnTreatmentOcr');
    if (btnTreatmentOcr) {
      btnTreatmentOcr.addEventListener('click', function () {
        if (currentImages.length === 0) {
          Toast.warning('请先上传图片');
          return;
        }

        // 显示加载状态
        btnTreatmentOcr.disabled = true;
        btnTreatmentOcr.textContent = '识别中...';

        // 调用OCR识别（使用第一张图片）
        OCR.recognizeText(currentImages[0].data)
          .then(function (result) {
            // 将OCR结果填充到表单
            if (result.extractedData) {
              if (result.extractedData.treatmentDate) {
                document.getElementById('treatmentDate').value = result.extractedData.treatmentDate;
              }
              if (result.extractedData.treatmentContent) {
                document.getElementById('treatmentContent').value = result.extractedData.treatmentContent;
              }
              if (result.extractedData.duration) {
                document.getElementById('duration').value = result.extractedData.duration;
              }
              if (result.extractedData.effect) {
                document.getElementById('effect').value = result.extractedData.effect;
              }
            }

            Toast.success('OCR识别完成，请核对信息');
          })
          .catch(function (error) {
            Toast.error('OCR识别失败，请稍后重试');
            console.error('OCR recognize error:', error);
          })
          .finally(function () {
            btnTreatmentOcr.disabled = false;
            btnTreatmentOcr.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;">
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 12h10M7 8h6M7 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              OCR识别图片文字
            `;
          });
      });
    }

    const form = document.getElementById('treatmentForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const treatmentDate = document.getElementById('treatmentDate').value;
        const treatmentType = document.getElementById('treatmentType').value;
        const treatmentContent = document.getElementById('treatmentContent').value.trim();

        // 必填字段验证
        if (!treatmentDate) {
          Toast.warning('请选择治疗日期');
          return;
        }
        if (!treatmentType) {
          Toast.warning('请选择治疗类型');
          return;
        }
        if (!treatmentContent) {
          Toast.warning('请输入治疗内容');
          return;
        }

        const medicalRecordId = document.getElementById('treatmentMedicalRecordId').value;
        const memberId = document.getElementById('treatmentMemberId').value;

        if (!medicalRecordId) {
          Toast.error('缺少关联的看病记录');
          return;
        }
        if (!memberId) {
          Toast.error('缺少关联的家庭成员');
          return;
        }

        // 获取关联的看病记录以填充groupId
        const medicalRecord = Storage.getById(Storage.KEYS.MEDICAL_RECORDS, medicalRecordId);
        const groupId = medicalRecord ? medicalRecord.groupId : '';

        // 收集其他表单数据
        const duration = document.getElementById('duration').value.trim();
        const effect = document.getElementById('effect').value.trim();
        const notes = document.getElementById('treatmentNotes').value.trim();
        const existingId = document.getElementById('treatmentId').value;

        const currentUser = Storage.getCurrentUser();
        const now = Utils.getToday();

        if (existingId) {
          // 编辑模式：更新已有记录
          const existingTreatment = Storage.getById(Storage.KEYS.TREATMENTS, existingId);
          if (existingTreatment) {
            const updatedTreatment = {
              ...existingTreatment,
              treatmentDate,
              treatmentType,
              treatmentContent,
              duration,
              effect,
              notes,
              updatedAt: now
            };
            Storage.update(Storage.KEYS.TREATMENTS, existingId, updatedTreatment);
            Toast.success('治疗记录已更新');
            window.location.hash = `#/treatment/detail?id=${existingId}`;
          }
        } else {
          // 添加模式：创建新记录
          const newTreatment = {
            id: Utils.generateId('treatment'),
            medicalRecordId,
            memberId,
            groupId,
            treatmentDate,
            treatmentType,
            treatmentContent,
            duration,
            effect,
            notes,
            images: [],
            createdBy: currentUser.id,
            editable: true,
            createdAt: now,
            updatedAt: now
          };
          Storage.add(Storage.KEYS.TREATMENTS, newTreatment);
          Toast.success('治疗记录添加成功');
          // 返回看病记录详情页
          window.location.hash = `#/medical-record/detail?id=${medicalRecordId}`;
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
    const treatmentId = params.get('id');
    const treatment = Storage.getById(Storage.KEYS.TREATMENTS, treatmentId);

    // 编辑按钮
    const btnEdit = document.getElementById('btnEdit');
    if (btnEdit) {
      btnEdit.addEventListener('click', function () {
        window.location.hash = `#/treatment/edit?id=${treatmentId}`;
      });
    }

    // 删除按钮
    const btnDelete = document.getElementById('btnDelete');
    if (btnDelete && treatment) {
      btnDelete.addEventListener('click', function () {
        Modal.confirm({
          title: '删除治疗记录',
          message: '确定要删除这条治疗记录吗？此操作不可恢复。',
          confirmText: '删除',
          cancelText: '取消',
          danger: true,
          onConfirm: function () {
            Storage.remove(Storage.KEYS.TREATMENTS, treatmentId);
            Toast.success('治疗记录已删除');

            // 返回看病记录详情页
            if (treatment.medicalRecordId) {
              window.location.hash = `#/medical-record/detail?id=${treatment.medicalRecordId}`;
            } else {
              window.history.back();
            }
          }
        });
      });
    }
  }
};
