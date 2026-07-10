(function () {
  var recipes = {
    "抖音菜": {
      name: "番茄鸡蛋焖饭",
      desc: "一锅完成的舒适晚餐，利用剩米饭和常见食材，酸甜开胃，适合下班后快速补充能量。",
      meta: ["20 分钟", "难度低", "少洗锅", "适合新手"],
      steps: [
        "番茄切块，鸡蛋打散，剩米饭提前拨松。",
        "锅中少油炒蛋，盛出后炒番茄出汁。",
        "加入米饭和鸡蛋翻匀，按口味加少量生抽和辣椒粉。",
        "小火焖 3 分钟，撒葱花后装盘拍照保存。"
      ],
      phoneSub: "下班后 20 分钟完成，少洗锅，适合微辣少油口味。"
    },
    "家庭聚餐": {
      name: "金蒜虾仁时蔬拼盘",
      desc: "颜色丰富、摆盘好看，适合聚餐端上桌。AI 会补充备菜顺序和摆盘建议，降低翻车概率。",
      meta: ["35 分钟", "卖相好", "适合分享", "备菜清晰"],
      steps: [
        "虾仁开背去线，青菜和土豆提前焯水或煎熟。",
        "蒜末小火炒香，加入虾仁快速翻炒至变色。",
        "加入时蔬翻匀，用少量盐、黑胡椒和柠檬汁调味。",
        "按颜色分区摆盘，最后撒坚果碎或葱花提升层次。"
      ],
      phoneSub: "适合多人分享，成品更上镜，还能生成摆盘提示。"
    },
    "清理冰箱": {
      name: "冰箱剩菜治愈炒面",
      desc: "把零散食材集中消耗，优先使用快过期蔬菜，适合减少浪费的晚餐场景。",
      meta: ["18 分钟", "清冰箱", "替代灵活", "减少浪费"],
      steps: [
        "把剩余青菜、鸡蛋、肉类或豆制品切成适合入口的大小。",
        "面条煮至八成熟后过冷水，避免后续粘连。",
        "先炒蛋和蛋白类食材，再加入蔬菜和面条。",
        "用生抽、少量醋和辣椒油调味，最后加入快过期食材优先消耗提醒。"
      ],
      phoneSub: "根据剩余食材组合菜品，帮你把冰箱吃干净。"
    },
    "探索新菜": {
      name: "短视频同款焦香土豆饼",
      desc: "从热门短视频中提炼关键步骤，转成更适合家常厨房复刻的版本。",
      meta: ["30 分钟", "短视频复刻", "外脆里软", "趣味尝鲜"],
      steps: [
        "土豆蒸熟压泥，加入少量淀粉、盐和黑胡椒。",
        "揉成小饼，表面刷薄油，撒上芝士或葱花。",
        "平底锅小火慢煎，两面煎到金黄焦香。",
        "AI 自动整理视频里的火候、翻面时间和失败提醒。"
      ],
      phoneSub: "解析热门视频做法，变成清晰可复刻的家常食谱。"
    }
  };

  var selectedScene = "抖音菜";

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
    }, 1800);
  }

  function selectedIngredients() {
    return $all(".chip.active").map(function (chip) {
      return chip.dataset.ingredient || chip.textContent.trim();
    });
  }

  function renderRecipe(scene) {
    var recipe = recipes[scene] || recipes["抖音菜"];
    var ingredients = selectedIngredients();
    $("#recipeName").textContent = recipe.name;
    $("#recipeDesc").textContent = recipe.desc;
    $("#phoneTitle").textContent = recipe.name;
    $("#phoneSub").textContent = recipe.phoneSub;
    $("#resultIntro").textContent = "已根据“" + (ingredients.length ? ingredients.join("、") : "当前食材") + "”和“" + scene + "”生成。";
    $("#sceneBadge").textContent = "当前：" + scene;

    $("#recipeMeta").innerHTML = recipe.meta.map(function (item) {
      return "<span>" + item + "</span>";
    }).join("");

    $("#phoneMeta").innerHTML = recipe.meta.slice(0, 3).map(function (item) {
      return "<span>" + item + "</span>";
    }).join("");

    $("#recipeSteps").innerHTML = recipe.steps.map(function (step) {
      return "<div class=\"step\">" + step + "</div>";
    }).join("");
  }

  function setScene(scene) {
    selectedScene = scene;
    $all(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.scene === scene);
    });
    $all(".scenario-card").forEach(function (card) {
      card.classList.toggle("active", card.dataset.scenario === scene);
    });
    renderRecipe(scene);
  }

  $all("[data-scroll]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.querySelector(button.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  $all(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      chip.classList.toggle("active");
      renderRecipe(selectedScene);
    });
  });

  $("#addIngredient").addEventListener("click", function () {
    var input = $("#customIngredient");
    var value = input.value.trim();
    if (!value) {
      showToast("先输入一个食材吧");
      return;
    }
    var chip = document.createElement("button");
    chip.className = "chip active";
    chip.dataset.ingredient = value;
    chip.textContent = value;
    chip.addEventListener("click", function () {
      chip.classList.toggle("active");
      renderRecipe(selectedScene);
    });
    $("#ingredientChips").appendChild(chip);
    input.value = "";
    renderRecipe(selectedScene);
    showToast("已加入食材：" + value);
  });

  $("#customIngredient").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      $("#addIngredient").click();
    }
  });

  $all(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      setScene(tab.dataset.scene);
      showToast("已切换到：" + tab.dataset.scene);
    });
  });

  $all(".scenario-card").forEach(function (card) {
    card.addEventListener("click", function () {
      setScene(card.dataset.scenario);
      showToast("场景推荐已更新");
    });
  });

  $("#generateBtn").addEventListener("click", function () {
    var output = $("#recipeOutput");
    output.classList.add("loading");
    window.setTimeout(function () {
      output.classList.remove("loading");
      renderRecipe(selectedScene);
      showToast("已生成新的食谱建议");
    }, 850);
  });

  $("[data-random]").addEventListener("click", function () {
    var scenes = Object.keys(recipes);
    var next = scenes[Math.floor(Math.random() * scenes.length)];
    setScene(next);
    document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("小厨娘随机推荐：" + recipes[next].name);
  });

  $("#analyzeVideo").addEventListener("click", function () {
    var box = $("#analysisBox");
    box.classList.add("loading");
    window.setTimeout(function () {
      box.classList.remove("loading");
      showToast("视频解析完成，已生成食谱卡");
    }, 900);
  });

  renderRecipe(selectedScene);
})();
