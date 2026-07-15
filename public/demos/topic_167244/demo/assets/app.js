(function() {
  'use strict';

  var ROLL_KEY = 'roll_demo_data';

  var defaultData = {
    height: 170,
    weight: 65,
    age: 25,
    gender: 'male',
    activity: 1.375,
    report: 'normal',
    goal: 'lose',
    distance: '2',
    rollResult: null
  };

  window.RollApp = {
    getData: function() {
      var raw = localStorage.getItem(ROLL_KEY);
      return raw ? JSON.parse(raw) : Object.assign({}, defaultData);
    },
    saveData: function(data) {
      localStorage.setItem(ROLL_KEY, JSON.stringify(data));
    },
    update: function(key, value) {
      var data = this.getData();
      data[key] = value;
      this.saveData(data);
    },
    calculateMetrics: function(data) {
      var h = parseFloat(data.height) || 170;
      var w = parseFloat(data.weight) || 65;
      var age = parseFloat(data.age) || 25;
      var activity = parseFloat(data.activity) || 1.375;

      var bmi = w / Math.pow(h / 100, 2);
      var bmr = data.gender === 'male'
        ? 10 * w + 6.25 * h - 5 * age + 5
        : 10 * w + 6.25 * h - 5 * age - 161;
      var tdee = Math.round(bmr * activity);

      var target, carbRatio, proteinRatio, fatRatio;
      if (data.goal === 'lose') {
        target = tdee - 500;
        carbRatio = 0.40; proteinRatio = 0.30; fatRatio = 0.30;
      } else if (data.goal === 'gain') {
        target = tdee + 300;
        carbRatio = 0.50; proteinRatio = 0.25; fatRatio = 0.25;
      } else {
        target = tdee;
        carbRatio = 0.45; proteinRatio = 0.25; fatRatio = 0.30;
      }

      if (data.report === 'sugar') { carbRatio -= 0.05; proteinRatio += 0.05; }
      if (data.report === 'uric') { proteinRatio -= 0.05; fatRatio += 0.05; }
      if (data.report === 'fat') { fatRatio -= 0.05; carbRatio += 0.05; }

      return {
        bmi: bmi.toFixed(1),
        bmr: Math.round(bmr),
        tdee: tdee,
        target: target,
        carbG: Math.round(target * carbRatio / 4),
        proteinG: Math.round(target * proteinRatio / 4),
        fatG: Math.round(target * fatRatio / 9)
      };
    }
  };

  window.RollData = {
    reels: {
      carb: [
        { emoji: '🍚', name: '糙米饭', desc: '低 GI 慢碳', tags: ['lowgi'] },
        { emoji: '🍜', name: '荞麦面', desc: '控糖优选', tags: ['lowgi'] },
        { emoji: '🍠', name: '蒸红薯', desc: '膳食纤维', tags: ['fiber'] },
        { emoji: '🌽', name: '甜玉米', desc: '饱腹粗粮', tags: ['fiber'] },
        { emoji: '🥯', name: '全麦面包', desc: '早餐常备', tags: ['lowgi'] },
        { emoji: '🍙', name: '杂粮饭团', desc: '便携主食', tags: ['lowgi'] }
      ],
      vitamin: [
        { emoji: '🥦', name: '西兰花', desc: '高纤低卡', tags: ['fiber'] },
        { emoji: '🥬', name: '油麦菜', desc: '清爽绿叶', tags: ['fiber'] },
        { emoji: '🥒', name: '黄瓜片', desc: '补水解腻', tags: ['hydration'] },
        { emoji: '🍄', name: '菌菇类', desc: '低脂鲜味', tags: ['lowpurine'] },
        { emoji: '🥕', name: '胡萝卜', desc: '维生素 A', tags: ['vitamin'] },
        { emoji: '🌶️', name: '彩椒', desc: '维生素 C', tags: ['vitamin'] }
      ],
      protein: [
        { emoji: '🍗', name: '鸡胸肉', desc: '高蛋白低脂', tags: ['highprotein', 'lowpurine'] },
        { emoji: '🐟', name: '三文鱼', desc: '优质 Omega-3', tags: ['omega3'] },
        { emoji: '🥚', name: '水煮蛋', desc: '便捷蛋白', tags: ['lowpurine'] },
        { emoji: '🍤', name: '白灼虾', desc: '低脂高蛋白', tags: ['highprotein'] },
        { emoji: '🫘', name: '嫩豆腐', desc: '植物蛋白', tags: ['lowpurine'] },
        { emoji: '🥩', name: '瘦牛肉', desc: '补铁增肌', tags: ['highprotein'] }
      ]
    },
    cuisines: {
      '2': ['轻食沙拉', '日式便当', '中式小碗菜'],
      '4': ['轻食沙拉', '日式便当', '中式小碗菜', '潮汕牛肉饭', '烤鱼'],
      '6': ['轻食沙拉', '日式便当', '中式小碗菜', '潮汕牛肉饭', '烤鱼', '粤式蒸菜', '减脂餐专线']
    },
    weightedIndex: function(items, data) {
      var weights = items.map(function(item) {
        var w = 1;
        if (data.goal === 'lose') {
          if (item.tags.indexOf('lowgi') !== -1) w += 2;
          if (item.tags.indexOf('fiber') !== -1) w += 1;
          if (item.tags.indexOf('highprotein') !== -1) w += 1;
        } else if (data.goal === 'gain') {
          if (item.tags.indexOf('highprotein') !== -1) w += 3;
          if (item.tags.indexOf('lowgi') !== -1) w += 1;
        }
        if (data.report === 'sugar' && item.tags.indexOf('lowgi') !== -1) w += 2;
        if (data.report === 'uric' && item.tags.indexOf('lowpurine') !== -1) w += 3;
        if (data.report === 'fat' && item.tags.indexOf('omega3') !== -1) w += 2;
        return w;
      });

      var total = weights.reduce(function(a, b) { return a + b; }, 0);
      var r = Math.random() * total;
      var sum = 0;
      for (var i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (r <= sum) return i;
      }
      return 0;
    }
  };
})();
