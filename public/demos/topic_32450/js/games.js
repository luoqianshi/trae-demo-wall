(function () {
  "use strict";

  var selectedColor = "#ff9bb8";
  var currentDrawing = "flower";
  var breathTimer = null;
  var breathStep = 0;
  var breathRunning = false;

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function createParticles(x, y, count) {
    var colors = window.MoodData.palettes;
    for (var i = 0; i < count; i += 1) {
      var particle = document.createElement("span");
      var angle = Math.random() * Math.PI * 2;
      var distance = 32 + Math.random() * 58;
      particle.className = "particle";
      particle.style.left = x + "px";
      particle.style.top = y + "px";
      particle.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--ty", Math.sin(angle) * distance + "px");
      particle.style.setProperty("--particle-color", randomItem(colors));
      document.body.appendChild(particle);
      setTimeout(function (node) {
        node.remove();
      }, 760, particle);
    }
  }

  function initBreathing() {
    var circle = document.getElementById("breathCircle");
    var phase = document.getElementById("breathPhase");
    var hint = document.getElementById("breathHint");
    var toggle = document.getElementById("breathToggle");
    var phases = [
      { text: "吸气 4", scale: 1.12, duration: 4000, hint: "像闻到一朵小花，慢慢吸气。" },
      { text: "屏息 7", scale: 1.12, duration: 7000, hint: "轻轻停住，不用憋到难受。" },
      { text: "呼气 8", scale: 0.78, duration: 8000, hint: "像吹走一片云，慢慢呼出去。" }
    ];

    function runStep() {
      var item = phases[breathStep % phases.length];
      phase.textContent = item.text;
      hint.textContent = item.hint;
      circle.style.setProperty("--breath-scale", item.scale);
      circle.style.setProperty("--breath-duration", item.duration + "ms");
      breathStep += 1;
      breathTimer = setTimeout(runStep, item.duration);
    }

    toggle.addEventListener("click", function () {
      breathRunning = !breathRunning;
      if (breathRunning) {
        toggle.textContent = "暂停练习";
        runStep();
      } else {
        clearTimeout(breathTimer);
        phase.textContent = "暂停";
        hint.textContent = "准备好时再继续，暂停也没关系。";
        circle.style.setProperty("--breath-scale", "0.82");
        toggle.textContent = "继续练习";
      }
    });
  }

  function initAffirmation() {
    var card = document.getElementById("affirmationCard");
    card.addEventListener("click", function () {
      card.classList.add("flip");
      window.MoodAudio.flip();
      setTimeout(function () {
        card.textContent = randomItem(window.MoodData.affirmations);
        card.classList.remove("flip");
      }, 180);
    });
  }

  function initBubbles() {
    var field = document.getElementById("bubbleField");
    var reset = document.getElementById("resetBubbles");

    function render() {
      field.innerHTML = "";
      for (var i = 0; i < 24; i += 1) {
        var bubble = document.createElement("button");
        var size = 32 + Math.random() * 48;
        bubble.className = "bubble";
        bubble.type = "button";
        bubble.setAttribute("aria-label", "戳破一个泡泡");
        bubble.style.width = size + "px";
        bubble.style.height = size + "px";
        bubble.style.left = Math.random() * 86 + "%";
        bubble.style.top = Math.random() * 76 + "%";
        bubble.style.animationDelay = -Math.random() * 4 + "s";
        bubble.addEventListener("click", function (event) {
          event.currentTarget.classList.add("popped");
          window.MoodAudio.pop();
          createParticles(event.clientX, event.clientY, 8);
          setTimeout(function (node) {
            node.remove();
          }, 300, event.currentTarget);
        });
        field.appendChild(bubble);
      }
    }

    reset.addEventListener("click", render);
    render();
  }

  function initSquishy() {
    var ball = document.getElementById("squishy");
    var pressing = false;
    function press(event) {
      pressing = true;
      ball.classList.add("press");
      window.MoodAudio.squish();
      createParticles(event.clientX, event.clientY, 7);
    }
    function release() {
      if (!pressing) {
        return;
      }
      pressing = false;
      ball.classList.remove("press");
      var rect = ball.getBoundingClientRect();
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
    }
    ball.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  }

  function initCrusher() {
    var input = document.getElementById("worryInput");
    var button = document.getElementById("crushWorry");
    var stage = document.getElementById("shredStage");
    var message = document.getElementById("crushMessage");
    var messages = [
      "烦恼没有消失也没关系，你已经把它从心里拿出来看见了。",
      "让这件事先碎成小块，今晚只处理其中最小的一块。",
      "你不必独自修好所有坏天气，找人一起撑伞也很好。"
    ];

    button.addEventListener("click", function () {
      var text = input.value.trim() || "这个烦恼";
      stage.innerHTML = "";
      message.textContent = "";
      window.MoodAudio.crush();

      // 1) 先把烦恼以纸条形式送进碎纸口
      var paper = document.createElement("div");
      paper.className = "shred-paper";
      paper.textContent = text;
      stage.appendChild(paper);

      // 2) 机器抖动表示正在工作
      stage.classList.remove("working");
      void stage.offsetWidth;
      stage.classList.add("working");

      // 3) 纸条吸入后，碎成一个个字符从碎纸口向下散落
      var chars = text.split("");
      setTimeout(function () {
        paper.remove();
        var stageWidth = stage.clientWidth || 240;
        chars.forEach(function (char, index) {
          if (char.trim() === "") {
            return;
          }
          var piece = document.createElement("span");
          var spread = 90 + Math.random() * 60;
          var fall = 80 + Math.random() * 50;
          piece.className = "shred-piece";
          piece.textContent = char;
          piece.style.left = (12 + Math.random() * (stageWidth - 24)) + "px";
          piece.style.setProperty("--tx", (Math.random() * spread * 2 - spread) + "px");
          piece.style.setProperty("--ty", fall + "px");
          piece.style.setProperty("--rot", (Math.random() * 520 - 260) + "deg");
          piece.style.animationDelay = index * 0.03 + "s";
          stage.appendChild(piece);
        });
      }, 420);

      setTimeout(function () {
        input.value = "";
        message.textContent = randomItem(messages);
      }, 1400);
    });
  }

  function initFortune() {
    var deck = document.getElementById("fortuneDeck");
    var result = document.getElementById("fortuneResult");
    var reset = document.getElementById("resetFortune");

    function render() {
      deck.innerHTML = "";
      result.textContent = "选一张盖着的小卡牌吧。";
      for (var i = 0; i < 3; i += 1) {
        var card = document.createElement("button");
        card.type = "button";
        card.className = "fortune-card";
        card.textContent = "✦";
        card.addEventListener("click", function (event) {
          Array.prototype.forEach.call(deck.children, function (node) {
            node.disabled = true;
          });
          event.currentTarget.classList.add("open");
          event.currentTarget.textContent = "💌";
          result.textContent = randomItem(window.MoodData.fortunes);
          window.MoodAudio.flip();
        });
        deck.appendChild(card);
      }
    }

    reset.addEventListener("click", render);
    render();
  }

  function drawingSvg(key, saved) {
    var get = function (id, fallback) {
      return saved[id] || fallback;
    };
    var common = 'stroke="#25405f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
    if (key === "cloud") {
      return '<svg viewBox="0 0 320 260" role="img" aria-label="云朵线稿">' +
        '<path class="paintable" data-part="cloud-main" fill="' + get("cloud-main", "#ffffff") + '" ' + common + ' d="M85 165c-33 0-58-21-58-50s24-51 54-51c12-29 40-47 74-43 33 4 57 27 65 57 36 0 64 24 64 56 0 33-28 58-65 58H85z"/>' +
        '<circle class="paintable" data-part="drop-1" fill="' + get("drop-1", "#82c8ff") + '" ' + common + ' cx="101" cy="220" r="16"/>' +
        '<circle class="paintable" data-part="drop-2" fill="' + get("drop-2", "#93dfc3") + '" ' + common + ' cx="168" cy="224" r="16"/>' +
        '<circle class="paintable" data-part="drop-3" fill="' + get("drop-3", "#ff9bb8") + '" ' + common + ' cx="234" cy="220" r="16"/>' +
        '</svg>';
    }
    if (key === "mandala") {
      return '<svg viewBox="0 0 320 260" role="img" aria-label="曼陀罗线稿">' +
        '<circle class="paintable" data-part="center" fill="' + get("center", "#ffe88a") + '" ' + common + ' cx="160" cy="130" r="30"/>' +
        '<path class="paintable" data-part="petal-1" fill="' + get("petal-1", "#ff9bb8") + '" ' + common + ' d="M160 28c26 32 26 63 0 93-26-30-26-61 0-93z"/>' +
        '<path class="paintable" data-part="petal-2" fill="' + get("petal-2", "#82c8ff") + '" ' + common + ' d="M262 130c-32 26-63 26-93 0 30-26 61-26 93 0z"/>' +
        '<path class="paintable" data-part="petal-3" fill="' + get("petal-3", "#93dfc3") + '" ' + common + ' d="M160 232c-26-32-26-63 0-93 26 30 26 61 0 93z"/>' +
        '<path class="paintable" data-part="petal-4" fill="' + get("petal-4", "#ffc36b") + '" ' + common + ' d="M58 130c32-26 63-26 93 0-30 26-61 26-93 0z"/>' +
        '</svg>';
    }
    if (key === "cat") {
      return '<svg viewBox="0 0 320 260" role="img" aria-label="小猫线稿">' +
        '<path class="paintable" data-part="face" fill="' + get("face", "#ffc36b") + '" ' + common + ' d="M82 94 104 35l42 38c10-3 20-4 32-3l40-35 20 59c19 18 28 41 24 67-7 43-48 72-101 72s-95-29-103-72c-4-26 5-49 24-67z"/>' +
        '<circle fill="#25405f" cx="125" cy="138" r="7"/><circle fill="#25405f" cx="195" cy="138" r="7"/>' +
        '<path fill="none" ' + common + ' d="M160 152v18m0 0c-12 13-28 13-39 0m39 0c12 13 28 13 39 0"/>' +
        '<path class="paintable" data-part="bow" fill="' + get("bow", "#ff9bb8") + '" ' + common + ' d="M126 214c13-25 26-26 34-4 10-22 24-20 35 4-14 12-26 10-35-4-7 14-20 16-34 4z"/>' +
        '</svg>';
    }
    return '<svg viewBox="0 0 320 260" role="img" aria-label="小花线稿">' +
      '<path fill="none" ' + common + ' d="M160 146v83m0-47c-28-18-57-12-77 18m77-22c29-18 59-12 78 19"/>' +
      '<circle class="paintable" data-part="center" fill="' + get("center", "#ffe88a") + '" ' + common + ' cx="160" cy="111" r="25"/>' +
      '<ellipse class="paintable" data-part="top" fill="' + get("top", "#ff9bb8") + '" ' + common + ' cx="160" cy="56" rx="29" ry="42"/>' +
      '<ellipse class="paintable" data-part="right" fill="' + get("right", "#ffc36b") + '" ' + common + ' cx="214" cy="112" rx="42" ry="29"/>' +
      '<ellipse class="paintable" data-part="bottom" fill="' + get("bottom", "#93dfc3") + '" ' + common + ' cx="160" cy="166" rx="29" ry="42"/>' +
      '<ellipse class="paintable" data-part="left" fill="' + get("left", "#82c8ff") + '" ' + common + ' cx="106" cy="112" rx="42" ry="29"/>' +
      '</svg>';
  }

  function initColoring() {
    var tabs = document.getElementById("drawingTabs");
    var board = document.getElementById("coloringBoard");
    var palette = document.getElementById("palette");

    function getSaved() {
      return window.MoodStorage.loadColoring()[currentDrawing] || {};
    }

    function savePart(part, color) {
      var all = window.MoodStorage.loadColoring();
      all[currentDrawing] = all[currentDrawing] || {};
      all[currentDrawing][part] = color;
      window.MoodStorage.saveColoring(all);
    }

    function renderBoard() {
      board.innerHTML = drawingSvg(currentDrawing, getSaved());
      Array.prototype.forEach.call(board.querySelectorAll(".paintable"), function (node) {
        node.addEventListener("click", function () {
          node.setAttribute("fill", selectedColor);
          savePart(node.dataset.part, selectedColor);
          window.MoodAudio.pop();
        });
      });
    }

    window.MoodData.drawings.forEach(function (drawing) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "drawing-tab" + (drawing.key === currentDrawing ? " active" : "");
      tab.textContent = drawing.label;
      tab.addEventListener("click", function () {
        currentDrawing = drawing.key;
        Array.prototype.forEach.call(tabs.children, function (node) {
          node.classList.toggle("active", node === tab);
        });
        renderBoard();
      });
      tabs.appendChild(tab);
    });

    window.MoodData.palettes.forEach(function (color) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "color-dot" + (color === selectedColor ? " active" : "");
      dot.style.background = color;
      dot.setAttribute("aria-label", "选择颜色 " + color);
      dot.addEventListener("click", function () {
        selectedColor = color;
        Array.prototype.forEach.call(palette.children, function (node) {
          node.classList.toggle("active", node === dot);
        });
      });
      palette.appendChild(dot);
    });

    document.getElementById("clearColoring").addEventListener("click", function () {
      var all = window.MoodStorage.loadColoring();
      all[currentDrawing] = {};
      window.MoodStorage.saveColoring(all);
      renderBoard();
    });

    renderBoard();
  }

  function initChime() {
    var keys = document.getElementById("chimeKeys");
    if (!keys) {
      return;
    }
    // 大调五声音阶，听起来都和谐：C D E G A C
    var notes = [
      { label: "🌤", freq: 523.25, color: "#54a9f7" },
      { label: "🌈", freq: 587.33, color: "#91dfc3" },
      { label: "☀️", freq: 659.25, color: "#ffd278" },
      { label: "🌸", freq: 783.99, color: "#ff91b6" },
      { label: "💫", freq: 880.0, color: "#ffaf5f" },
      { label: "🌊", freq: 1046.5, color: "#74bfff" },
      { label: "🍀", freq: 1174.7, color: "#7fd6b4" },
      { label: "✨", freq: 1318.5, color: "#ffc36b" }
    ];
    notes.forEach(function (note) {
      var key = document.createElement("button");
      key.type = "button";
      key.className = "chime-key";
      key.textContent = note.label;
      key.style.setProperty("--chime-color", note.color);
      key.setAttribute("aria-label", "弹一个音");
      key.addEventListener("pointerdown", function () {
        window.MoodAudio.chime(note.freq);
        key.classList.add("lit");
        setTimeout(function () {
          key.classList.remove("lit");
        }, 220);
      });
      keys.appendChild(key);
    });
  }

  function initFog() {
    var canvas = document.getElementById("fogCanvas");
    if (!canvas) {
      return;
    }
    var ctx = canvas.getContext("2d");
    var painting = false;
    var lastWipe = 0;

    function fog() {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(214, 226, 238, 0.94)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "600 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("用手指擦一擦", canvas.width / 2, canvas.height / 2);
    }

    function pos(event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function wipe(event) {
      var p = pos(event);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx.fill();
      var now = Date.now();
      if (now - lastWipe > 160) {
        window.MoodAudio.wipe();
        lastWipe = now;
      }
    }

    canvas.addEventListener("pointerdown", function (event) {
      painting = true;
      wipe(event);
    });
    canvas.addEventListener("pointermove", function (event) {
      if (painting) {
        wipe(event);
      }
    });
    canvas.addEventListener("pointerup", function () {
      painting = false;
    });
    canvas.addEventListener("pointerleave", function () {
      painting = false;
    });

    document.getElementById("resetFog").addEventListener("click", fog);
    fog();
  }

  function initFish() {
    var fish = document.getElementById("woodenFish");
    var count = document.getElementById("meritCount");
    if (!fish) {
      return;
    }
    var merit = 0;
    fish.addEventListener("pointerdown", function (event) {
      merit += 1;
      count.textContent = "功德 +" + merit;
      window.MoodAudio.knock();
      fish.classList.add("knock");
      setTimeout(function () {
        fish.classList.remove("knock");
      }, 110);
      var float = document.createElement("span");
      float.className = "merit-float";
      float.textContent = "功德 +1";
      float.style.left = event.clientX - 18 + "px";
      float.style.top = event.clientY - 30 + "px";
      document.body.appendChild(float);
      setTimeout(function () {
        float.remove();
      }, 800);
    });
  }

  window.MoodGames = {
    init: function () {
      initBreathing();
      initAffirmation();
      initBubbles();
      initSquishy();
      initCrusher();
      initChime();
      initFog();
      initFortune();
      initFish();
      initColoring();
    },
    createParticles: createParticles
  };
})();
