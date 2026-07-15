/* 相 · 面相观察（拍照/上传 + 扫描动画 + 趋势） */
(function (App) {
  'use strict';
  var h = App.h, UI = App.UI, Store = App.Store;

  var streamRef = { stream: null };

  function render() {
    var wrap = h('div');
    wrap.appendChild(h('.quote', { text: '相由心生，气随境转。面相观察重在记录状态、回看趋势，而非论断吉凶。' }));

    // 采集区
    var capBox = h('.card.center', {});
    var preview = h('div', {
      style: {
        width: '100%', height: '220px', borderRadius: '14px', overflow: 'hidden',
        background: 'rgba(0,0,0,.3)', border: '1px solid var(--rule)',
        display: 'grid', placeItems: 'center', position: 'relative', marginBottom: '0.7rem'
      }
    }, [ h('.muted', { text: '📷 拍照或上传照片开始' }) ]);
    capBox.appendChild(preview);

    var fileInput = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    var imgData = { url: null };

    fileInput.onchange = function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        imgData.url = reader.result;
        showImage(preview, reader.result);
        analyzeBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    };
    capBox.appendChild(fileInput);

    var camBtn = h('button.btn.block', { text: '📷 调用摄像头', onclick: function () { openCamera(preview, imgData, analyzeBtn); } });
    var upBtn = h('button.btn.block', { text: '🖼 上传照片', onclick: function () { fileInput.click(); } });
    capBox.appendChild(h('.row', { style: { gap: '0.6rem' } }, [ camBtn, upBtn ]));

    var analyzeBtn = h('button.btn.primary.block', { text: '开始面相分析', disabled: true, style: { marginTop: '0.6rem' } });
    var resultBox = h('div');

    analyzeBtn.onclick = function () {
      analyzeBtn.disabled = true;
      runScan(preview, function () {
        App.clear(resultBox);
        resultBox.appendChild(h('.card', {}, [ UI.spinner('正在观察气色与神态…') ]));
        App.Mock.analyzeFace(imgData.url).then(function (res) {
          Store.pushLog('faceRecords', res);
          Store.addCultivation(5);
          App.clear(resultBox);
          resultBox.appendChild(buildResult(res));
          analyzeBtn.disabled = false;
        });
      });
    };
    capBox.appendChild(analyzeBtn);
    wrap.appendChild(capBox);
    wrap.appendChild(resultBox);

    // 趋势
    var records = Store.get().faceRecords;
    if (records.length) {
      wrap.appendChild(h('.section-title', { text: '状态趋势（近期）' }));
      wrap.appendChild(buildTrend(records));
    }

    wrap.appendChild(h('.disclaimer', { html: '照片仅在<b>本地浏览器</b>用于演示，不会上传服务器；面相内容属文化体验参考。' }));
    return wrap;
  }

  function showImage(preview, url) {
    App.clear(preview);
    preview.appendChild(h('img', { src: url, style: { width: '100%', height: '100%', objectFit: 'cover' } }));
  }

  function openCamera(preview, imgData, analyzeBtn) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      UI.toast('当前环境不支持摄像头，请改用上传'); return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(function (stream) {
      streamRef.stream = stream;
      App.clear(preview);
      var video = h('video', { autoplay: true, playsinline: true, style: { width: '100%', height: '100%', objectFit: 'cover' } });
      video.srcObject = stream;
      preview.appendChild(video);
      var snap = h('button.btn.primary', { text: '拍摄', style: { position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)' } });
      snap.onclick = function () {
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320; canvas.height = video.videoHeight || 240;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        imgData.url = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        showImage(preview, imgData.url);
        analyzeBtn.disabled = false;
      };
      preview.appendChild(snap);
    }).catch(function () {
      UI.toast('无法访问摄像头，请改用上传');
    });
  }

  function stopCamera() {
    if (streamRef.stream) {
      streamRef.stream.getTracks().forEach(function (t) { t.stop(); });
      streamRef.stream = null;
    }
  }

  // 扫描动画
  function runScan(preview, done) {
    var line = h('div', {
      style: {
        position: 'absolute', left: 0, right: 0, top: 0, height: '3px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        boxShadow: '0 0 14px var(--accent)', animation: 'none'
      }
    });
    preview.style.position = 'relative';
    preview.appendChild(line);
    var pos = 0, dir = 1, count = 0;
    var timer = setInterval(function () {
      pos += dir * 6;
      if (pos >= 210) dir = -1;
      if (pos <= 0) { dir = 1; count++; }
      line.style.top = pos + 'px';
      if (count >= 2) { clearInterval(timer); if (line.parentNode) line.parentNode.removeChild(line); done(); }
    }, 30);
  }

  function buildResult(res) {
    var box = h('div');
    box.appendChild(h('.section-title', { text: '面相观察结果' }));
    box.appendChild(h('.card', {}, [
      h('.row.between', {}, [
        h('.card-title', { text: '综合状态' }),
        h('.tag.gold', { text: '状态分 ' + res.score })
      ]),
      h('.card-sub', { text: '气色：' + res.qise }),
      h('div', { style: { marginTop: '0.6rem' } }, res.items.map(function (it) {
        return h('.row.between', { style: { padding: '0.3rem 0', borderBottom: '1px solid var(--rule)' } }, [
          h('span', { text: it.part, style: { color: 'var(--muted)' } }),
          h('span', { text: it.text, style: { color: it.good ? 'var(--accent2)' : 'var(--danger)', fontSize: '0.85rem', textAlign: 'right' } })
        ]);
      })),
      h('.quote', { style: { marginTop: '0.7rem' }, text: res.advice })
    ]));
    box.appendChild(h('button.btn.block', { text: '问 AI 调理建议', onclick: function () { App.Router.go('chat', { hint: 'face' }); } }));
    return box;
  }

  function buildTrend(records) {
    var data = records.slice(0, 7).reverse();
    var box = h('.card', {});
    var W = 300, H = 90, pad = 6;
    var max = 100, min = 50;
    var pts = data.map(function (r, i) {
      var x = pad + (data.length === 1 ? W / 2 : (i * (W - pad * 2) / (data.length - 1)));
      var y = pad + (1 - (r.score - min) / (max - min)) * (H - pad * 2);
      return [x, y];
    });
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', '100%');
    if (pts.length > 1) {
      var poly = document.createElementNS(svgNS, 'polyline');
      poly.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', '#d7aa43');
      poly.setAttribute('stroke-width', '2');
      svg.appendChild(poly);
    }
    pts.forEach(function (p) {
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', '3');
      c.setAttribute('fill', '#80b477');
      svg.appendChild(c);
    });
    box.appendChild(svg);
    box.appendChild(h('.small.muted.center', { text: '最近 ' + data.length + ' 次状态分（越高越佳）' }));
    return box;
  }

  App.Pages = App.Pages || {};
  App.Pages.face = { title: '相 · 面相观察', tab: 'face', render: render };
})(window.App);
