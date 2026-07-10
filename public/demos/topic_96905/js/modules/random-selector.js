/**
 * 随机选择模块
 * 从候选列表中加权随机选择一个目的地。
 * 纯算法模块，无外部依赖。
 */
const RandomSelector = (function () {

  /**
   * 加权随机选择
   * @param {array} candidates - 候选列表
   * @param {string} weightBy - 权重模式：tagScore / uniform / inverseCost
   * @returns {object|null} 选中的候选目的地
   */
  function weightedRandomSelect(candidates, weightBy) {
    weightBy = weightBy || 'tagScore';

    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    let weights;
    switch (weightBy) {
      case 'uniform':
        weights = candidates.map(function () { return 1; });
        break;
      case 'inverseCost':
        weights = candidates.map(function (c) { return 1 / c.totalCost.mid; });
        break;
      case 'tagScore':
      default:
        weights = candidates.map(function (c) { return c.tagScore; });
        break;
    }

    // 归一化
    var total = weights.reduce(function (sum, w) { return sum + w; }, 0);

    // 全部权重为 0 时退化为均匀随机
    if (total === 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    weights = weights.map(function (w) { return w / total; });

    // 加权随机
    var r = Math.random();
    for (var i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }

    return candidates[candidates.length - 1];
  }

  return { weightedRandomSelect: weightedRandomSelect };
})();
