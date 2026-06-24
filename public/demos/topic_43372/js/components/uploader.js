/* ============================================================
 * uploader.js  文件上传组件
 * 将指定 DOM 区域变成拖拽/点击上传区，并在 fileList 显示
 * 用法：var u = __UPLOADER.init('#crypto-uploader', '#crypto-file', '#crypto-filelist', {
 *           onFiles: function(files) {}, multiple: true, accept: '.xlsx,.xlsm,.xls'
 *       });
 * ============================================================ */
(function (global) {
  'use strict';
  var C = global.__C;

  function init(uploaderSel, inputSel, fileListSel, opts) {
    opts = opts || {};
    var uploader = typeof uploaderSel === 'string' ? document.querySelector(uploaderSel) : uploaderSel;
    var input = typeof inputSel === 'string' ? document.querySelector(inputSel) : inputSel;
    var fileList = typeof fileListSel === 'string' ? document.querySelector(fileListSel) : fileListSel;
    if (!uploader || !input) return null;

    var state = { files: [] };

    function render() {
      if (!fileList) return;
      fileList.innerHTML = '';
      state.files.forEach(function (f, i) {
        var div = document.createElement('div');
        div.className = 'filelist-item';
        div.innerHTML = '<span>📄 ' + f.name + '</span>' +
          '<span class="file-meta">' + C.fmtSize(f.size) + '</span>' +
          '<span class="file-remove" data-idx="' + i + '" title="移除">✕</span>';
        fileList.appendChild(div);
      });
      fileList.querySelectorAll('.file-remove').forEach(function (el) {
        el.addEventListener('click', function () {
          var idx = parseInt(el.getAttribute('data-idx'), 10);
          state.files.splice(idx, 1);
          render();
          if (opts.onFiles) opts.onFiles(state.files);
        });
      });
    }

    function addFiles(fileLike) {
      var arr = Array.from(fileLike);
      state.files = state.files.concat(arr);
      render();
      if (opts.onFiles) opts.onFiles(state.files);
    }

    uploader.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length) addFiles(e.target.files);
      input.value = '';
    });
    uploader.addEventListener('dragover', function (e) {
      e.preventDefault(); e.stopPropagation();
      uploader.classList.add('drag');
    });
    uploader.addEventListener('dragleave', function (e) {
      e.preventDefault(); e.stopPropagation();
      uploader.classList.remove('drag');
    });
    uploader.addEventListener('drop', function (e) {
      e.preventDefault(); e.stopPropagation();
      uploader.classList.remove('drag');
      if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });

    return {
      getFiles: function () { return state.files.slice(); },
      clear: function () { state.files = []; render(); if (opts.onFiles) opts.onFiles([]); },
      setFiles: function (arr) { state.files = arr ? arr.slice() : []; render(); if (opts.onFiles) opts.onFiles(state.files); }
    };
  }

  global.__UPLOADER = { init: init };
})(window);
