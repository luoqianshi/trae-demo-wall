/* ========== form.js — 表单页（添加 / 编辑美食） ========== */

const FormPage = (() => {
  'use strict';

  let unsubscribe = null;
  let container = null;
  let mode = 'add';       // 'add' | 'edit'
  let editId = null;      // 编辑模式下的美食 ID
  let selectedTag = '其他'; // 当前选中的分类

  function onEnter(param, el) {
    container = el;
    if (param !== null && param !== undefined) {
      mode = 'edit';
      editId = param;
      const food = Actions.getFoodById(editId);
      selectedTag = food ? food.tag : '其他';
    } else {
      mode = 'add';
      editId = null;
      selectedTag = '其他';
    }
    unsubscribe = Store.subscribe(render);
    render(Store.getState());
  }

  function onLeave() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    container = null;
  }

  // 渲染分类选择器
  function renderTagSelector() {
    return Actions.TAGS.map((tag) => {
      const active = tag === selectedTag ? ' active' : '';
      return `<div class="form-tag-option${active}" data-tag="${FoodCard.escapeHtml(tag)}">${FoodCard.escapeHtml(tag)}</div>`;
    }).join('');
  }

  // 表单验证 + 保存
  function saveForm() {
    const nameInput = container.querySelector('#form-name');
    const placeInput = container.querySelector('#form-place');
    const noteInput = container.querySelector('#form-note');
    const nameError = container.querySelector('#form-name-error');

    if (!nameInput) return;

    const name = nameInput.value.trim();

    // 名称必填校验
    if (!name) {
      nameInput.classList.add('error');
      if (nameError) nameError.classList.add('show');
      // 触发抖动动画（移除再添加以重启动画）
      nameInput.classList.remove('shake');
      void nameInput.offsetWidth;
      nameInput.classList.add('shake');
      nameInput.focus();
      return;
    }

    // 清除错误状态
    nameInput.classList.remove('error');
    if (nameError) nameError.classList.remove('show');

    const data = {
      name: name,
      place: placeInput ? placeInput.value : '',
      tag: selectedTag,
      note: noteInput ? noteInput.value : ''
    };

    if (mode === 'add') {
      Actions.addFood(data);
      UI.toast('添加成功');
    } else {
      Actions.editFood(editId, data);
      UI.toast('保存成功');
    }
    Router.goBack();
  }

  function render(state) {
    // 编辑模式下美食不存在
    if (mode === 'edit') {
      const food = Actions.getFoodById(editId);
      if (!food) {
        container.innerHTML = `
          <div id="form-nav"></div>
          <div class="form-body">
            ${EmptyState.render('❓', '美食不存在', '可能已被删除')}
            <div style="padding: 0 var(--space-md); margin-top: var(--space-md);">
              <button class="btn btn-primary btn-block" id="form-go-back">返回</button>
            </div>
          </div>`;
        NavBar.mount(container.querySelector('#form-nav'), '编辑美食', null);
        const goBackBtn = container.querySelector('#form-go-back');
        if (goBackBtn) {
          goBackBtn.addEventListener('click', () => Router.goBack());
        }
        return;
      }
    }

    // 保留当前输入值（防止重渲染时丢失）
    let nameValue = '';
    let placeValue = '';
    let noteValue = '';
    const existingName = container.querySelector('#form-name');
    if (existingName) {
      nameValue = existingName.value;
      const existingPlace = container.querySelector('#form-place');
      const existingNote = container.querySelector('#form-note');
      placeValue = existingPlace ? existingPlace.value : '';
      noteValue = existingNote ? existingNote.value : '';
    } else if (mode === 'edit') {
      const food = Actions.getFoodById(editId);
      if (food) {
        nameValue = food.name || '';
        placeValue = food.place || '';
        noteValue = food.note || '';
        selectedTag = food.tag || '其他';
      }
    }

    const title = mode === 'add' ? '添加美食' : '编辑美食';

    container.innerHTML = `
      <div id="form-nav"></div>
      <div class="form-page">
        <div class="form-section-title">基本信息</div>
        <div class="form-group">
          <label class="form-label" for="form-name">名称<span class="required">*</span></label>
          <input type="text" class="form-input" id="form-name" placeholder="请输入美食名称" value="">
          <div class="form-error" id="form-name-error">请输入美食名称</div>
        </div>
        <div class="form-group">
          <label class="form-label" for="form-place">地点</label>
          <input type="text" class="form-input" id="form-place" placeholder="请输入地点（可选）" value="">
        </div>
        <div class="form-group">
          <label class="form-label">分类</label>
          <div class="form-tag-selector">
            ${renderTagSelector()}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="form-note">备注</label>
          <textarea class="form-textarea" id="form-note" placeholder="添加备注（可选）"></textarea>
        </div>
        <button class="btn btn-primary btn-block" id="form-submit">保存</button>
        <div class="page-bottom-spacer"></div>
      </div>`;

    // 挂载 NavBar
    NavBar.mount(
      container.querySelector('#form-nav'),
      title,
      { text: '保存', id: 'save', callback: saveForm }
    );

    // 以编程方式设置输入值（避免 HTML 属性转义问题）
    const nameInput = container.querySelector('#form-name');
    if (nameInput) nameInput.value = nameValue;
    const placeInput = container.querySelector('#form-place');
    if (placeInput) placeInput.value = placeValue;
    const noteInput = container.querySelector('#form-note');
    if (noteInput) noteInput.value = noteValue;

    // 绑定分类选择器
    const tagSelector = container.querySelector('.form-tag-selector');
    if (tagSelector) {
      tagSelector.addEventListener('click', (e) => {
        const option = e.target.closest('.form-tag-option');
        if (!option) return;
        selectedTag = option.dataset.tag;
        tagSelector.querySelectorAll('.form-tag-option').forEach((opt) => {
          opt.classList.toggle('active', opt.dataset.tag === selectedTag);
        });
      });
    }

    // 绑定保存按钮
    const submitBtn = container.querySelector('#form-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', saveForm);
    }

    // 输入时清除名称错误状态
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        nameInput.classList.remove('error');
        const nameError = container.querySelector('#form-name-error');
        if (nameError) nameError.classList.remove('show');
      });
    }
  }

  return { onEnter, onLeave };
})();
