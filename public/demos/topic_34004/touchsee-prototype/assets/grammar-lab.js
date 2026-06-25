// ============================================================
// TouchSee Grammar Lab — 触觉语法实验室交互模块
// ============================================================
(function (global) {
  'use strict';

  var Engine = global.TouchSee && global.TouchSee.Engine;
  var Audio = global.TouchSee && global.TouchSee.Audio;
  if (!Engine) { console.error('[TouchSee] Engine not loaded'); return; }

  var state = {
    azimuth: 0,
    distance: 3.0,
    elevation: 0,
    type: 'person',
    view: 'front',
    playing: false,
    soundEnabled: false,
  };

  var elements = {};

  function init() {
    // Cache elements
    elements.container = document.getElementById('lab-body-container');
    elements.azSlider = document.getElementById('azimuth-slider');
    elements.azVal = document.getElementById('azimuth-val');
    elements.distSlider = document.getElementById('distance-slider');
    elements.distVal = document.getElementById('distance-val');
    elements.elevSlider = document.getElementById('elevation-slider');
    elements.elevVal = document.getElementById('elevation-val');
    elements.typeButtons = document.getElementById('type-buttons');
    elements.viewToggle = document.getElementById('view-toggle');
    elements.playBtn = document.getElementById('play-approach');
    elements.vocabGrid = document.getElementById('vocab-grid');
    elements.soundToggle = document.getElementById('lab-sound-toggle');

    // Data panel elements
    elements.dpDirection = document.getElementById('dp-direction');
    elements.dpZone = document.getElementById('dp-zone');
    elements.dpFreq = document.getElementById('dp-freq');
    elements.dpIntensity = document.getElementById('dp-intensity');
    elements.dpColor = document.getElementById('dp-color');
    elements.dpPattern = document.getElementById('dp-pattern');
    elements.dpMotors = document.getElementById('dp-motors');
    elements.dpSound = document.getElementById('dp-sound');

    if (!elements.container) return;

    // Render initial body model
    renderBodyModel();

    // Render vocabulary cards
    renderVocabCards();

    // Bind events
    bindEvents();

    // Initial update
    update();
  }

  function renderBodyModel() {
    elements.container.innerHTML = Engine.createBodySVG(state.view, 200);
  }

  function renderVocabCards() {
    var patterns = Engine.TYPE_PATTERNS;
    var html = [];
    for (var key in patterns) {
      var p = patterns[key];
      html.push('<div class="vocab-card' + (key === state.type ? ' active' : '') + '" data-type="' + key + '">');
      html.push('<div class="name">' + p.label + '</div>');
      html.push('<div class="rhythm">' + p.rhythm + '</div>');
      html.push('<div class="desc">' + p.desc + '</div>');
      html.push('</div>');
    }
    elements.vocabGrid.innerHTML = html.join('');

    // Bind click events
    var cards = elements.vocabGrid.querySelectorAll('.vocab-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function () {
        var type = this.getAttribute('data-type');
        state.type = type;
        // Update type buttons
        var btns = elements.typeButtons.querySelectorAll('.type-btn');
        for (var j = 0; j < btns.length; j++) {
          btns[j].classList.toggle('active', btns[j].getAttribute('data-type') === type);
        }
        // Update vocab cards
        for (var k = 0; k < cards.length; k++) {
          cards[k].classList.toggle('active', cards[k].getAttribute('data-type') === type);
        }
        update();
      });
    }
  }

  function bindEvents() {
    // Azimuth slider
    elements.azSlider.addEventListener('input', function () {
      state.azimuth = parseInt(this.value, 10);
      elements.azVal.textContent = state.azimuth + '°';
      update();
    });

    // Distance slider (50-600 → 0.5m-6.0m)
    elements.distSlider.addEventListener('input', function () {
      state.distance = parseInt(this.value, 10) / 100;
      elements.distVal.textContent = state.distance.toFixed(1) + 'm';
      update();
    });

    // Elevation slider
    elements.elevSlider.addEventListener('input', function () {
      state.elevation = parseInt(this.value, 10);
      elements.elevVal.textContent = state.elevation + '°';
      update();
    });

    // Type buttons
    var typeBtns = elements.typeButtons.querySelectorAll('.type-btn');
    for (var i = 0; i < typeBtns.length; i++) {
      typeBtns[i].addEventListener('click', function () {
        state.type = this.getAttribute('data-type');
        for (var j = 0; j < typeBtns.length; j++) {
          typeBtns[j].classList.remove('active');
        }
        this.classList.add('active');
        // Update vocab cards
        var cards = elements.vocabGrid.querySelectorAll('.vocab-card');
        for (var k = 0; k < cards.length; k++) {
          cards[k].classList.toggle('active', cards[k].getAttribute('data-type') === state.type);
        }
        update();
      });
    }

    // View toggle
    var viewBtns = elements.viewToggle.querySelectorAll('button');
    for (var i = 0; i < viewBtns.length; i++) {
      viewBtns[i].addEventListener('click', function () {
        state.view = this.getAttribute('data-view');
        for (var j = 0; j < viewBtns.length; j++) {
          viewBtns[j].classList.remove('active');
        }
        this.classList.add('active');
        renderBodyModel();
        update();
      });
    }

    // Play approach animation
    elements.playBtn.addEventListener('click', playApproach);

    // Sound toggle
    if (elements.soundToggle) {
      elements.soundToggle.addEventListener('click', function () {
        state.soundEnabled = !state.soundEnabled;
        if (Audio) {
          Audio.setEnabled(state.soundEnabled);
        }
        elements.soundToggle.textContent = state.soundEnabled ? '声音辅助 [开]' : '声音辅助 [关]';
        elements.soundToggle.classList.toggle('active', state.soundEnabled);
        if (!state.soundEnabled && Audio) {
          Audio.stopAll();
        }
        update();
      });
    }
  }

  function update() {
    // Build obstacle from current state
    var obstacle = {
      azimuth: state.azimuth,
      elevation: state.elevation,
      distance: state.distance,
      type: state.type,
      confidence: 0.95,
    };

    // Resolve haptics
    var motorStates = Engine.resolveHaptics([obstacle]);

    // Update body model
    Engine.updateMotorStates(elements.container, motorStates, state.view);

    // Update data panel
    var dirLabel = Engine.getDirectionLabel(state.azimuth, state.elevation);
    var dist = Engine.mapDistance(state.distance);
    var typePattern = Engine.TYPE_PATTERNS[state.type];

    elements.dpDirection.textContent = dirLabel;
    elements.dpZone.textContent = dist.label;
    elements.dpFreq.textContent = dist.freq.toFixed(1) + ' Hz';
    elements.dpIntensity.textContent = Math.round(dist.intensity * 100) + '%';
    elements.dpColor.innerHTML = '● ' + dist.colorName;
    elements.dpColor.style.color = dist.color;
    elements.dpPattern.textContent = typePattern.pattern;

    // Update sound status in data panel
    if (elements.dpSound) {
      if (!state.soundEnabled) {
        elements.dpSound.textContent = '已关闭';
        elements.dpSound.style.color = 'var(--faint)';
      } else if (dist.soundTrigger) {
        var alertMark = dist.distance < 1.0 ? ' ⚠' : '';
        elements.dpSound.textContent = dist.soundFreq + 'Hz ' + Math.round(dist.soundVolume * 100) + '%' + alertMark;
        elements.dpSound.style.color = dist.color;
      } else {
        elements.dpSound.textContent = '无声（距离>2m）';
        elements.dpSound.style.color = 'var(--faint)';
      }
    }

    // Play sound if enabled and in trigger zone
    if (state.soundEnabled && Audio && dist.soundTrigger) {
      Audio.playAlert([obstacle]);
    } else if (Audio && (!state.soundEnabled || !dist.soundTrigger)) {
      Audio.stopAll();
    }

    // Update motor list
    var dir = Engine.mapDirection(state.azimuth, state.elevation);
    var activeMotors = state.view === 'front' ? dir.front : dir.back;
    var motorHtml = [];
    for (var i = 0; i < activeMotors.length; i++) {
      motorHtml.push('<span class="motor-chip">' + activeMotors[i] + '</span>');
    }
    if (motorHtml.length === 0) {
      motorHtml.push('<span class="motor-chip" style="color:var(--faint);">无（切换视图）</span>');
    }
    elements.dpMotors.innerHTML = motorHtml.join('');
  }

  function playApproach() {
    if (state.playing) return;
    state.playing = true;
    elements.playBtn.textContent = '播放中...';
    elements.playBtn.disabled = true;

    var startDist = 6.0;
    var endDist = 0.5;
    var duration = 4000; // 4 seconds
    var startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Ease-in-out
      var eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      state.distance = startDist + (endDist - startDist) * eased;
      elements.distSlider.value = Math.round(state.distance * 100);
      elements.distVal.textContent = state.distance.toFixed(1) + 'm';

      update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        state.playing = false;
        elements.playBtn.textContent = '播放接近动画';
        elements.playBtn.disabled = false;
      }
    }

    requestAnimationFrame(animate);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
