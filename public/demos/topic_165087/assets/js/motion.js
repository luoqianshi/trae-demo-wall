/* ============================================================
   Drop Snacks · V6 Motion System
   圆环渐进扩张、滞后、超调、回弹和释放
   使用 transform 和 opacity，不使用 width/height 逐帧驱动
   ============================================================ */
(function(){
  "use strict";

  var rings = null;       /* {outer, mid, inner, coreGlow, coreDot} */
  var currentProgress = 0;
  var targetProgress = 0;
  var rafId = null;
  var reducedMotion = false;
  /* 追踪 complete() 的嵌套 setTimeout，reset() 时取消，避免 stale callback 覆写干净状态 */
  var completeTimerIds = [];

  /* 检测 prefers-reduced-motion */
  function detectReducedMotion(){
    try{
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }catch(e){
      return false;
    }
  }

  function isReducedMotion(){
    return reducedMotion;
  }

  /* 取消 complete() 的所有 pending setTimeout，防止 stale callback 在 reset 后覆写 ring 样式 */
  function clearCompleteTimers(){
    for(var i = 0; i < completeTimerIds.length; i++){
      clearTimeout(completeTimerIds[i]);
    }
    completeTimerIds.length = 0;
  }

  /* 初始化 */
  function init(elements){
    rings = elements;
    reducedMotion = detectReducedMotion();
    reset();
  }

  /* 重置所有圆环到初始状态 */
  function reset(){
    /* 先取消 complete() 的 pending setTimeout，确保旧 callback 不会在 reset 后写入 ring */
    clearCompleteTimers();
    if(!rings) return;
    currentProgress = 0;
    targetProgress = 0;
    if(rafId){
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* 使用 transform 重置，不用 width/height */
    if(rings.outer){
      rings.outer.style.transform = "scale(1)";
      rings.outer.style.opacity = "0.18";
      rings.outer.classList.remove("lit");
    }
    if(rings.mid){
      rings.mid.style.transform = "scale(1)";
      rings.mid.style.opacity = "0.18";
      rings.mid.classList.remove("lit");
    }
    if(rings.inner){
      rings.inner.style.transform = "scale(1)";
      rings.inner.style.opacity = "0.18";
      rings.inner.classList.remove("lit");
    }
    if(rings.coreGlow){
      rings.coreGlow.style.transform = "scale(1)";
      rings.coreGlow.style.opacity = "0.5";
    }
    if(rings.coreDot){
      rings.coreDot.classList.remove("charged");
    }
  }

  /* 设置进度：核心入口，鼠标/触摸/键盘共用 */
  function setProgress(progress){
    if(!rings) return;
    targetProgress = Math.max(0, Math.min(1, progress));

    if(reducedMotion){
      /* reduced motion: 直接设置，无动画 */
      applyProgressDirect(targetProgress);
      currentProgress = targetProgress;
    } else {
      /* 使用 requestAnimationFrame 插值 */
      if(!rafId){
        animateProgress();
      }
    }
  }

  /* 直接设置进度（reduced motion 或即时更新） */
  function applyProgressDirect(progress){
    if(!rings) return;

    /* 内环最先响应：progress 从 0 开始 */
    var innerP = Math.min(1, progress / 0.5);
    /* 中环稍后响应：progress > 0.15 开始 */
    var midP = Math.max(0, Math.min(1, (progress - 0.15) / 0.5));
    /* 外环最后响应：progress > 0.35 开始 */
    var outerP = Math.max(0, Math.min(1, (progress - 0.35) / 0.65));

    /* 内环：scale 1→1.08，opacity 0.18→1 */
    if(rings.inner){
      rings.inner.style.transform = "scale(" + (1 + innerP * 0.08) + ")";
      rings.inner.style.opacity = (0.18 + innerP * 0.82).toString();
      if(innerP > 0.1) rings.inner.classList.add("lit");
      else rings.inner.classList.remove("lit");
    }

    /* 中环：scale 1→1.06，opacity 0.18→1 */
    if(rings.mid){
      rings.mid.style.transform = "scale(" + (1 + midP * 0.06) + ")";
      rings.mid.style.opacity = (0.18 + midP * 0.82).toString();
      if(midP > 0.1) rings.mid.classList.add("lit");
      else rings.mid.classList.remove("lit");
    }

    /* 外环：scale 1→1.04，opacity 0.18→1 */
    if(rings.outer){
      rings.outer.style.transform = "scale(" + (1 + outerP * 0.04) + ")";
      rings.outer.style.opacity = (0.18 + outerP * 0.82).toString();
      if(outerP > 0.1) rings.outer.classList.add("lit");
      else rings.outer.classList.remove("lit");
    }

    /* core glow: 使用 transform scale 而非 width/height */
    if(rings.coreGlow){
      var glowScale = 1 + progress * 1.5; /* 1x → 2.5x */
      rings.coreGlow.style.transform = "scale(" + glowScale + ")";
      rings.coreGlow.style.opacity = (0.5 + progress * 0.5).toString();
    }

    /* core dot charged */
    if(rings.coreDot){
      if(progress > 0.82) rings.coreDot.classList.add("charged");
      else rings.coreDot.classList.remove("charged");
    }
  }

  /* requestAnimationFrame 动画循环 */
  function animateProgress(){
    if(!rings){ rafId = null; return; }

    var diff = targetProgress - currentProgress;
    var absDiff = Math.abs(diff);

    if(absDiff < 0.005){
      currentProgress = targetProgress;
      applyProgressDirect(currentProgress);
      rafId = null;
      return;
    }

    /* 轻量插值：不同环有不同的响应速度 */
    currentProgress += diff * 0.18;
    applyProgressDirect(currentProgress);

    rafId = requestAnimationFrame(animateProgress);
  }

  /* 完成序列：超调 → 回弹 → 释放 → 安静 */
  function complete(options){
    if(!rings) return;
    options = options || {};

    /* 每次启动前先取消旧 completion timeout，避免叠加 */
    clearCompleteTimers();

    if(rafId){
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if(reducedMotion){
      /* reduced motion: 直接进入稳定完成态，无超调 */
      applyProgressDirect(1);
      if(rings.coreDot) rings.coreDot.classList.add("charged");
      if(options.onDone) options.onDone();
      return;
    }

    /* 阶段 1：超调（约 200ms） */
    var overshootScale = {
      inner: 1.12,
      mid: 1.10,
      outer: 1.06,
      glow: 2.8
    };

    if(rings.inner) rings.inner.style.transform = "scale(" + overshootScale.inner + ")";
    if(rings.mid) rings.mid.style.transform = "scale(" + overshootScale.mid + ")";
    if(rings.outer) rings.outer.style.transform = "scale(" + overshootScale.outer + ")";
    if(rings.coreGlow){
      rings.coreGlow.style.transform = "scale(" + overshootScale.glow + ")";
      rings.coreGlow.style.opacity = "1";
    }

    /* 全部点亮 */
    if(rings.inner) rings.inner.classList.add("lit");
    if(rings.mid) rings.mid.classList.add("lit");
    if(rings.outer) rings.outer.classList.add("lit");
    if(rings.coreDot) rings.coreDot.classList.add("charged");

    /* 阶段 2：回弹到稳定尺寸（约 250ms 后） */
    completeTimerIds.push(setTimeout(function(){
      if(rings.inner) rings.inner.style.transform = "scale(1.08)";
      if(rings.mid) rings.mid.style.transform = "scale(1.06)";
      if(rings.outer) rings.outer.style.transform = "scale(1.04)";

      /* 阶段 3：光场向外释放一次（约 350ms 后） */
      completeTimerIds.push(setTimeout(function(){
        if(rings.coreGlow){
          rings.coreGlow.style.transform = "scale(3.2)";
          rings.coreGlow.style.opacity = "0.3";
        }

        /* 阶段 4：进入安静完成态（约 500ms 后） */
        completeTimerIds.push(setTimeout(function(){
          if(rings.coreGlow){
            rings.coreGlow.style.transform = "scale(2)";
            rings.coreGlow.style.opacity = "0.6";
          }
          if(rings.inner) rings.inner.style.transform = "scale(1.05)";
          if(rings.mid) rings.mid.style.transform = "scale(1.03)";
          if(rings.outer) rings.outer.style.transform = "scale(1.02)";

          if(options.onDone) options.onDone();
        }, 150));
      }, 150));
    }, 200));
  }

  /* 获取当前进度 */
  function getProgress(){
    return currentProgress;
  }

  window.DropSnacksMotion = {
    init: init,
    reset: reset,
    setProgress: setProgress,
    complete: complete,
    getProgress: getProgress,
    isReducedMotion: isReducedMotion
  };
})();
