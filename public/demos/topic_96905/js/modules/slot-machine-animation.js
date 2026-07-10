/**
 * 老虎机动画模块
 * 单槽老虎机滚动动画，摇臂按钮启动，2秒 ease-out 动画。
 * 修复：确保定格城市与实际选中城市一致。
 */
const SlotMachineAnimation = (function () {

  var ITEM_HEIGHT = 60;
  var ANIMATION_DURATION = 2000;
  var ROUNDS = 5;
  var MAX_DISPLAY = 10;

  /**
   * 从候选列表中抽样构建展示列表，确保选中城市在其中
   * @param {array} candidates - 全部候选
   * @param {number} selectedIndex - 选中索引
   * @returns {object} { displayList, displayIndex }
   */
  function buildDisplayList(candidates, selectedIndex) {
    var selected = candidates[selectedIndex];
    var others = candidates.filter(function (c, i) { return i !== selectedIndex; });

    // 随机打乱并取前 MAX_DISPLAY-1 个
    others.sort(function () { return Math.random() - 0.5; });
    var sample = others.slice(0, MAX_DISPLAY - 1);

    // 选中城市放在列表末尾
    var displayList = sample.concat([selected]);
    var displayIndex = displayList.length - 1;

    return { displayList: displayList, displayIndex: displayIndex };
  }

  /**
   * 启动老虎机滚动动画
   * @param {array} candidates - 候选城市列表
   * @param {number} selectedIndex - 选中城市在候选列表中的索引
   * @param {function} callback - 动画结束回调
   */
  function spinSlot(candidates, selectedIndex, callback) {
    var slotList = document.getElementById('slot-list');
    if (!slotList) {
      if (callback) callback();
      return;
    }

    if (!candidates || candidates.length === 0) {
      if (callback) callback();
      return;
    }

    // 构建展示列表，确保选中城市在已知位置
    var info = buildDisplayList(candidates, selectedIndex);
    var displayList = info.displayList;
    var displayIndex = info.displayIndex;

    // 构建滚动列表：重复展示列表多轮
    var html = '';
    for (var r = 0; r < ROUNDS; r++) {
      displayList.forEach(function (c) {
        html += '<li class="slot-item">' + c.city.name + '</li>';
      });
    }
    slotList.innerHTML = html;

    // 计算最终偏移量：让选中城市停在窗口中央
    // 最后一轮的选中城市位置
    var totalOffset = (ROUNDS - 1) * displayList.length + displayIndex;
    var finalY = -(totalOffset * ITEM_HEIGHT);

    // 先重置到起点
    slotList.style.transition = 'none';
    slotList.style.transform = 'translateY(0)';

    // 强制重排
    void slotList.offsetHeight;

    // 启动动画
    slotList.style.transition =
      'transform ' + (ANIMATION_DURATION / 1000) + 's cubic-bezier(0.25, 0.1, 0.25, 1)';
    slotList.style.transform = 'translateY(' + finalY + 'px)';

    setTimeout(function () {
      if (callback) callback();
    }, ANIMATION_DURATION + 50);
  }

  function show() {
    var section = document.getElementById('slot-section');
    if (section) section.classList.remove('hidden');
  }

  function hide() {
    var section = document.getElementById('slot-section');
    if (section) section.classList.add('hidden');
  }

  function setHint(text) {
    var hint = document.getElementById('slot-hint');
    if (hint) hint.textContent = text;
  }

  return {
    spinSlot: spinSlot,
    show: show,
    hide: hide,
    setHint: setHint
  };
})();
