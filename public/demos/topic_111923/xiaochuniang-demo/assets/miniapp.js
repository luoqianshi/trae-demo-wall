(function () {
  var recipes = {
    "抖音菜": {
      name: "番茄鸡蛋焖饭",
      desc: "一锅完成的舒适晚餐，酸甜开胃，适合下班后快速补充能量。",
      meta: ["20 分钟", "少洗锅", "难度低"],
      image: "assets/tomato_egg_rice_1024x1024.jpg",
      detail: "根据你的口味记忆生成：少油、微辣、不加香菜，适合下班后快速完成。",
      steps: [
        ["🍅", "番茄切块，鸡蛋打散，剩米饭提前拨松。"],
        ["🍳", "锅中少油炒蛋，盛出后炒番茄出汁。"],
        ["🥄", "加入米饭和鸡蛋翻匀，按口味加少量生抽和辣椒粉。"],
        ["📸", "小火焖 3 分钟，撒葱花后装盘拍照保存。"]
      ]
    },
    "家庭聚餐": {
      name: "金蒜虾仁时蔬",
      desc: "颜色丰富、摆盘好看，适合聚餐端上桌，还会生成备菜顺序。",
      meta: ["35 分钟", "卖相好", "适合分享"],
      image: "assets/garlic_shrimp_veg_1024x1024.jpg",
      detail: "适合家庭聚餐的上镜菜，色彩丰富、备菜清楚，端上桌很有仪式感。",
      steps: [
        ["🦐", "虾仁开背去线，蔬菜切成大小相近的小块。"],
        ["🧄", "蒜末小火炒香，加入虾仁快速翻炒至变色。"],
        ["🥒", "加入彩椒、黄瓜或其他时蔬，保持大火快炒。"],
        ["🍽️", "按颜色分区摆盘，撒芝麻或香草提升卖相。"]
      ]
    },
    "清理冰箱": {
      name: "冰箱剩菜治愈炒面",
      desc: "把零散食材集中消耗，优先使用快过期蔬菜，减少浪费。",
      meta: ["18 分钟", "清冰箱", "替代灵活"],
      image: "assets/leftover_noodles_1024x1024.jpg",
      detail: "把冰箱里的零散食材变成一盘热乎炒面，适合清库存也适合懒人晚餐。",
      steps: [
        ["🥬", "找出快过期蔬菜、鸡蛋、肉类或豆制品并切小。"],
        ["🍜", "面条煮到八成熟后过冷水，避免后续粘连。"],
        ["🔥", "先炒蛋白类食材，再加入蔬菜和面条大火翻炒。"],
        ["🌶️", "用生抽、醋和辣椒油调味，最后按剩余食材灵活加料。"]
      ]
    },
    "探索新菜": {
      name: "短视频同款焦香土豆饼",
      desc: "从热门短视频提炼关键步骤，转成更适合家常厨房复刻的版本。",
      meta: ["30 分钟", "短视频复刻", "外脆里软"],
      image: "assets/potato_pancake_1024x1024.jpg",
      detail: "把短视频里的高赞土豆饼拆成家常步骤，重点提示火候、翻面和失败点。",
      steps: [
        ["🥔", "土豆蒸熟压成泥，加入少量淀粉、盐和黑胡椒。"],
        ["🧀", "揉成小饼，可按喜好加入芝士、葱花或火腿碎。"],
        ["🍳", "平底锅刷薄油，小火慢煎到两面金黄。"],
        ["✨", "出锅后撒香草，搭配酸奶酱或番茄酱更有短视频同款感。"]
      ]
    },
    "番茄炖牛腩": {
      name: "番茄炖牛腩",
      desc: "浓郁番茄汤底配软烂牛腩，下饭神器，越炖越香。",
      meta: ["90 分钟", "慢炖", "下饭"],
      image: "assets/tomato_braised_beef_1024x1024.jpg",
      detail: "牛腩冷水焯水去腥，和番茄块一起慢炖到软烂，酸甜浓郁超下饭。",
      ingredients: ["番茄", "牛腩", "土豆", "洋葱", "胡萝卜"],
      steps: [
        ["🥩", "牛腩切块，冷水下锅加姜片料酒焯水去腥。"],
        ["🍅", "番茄去皮切块，洋葱切丝，土豆胡萝卜切滚刀块。"],
        ["🔥", "锅中炒香洋葱和番茄，加入牛腩和热水没过食材。"],
        ["⏳", "小火慢炖 60 分钟，最后 20 分钟加入土豆和胡萝卜。"]
      ]
    },
    "麻婆豆腐": {
      name: "麻婆豆腐",
      desc: "经典川菜，麻辣鲜香嫩，豆腐入口即化，米饭杀手。",
      meta: ["20 分钟", "川菜", "麻辣"],
      image: "assets/mapo_tofu_1024x1024.jpg",
      detail: "嫩豆腐配郫县豆瓣酱和花椒粉，麻、辣、烫、香、酥、嫩、鲜、活。",
      ingredients: ["豆腐", "肉末", "豆瓣酱", "花椒", "葱"],
      steps: [
        ["🧊", "嫩豆腐切小方块，淡盐水焯水去豆腥。"],
        ["🌶️", "锅中炒香肉末，加入郫县豆瓣酱炒出红油。"],
        ["🥄", "加清水和豆腐，中火煮 5 分钟让豆腐入味。"],
        ["✨", "勾芡后撒上花椒粉和葱花，趁热拌饭吃。"]
      ]
    },
    "可乐鸡翅": {
      name: "可乐鸡翅",
      desc: "甜咸焦香的经典家常菜，孩子和大人都爱吃。",
      meta: ["25 分钟", "甜咸", "零失败"],
      image: "assets/cola_chicken_wings_1024x1024.jpg",
      detail: "可乐中的糖分焦化后给鸡翅裹上漂亮糖色，不用加糖也能上色。",
      ingredients: ["鸡翅", "可乐", "生抽", "姜", "葱"],
      steps: [
        ["🍗", "鸡翅两面划刀，冷水加姜片焯水去血沫。"],
        ["🍳", "锅中少油把鸡翅两面煎到金黄。"],
        ["🥤", "倒入可乐没过鸡翅，加生抽和老抽调味。"],
        ["🔥", "中火收汁到浓稠，注意翻面防粘锅，出锅撒芝麻。"]
      ]
    },
    "剁椒鱼头": {
      name: "剁椒鱼头",
      desc: "湖南名菜，鲜辣开胃，鱼头嫩滑，剁椒香气扑鼻。",
      meta: ["30 分钟", "湘菜", "鲜辣"],
      image: "assets/chopped_pepper_fish_head_1024x1024.jpg",
      detail: "大鱼头铺满满满剁椒一起蒸，蒸出来的汤汁拌面更是一绝。",
      ingredients: ["鱼头", "剁椒", "姜", "葱", "蒸鱼豉油"],
      steps: [
        ["🐟", "鱼头对半劈开，去掉黑膜和血块，用料酒姜片腌制。"],
        ["🌶️", "盘底铺姜片和葱段，放上鱼头，铺满红剁椒。"],
        ["⏳", "水开后大火蒸 12 到 15 分钟，根据鱼头大小调整。"],
        ["✨", "出锅淋蒸鱼豉油，撒葱花，浇一勺滚烫热油激香。"]
      ]
    },
    "辣子鸡": {
      name: "辣子鸡",
      desc: "重庆江湖菜，干香麻辣，鸡肉外酥里嫩，越吃越上头。",
      meta: ["35 分钟", "重庆", "干香"],
      image: "assets/spicy_chicken_1024x1024.jpg",
      detail: "鸡肉小块先腌后炸，和大量干辣椒花椒一起爆炒，干香不油。",
      ingredients: ["鸡肉", "干辣椒", "花椒", "姜", "蒜"],
      steps: [
        ["🍗", "鸡腿肉去骨切小丁，加料酒生抽淀粉腌制 15 分钟。"],
        ["🔥", "油温六成热下鸡肉炸至金黄酥脆，捞出沥油。"],
        ["🌶️", "留底油炒香大量干辣椒段和花椒粒。"],
        ["✨", "倒入鸡丁快速翻炒，撒白芝麻和葱段出锅。"]
      ]
    },
    "猪肚鸡": {
      name: "猪肚鸡",
      desc: "广东经典煲汤，奶白浓郁，暖胃又滋补，适合秋冬。",
      meta: ["120 分钟", "煲汤", "滋补"],
      image: "assets/pork_tripe_chicken_1024x1024.jpg",
      detail: "猪肚和整鸡一起慢炖，汤色奶白，胡椒提味，一碗下肚全身暖。",
      ingredients: ["猪肚", "鸡", "胡椒", "姜", "枸杞"],
      steps: [
        ["🥩", "猪肚用盐和面粉反复搓洗，焯水后切条。"],
        ["🍗", "整鸡塞入姜片和胡椒粒，放入猪肚中扎紧口。"],
        ["🔥", "冷水下锅，加姜片大火烧开，撇去浮沫。"],
        ["⏳", "转小火慢炖 90 分钟，出锅前加枸杞和适量盐。"]
      ]
    },
    "凉拌黄瓜": {
      name: "凉拌黄瓜",
      desc: "夏日清爽小菜，酸辣脆嫩，开胃解腻，5 分钟上桌。",
      meta: ["5 分钟", "凉菜", "开胃"],
      image: "assets/cold_cucumber_1024x1024.jpg",
      detail: "拍碎的黄瓜比切的更入味，蒜和辣椒油是灵魂。",
      ingredients: ["黄瓜", "蒜", "辣椒油", "醋", "生抽"],
      steps: [
        ["🥒", "黄瓜拍碎后切段，比刀切更容易入味。"],
        ["🧄", "蒜拍成蒜泥，加少量盐静置出蒜香。"],
        ["🌶️", "加入生抽、香醋、辣椒油和少许糖拌匀。"],
        ["❄️", "放入冰箱冷藏 10 分钟，口感更脆爽。"]
      ]
    },
    "波士顿龙虾芝士焗": {
      name: "波士顿龙虾芝士焗",
      desc: "餐厅级硬菜，龙虾鲜甜配浓郁芝士，家庭聚餐撑场面。",
      meta: ["40 分钟", "硬菜", "聚餐"],
      image: "assets/lobster_gratin_1024x1024.jpg",
      detail: "龙虾对半切开，铺上芝士和黄油蒜蓉，烤到金黄拉丝。",
      ingredients: ["龙虾", "芝士", "黄油", "蒜", "柠檬"],
      steps: [
        ["🦞", "龙虾放尿后对半切开，去除内脏和沙线。"],
        ["🧈", "黄油加蒜末炒香，抹在龙虾肉上。"],
        ["🧀", "铺满马苏里拉芝士碎，烤箱 200 度烤 15 分钟。"],
        ["✨", "出炉挤柠檬汁，撒上欧芹碎，趁热拉丝吃。"]
      ]
    },
    "松鼠鳜鱼": {
      name: "松鼠鳜鱼",
      desc: "苏帮菜经典，造型精美，酸甜酥脆，宴客必备大菜。",
      meta: ["50 分钟", "苏菜", "宴客"],
      image: "assets/squirrel_fish_1024x1024.jpg",
      detail: "鳜鱼改花刀炸至金黄蓬松，浇上番茄糖醋汁，形似松鼠。",
      ingredients: ["鳜鱼", "番茄酱", "糖", "醋", "淀粉"],
      steps: [
        ["🐟", "鳜鱼去头，鱼肉改菱形花刀，不要切断鱼皮。"],
        ["🌽", "鱼身拍干淀粉，抖掉多余粉，油温七成热炸至定型。"],
        ["🍅", "锅中炒番茄酱，加糖醋汁和少量水煮到浓稠。"],
        ["✨", "鱼头鱼尾摆盘，鱼身浇汁，趁热上桌酥脆有声。"]
      ]
    }
  };

  var historyStack = ["home"];
  var currentRoute = "home";
  var activeScene = "抖音菜";

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function showToast(text) {
    var toast = $("#toast");
    toast.textContent = text;
    toast.classList.add("show");
    window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1600);
  }

  function setTab(route) {
    $all(".nav-item").forEach(function (item) {
      item.classList.toggle("active", item.dataset.tab === route);
    });
  }

  function navigate(route, push) {
    var target = $("#page-" + route);
    if (!target) {
      return;
    }

    $all(".page").forEach(function (page) {
      page.classList.remove("active");
      page.scrollTop = 0;
    });
    target.classList.add("active");
    currentRoute = route;

    if (push !== false && historyStack[historyStack.length - 1] !== route) {
      historyStack.push(route);
    }

    if (["home", "recipes", "start", "community", "book"].indexOf(route) >= 0) {
      setTab(route);
    } else {
      setTab("");
    }
  }

  function goBack() {
    if (historyStack.length > 1) {
      historyStack.pop();
      navigate(historyStack[historyStack.length - 1], false);
    } else {
      navigate("home", false);
    }
  }

  function renderRecipe(scene) {
    var recipe = recipes[scene] || recipes["抖音菜"];
    $("#recipeName").textContent = recipe.name;
    $("#recipeDesc").textContent = recipe.desc;
    $("#recipeMeta").innerHTML = recipe.meta.map(function (item) {
      return "<span>" + item + "</span>";
    }).join("");
    if ($("#resultCoverImg")) {
      $("#resultCoverImg").src = recipe.image;
      $("#resultCoverImg").alt = recipe.name;
    }
  }

  function renderDetailRecipe(scene) {
    var recipe = recipes[scene] || recipes["抖音菜"];
    $("#detailCoverImg").src = recipe.image;
    $("#detailCoverImg").alt = recipe.name;
    $("#detailName").textContent = recipe.name;
    $("#detailDesc").textContent = recipe.detail || recipe.desc;
    $("#detailMeta").innerHTML = recipe.meta.map(function (item) {
      return "<span>" + item + "</span>";
    }).join("");
    $("#detailFlow").innerHTML = [
      "<div class=\"flow-doodle\"><svg viewBox=\"0 0 40 260\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path d=\"M20 4 C4 36, 34 58, 18 88 S5 138, 22 166 S36 210, 18 256\" /></svg></div>"
    ].concat(recipe.steps.map(function (step) {
      return "<div class=\"flow-node\"><div class=\"flow-bubble\">" + step[0] + "</div><div class=\"flow-text\">" + step[1] + "</div></div>";
    })).join("");
  }

  $all("[data-route]").forEach(function (button) {
    button.addEventListener("click", function () {
      navigate(button.dataset.route);
    });
  });

  $all("[data-recipe]").forEach(function (button) {
    button.addEventListener("click", function () {
      renderDetailRecipe(button.dataset.recipe);
    });
  });

  $all("[data-tab]").forEach(function (button) {
    button.addEventListener("click", function () {
      navigate(button.dataset.tab);
    });
  });

  $all("[data-back]").forEach(function (button) {
    button.addEventListener("click", goBack);
  });

  $all("#startChips .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      chip.classList.toggle("active");
      showToast(chip.classList.contains("active") ? "已加入：" + chip.textContent : "已移除：" + chip.textContent);
    });
  });

  $all("#sceneChips .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $all("#sceneChips .chip").forEach(function (item) {
        item.classList.remove("active");
      });
      chip.classList.add("active");
      activeScene = chip.dataset.scene || chip.textContent.trim();
      renderRecipe(activeScene);
      showToast("已切换场景：" + activeScene);
    });
  });

  $all("[data-scene-select]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeScene = button.dataset.sceneSelect;
      $all("#sceneChips .chip").forEach(function (chip) {
        chip.classList.toggle("active", chip.dataset.scene === activeScene);
      });
      renderRecipe(activeScene);
      navigate("start");
      showToast("已带入场景：" + activeScene);
    });
  });

  var aiGeneratedRecipes = {};
  var aiRecipeCounter = 1;

  function findRecipeByIngredients(selectedIngredients) {
    var matched = [];
    var keys = Object.keys(recipes);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var r = recipes[key];
      if (!r.ingredients) continue;
      var matchCount = 0;
      for (var j = 0; j < selectedIngredients.length; j++) {
        var ing = selectedIngredients[j];
        for (var k = 0; k < r.ingredients.length; k++) {
          if (r.ingredients[k].indexOf(ing) >= 0 || ing.indexOf(r.ingredients[k]) >= 0) {
            matchCount++;
            break;
          }
        }
      }
      if (matchCount > 0) {
        matched.push({ key: key, recipe: r, score: matchCount });
      }
    }
    matched.sort(function (a, b) { return b.score - a.score; });
    return matched;
  }

  function generateAIRecipe(selectedIngredients) {
    var id = "AI_" + aiRecipeCounter++;
    var names = ["创意混搭", "灵感一锅", "随手妙炒", "私房混搭", "惊喜料理"];
    var name = names[Math.floor(Math.random() * names.length)] + " #" + (aiRecipeCounter - 1);
    var steps = [
      ["🥬", "把" + selectedIngredients.join("、") + "洗净切好备用。"],
      ["🔥", "锅中热油，按先硬后软的顺序下锅翻炒。"],
      ["🧂", "加生抽、少许盐和糖调味，翻炒均匀。"],
      ["✨", "出锅前撒葱花或香菜，装盘拍照保存。"]
    ];
    var aiRecipe = {
      name: name,
      desc: "AI 根据你手头食材「" + selectedIngredients.join("、") + "」自动生成的创意食谱，步骤简单，容错率高。",
      meta: ["AI 生成", "约 20 分钟", "随心搭配"],
      image: "assets/tomato_egg_rice_1024x1024.jpg",
      detail: "AI 引擎已分析你的食材组合，生成专属食谱。你可以随时调整步骤和调味。",
      ingredients: selectedIngredients,
      steps: steps
    };
    recipes[id] = aiRecipe;
    return id;
  }

  $("#generateRecipe").addEventListener("click", function () {
    var selected = $all("#startChips .chip.active").map(function (chip) {
      return chip.textContent.trim();
    });
    var typed = $("#ingredientInput").value.trim().split(/[,，、\s]+/).filter(function (x) { return x.trim(); });
    var ingredients = selected.length ? selected : typed;

    var matched = findRecipeByIngredients(ingredients);

    if (matched.length > 0) {
      activeScene = matched[0].key;
      renderRecipe(activeScene);
      $("#resultCard").style.display = "block";
      showToast("已匹配到「" + matched[0].recipe.name + "」，共 " + matched.length + " 道相关食谱");
    } else {
      var aiKey = generateAIRecipe(ingredients);
      activeScene = aiKey;
      renderRecipe(activeScene);
      $("#resultCard").style.display = "block";
      showToast("没有匹配已有食谱，AI 已自动生成「" + recipes[aiKey].name + "」");
    }
  });

  $("#viewGeneratedDetail").addEventListener("click", function () {
    renderDetailRecipe(activeScene);
  });

  $("#scanFridge").addEventListener("click", function () {
    showToast("已识别 5 种食材，推荐 3 道菜");
  });

  $("#analyzeVideo").addEventListener("click", function () {
    showToast("解析完成，已生成 ins 风食谱卡");
  });

  renderRecipe(activeScene);
  renderDetailRecipe(activeScene);
})();
