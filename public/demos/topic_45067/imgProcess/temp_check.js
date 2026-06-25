
(function(){
"use strict";

// ============ 全局状态 ============
var S = {
  files: [],      // {id, name, origImg, workData, adj, size, thumb}
  active: -1,     // 当前选中 index
  fmt: "png",
  qual: 85,
  eZoom: 100,
  addSuffix: true,
  zoom: 1,
  zoomFit: true,
  cropOn: false,
  crop: {x:0,y:0,w:0,h:0},
  cropRatio: "free",
  cropLock: false,
  cmpMode: "off", // off / split / overlay
  cmpPos: 50,
  adj: {bright:0,contrast:0,saturate:0,hue:0,blur:0,sharp:0,opacity:100},
  filter: "none",
  drag: null,
  dragStart: null,
  pan: {x:0,y:0,active:false},
  undoStack: [],
  redoStack: [],
  lockRatio: true,
  historyIndex: 0,
  // 标注相关
  drawTool: null,  // pen/arrow/rect/ellipse/blur/text
  mkColor: "#ef4444",
  mkSize: 4,
  mkAlpha: 100,
  mkBlurSz: 8,
  mkTxtColor: "#ffffff",
  mkTxtBg: "none",
  mkTxtSz: 24,
  mkTxtStroke: false,
  mkTxtShadow: true,
  // 拼接相关
  stDir: "h",
  stGap: 0,
  stPad: 0,
};

var $ = function(s){return document.querySelector(s);};
var $$ = function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};

// ============ 工具函数 ============
function toast(m, t){
  var el=$("#toast");
  el.textContent=m;
  el.className="toast sh "+(t||"");
  clearTimeout(el._t);
  el._t=setTimeout(function(){el.className="toast";},2000);
}
function hSize(b){
  if(!b) return "0 B";
  if(b<1024) return b+" B";
  if(b<1048576) return (b/1024).toFixed(1)+" KB";
  return (b/1048576).toFixed(2)+" MB";
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function gcd(a,b){return b===0?a:gcd(b,a%b);}
function ratioStr(w,h){
  var g=gcd(w,h);
  return (w/g)+":"+(h/g);
}
function uid(){return "f"+Math.random().toString(36).slice(2,9);}

function status(m){$("#statusBar").innerHTML="<span>"+m+"</span>";}

// ============ 预设检查 ============
var presetCheckData = {
  folderPath: "",
  files: [],
  results: {}
};

// 预设检查规则
var presetRules = [
  { 
    id: "6", 
    name: "6/6L", 
    keywords: ["6", "6l", "6L"],
    width: 1920, 
    height: 1080, 
    formats: ["jpg", "jpeg", "png"], 
    type: "landscape", 
    required: true 
  },
  { 
    id: "9", 
    name: "9/9L", 
    keywords: ["9", "9l", "9L"],
    width: 1080, 
    height: 1920, 
    formats: ["jpg", "jpeg", "png"], 
    type: "portrait", 
    required: true 
  },
  { 
    id: "11", 
    name: "11", 
    keywords: ["11"],
    width: 1440, 
    height: 1440, 
    formats: ["jpg", "jpeg", "png"], 
    type: "square", 
    required: true 
  },
  { 
    id: "logo", 
    name: "Logo", 
    keywords: ["logo"],
    width: 720, 
    height: 0, 
    formats: ["png"], 
    type: "width", 
    required: true 
  },
  { 
    id: "size", 
    name: "文件大小", 
    keywords: [],
    size: 4 * 1024 * 1024, 
    formats: ["jpg", "jpeg", "png", "webp", "gif", "bmp"], 
    type: "filesize", 
    required: true 
  }
];

// 顶栏预设检查按钮 - 打开检查模态框
$("#btnPresetCheck").onclick = function() {
  // 重置状态
  resetCheckModal();
  // 显示模态框
  $("#checkModal").className = "modal-mask on";
};

// 关闭检查模态框
$("#checkClose").onclick = function() {
  $("#checkModal").className = "modal-mask";
};
$("#checkCancelBtn").onclick = function() {
  $("#checkModal").className = "modal-mask";
};
// 点击遮罩关闭
$("#checkModal").onclick = function(e) {
  if (e.target === this) {
    this.className = "modal-mask";
  }
};

// 重置检查模态框状态
function resetCheckModal() {
  var ids = ["6", "9", "11", "logo", "size"];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var iconEl = $("#ci-" + id);
    var statusEl = $("#cs-" + id);
    if (iconEl) {
      iconEl.className = "check-icon";
      iconEl.textContent = "?";
    }
    if (statusEl) {
      statusEl.className = "check-status pending";
      statusEl.textContent = "待检测";
    }
  }
  $("#ccCount").textContent = "0";
  $("#ccPass").textContent = "0";
  $("#ccFail").textContent = "0";
  $("#ccMiss").textContent = "0";
  $("#checkDetailSection").style.display = "none";
  $("#checkDetailList2").innerHTML = "";
  $("#checkExportBtn").style.display = "none";
  $("#checkFolderPath").style.display = "none";
  $("#checkCurrentPath").textContent = "";
}

// 选择文件夹按钮
$("#btnSelectFolder2").onclick = function() {
  var input = document.createElement("input");
  input.type = "file";
  input.webkitdirectory = true;
  input.onchange = function(e) {
    var files = e.target.files;
    if (files && files.length > 0) {
      // 获取文件夹路径
      var path = files[0].webkitRelativePath || "";
      var folderPath = path.split("/")[0] || "选择的文件夹";
      presetCheckData.folderPath = folderPath;
      presetCheckData.files = Array.prototype.slice.call(files);
      
      // 显示路径
      $("#checkCurrentPath").textContent = folderPath;
      $("#checkFolderPath").style.display = "block";
      
      // 执行检查
      runPresetCheck();
    }
  };
  input.click();
};

// 检查文件名是否匹配规则关键词（不区分大小写）
function matchFileName(fileName, keywords) {
  var lowerName = fileName.toLowerCase();
  for (var i = 0; i < keywords.length; i++) {
    if (lowerName.includes(keywords[i].toLowerCase())) {
      return true;
    }
  }
  return false;
}

// 执行预设检查
function runPresetCheck() {
  var files = presetCheckData.files;
  if (!files || files.length === 0) {
    toast("请先选择包含图片的文件夹", "wa");
    return;
  }
  
  var imageFiles = [];
  
  // 筛选图片文件
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (f.type.startsWith("image/")) {
      imageFiles.push(f);
    }
  }
  
  if (imageFiles.length === 0) {
    toast("文件夹中没有找到图片文件", "wa");
    return;
  }
  
  // 初始化结果
  var results = {};
  var ruleIds = ["6", "9", "11", "logo", "size"];
  for (var j = 0; j < ruleIds.length; j++) {
    results[ruleIds[j]] = { status: "pending", files: [], missing: true };
  }
  
  var totalChecked = 0;
  var passCount = 0;
  var failCount = 0;
  var allDetails = [];
  
  var processedCount = 0;
  
  function processNextFile() {
    if (processedCount >= imageFiles.length) {
      // 所有文件处理完成，显示最终结果
      displayCheckModalResults(results, totalChecked, passCount, failCount, allDetails);
      return;
    }
    
    var file = imageFiles[processedCount];
    var reader = new FileReader();
    
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var fileName = file.name;
        var lowerName = fileName.toLowerCase();
        var ext = lowerName.split(".").pop();
        var imgWidth = img.naturalWidth;
        var imgHeight = img.naturalHeight;
        var fileSize = file.size;
        
        totalChecked++;
        
        // 检查每个规则
        for (var r = 0; r < presetRules.length; r++) {
          var rule = presetRules[r];
          var matched = false;
          
          // 文件大小规则对所有图片生效
          if (rule.type === "filesize") {
            matched = true;
          } else {
            // 根据文件名关键词匹配（不区分大小写）
            matched = matchFileName(fileName, rule.keywords);
          }
          
          if (matched) {
            var rulePass = false;
            var detailInfo = "";
            
            if (rule.type === "filesize") {
              rulePass = fileSize < rule.size;
              detailInfo = hSize(fileSize) + " / 4MB";
            } else if (rule.type === "width") {
              var fmtOk = rule.formats.includes(ext);
              rulePass = imgWidth > rule.width && fmtOk;
              detailInfo = imgWidth + "px宽 / 720px+" + (fmtOk ? " ✓格式" : " ✗格式错误");
            } else if (rule.type === "landscape") {
              var fmtOk = rule.formats.includes(ext);
              var sizeOk = imgWidth > rule.width && imgHeight > rule.height;
              rulePass = sizeOk && fmtOk;
              detailInfo = imgWidth + "×" + imgHeight + " / " + (rule.width+1) + "×" + (rule.height+1) + "+" + (fmtOk ? " ✓格式" : " ✗格式错误");
            } else if (rule.type === "portrait") {
              var fmtOk = rule.formats.includes(ext);
              var sizeOk = imgWidth > rule.width && imgHeight > rule.height;
              rulePass = sizeOk && fmtOk;
              detailInfo = imgWidth + "×" + imgHeight + " / " + (rule.width+1) + "×" + (rule.height+1) + "+" + (fmtOk ? " ✓格式" : " ✗格式错误");
            } else if (rule.type === "square") {
              var fmtOk = rule.formats.includes(ext);
              var sizeOk = imgWidth > rule.width && imgHeight > rule.height;
              rulePass = sizeOk && fmtOk;
              detailInfo = imgWidth + "×" + imgHeight + " / " + (rule.width+1) + "×" + (rule.height+1) + "+" + (fmtOk ? " ✓格式" : " ✗格式错误");
            }
            
            results[rule.id].files.push({
              name: fileName,
              width: imgWidth,
              height: imgHeight,
              size: fileSize,
              pass: rulePass,
              info: detailInfo
            });
            
            if (rulePass) {
              results[rule.id].status = "pass";
              results[rule.id].missing = false;
              passCount++;
            } else {
              results[rule.id].status = "fail";
              results[rule.id].missing = false;
              failCount++;
            }
            
            if (rule.type !== "filesize") {
              allDetails.push({
                ruleId: rule.id,
                ruleName: rule.name,
                file: fileName,
                pass: rulePass,
                info: detailInfo
              });
            }
          }
        }
        
        // 文件大小规则也加入详情
        var sizeRule = results["size"];
        if (sizeRule.files.length > 0) {
          var lastSizeFile = sizeRule.files[sizeRule.files.length - 1];
          allDetails.push({
            ruleId: "size",
            ruleName: "文件大小",
            file: fileName,
            pass: lastSizeFile.pass,
            info: lastSizeFile.info
          });
        }
        
        // 实时更新UI
        updateCheckModalUI(results, totalChecked, passCount, failCount);
        
        processedCount++;
        processNextFile();
      };
      img.onerror = function() {
        processedCount++;
        processNextFile();
      };
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      processedCount++;
      processNextFile();
    };
    
    reader.readAsDataURL(file);
  }
  
  processNextFile();
  status("正在检查 " + imageFiles.length + " 个图片文件...");
}

// 实时更新检查模态框UI
function updateCheckModalUI(results, total, pass, fail) {
  // 更新状态标签
  for (var id in results) {
    var iconEl = $("#ci-" + id);
    var statusEl = $("#cs-" + id);
    if (!iconEl || !statusEl) continue;
    
    var result = results[id];
    if (result.files.length > 0) {
      var hasFail = result.files.some(function(f) { return !f.pass; });
      if (hasFail) {
        iconEl.className = "check-icon fail";
        iconEl.textContent = "✗";
        statusEl.className = "check-status fail";
        statusEl.textContent = "部分不通过";
      } else {
        iconEl.className = "check-icon ok";
        iconEl.textContent = "✓";
        statusEl.className = "check-status pass";
        statusEl.textContent = "全部通过";
      }
    } else {
      iconEl.className = "check-icon miss";
      iconEl.textContent = "?";
      statusEl.className = "check-status miss";
      statusEl.textContent = "未找到";
    }
  }
  
  // 更新统计
  $("#ccCount").textContent = total;
  $("#ccPass").textContent = pass;
  $("#ccFail").textContent = fail;
  
  // 计算缺失数量
  var missingCount = 0;
  for (var rid in results) {
    if (rid !== "size" && results[rid].missing) {
      missingCount++;
    }
  }
  $("#ccMiss").textContent = missingCount;
}

// 显示最终检查结果
function displayCheckModalResults(results, total, pass, fail, details) {
  updateCheckModalUI(results, total, pass, fail);
  
  // 显示详细报告
  if (details.length > 0) {
    $("#checkDetailSection").style.display = "block";
    var detailList = $("#checkDetailList2");
    detailList.innerHTML = "";
    
    for (var i = 0; i < details.length; i++) {
      var d = details[i];
      var item = document.createElement("div");
      item.className = "check-detail-item " + (d.pass ? "pass" : "fail");
      item.innerHTML = 
        '<span style="font-weight:600;min-width:60px;font-size:10px;color:var(--text-muted);">' + d.ruleName + '</span>' +
        '<span class="cdi-name">' + d.file + '</span>' +
        '<span class="cdi-status">' + (d.pass ? "✓" : "✗") + '</span>';
      item.title = d.info;
      detailList.appendChild(item);
    }
  }
  
  // 显示导出按钮
  $("#checkExportBtn").style.display = "inline-flex";
  
  presetCheckData.results = results;
  
  if (fail > 0) {
    toast("检查完成：发现 " + fail + " 个问题", "er");
  } else {
    toast("所有图片检查通过！", "ok");
  }
  
  status("就绪");
}

// 导出检测报告
$("#checkExportBtn").onclick = function() {
  var results = presetCheckData.results;
  var details = [];
  
  details.push("=== 图片尺寸预设检查报告 ===\n");
  details.push("检查时间：" + new Date().toLocaleString() + "\n");
  details.push("文件夹：" + presetCheckData.folderPath + "\n");
  details.push("\n--- 检查结果汇总 ---\n");
  
  for (var i = 0; i < presetRules.length; i++) {
    var rule = presetRules[i];
    var result = results[rule.id];
    if (!result) continue;
    
    var statusText = "未找到匹配文件";
    if (result.files.length > 0) {
      var hasFail = result.files.some(function(f) { return !f.pass; });
      statusText = hasFail ? "部分不通过" : "全部通过";
    }
    
    details.push("\n【" + rule.name + "】");
    details.push("状态：" + statusText);
    details.push("要求：" + getRuleDescription(rule));
    details.push("检测到文件：");
    
    if (result.files.length > 0) {
      for (var j = 0; j < result.files.length; j++) {
        var f = result.files[j];
        details.push("  - " + f.name + " | " + f.info + " | " + (f.pass ? "✓ 通过" : "✗ 不通过"));
      }
    } else {
      details.push("  （无匹配文件）");
    }
  }
  
  // 创建下载
  var blob = new Blob([details.join("\n")], { type: "text/plain;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "图片检查报告_" + Date.now() + ".txt";
  a.click();
  URL.revokeObjectURL(url);
  
  toast("报告已导出", "ok");
};

function getRuleDescription(rule) {
  if (rule.type === "filesize") {
    return "文件大小 < 4MB";
  } else if (rule.type === "width") {
    return "宽度 > " + rule.width + "px | PNG格式";
  } else if (rule.type === "landscape") {
    return "宽 > " + rule.width + " 且 高 > " + rule.height + " | JPG/PNG格式";
  } else if (rule.type === "portrait") {
    return "宽 > " + rule.width + " 且 高 > " + rule.height + " | JPG/PNG格式";
  } else if (rule.type === "square") {
    return "宽 > " + rule.width + " 且 高 > " + rule.height + " | JPG/PNG格式";
  }
  return "";
}

// ============ 初始化 ============
function init(){
  bindEvents();
  loadPrefs();
  status("就绪 · 拖拽图片到窗口开始");
}

// ============ 事件绑定 ============
function bindEvents(){
  // 打开/添加
  $("#btnOpen").onclick=function(){openFileDialog();};
  $("#btnAdd").onclick=function(){openFileDialog();};
  $("#fileInput").onchange=function(e){
    if(e.target.files && e.target.files.length){
      addFiles(Array.prototype.slice.call(e.target.files));
    }
  };

  // 全局拖拽
  var dm=$("#dropMask");
  document.addEventListener("dragover",function(e){
    e.preventDefault();
    dm.className="drop-mask on";
  });
  document.addEventListener("dragleave",function(e){
    if(e.relatedTarget===null || (e.clientX<=0||e.clientY<=0||e.clientX>=window.innerWidth||e.clientY>=window.innerHeight)){
      dm.className="drop-mask";
    }
  });
  document.addEventListener("drop",function(e){
    e.preventDefault();
    dm.className="drop-mask";
    if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){
      addFiles(Array.prototype.slice.call(e.dataTransfer.files));
    }
  });

  // 顶栏按钮
  $("#btnSave").onclick=function(){saveCurrent();};
  $("#btnExport").onclick=function(){switchTab("export");};

  // 工具栏按钮
  $("#tUndo").onclick=function(){undo();};
  $("#tRedo").onclick=function(){redo();};
  $("#tRL").onclick=function(){rotate(false);};
  $("#tRR").onclick=function(){rotate(true);};
  $("#tFH").onclick=function(){flip("h");};
  $("#tFV").onclick=function(){flip("v");};
  $("#tCrop").onclick=function(){toggleCrop();};
  $("#tCmp").onclick=function(){toggleCompare();};
  $("#tZoomIn").onclick=function(){zoomStep(1.2);};
  $("#tZoomOut").onclick=function(){zoomStep(0.8);};
  $("#tZoomFit").onclick=function(){fitCanvas();};

  // 缩放控件
  $("#zIn").onclick=function(){zoomStep(1.2);};
  $("#zOut").onclick=function(){zoomStep(0.8);};
  $("#zFit").onclick=function(){fitCanvas();};

  // 属性面板 Tab
  $$(".pt").forEach(function(t){
    t.onclick=function(){switchTab(t.dataset.t);};
  });

  // 格式按钮
  $$(".fmt-btn").forEach(function(b){
    b.onclick=function(){
      var p=b.parentElement;
      p.querySelectorAll(".fmt-btn").forEach(function(x){x.classList.remove("active");});
      b.classList.add("active");
      S.fmt=b.dataset.f;
      updateExportPreview();
    };
  });

  // 导出质量滑块
  $("#eQ").oninput=function(){
    S.qual=+this.value;
    $("#eQL").textContent=S.qual+"%";
    updateExportPreview();
  };
  $("#eZ").oninput=function(){
    S.eZoom=+this.value;
    $("#eZL").textContent=S.eZoom+"%";
    updateExportSize();
    updateExportPreview();
  };
  $("#eSuffix").onchange=function(){S.addSuffix=this.checked;};
  $("#eFN").oninput=function(){
    if(S.active>=0) S.files[S.active].name=this.value;
    updateFileList();
  };

  // 下载
  $("#btnDownload").onclick=function(){downloadCurrent();};
  $("#btnCopy").onclick=function(){copyToClipboard();};

  // 调整滑块
  ["Bright","Contrast","Saturate","Hue","Blur","Sharp","Opacity"].forEach(function(k){
    var el=$("#a"+k);
    var lbl=$("#a"+k+"L");
    if(el&&lbl){
      el.oninput=function(){
        S.adj[k.toLowerCase()]=+this.value;
        if(k==="Hue") lbl.textContent=this.value+"°";
        else if(k==="Blur") lbl.textContent=this.value+"px";
        else if(k==="Opacity") lbl.textContent=this.value+"%";
        else lbl.textContent=this.value;
        S.filter="custom";
        $$(".fp").forEach(function(f){f.classList.remove("active");});
        applyAdjusts();
      };
    }
  });
  $("#aReset1").onclick=function(){
    S.adj.bright=0;S.adj.contrast=0;S.adj.saturate=0;S.adj.hue=0;
    ["Bright","Contrast","Saturate","Hue"].forEach(function(k){
      var el=$("#a"+k);if(!el) return;
      el.value=0;
      var lbl=$("#a"+k+"L");
      if(lbl) lbl.textContent=(k==="Hue")?"0°":"0";
    });
    applyAdjusts();
  };
  $("#aResetAll").onclick=function(){
    Object.keys(S.adj).forEach(function(k){
      S.adj[k]=(k==="opacity")?100:0;
    });
    updateAdjSliders();
    S.filter="none";
    setFilterPreset("none");
    applyAdjusts();
    toast("已全部重置","ok");
  };

  // 滤镜预设
  $$(".fp").forEach(function(f){
    f.onclick=function(){setFilterPreset(f.dataset.f);};
  });

  // 裁剪比例预设
  $$(".cr-preset").forEach(function(p){
    p.onclick=function(){
      $$(".cr-preset").forEach(function(x){x.classList.remove("active");});
      p.classList.add("active");
      S.cropRatio=p.dataset.r;
      if(S.cropOn) resetCropBox();
    };
  });

  // 尺寸面板
  $("#sLock").onclick=function(){
    S.lockRatio=!S.lockRatio;
    this.textContent=S.lockRatio?"🔒":"🔓";
    toast(S.lockRatio?"已锁定比例":"已解锁比例","ok");
  };
  $("#sPct").oninput=function(){
    $("#sPctL").textContent=this.value+"%";
    if(S.active<0) return;
    var f=S.files[S.active];
    var img=f.origImg;
    var pct=+this.value/100;
    $("#sW").value=Math.round(img.naturalWidth*pct);
    $("#sH").value=Math.round(img.naturalHeight*pct);
  };
  $("#sW").oninput=function(){
    if(!S.lockRatio||S.active<0) return;
    var f=S.files[S.active];
    var r=f.origImg.naturalHeight/f.origImg.naturalWidth;
    $("#sH").value=Math.round(+this.value*r);
    updatePctFromSize();
  };
  $("#sH").oninput=function(){
    if(!S.lockRatio||S.active<0) return;
    var f=S.files[S.active];
    var r=f.origImg.naturalWidth/f.origImg.naturalHeight;
    $("#sW").value=Math.round(+this.value*r);
    updatePctFromSize();
  };
  function updatePctFromSize(){
    if(S.active<0) return;
    var f=S.files[S.active];
    var w=+$("#sW").value||1;
    var pct=Math.round(w/f.origImg.naturalWidth*100);
    $("#sPct").value=pct;
    $("#sPctL").textContent=pct+"%";
  }
  $("#sApply").onclick=function(){resizeImage();};
  $("#sHalf").onclick=function(){setSizePct(50);};
  $("#sQuarter").onclick=function(){setSizePct(25);};
  $("#sDouble").onclick=function(){setSizePct(200);};
  $$("[data-sw]").forEach(function(b){
    b.onclick=function(){
      $("#sW").value=b.dataset.sw;
      $("#sH").value=b.dataset.sh;
      updatePctFromSize();
    };
  });
  function setSizePct(p){
    $("#sPct").value=p;
    $("#sPct").oninput();
  }

  // 画布鼠标滚轮缩放
  $("#canvas").addEventListener("wheel",function(e){
    if(!S.files[S.active]) return;
    e.preventDefault();
    var delta=e.deltaY<0?1.1:0.9;
    zoomStep(delta);
  },{passive:false});

  // 画布平移
  var cw=$("#canvasWrap");
  var isPanning=false, panStart={x:0,y:0}, panOrig={x:0,y:0};
  cw.addEventListener("mousedown",function(e){
    if(S.cropOn||S.active<0) return;
    if(e.button!==1&&!e.altKey&&!e.spaceBar) return;
    isPanning=true;
    panStart.x=e.clientX;panStart.y=e.clientY;
    panOrig.x=S.pan.x;panOrig.y=S.pan.y;
    cw.style.cursor="grabbing";
  });
  document.addEventListener("mousemove",function(e){
    if(!isPanning) return;
    S.pan.x=panOrig.x+(e.clientX-panStart.x);
    S.pan.y=panOrig.y+(e.clientY-panStart.y);
    updateCanvasTransform();
  });
  document.addEventListener("mouseup",function(){
    if(isPanning){isPanning=false;cw.style.cursor="";}
  });

  // 画布鼠标位置（取色）
  $("#canvas").addEventListener("mousemove",function(e){
    if(S.active<0) return;
    var p=canvasXY(e);
    $("#iX").textContent=p.x;
    $("#iY").textContent=p.y;
    try{
      var d=this.getContext("2d").getImageData(p.x,p.y,1,1).data;
      var hex="#"+[d[0],d[1],d[2]].map(function(v){return v.toString(16).padStart(2,"0");}).join("").toUpperCase();
      var a=d[3];
      $("#iC").textContent=hex+(a<255?" A:"+a:"");
    }catch(err){}
  });

  // 画布点击（裁剪）
  $("#canvas").addEventListener("mousedown",function(e){
    if(!S.cropOn||e.button!==0) return;
    var p=canvasXY(e);
    var rect=getImgRect();
    var cx=e.clientX-rect.left, cy=e.clientY-rect.top;
    S.crop={x:cx,y:cy,w:1,h:1};
    S.drag={type:"crop-new",sx:e.clientX,sy:e.clientY};
    e.preventDefault();
  });
  document.addEventListener("mousemove",function(e){
    if(S.cropOn && S.drag && S.drag.type==="crop-new"){
      var rect=getImgRect();
      var cx=e.clientX-rect.left, cy=e.clientY-rect.top;
      var sx=S.drag.sx-rect.left, sy=S.drag.sy-rect.top;
      var x=Math.min(sx,cx), y=Math.min(sy,cy);
      var w=Math.abs(cx-sx), h=Math.abs(cy-sy);
      // 比例锁定
      if(S.cropRatio!=="free"){
        var parts=S.cropRatio.split(":");
        var rr=+parts[0]/+parts[1];
        if(w/h>rr) h=w/rr; else w=h*rr;
      }
      S.crop={x:clamp(x,0,rect.width),y:clamp(y,0,rect.height),
              w:clamp(w,0,rect.width-x),h:clamp(h,0,rect.height-y)};
      updateCropBox();
    }
  });
  document.addEventListener("mouseup",function(){
    if(S.drag&&S.drag.type==="crop-new"){S.drag=null;}
  });

  // 裁剪框拖拽
  var cr=$("#cropBox");
  cr.addEventListener("mousedown",function(e){
    if(!S.cropOn) return;
    var hd=e.target.classList.contains("cr-hd")?e.target:null;
    var handle=hd?null:"move";
    if(hd){
      var cls=hd.className.split(" ");
      for(var i=0;i<cls.length;i++){
        if(cls[i]!=="cr-hd"){handle=cls[i];break;}
      }
    }
    var rect=getImgRect();
    S.drag={
      type:"crop-handle",handle:handle,
      sx:e.clientX,sy:e.clientY,
      bx:S.crop.x,by:S.crop.y,bw:S.crop.w,bh:S.crop.h
    };
    e.stopPropagation();
    e.preventDefault();
  });
  document.addEventListener("mousemove",function(e){
    if(!S.drag||S.drag.type!=="crop-handle") return;
    var dx=e.clientX-S.drag.sx, dy=e.clientY-S.drag.sy;
    var h=S.drag.handle;
    var rect=getImgRect();
    var nx=S.drag.bx, ny=S.drag.by, nw=S.drag.bw, nh=S.drag.bh;
    if(h==="move"){
      nx=clamp(S.drag.bx+dx,0,rect.width-nw);
      ny=clamp(S.drag.by+dy,0,rect.height-nh);
    } else {
      if(h.indexOf("w")>=0){var t=S.drag.bx+dx;nx=clamp(t,0,S.drag.bx+S.drag.bw-10);nw=S.drag.bx+S.drag.bw-nx;}
      if(h.indexOf("e")>=0){nw=clamp(S.drag.bw+dx,10,rect.width-S.drag.bx);}
      if(h.indexOf("n")>=0){var t2=S.drag.by+dy;ny=clamp(t2,0,S.drag.by+S.drag.bh-10);nh=S.drag.by+S.drag.bh-ny;}
      if(h.indexOf("s")>=0){nh=clamp(S.drag.bh+dy,10,rect.height-S.drag.by);}
      // 比例锁定
      if(S.cropRatio!=="free"){
        var parts=S.cropRatio.split(":");
        var rr=+parts[0]/+parts[1];
        if(nw/nh>rr){nh=nw/rr;} else {nw=nh*rr;}
      }
    }
    S.crop={x:nx,y:ny,w:nw,h:nh};
    updateCropBox();
  });
  document.addEventListener("mouseup",function(){
    if(S.drag&&S.drag.type==="crop-handle") S.drag=null;
  });

  // 双击画布确认裁剪
  $("#canvas").addEventListener("dblclick",function(){
    if(S.cropOn && S.crop.w>10 && S.crop.h>10) applyCrop();
  });
  
  // 抠图颜色选取
  $("#canvas").addEventListener("click",function(e){
    if(Cutout.pickMode) {
      handleCutoutColorPick(e);
    }
  });

  // 对比滑块
  var cmp=$("#cmpSlider");
  var cmpDrag=false;
  cmp.addEventListener("mousedown",function(e){cmpDrag=true;e.preventDefault();});
  document.addEventListener("mousemove",function(e){
    if(!cmpDrag) return;
    var rect=getImgRect();
    var pct=(e.clientX-rect.left)/rect.width*100;
    S.cmpPos=clamp(pct,0,100);
    cmp.style.left=S.cmpPos+"%";
    // 右边显示原图，左边显示处理后
    var co=$("#canvasOrig");
    co.style.clip="rect(0, 999999px, 999999px, "+(S.cmpPos*rect.width/100)+"px)";
  });
  document.addEventListener("mouseup",function(){cmpDrag=false;});

  // 右键菜单
  document.addEventListener("contextmenu",function(e){
    if(S.active<0) return;
    e.preventDefault();
    var m=$("#ctxMenu");
    m.className="ctx-menu on";
    m.style.left=e.clientX+"px";
    m.style.top=e.clientY+"px";
    var r=m.getBoundingClientRect();
    if(r.right>window.innerWidth) m.style.left=(e.clientX-r.width)+"px";
    if(r.bottom>window.innerHeight) m.style.top=(e.clientY-r.height)+"px";
  });
  document.addEventListener("click",function(){$("#ctxMenu").className="ctx-menu";});
  $$(".xi").forEach(function(i){i.onclick=function(){return;};});
  $$(".ctx-item").forEach(function(i){
    i.onclick=function(){
      var a=i.dataset.a;
      if(a==="save") saveCurrent();
      else if(a==="copy") copyToClipboard();
      else if(a==="rl") rotate(false);
      else if(a==="rr") rotate(true);
      else if(a==="fh") flip("h");
      else if(a==="fv") flip("v");
      else if(a==="crop") toggleCrop();
      else if(a==="compare") toggleCompare();
      else if(a==="undo") undo();
      else if(a==="redo") redo();
      else if(a==="zoomin") zoomStep(1.2);
      else if(a==="zoomout") zoomStep(0.8);
      else if(a==="zoomfit") fitCanvas();
      $("#ctxMenu").className="ctx-menu";
    };
  });

  // 键盘快捷键
  var spaceDown=false;
  document.addEventListener("keydown",function(e){
    if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="TEXTAREA"){
      if(e.key==="Escape") e.target.blur();
      return;
    }
    if(e.key===" ") {spaceDown=true;e.preventDefault();return;}
    var ctrl=e.ctrlKey||e.metaKey;
    if(ctrl&&e.key==="o"){e.preventDefault();openFileDialog();}
    else if(ctrl&&e.key==="s"){e.preventDefault();saveCurrent();}
    else if(ctrl&&e.key==="z"){e.preventDefault();undo();}
    else if(ctrl&&e.key==="y"){e.preventDefault();redo();}
    else if(ctrl&&e.key==="c"&&!window.getSelection().toString()){e.preventDefault();copyToClipboard();}
    else if(e.key==="q"||e.key==="Q"){rotate(false);}
    else if(e.key==="e"||e.key==="E"){rotate(true);}
    else if(e.key==="h"||e.key==="H"){flip("h");}
    else if(e.key==="v"||e.key==="V"){flip("v");}
    else if(e.key==="c"||e.key==="C"){toggleCrop();}
    else if(e.key==="d"||e.key==="D"){toggleCompare();}
    else if(e.key==="f"||e.key==="F"){fitCanvas();}
    else if(e.key==="+"){zoomStep(1.2);}
    else if(e.key==="-"){zoomStep(0.8);}
    else if(e.key==="Escape"){
      if(S.cropOn){endCrop();toast("已取消裁剪","wa");}
      else if(S.cmpMode!=="off"){toggleCompare();}
      else if(S.drawTool){setTool(null);}
    }
    else if(e.key==="p"||e.key==="P"){setTool("pen");}
    else if(e.key==="a"||e.key==="A"){setTool("arrow");}
    else if(e.key==="r"||e.key==="R"){setTool("rect");}
    else if(e.key==="o"||e.key==="O"){setTool("ellipse");}
    else if(e.key==="b"||e.key==="B"){setTool("blur");}
    else if(e.key==="t"||e.key==="T"){if(S.work){switchTab("mark");commitTextMark();}}
    else if(e.key==="Enter"){
      if(S.cropOn && S.crop.w>10 && S.crop.h>10) applyCrop();
      else if(S.drawTool) commitDraw();
    }
  });
  document.addEventListener("keyup",function(e){
    if(e.key===" ") spaceDown=false;
  });

  // 批量
  $("#btnBatch").onclick=function(){showBatchModal();};
  $("#btnClear").onclick=function(){clearAll();};
  $("#batchClose").onclick=function(){$("#batchModal").className="modal-mask";};
  $("#batchCancel").onclick=function(){$("#batchModal").className="modal-mask";};
  $("#batchStart").onclick=function(){batchExport();};
  $("#bQ").oninput=function(){$("#bQL").textContent=this.value+"%";};
  $("#bZ").oninput=function(){$("#bZL").textContent=this.value+"%";};

  // ===== 新功能：标注工具 =====
  $("#tPen").onclick=function(){setTool("pen");};
  $("#tArrow").onclick=function(){setTool("arrow");};
  $("#tRect").onclick=function(){setTool("rect");};
  $("#tEllipse").onclick=function(){setTool("ellipse");};
  $("#tBlur").onclick=function(){setTool("blur");};
  $("#tText").onclick=function(){setTool("text");};
  $("#tWatermark").onclick=function(){switchTab("mark");};

  // 颜色选择
  $$(".color-swatch[data-color]").forEach(function(s){
    s.onclick=function(){
      $$(".color-swatch[data-color]").forEach(function(x){x.classList.remove("active");});
      s.classList.add("active");
      S.mkColor=s.dataset.color;
    };
  });
  S.mkColor="#ef4444";

  // 文字颜色
  $$(".color-swatch[data-tc]").forEach(function(s){
    s.onclick=function(){
      $$(".color-swatch[data-tc]").forEach(function(x){x.classList.remove("tx-active");});
      s.classList.add("tx-active");
      S.mkTxtColor=s.dataset.tc;
    };
  });
  S.mkTxtColor="#ffffff";

  // 文字背景
  $$(".color-swatch[data-bg]").forEach(function(s){
    s.onclick=function(){
      $$(".color-swatch[data-bg]").forEach(function(x){x.style.outline="";});
      s.style.outline="2px solid var(--c-primary)";
      S.mkTxtBg=s.dataset.bg;
    };
  });
  S.mkTxtBg="none";

  // 标注滑块
  $("#mkSize").oninput=function(){
    S.mkSize=+this.value;
    $("#mkSizeL").textContent=S.mkSize;
  };
  S.mkSize=4;
  $("#mkAlpha").oninput=function(){
    S.mkAlpha=+this.value;
    $("#mkAlphaL").textContent=S.mkAlpha+"%";
  };
  S.mkAlpha=100;
  $("#mkBlur").oninput=function(){
    S.mkBlurSz=+this.value;
    $("#mkBlurL").textContent=S.mkBlurSz+"px";
  };
  S.mkBlurSz=8;
  $("#mkApply").onclick=function(){commitDraw();};
  $("#mkUndo").onclick=function(){undoDraw();};

  // 文字标注
  $("#mkTxtSz").oninput=function(){
    S.mkTxtSz=+this.value;
    $("#mkTxtSzL").textContent=S.mkTxtSz;
  };
  S.mkTxtSz=24;
  $("#mkTxtAdd").onclick=function(){commitTextMark();};

  // 水印系统
  bindWatermarkEvents();
  
  // 抠图系统
  bindCutoutEvents();

  // 智能压缩
  $("#smartCompress").onclick=function(){smartCompress();};

  // 图片拼接
  $("#stDirH").onclick=function(){
    $("#stDirH").style.cssText="flex:1;background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.3);";
    $("#stDirV").style.cssText="flex:1;";
    S.stDir="h";
  };
  $("#stDirV").onclick=function(){
    $("#stDirV").style.cssText="flex:1;background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.3);";
    $("#stDirH").style.cssText="flex:1;";
    S.stDir="v";
  };
  S.stDir="h";
  $("#stGap").oninput=function(){
    S.stGap=+this.value;
    $("#stGapL").textContent=S.stGap+"px";
  };
  S.stGap=0;
  $("#stPad").oninput=function(){
    S.stPad=+this.value;
    $("#stPadL").textContent=S.stPad+"px";
  };
  S.stPad=0;
  $("#stApply").onclick=function(){stitchImages();};

  // 画布标注绘制
  var DC=$("#drawCanvas");
  var drawCtx=DC.getContext("2d");
  var isDraw=false, drawStart={x:0,y:0}, drawPaths=[];

  DC.addEventListener("mousedown",function(e){
    if(!S.drawTool||!S.work) return;
    var p=canvasXY(e);
    isDraw=true;
    drawStart={x:p.x,y:p.y};
    drawCtx.clearRect(0,0,DC.width,DC.height);
    // 重绘已有标注
    redrawPaths();
    if(S.drawTool==="text"){
      var ti=$("#textInput");
      ti.style.display="block";
      ti.style.left=(e.clientX)+"px";
      ti.style.top=(e.clientY)+"px";
      ti.style.fontSize=S.mkTxtSz+"px";
      ti.style.color=S.mkTxtColor;
      if(S.mkTxtBg==="none") ti.style.background="transparent";
      else ti.style.background=S.mkTxtBg;
      ti.style.textShadow=S.mkTxtShadow?"2px 2px 4px rgba(0,0,0,.6)":"none";
      ti.style.webkitTextStroke=S.mkTxtStroke?"1px rgba(0,0,0,.5)":"none";
      ti.value="";
      ti.focus();
      isDraw=false;
      return;
    }
    drawCtx.beginPath();
    drawCtx.moveTo(p.x,p.y);
    if(S.drawTool==="blur"){
      drawCtx.globalAlpha=1;
      drawCtx.strokeStyle="rgba(0,0,0,0)";
      drawCtx.lineWidth=S.mkSize;
    } else {
      drawCtx.globalAlpha=S.mkAlpha/100;
      drawCtx.strokeStyle=S.mkColor;
      drawCtx.lineWidth=S.mkSize;
      drawCtx.lineCap="round";
      drawCtx.lineJoin="round";
    }
  });

  DC.addEventListener("mousemove",function(e){
    if(!isDraw||!S.work) return;
    var p=canvasXY(e);
    var tool=S.drawTool;
    drawCtx.clearRect(0,0,DC.width,DC.height);
    redrawPaths();
    if(tool==="pen"){
      drawCtx.lineTo(p.x,p.y);
      drawCtx.stroke();
    } else if(tool==="arrow"){
      drawArrow(drawCtx,drawStart.x,drawStart.y,p.x,p.y);
    } else if(tool==="rect"){
      drawCtx.beginPath();
      drawCtx.strokeRect(drawStart.x,drawStart.y,p.x-drawStart.x,p.y-drawStart.y);
    } else if(tool==="ellipse"){
      drawEllipse(drawCtx,drawStart.x,drawStart.y,p.x-drawStart.x,p.y-drawStart.y);
    } else if(tool==="blur"){
      applyBlurArea(drawCtx,drawStart.x,drawStart.y,p.x,p.y);
    }
  });

  document.addEventListener("mouseup",function(){
    if(!isDraw) return;
    isDraw=false;
    var paths=drawCtx.getImageData(0,0,DC.width,DC.height);
    drawPaths.push(paths);
    // 同步到主画布
    if(S.work){
      var mc=$("#canvas");
      var mctx=mc.getContext("2d");
      mctx.drawImage(DC,0,0);
      drawCtx.clearRect(0,0,DC.width,DC.height);
      redrawPaths();
    }
    updateHistoryList();
  });

  // 文字输入确认
  var ti=$("#textInput");
  ti.addEventListener("blur",function(){
    if(ti.style.display==="none") return;
    var txt=ti.value.trim();
    if(!txt) {ti.style.display="none";return;}
    var rect=getImgRect();
    var sx=DC.width/rect.width, sy=DC.height/rect.height;
    var x=parseFloat(ti.style.left)-rect.left;
    var y=parseFloat(ti.style.top)-rect.top;
    x=Math.round(x*sx); y=Math.round(y*sy);
    var c=$("#canvas");
    var ctx=c.getContext("2d");
    ctx.save();
    ctx.font="bold "+S.mkTxtSz+"px Microsoft YaHei,sans-serif";
    ctx.fillStyle=S.mkTxtColor;
    ctx.globalAlpha=S.mkAlpha/100;
    if(S.mkTxtShadow) ctx.shadowColor="rgba(0,0, 0, 0.6)", ctx.shadowBlur=4, ctx.shadowOffsetX=2, ctx.shadowOffsetY=2;
    if(S.mkTxtBg!=="none"){
      var m=ctx.measureText(txt);
      var pad=4;
      ctx.fillStyle=S.mkTxtBg;
      ctx.fillRect(x-pad,y-S.mkTxtSz-pad,m.width+pad*2,S.mkTxtSz+pad*2);
    }
    ctx.fillStyle=S.mkTxtColor;
    if(S.mkTxtStroke){
      ctx.strokeStyle="rgba(0,0,0,0.5)";
      ctx.lineWidth=2;
      ctx.strokeText(txt,x,y);
    }
    ctx.fillText(txt,x,y);
    ctx.restore();
    ti.style.display="none";
    ti.value="";
    updateHistoryList();
  });
  ti.addEventListener("keydown",function(e){
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ti.blur();}
    if(e.key==="Escape"){ti.value="";ti.style.display="none";}
  });

  // 窗口大小变化
  window.addEventListener("resize",function(){
    if(S.zoomFit) fitCanvas();
  });
}

// ============ 文件操作 ============
function openFileDialog(){
  $("#fileInput").value="";
  $("#fileInput").click();
}

function addFiles(fileList){
  var pending=fileList.slice();
  var count=0;
  function next(){
    if(pending.length===0){
      toast("已添加 "+count+" 张图片","ok");
      return;
    }
    var f=pending.shift();
    if(!f.type.startsWith("image/")){next();return;}
    loadImageFile(f,function(img){
      if(!img){next();return;}
      count++;
      var item={
        id:uid(),
        name:f.name.replace(/\.[^.]+$/,""),
        origImg:img,
        origSize:f.size,
        workCanvas:null,
        modified:false,
        thumb:null
      };
      // 生成工作画布副本
      var c=document.createElement("canvas");
      c.width=img.naturalWidth;c.height=img.naturalHeight;
      c.getContext("2d").drawImage(img,0,0);
      item.workCanvas=c;
      // 生成缩略图
      var tc=document.createElement("canvas");
      var tw=64,th=Math.round(64*img.naturalHeight/img.naturalWidth);
      tc.width=tw;tc.height=th;
      tc.getContext("2d").drawImage(img,0,0,tw,th);
      item.thumb=tc;

      S.files.push(item);
      if(S.active<0){
        S.active=S.files.length-1;
        loadActive();
      }
      updateFileList();
      next();
    });
  }
  next();
}

function loadImageFile(file,cb){
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){cb(img);};
    img.onerror=function(){cb(null);};
    img.src=e.target.result;
  };
  reader.onerror=function(){cb(null);};
  reader.readAsDataURL(file);
}

function updateFileList(){
  var list=$("#fileList");
  list.innerHTML="";
  S.files.forEach(function(f,i){
    var div=document.createElement("div");
    div.className="file-item"+(i===S.active?" active":"");
    div.innerHTML=
      '<div class="file-thumb"><img src="'+f.thumb.toDataURL()+'"></div>'+
      '<div class="file-info"><div class="file-name">'+f.name+'</div><div class="file-meta">'+f.origImg.naturalWidth+'×'+f.origImg.naturalHeight+'</div></div>'+
      '<div class="file-badge'+(f.modified?' mod':'')+'"></div>';
    div.onclick=function(){switchFile(i);};
    list.appendChild(div);
  });
  $("#fileCount").textContent=S.files.length;
}

function switchFile(i){
  if(i===S.active) return;
  // 保存当前状态
  saveCurrentState();
  S.active=i;
  loadActive();
  updateFileList();
}

function loadActive(){
  var f=S.files[S.active];
  if(!f) return;
  // 重置调整参数
  if(f.adj){
    S.adj=JSON.parse(JSON.stringify(f.adj));
    S.filter=f.filter||"none";
  } else {
    Object.keys(S.adj).forEach(function(k){S.adj[k]=(k==="opacity")?100:0;});
    S.filter="none";
  }
  updateAdjSliders();
  setFilterPreset(S.filter,true);
  renderCanvas();
  fitCanvas();
  $("#zoomCtrl").style.display="flex";
  $("#emptyState").style.display="none";
  $("#canvas").style.display="block";
  $("#iFN").value=f.name;
  $("#eFN").value=f.name;
  updateInfo();
  updateExportSize();
  updateExportPreview();
  // 尺寸面板
  $("#sW").value=f.origImg.naturalWidth;
  $("#sH").value=f.origImg.naturalHeight;
}

function saveCurrentState(){
  var f=S.files[S.active];
  if(!f) return;
  f.adj=JSON.parse(JSON.stringify(S.adj));
  f.filter=S.filter;
}

function clearAll(){
  if(S.files.length===0) return;
  S.files=[];
  S.active=-1;
  $("#canvas").style.display="none";
  $("#canvasOrig").style.display="none";
  $("#emptyState").style.display="flex";
  $("#zoomCtrl").style.display="none";
  $("#cropBox").className="crop-box";
  S.cropOn=false;
  S.cmpMode="off";
  updateFileList();
  toast("已清空","ok");
}

// ============ 画布渲染 ============
function renderCanvas(){
  var f=S.files[S.active];
  if(!f) return;
  var c=$("#canvas");
  var src=f.workCanvas;
  c.width=src.width;
  c.height=src.height;
  var ctx=c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  
  // 根据对比模式决定显示内容
  var showOriginal = (S.cmpMode === "flash" && flashState === "original");
  
  if (S.cmpMode === "side") {
    // 并排对比模式：左处理，右原始
    var halfW = Math.floor(c.width / 2);
    // 左侧：处理后
    ctx.filter=getFilterString();
    ctx.globalAlpha=S.adj.opacity/100;
    ctx.drawImage(src, 0, 0, halfW, c.height, 0, 0, halfW, c.height);
    ctx.filter="none";
    ctx.globalAlpha=1;
    // 右侧：原图
    ctx.drawImage(f.origImg, halfW, 0, halfW, c.height, halfW, 0, halfW, c.height);
    // 中间分割线
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, c.height);
    ctx.stroke();
  } else if (showOriginal) {
    // 闪烁模式：显示原图
    ctx.drawImage(f.origImg, 0, 0);
  } else {
    // 正常显示处理后图片
    ctx.filter=getFilterString();
    ctx.globalAlpha=S.adj.opacity/100;
    ctx.drawImage(src,0,0);
    ctx.filter="none";
    ctx.globalAlpha=1;
  }
  
  // 原图对比（分割模式）
  var co=$("#canvasOrig");
  co.width=src.width;co.height=src.height;
  co.getContext("2d").drawImage(f.origImg,0,0);
  co.style.display=S.cmpMode==="split"?"block":"none";
  $("#cmpSlider").style.display=S.cmpMode==="split"?"block":"none";
  if(S.cmpMode==="split"){
    co.style.clip="rect(0,999999px,999999px,"+(S.cmpPos*co.width/100)+"px)";
  }
  // 更新工具按钮状态
  $("#tCmp").classList.toggle("active",S.cmpMode!=="off");
  $("#tCrop").classList.toggle("active",S.cropOn);
}

function getFilterString(){
  var f=[];
  if(S.adj.bright!==0) f.push("brightness("+(100+S.adj.bright)+"%)");
  if(S.adj.contrast!==0) f.push("contrast("+(100+S.adj.contrast)+"%)");
  if(S.adj.saturate!==0) f.push("saturate("+(100+S.adj.saturate)+"%)");
  if(S.adj.hue!==0) f.push("hue-rotate("+S.adj.hue+"deg)");
  if(S.adj.blur>0) f.push("blur("+S.adj.blur+"px)");
  if(S.adj.sharp>0) f.push("contrast("+(100+S.adj.sharp/2)+"%)");
  return f.length?f.join(" "):"none";
}

function applyAdjusts(){
  renderCanvas();
  if(S.active>=0){
    S.files[S.active].modified=true;
    updateFileList();
  }
  updateExportPreview();
}

function updateAdjSliders(){
  var map={bright:"Bright",contrast:"Contrast",saturate:"Saturate",hue:"Hue",blur:"Blur",sharp:"Sharp",opacity:"Opacity"};
  Object.keys(map).forEach(function(k){
    var el=$("#a"+map[k]);
    var lbl=$("#a"+map[k]+"L");
    if(el) el.value=S.adj[k];
    if(lbl){
      if(k==="hue") lbl.textContent=S.adj[k]+"°";
      else if(k==="blur") lbl.textContent=S.adj[k]+"px";
      else if(k==="opacity") lbl.textContent=S.adj[k]+"%";
      else lbl.textContent=S.adj[k];
    }
  });
}

function setFilterPreset(name, skipRender){
  $$(".fp").forEach(function(f){f.classList.toggle("active",f.dataset.f===name);});
  S.filter=name;
  if(name==="none"){
    S.adj={bright:0,contrast:0,saturate:0,hue:0,blur:0,sharp:0,opacity:100};
  } else if(name==="gray"){
    S.adj={bright:0,contrast:0,saturate:-100,hue:0,blur:0,sharp:0,opacity:100};
  } else if(name==="sepia"){
    S.adj={bright:5,contrast:0,saturate:-30,hue:30,blur:0,sharp:0,opacity:100};
  } else if(name==="invert"){
    // invert 用 CSS 滤镜直接应用
    S.adj={bright:0,contrast:0,saturate:0,hue:180,blur:0,sharp:0,opacity:100};
  } else if(name==="warm"){
    S.adj={bright:10,contrast:5,saturate:20,hue:-15,blur:0,sharp:0,opacity:100};
  } else if(name==="cool"){
    S.adj={bright:0,contrast:5,saturate:10,hue:15,blur:0,sharp:0,opacity:100};
  } else if(name==="vivid"){
    S.adj={bright:10,contrast:20,saturate:50,hue:0,blur:0,sharp:20,opacity:100};
  } else if(name==="fade"){
    S.adj={bright:15,contrast:-20,saturate:-10,hue:0,blur:0,sharp:0,opacity:100};
  }
  updateAdjSliders();
  if(!skipRender) applyAdjusts();
}

// ============ 信息面板 ============
function updateInfo(){
  var f=S.files[S.active];
  if(!f) return;
  var c=$("#canvas");
  $("#iW").textContent=c.width;
  $("#iH").textContent=c.height;
  $("#iR").textContent=ratioStr(c.width,c.height);
  $("#iO").textContent=f.origImg.naturalWidth+"×"+f.origImg.naturalHeight;
  $("#iFS").textContent=hSize(f.origSize);
}

// ============ 画布坐标 ============
function getImgRect(){
  var c=$("#canvas");
  return c.getBoundingClientRect();
}
function canvasXY(e){
  var r=getImgRect();
  return {
    x:Math.round((e.clientX-r.left)*(r.width>0?$("#canvas").width/r.width:1)),
    y:Math.round((e.clientY-r.top)*(r.height>0?$("#canvas").height/r.height:1))
  };
}

// ============ 缩放/平移 ============
function zoomStep(factor){
  S.zoomFit=false;
  S.zoom=clamp(S.zoom*factor,0.05,20);
  updateCanvasTransform();
}
function fitCanvas(){
  var f=S.files[S.active];
  if(!f) return;
  var wrap=$("#canvasWrap");
  var w=wrap.clientWidth-40, h=wrap.clientHeight-40;
  var iw=f.workCanvas.width, ih=f.workCanvas.height;
  S.zoom=Math.min(w/iw, h/ih);
  S.zoomFit=true;
  S.pan={x:0,y:0};
  updateCanvasTransform();
}
function updateCanvasTransform(){
  var c=$("#canvas");
  var co=$("#canvasOrig");
  c.style.transform="translate("+S.pan.x+"px,"+S.pan.y+"px) scale("+S.zoom+")";
  co.style.transform="translate("+S.pan.x+"px,"+S.pan.y+"px) scale("+S.zoom+")";
  var z=Math.round(S.zoom*100);
  $("#zoomVal").textContent=z+"%";
  // 同步裁剪框
  if(S.cropOn) updateCropBox();
}

// ============ 旋转/翻转 ============
function pushUndo(){
  var f=S.files[S.active];
  if(!f) return;
  var c=document.createElement("canvas");
  c.width=f.workCanvas.width;c.height=f.workCanvas.height;
  c.getContext("2d").drawImage(f.workCanvas,0,0);
  S.undoStack.push({canvas:c,adj:JSON.parse(JSON.stringify(S.adj)),filter:S.filter});
  if(S.undoStack.length>50) S.undoStack.shift();
  S.redoStack=[];
}
function undo(){
  if(S.undoStack.length===0){toast("没有可撤销的操作","wa");return;}
  var f=S.files[S.active];
  if(!f) return;
  // 保存当前到 redo
  var cur=document.createElement("canvas");
  cur.width=f.workCanvas.width;cur.height=f.workCanvas.height;
  cur.getContext("2d").drawImage(f.workCanvas,0,0);
  S.redoStack.push({canvas:cur,adj:JSON.parse(JSON.stringify(S.adj)),filter:S.filter});
  // 恢复
  var u=S.undoStack.pop();
  f.workCanvas=u.canvas;
  S.adj=JSON.parse(JSON.stringify(u.adj));
  S.filter=u.filter;
  updateAdjSliders();
  setFilterPreset(S.filter,true);
  renderCanvas();
  fitCanvas();
  toast("已撤销","ok");
}
function redo(){
  if(S.redoStack.length===0){toast("没有可重做的操作","wa");return;}
  var f=S.files[S.active];
  if(!f) return;
  var cur=document.createElement("canvas");
  cur.width=f.workCanvas.width;cur.height=f.workCanvas.height;
  cur.getContext("2d").drawImage(f.workCanvas,0,0);
  S.undoStack.push({canvas:cur,adj:JSON.parse(JSON.stringify(S.adj)),filter:S.filter});
  var r=S.redoStack.pop();
  f.workCanvas=r.canvas;
  S.adj=JSON.parse(JSON.stringify(r.adj));
  S.filter=r.filter;
  updateAdjSliders();
  setFilterPreset(S.filter,true);
  renderCanvas();
  fitCanvas();
  toast("已重做","ok");
}

function rotate(right){
  if(S.active<0) return;
  pushUndo();
  var f=S.files[S.active];
  var src=f.workCanvas;
  var c=document.createElement("canvas");
  c.width=src.height;c.height=src.width;
  var ctx=c.getContext("2d");
  ctx.save();
  ctx.translate(c.width/2,c.height/2);
  ctx.rotate((right?90:-90)*Math.PI/180);
  ctx.drawImage(src,-src.width/2,-src.height/2);
  ctx.restore();
  f.workCanvas=c;
  // 重新生成缩略图
  var tc=document.createElement("canvas");
  var tw=64,th=Math.round(64*c.height/c.width);
  tc.width=tw;tc.height=th;
  tc.getContext("2d").drawImage(c,0,0,tw,th);
  f.thumb=tc;
  f.modified=true;
  renderCanvas();
  fitCanvas();
  updateInfo();
  updateFileList();
  status("已"+(right?"右":"左")+"旋转 90°");
}

function flip(dir){
  if(S.active<0) return;
  pushUndo();
  var f=S.files[S.active];
  var src=f.workCanvas;
  var c=document.createElement("canvas");
  c.width=src.width;c.height=src.height;
  var ctx=c.getContext("2d");
  ctx.save();
  if(dir==="h"){ctx.translate(src.width,0);ctx.scale(-1,1);}
  else{ctx.translate(0,src.height);ctx.scale(1,-1);}
  ctx.drawImage(src,0,0);
  ctx.restore();
  f.workCanvas=c;
  f.modified=true;
  renderCanvas();
  fitCanvas();
  updateFileList();
  status("已"+(dir==="h"?"水平":"垂直")+"翻转");
}

// ============ 裁剪 ============
function toggleCrop(){
  if(S.active<0) return;
  if(S.cropOn) endCrop();
  else startCrop();
}
function startCrop(){
  S.cropOn=true;
  $("#tCrop").classList.add("active");
  resetCropBox();
  status("拖动鼠标选择裁剪区域，Enter 确认，Esc 取消");
}
function endCrop(){
  S.cropOn=false;
  $("#tCrop").classList.remove("active");
  $("#cropBox").className="crop-box";
  status("就绪");
}
function resetCropBox(){
  var f=S.files[S.active];
  if(!f) return;
  var rect=getImgRect();
  var w=rect.width*0.6,h=rect.height*0.6;
  if(S.cropRatio!=="free"){
    var parts=S.cropRatio.split(":");
    var rr=+parts[0]/+parts[1];
    if(w/h>rr) h=w/rr; else w=h*rr;
  }
  S.crop={x:(rect.width-w)/2,y:(rect.height-h)/2,w:w,h:h};
  updateCropBox();
}
function updateCropBox(){
  var box=$("#cropBox");
  box.className="crop-box on";
  var rect=getImgRect();
  var wrapRect=$("#canvasWrap").getBoundingClientRect();
  // 画布相对于 wrap 的偏移 + 缩放
  var sx=rect.width/$("#canvas").width;
  var sy=rect.height/$("#canvas").height;
  // 使用 CSS 定位在 canvas-wrap 内
  var cx=(rect.left-wrapRect.left)/S.zoom+S.pan.x;
  var cy=(rect.top-wrapRect.top)/S.zoom+S.pan.y;
  var cw=S.crop.w/S.zoom;
  var ch=S.crop.h/S.zoom;
  box.style.left=(cx+S.crop.x/S.zoom)+"px";
  box.style.top=(cy+S.crop.y/S.zoom)+"px";
  box.style.width=cw+"px";
  box.style.height=ch+"px";
  // 实际像素
  var sx2=$("#canvas").width/rect.width;
  var pw=Math.round(S.crop.w*sx2);
  var ph=Math.round(S.crop.h*sy);
  $("#cropInfo").textContent=pw+" × "+ph;
}
function applyCrop(){
  if(!S.cropOn||S.active<0) return;
  pushUndo();
  var f=S.files[S.active];
  var rect=getImgRect();
  var sx=f.workCanvas.width/rect.width;
  var sy=f.workCanvas.height/rect.height;
  var x=Math.round(S.crop.x*sx);
  var y=Math.round(S.crop.y*sy);
  var w=Math.round(S.crop.w*sx);
  var h=Math.round(S.crop.h*sy);
  x=clamp(x,0,f.workCanvas.width);
  y=clamp(y,0,f.workCanvas.height);
  w=clamp(w,1,f.workCanvas.width-x);
  h=clamp(h,1,f.workCanvas.height-y);
  var c=document.createElement("canvas");
  c.width=w;c.height=h;
  c.getContext("2d").drawImage(f.workCanvas,x,y,w,h,0,0,w,h);
  f.workCanvas=c;
  // 缩略图
  var tc=document.createElement("canvas");
  var tw=64,th=Math.round(64*c.height/c.width);
  tc.width=tw;tc.height=th;
  tc.getContext("2d").drawImage(c,0,0,tw,th);
  f.thumb=tc;
  f.modified=true;
  endCrop();
  renderCanvas();
  fitCanvas();
  updateInfo();
  updateFileList();
  toast("裁剪完成: "+w+"×"+h,"ok");
  status("裁剪完成");
}

// ============ 对比 ============
function toggleCompare() {
  if (S.active < 0) return;
  
  var modes = ["off", "split", "flash", "side"];
  var currentIdx = modes.indexOf(S.cmpMode);
  var nextIdx = (currentIdx + 1) % modes.length;
  S.cmpMode = modes[nextIdx];
  
  if (S.cmpMode === "split") {
    $("#cmpSlider").style.left = "50%";
    $("#cmpSlider").style.display = "block";
    S.cmpPos = 50;
    stopFlashCompare();
    status("对比模式：左右分割 (D键切换)");
  } else if (S.cmpMode === "flash") {
    $("#cmpSlider").style.display = "none";
    startFlashCompare();
    status("对比模式：闪烁切换 (D键切换)");
  } else if (S.cmpMode === "side") {
    $("#cmpSlider").style.display = "none";
    stopFlashCompare();
    status("对比模式：并排显示 (D键切换)");
  } else {
    $("#cmpSlider").style.display = "none";
    stopFlashCompare();
    status("已退出对比模式");
  }
  
  renderCanvas();
}

// 闪烁对比计时器
var flashTimer = null;
var flashState = "processed"; // processed / original

function startFlashCompare() {
  if (flashTimer) clearInterval(flashTimer);
  flashState = "processed";
  flashTimer = setInterval(function() {
    flashState = (flashState === "processed") ? "original" : "processed";
    renderCanvas();
  }, 800);
}

function stopFlashCompare() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
}

// ============ 尺寸调整 ============
function resizeImage(){
  if(S.active<0) return;
  var w=Math.round(+$("#sW").value);
  var h=Math.round(+$("#sH").value);
  if(!w||!h||w<1||h<1){toast("请输入有效尺寸","er");return;}
  pushUndo();
  var f=S.files[S.active];
  var c=document.createElement("canvas");
  c.width=w;c.height=h;
  var ctx=c.getContext("2d");
  var algo=$("#sAlgo").value;
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  if(algo==="pixelated") ctx.imageSmoothingEnabled=false;
  ctx.drawImage(f.workCanvas,0,0,w,h);
  f.workCanvas=c;
  var tc=document.createElement("canvas");
  var tw=64,th=Math.round(64*c.height/c.width);
  tc.width=tw;tc.height=th;
  tc.getContext("2d").drawImage(c,0,0,tw,th);
  f.thumb=tc;
  f.modified=true;
  renderCanvas();
  fitCanvas();
  updateInfo();
  updateFileList();
  toast("已调整为 "+w+"×"+h,"ok");
  status("尺寸调整完成");
}

// ============ 导出 ============
function getExportCanvas(){
  var f=S.files[S.active];
  if(!f) return null;
  var w=Math.round(f.workCanvas.width*S.eZoom/100);
  var h=Math.round(f.workCanvas.height*S.eZoom/100);
  w=Math.max(1,w);h=Math.max(1,h);
  var c=document.createElement("canvas");
  c.width=w;c.height=h;
  var ctx=c.getContext("2d");
  ctx.filter=getFilterString();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(f.workCanvas,0,0,w,h);
  ctx.filter="none";
  return c;
}

function updateExportSize(){
  var f=S.files[S.active];
  if(!f) return;
  var w=Math.round(f.workCanvas.width*S.eZoom/100);
  var h=Math.round(f.workCanvas.height*S.eZoom/100);
  $("#eOW").textContent=w;
  $("#eOH").textContent=h;
}

function updateExportPreview(){
  var f=S.files[S.active];
  if(!f) return;
  var c=getExportCanvas();
  if(!c) return;
  var mime="image/"+S.fmt;
  var q=(S.fmt==="png")?undefined:S.qual/100;
  // 用缩略图预估大小（避免大图慢）
  var tc=document.createElement("canvas");
  var tw=200,th=Math.round(200*c.height/c.width);
  tc.width=tw;tc.height=th;
  tc.getContext("2d").drawImage(c,0,0,tw,th);
  var url=tc.toDataURL(mime,q);
  var est=estimateSize(c.width,c.height,tw,th,dataUrlSize(url));
  $("#iES").textContent="~"+hSize(est);
  $("#pESize").textContent="~"+hSize(est);
  var pct=clamp(est/f.origSize*100,0,100);
  var cls="";
  if(est<f.origSize*0.5) cls="";
  else if(est<f.origSize) cls="warn";
  else cls="err";
  $("#sizeFill").style.width=pct+"%";
  $("#sizeFill").className="size-bar-fill "+cls;
  $("#pEBar").style.width=pct+"%";
  $("#pEBar").className="size-bar-fill "+cls;
}

function dataUrlSize(url){
  var p=url.split(",")[1]||"";
  return Math.round(p.length*3/4);
}
function estimateSize(w,h,tw,th,sz){
  // 简单按面积比例估算
  return Math.round(sz*(w*h)/(tw*th));
}

function downloadCurrent(){
  if(S.active<0){toast("请先打开图片","wa");return;}
  var c=getExportCanvas();
  if(!c) return;
  var mime="image/"+S.fmt;
  var q=(S.fmt==="png")?undefined:S.qual/100;
  var url=c.toDataURL(mime,q);
  var a=document.createElement("a");
  var ext=(S.fmt==="jpeg")?"jpg":S.fmt;
  var name=$("#eFN").value||"image";
  if(S.addSuffix) name+="_"+c.width+"x"+c.height;
  a.download=name+"."+ext;
  a.href=url;
  a.click();
  status("已导出 "+c.width+"×"+c.height+" · "+S.fmt.toUpperCase());
  toast("下载中...","ok");
}

function copyToClipboard(){
  if(S.active<0){toast("请先打开图片","wa");return;}
  var c=getExportCanvas();
  if(!c) return;
  try{
    c.toBlob(function(blob){
      if(!blob){toast("复制失败","er");return;}
      try{
        var item=new ClipboardItem({"image/png":blob});
        navigator.clipboard.write([item]).then(function(){
          toast("已复制到剪贴板","ok");
        }).catch(function(){
          toast("复制失败：浏览器不支持","er");
        });
      }catch(err){
        // fallback: 下载
        toast("浏览器不支持直接复制，已改为下载","wa");
        var a=document.createElement("a");
        a.download="image.png";
        a.href=c.toDataURL("image/png");
        a.click();
      }
    },"image/png");
  }catch(err){
    toast("复制失败","er");
  }
}

function saveCurrent(){downloadCurrent();}

// ============ Tab 切换 ============
function switchTab(name){
  $$(".pt").forEach(function(t){t.classList.toggle("active",t.dataset.t===name);});
  ["info","adjust","size","export"].forEach(function(t){
    $("#p-"+t).style.display=(t===name)?"block":"none";
  });
}

// ============ 批量导出 ============
function showBatchModal(){
  if(S.files.length===0){toast("请先添加图片","wa");return;}
  var m=$("#batchModal");
  m.className="modal-mask on";
  var list=$("#batchList");
  list.innerHTML="";
  S.files.forEach(function(f,i){
    var div=document.createElement("div");
    div.className="bi";
    div.innerHTML='<span class="bn">'+f.name+'</span><span class="bs">'+f.origImg.naturalWidth+'×'+f.origImg.naturalHeight+'</span><span class="bf" id="bs'+i+'"></span>';
    list.appendChild(div);
  });
}

function batchExport(){
  var fmt=S.fmt;
  var qual=S.qual;
  var z=+$("#bZ").value/100;
  var nm=$("#bName").value;
  var total=S.files.length, done=0;
  $("#batchProgressWrap").style.display="block";

  function doNext(i){
    if(i>=total){
      $("#batchProgress").style.width="100%";
      setTimeout(function(){
        $("#batchModal").className="modal-mask";
        $("#batchProgressWrap").style.display="none";
        $("#batchProgress").style.width="0%";
        toast("批量导出完成: "+total+" 张","ok");
      },500);
      return;
    }
    var f=S.files[i];
    setTimeout(function(){
      try{
        var w=Math.round(f.workCanvas.width*z);
        var h=Math.round(f.workCanvas.height*z);
        w=Math.max(1,w);h=Math.max(1,h);
        var c=document.createElement("canvas");
        c.width=w;c.height=h;
        c.getContext("2d").drawImage(f.workCanvas,0,0,w,h);
        var mime="image/"+fmt;
        var q=(fmt==="png")?undefined:qual/100;
        var url=c.toDataURL(mime,q);
        var ext=(fmt==="jpeg")?"jpg":fmt;
        var fname;
        if(nm==="orig") fname=f.name+"."+ext;
        else if(nm==="suffix") fname=f.name+"_"+w+"x"+h+"."+ext;
        else fname=String(i+1).padStart(3,"0")+"."+ext;
        var a=document.createElement("a");
        a.download=fname;
        a.href=url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        $("#bs"+i).textContent="✓";
        $("#bs"+i).className="bf";
      }catch(err){
        $("#bs"+i).textContent="✗";
        $("#bs"+i).className="be";
      }
      done++;
      $("#batchProgress").style.width=(done/total*100)+"%";
      doNext(i+1);
    },80);
  }
  doNext(0);
}

// ============ 偏好存储 ============
function loadPrefs(){
  try{
    var s=localStorage.getItem("imgtool_prefs");
    if(s){
      var p=JSON.parse(s);
      if(p.fmt){S.fmt=p.fmt;$$(".fmt-btn").forEach(function(b){b.classList.toggle("active",b.dataset.f===S.fmt);});}
      if(p.qual){S.qual=p.qual;$("#eQ").value=p.qual;$("#eQL").textContent=p.qual+"%";}
    }
  }catch(e){}
}
// ===== 历史记录面板更新 =====
function updateHistoryList(){
  var list=$("#historyList");
  if(!list) return;
  list.innerHTML="";
  var all=S.undoStack.concat([{canvas:S.files[S.active]&&S.files[S.active].workCanvas?
    S.files[S.active].workCanvas:null,label:"当前"}]).concat(S.redoStack);
  all.forEach(function(h,i){
    if(!h) return;
    var div=document.createElement("div");
    div.className="hist-item";
    div.innerHTML='<span class="hi">↺</span><span class="ht">'+h.label+'</span>';
    div.onclick=function(){
      // 恢复到此步骤
      if(i<S.undoStack.length){
        S.redoStack=S.undoStack.splice(i+1).map(function(x){return x;});
        var cur=S.files[S.active];
        if(cur) cur.workCanvas=h.canvas;
        renderCanvas();
        fitCanvas();
      }
    };
    list.appendChild(div);
  });
  var cnt=(S.undoStack.length+S.redoStack.length);
  $("#histCount").textContent=cnt;
}

// ===== 标注工具 =====
function setTool(tool){
  if(!S.work) return;
  if(S.drawTool===tool){
    // 取消工具
    S.drawTool=null;
    var DC=$("#drawCanvas");
    DC.style.display="none";
    DC.className="";
    $$(".ib").forEach(function(b){b.classList.remove("active");});
    return;
  }
  S.drawTool=tool;
  var DC=$("#drawCanvas");
  var img=S.files[S.active];
  if(!img) return;
  DC.width=img.workCanvas.width;
  DC.height=img.workCanvas.height;
  DC.style.display="block";
  DC.className="draw-"+tool;
  var rect=getImgRect();
  var sx=rect.width/DC.width, sy=rect.height/DC.height;
  DC.style.width=rect.width+"px";
  DC.style.height=rect.height+"px";
  $$(".ib").forEach(function(b){b.classList.remove("active");});
  if(tool==="pen")$("#tPen").classList.add("active");
  else if(tool==="arrow")$("#tArrow").classList.add("active");
  else if(tool==="rect")$("#tRect").classList.add("active");
  else if(tool==="ellipse")$("#tEllipse").classList.add("active");
  else if(tool==="blur")$("#tBlur").classList.add("active");
  else if(tool==="text")$("#tText").classList.add("active");
  toast("标注工具已切换，Esc 退出","ok");
}

function drawArrow(ctx,x1,y1,x2,y2){
  var headLen=Math.min(20,Math.hypot(x2-x1,y2-y1)/3);
  var angle=Math.atan2(y2-y1,x2-x1);
  ctx.save();
  ctx.strokeStyle=ctx.strokeStyle||S.mkColor;
  ctx.lineWidth=S.mkSize;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
  // 箭头
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-headLen*Math.cos(angle-Math.PI/6),y2-headLen*Math.sin(angle-Math.PI/6));
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-headLen*Math.cos(angle+Math.PI/6),y2-headLen*Math.sin(angle+Math.PI/6));
  ctx.stroke();
  ctx.restore();
}

function drawEllipse(ctx,cx,cy,w,h){
  var rx=Math.abs(w/2),ry=Math.abs(h/2);
  var x=cx+Math.min(0,w),y=cy+Math.min(0,h);
  ctx.save();
  ctx.strokeStyle=ctx.strokeStyle||S.mkColor;
  ctx.lineWidth=S.mkSize;
  ctx.beginPath();
  ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
  ctx.stroke();
  ctx.restore();
}

function applyBlurArea(ctx,x1,y1,x2,y2){
  // 马赛克效果：在选定区域内降低分辨率绘制
  var src=$("#canvas");
  var block=S.mkBlurSz;
  var x=Math.min(x1,x2),y=Math.min(y1,y2);
  var w=Math.abs(x2-x1),h=Math.abs(y2-y1);
  for(var i=x;i<x+w;i+=block){
    for(var j=y;j<y+h;j+=block){
      ctx.drawImage(src,i,j,block,block,i,j,block,block);
    }
  }
}

function redrawPaths(){
  // 重绘所有已提交的标注
  drawPaths.forEach(function(path){
    if(!path) return;
    var tmp=document.createElement("canvas");
    tmp.width=path.width;tmp.height=path.height;
    tmp.getContext("2d").putImageData(path,0,0);
    var DC=$("#drawCanvas");
    DC.getContext("2d").drawImage(tmp,0,0);
  });
}

function commitDraw(){
  if(!S.work) return;
  pushUndo();
  var img=S.files[S.active];
  if(!img) return;
  var DC=$("#drawCanvas");
  var c=document.createElement("canvas");
  c.width=img.workCanvas.width;c.height=img.workCanvas.height;
  c.getContext("2d").drawImage(img.workCanvas,0,0);
  c.getContext("2d").drawImage(DC,0,0);
  img.workCanvas=c;
  img.modified=true;
  drawPaths=[];
  renderCanvas();
  updateFileList();
  updateHistoryList();
  setTool(null);
  toast("标注已应用","ok");
}

function undoDraw(){
  if(drawPaths.length===0){toast("没有可撤销的标注","wa");return;}
  drawPaths.pop();
  var DC=$("#drawCanvas");
  DC.getContext("2d").clearRect(0,0,DC.width,DC.height);
  redrawPaths();
  if(S.work){
    var img=S.files[S.active];
    if(img){
      var c=document.createElement("canvas");
      c.width=img.workCanvas.width;c.height=img.workCanvas.height;
      c.getContext("2d").drawImage(img.workCanvas,0,0);
      c.getContext("2d").drawImage(DC,0,0);
      img.workCanvas=c;
      renderCanvas();
    }
  }
  toast("已撤销标注","ok");
}

function commitTextMark(){
  if(!S.work) return;
  toast("请在画布上点击要添加文字的位置","ok");
  setTool("text");
}

// ===== 水印系统 =====
var Wm = {
  type: "tile",       // tile / single
  text: "© YourName",
  fontSize: 16,
  alpha: 15,
  color: "#ffffff",
  angle: -30,
  gap: 80,
  position: "center", // tl / tc / tr / ml / center / mr / bl / bc / br
  padding: 20,
  shadow: true,
  imgFile: null,
  imgSize: 50
};

// 水印类型切换
function bindWatermarkEvents() {
  // 类型切换
  document.querySelectorAll(".wm-type-btn").forEach(function(btn) {
    btn.onclick = function() {
      document.querySelectorAll(".wm-type-btn").forEach(function(b) { b.classList.remove("active"); });
      this.classList.add("active");
      Wm.type = this.getAttribute("data-wm");
      $("#wmTileSec").style.display = Wm.type === "tile" ? "block" : "none";
      $("#wmSingleSec").style.display = Wm.type === "single" ? "block" : "none";
    };
  });
  
  // 颜色选择
  document.querySelectorAll(".wm-color").forEach(function(sw) {
    sw.onclick = function() {
      document.querySelectorAll(".wm-color").forEach(function(s) { s.classList.remove("active"); });
      this.classList.add("active");
      Wm.color = this.getAttribute("data-wmc");
    };
  });
  
  // 位置选择
  document.querySelectorAll(".wm-pos-btn").forEach(function(btn) {
    btn.onclick = function() {
      document.querySelectorAll(".wm-pos-btn").forEach(function(b) { b.classList.remove("active"); });
      this.classList.add("active");
      Wm.position = this.getAttribute("data-pos");
    };
  });
  
  // 滑块事件
  $("#wmSz").oninput = function() { $("#wmSzL").textContent = this.value; Wm.fontSize = +this.value; };
  $("#wmAlpha").oninput = function() { $("#wmAlphaL").textContent = this.value + "%"; Wm.alpha = +this.value; };
  $("#wmAng").oninput = function() { $("#wmAngL").textContent = this.value + "°"; Wm.angle = +this.value; };
  $("#wmGap").oninput = function() { $("#wmGapL").textContent = this.value; Wm.gap = +this.value; };
  $("#wmPad").oninput = function() { $("#wmPadL").textContent = this.value; Wm.padding = +this.value; };
  $("#wmImgSz").oninput = function() { $("#wmImgSzL").textContent = this.value; Wm.imgSize = +this.value; };
  $("#wmShadow").onchange = function() { Wm.shadow = this.checked; };
  
  // 应用按钮
  $("#wmApply").onclick = function() { applyWatermark(); };
  
  // 移除按钮
  $("#wmRemove").onclick = function() { removeWatermark(); };
  
  // 选择图片水印
  $("#wmImgBtn").onclick = function() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
          Wm.imgFile = img;
          // 显示预览
          $("#wmImgPreview").style.display = "block";
          var thumb = $("#wmImgThumb");
          thumb.innerHTML = "";
          var prevImg = document.createElement("img");
          prevImg.src = img.src;
          prevImg.style.maxWidth = "80px";
          prevImg.style.maxHeight = "50px";
          prevImg.style.display = "block";
          thumb.appendChild(prevImg);
          toast("水印图片已加载", "ok");
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  
  // 清除图片水印
  $("#wmImgClear").onclick = function() {
    Wm.imgFile = null;
    $("#wmImgPreview").style.display = "none";
    toast("已清除水印图片", "ok");
  };
}

// 应用水印
function applyWatermark() {
  if (!S.work) return;
  pushUndo();
  var img = S.files[S.active];
  if (!img) return;
  
  var c = document.createElement("canvas");
  c.width = img.workCanvas.width;
  c.height = img.workCanvas.height;
  var ctx = c.getContext("2d");
  ctx.drawImage(img.workCanvas, 0, 0);
  
  var text = $("#wmText").value || "© YourName";
  Wm.text = text;
  
  if (Wm.type === "tile") {
    drawTileWatermark(ctx, c.width, c.height);
  } else {
    drawSingleWatermark(ctx, c.width, c.height);
  }
  
  img.workCanvas = c;
  img.modified = true;
  renderCanvas();
  fitCanvas();
  updateFileList();
  updateHistoryList();
  toast("水印已应用", "ok");
}

// 平铺水印
function drawTileWatermark(ctx, w, h) {
  var text = Wm.text;
  var fontSize = Wm.fontSize;
  var alpha = Wm.alpha / 100;
  var angle = Wm.angle * Math.PI / 180;
  var gap = Wm.gap;
  
  ctx.save();
  ctx.font = fontSize + 'px "Microsoft YaHei", sans-serif';
  ctx.fillStyle = hexToRgba(Wm.color, alpha);
  
  // 测量文字宽度
  var metrics = ctx.measureText(text);
  var textW = metrics.width;
  var textH = fontSize;
  
  // 计算平铺步长
  var stepX = textW + gap;
  var stepY = textH * 2 + gap / 2;
  
  // 旋转中心
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  
  // 平铺绘制
  for (var y = -h * 1.5; y < h * 1.5; y += stepY) {
    for (var x = -w * 1.5; x < w * 1.5; x += stepX) {
      // 交错偏移
      var offsetX = ((y / stepY) % 2 === 0) ? 0 : stepX / 2;
      ctx.fillText(text, x + offsetX, y);
    }
  }
  
  ctx.restore();
  
  // 如果有图片水印，也平铺图片
  if (Wm.imgFile) {
    drawTileImageWatermark(ctx, w, h);
  }
}

// 平铺图片水印
function drawTileImageWatermark(ctx, w, h) {
  var img = Wm.imgFile;
  var scale = Wm.imgSize / 100;
  var imgW = img.width * scale;
  var imgH = img.height * scale;
  var alpha = Wm.alpha / 100;
  var angle = Wm.angle * Math.PI / 180;
  var gap = Wm.gap;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  
  var stepX = imgW + gap;
  var stepY = imgH + gap / 2;
  
  for (var y = -h * 1.5; y < h * 1.5; y += stepY) {
    for (var x = -w * 1.5; x < w * 1.5; x += stepX) {
      var offsetX = ((y / stepY) % 2 === 0) ? 0 : stepX / 2;
      ctx.drawImage(img, x + offsetX - imgW / 2, y - imgH / 2, imgW, imgH);
    }
  }
  
  ctx.restore();
}

// 单水印
function drawSingleWatermark(ctx, w, h) {
  var text = Wm.text;
  var fontSize = Wm.fontSize;
  var alpha = Wm.alpha / 100;
  var padding = Wm.padding;
  
  ctx.save();
  ctx.font = fontSize + 'px "Microsoft YaHei", sans-serif';
  ctx.fillStyle = hexToRgba(Wm.color, alpha);
  
  // 阴影
  if (Wm.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }
  
  // 计算位置
  var pos = calcWatermarkPos(Wm.position, w, h, ctx.measureText(text).width, fontSize, padding);
  
  // 如果有图片水印，优先绘制图片
  if (Wm.imgFile) {
    var img = Wm.imgFile;
    var scale = Wm.imgSize / 100;
    var imgW = img.width * scale;
    var imgH = img.height * scale;
    var imgPos = calcWatermarkPos(Wm.position, w, h, imgW, imgH, padding);
    
    ctx.globalAlpha = alpha;
    if (Wm.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    ctx.drawImage(img, imgPos.x, imgPos.y, imgW, imgH);
  } else {
    ctx.fillText(text, pos.x, pos.y + fontSize);
  }
  
  ctx.restore();
}

// 计算水印位置
function calcWatermarkPos(pos, canvasW, canvasH, itemW, itemH, padding) {
  var x = 0, y = 0;
  
  switch (pos) {
    case "tl":
      x = padding;
      y = padding;
      break;
    case "tc":
      x = (canvasW - itemW) / 2;
      y = padding;
      break;
    case "tr":
      x = canvasW - itemW - padding;
      y = padding;
      break;
    case "ml":
      x = padding;
      y = (canvasH - itemH) / 2;
      break;
    case "center":
      x = (canvasW - itemW) / 2;
      y = (canvasH - itemH) / 2;
      break;
    case "mr":
      x = canvasW - itemW - padding;
      y = (canvasH - itemH) / 2;
      break;
    case "bl":
      x = padding;
      y = canvasH - itemH - padding;
      break;
    case "bc":
      x = (canvasW - itemW) / 2;
      y = canvasH - itemH - padding;
      break;
    case "br":
      x = canvasW - itemW - padding;
      y = canvasH - itemH - padding;
      break;
  }
  
  return { x: x, y: y };
}

// 颜色转RGBA
function hexToRgba(hex, alpha) {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}

// 移除水印（通过撤销栈回退）
function removeWatermark() {
  if (!S.work) return;
  toast("请使用撤销(Ctrl+Z)移除水印", "wa");
}

// ===== 抠图系统 =====
// 抠图状态
var Cutout = {
  mode: "color",          // color / threshold / magic / alpha
  bgColor: {r: 255, g: 255, b: 255},  // 背景色
  tolerance: 30,          // 容差
  threshold: 128,         // 亮度阈值
  edgeStrength: 50,       // 边缘强度
  smooth: 2,              // 平滑度
  feather: 0,              // 羽化
  invert: false,           // 反选
  optimize: true,          // 边缘优化
  pickMode: false         // 正在选取颜色
};

// 绑定抠图事件
function bindCutoutEvents() {
  // 模式切换
  document.querySelectorAll(".cut-mode-btn").forEach(function(btn) {
    btn.onclick = function() {
      document.querySelectorAll(".cut-mode-btn").forEach(function(b) { b.classList.remove("active"); });
      this.classList.add("active");
      Cutout.mode = this.getAttribute("data-mode");
      updateCutoutUI();
    };
  });
  
  // 背景色选择
  document.querySelectorAll(".cut-bg").forEach(function(sw) {
    sw.onclick = function() {
      document.querySelectorAll(".cut-bg").forEach(function(s) { s.classList.remove("active"); });
      this.classList.add("active");
      var hex = this.getAttribute("data-c");
      Cutout.bgColor = hexToRgb(hex);
      showCutoutPreview();
    };
  });
  
  // 从图片选取颜色
  $("#cutPickColor").onclick = function() {
    if (S.active < 0) {
      toast("请先加载一张图片", "wa");
      return;
    }
    Cutout.pickMode = true;
    $("#cutPreviewLabel").textContent = "请点击图片选择背景色";
    toast("点击画布上的图片选择背景色", "ok");
  };
  
  // 滑块事件
  $("#cutTolerance").oninput = function() {
    $("#cutToleranceL").textContent = this.value;
    Cutout.tolerance = +this.value;
    showCutoutPreview();
  };
  $("#cutThresh").oninput = function() {
    $("#cutThreshL").textContent = this.value;
    Cutout.threshold = +this.value;
    showCutoutPreview();
  };
  $("#cutEdge").oninput = function() {
    $("#cutEdgeL").textContent = this.value;
    Cutout.edgeStrength = +this.value;
    showCutoutPreview();
  };
  $("#cutSmooth").oninput = function() {
    $("#cutSmoothL").textContent = this.value;
    Cutout.smooth = +this.value;
    showCutoutPreview();
  };
  $("#cutFeather").oninput = function() {
    $("#cutFeatherL").textContent = this.value;
    Cutout.feather = +this.value;
    showCutoutPreview();
  };
  $("#cutInvert").onchange = function() {
    Cutout.invert = this.checked;
    showCutoutPreview();
  };
  $("#cutOptimize").onchange = function() {
    Cutout.optimize = this.checked;
    showCutoutPreview();
  };
  
  // 应用抠图
  $("#cutApply").onclick = function() {
    applyCutout();
  };
  
  // 重置图片
  $("#cutReset").onclick = function() {
    resetCutout();
  };
  
  // 批量抠图
  $("#cutBatch").onclick = function() {
    batchCutout();
  };
}

// 更新UI显示
function updateCutoutUI() {
  var mode = Cutout.mode;
  $("#cutColorSec").style.display = mode === "color" ? "block" : "none";
  $("#cutThresholdSec").style.display = mode === "threshold" ? "block" : "none";
  $("#cutEdgeSec").style.display = mode === "magic" ? "block" : "none";
}

// Hex转RGB
function hexToRgb(hex) {
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

// RGB转Hex
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(function(x) {
    return x.toString(16).padStart(2, "0");
  }).join("");
}

// 计算颜色距离
function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// 显示抠图预览
function showCutoutPreview() {
  var f = S.files[S.active];
  if (!f) return;
  
  var src = f.workCanvas;
  var preview = $("#cutPreview");
  var previewCtx = preview.getContext("2d");
  
  // 缩放预览
  var scale = Math.min(200 / src.width, 200 / src.height);
  preview.width = src.width * scale;
  preview.height = src.height * scale;
  
  // 绘制原图
  previewCtx.drawImage(src, 0, 0, preview.width, preview.height);
  
  // 获取像素数据
  var imgData = previewCtx.getImageData(0, 0, preview.width, preview.height);
  var data = imgData.data;
  
  // 应用抠图处理
  var tolerance = Cutout.tolerance * (255 / 100) * 4.4; // 转换为RGB距离
  
  for (var i = 0; i < data.length; i += 4) {
    var pixelColor = {r: data[i], g: data[i+1], b: data[i+2]};
    var mask = 0;
    
    if (Cutout.mode === "color") {
      // 颜色模式
      var dist = colorDistance(pixelColor, Cutout.bgColor);
      mask = dist < tolerance ? 0 : 1;
    } else if (Cutout.mode === "threshold") {
      // 阈值模式（基于亮度）
      var brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      mask = brightness < Cutout.threshold ? 0 : 1;
    } else if (Cutout.mode === "magic") {
      // 边缘检测模式 - 简化版
      var neighbors = getNeighborAvg(data, i, preview.width, preview.height);
      var diff = Math.abs(data[i] - neighbors.r) + Math.abs(data[i+1] - neighbors.g) + Math.abs(data[i+2] - neighbors.b);
      var edgeThreshold = Cutout.edgeStrength * 0.8;
      mask = diff > edgeThreshold ? 1 : 0;
    } else if (Cutout.mode === "alpha") {
      // 透明度模式 - 基于alpha通道
      mask = data[i+3] > 128 ? 1 : 0;
    }
    
    // 反选
    if (Cutout.invert) mask = 1 - mask;
    
    // 羽化效果
    if (Cutout.feather > 0 && mask === 0) {
      // 边缘过渡
      data[i+3] = Math.max(0, data[i+3] - Cutout.feather * 2);
    }
    
    // 边缘优化
    if (Cutout.optimize && mask === 1 && Cutout.mode === "color") {
      // 检查周围是否有透明像素，添加过渡
      var neighbors = getNeighborAlpha(data, i, preview.width, preview.height);
      if (neighbors < tolerance / 4) {
        data[i+3] = Math.max(0, data[i+3] - 50);
      }
    }
  }
  
  previewCtx.putImageData(imgData, 0, 0);
  
  var modeNames = {
    "color": "颜色去背",
    "threshold": "阈值抠图",
    "magic": "边缘检测",
    "alpha": "透明度抠图"
  };
  $("#cutPreviewLabel").textContent = modeNames[Cutout.mode] + " 预览";
  
  // 更新已选颜色显示
  if (Cutout.mode === "color") {
    var hex = rgbToHex(Cutout.bgColor.r, Cutout.bgColor.g, Cutout.bgColor.b);
    $("#cutColorSwatch").style.background = hex;
    $("#cutColorHex").textContent = hex.toUpperCase();
    $("#cutPickedColor").style.display = "inline-flex";
  }
  
  // 更新批量计数
  $("#cutBatchCount").textContent = S.files.length;
}

// 获取邻域平均颜色
function getNeighborAvg(data, idx, w, h) {
  var x = (idx / 4) % w;
  var y = Math.floor((idx / 4) / w);
  var sum = {r: 0, g: 0, b: 0, count: 0};
  var range = Cutout.smooth;
  
  for (var dy = -range; dy <= range; dy++) {
    for (var dx = -range; dx <= range; dx++) {
      var nx = x + dx;
      var ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        var nidx = (ny * w + nx) * 4;
        sum.r += data[nidx];
        sum.g += data[nidx+1];
        sum.b += data[nidx+2];
        sum.count++;
      }
    }
  }
  
  if (sum.count > 0) {
    return {
      r: sum.r / sum.count,
      g: sum.g / sum.count,
      b: sum.b / sum.count
    };
  }
  return {r: data[idx], g: data[idx+1], b: data[idx+2]};
}

// 获取邻域透明度
function getNeighborAlpha(data, idx, w, h) {
  var x = (idx / 4) % w;
  var y = Math.floor((idx / 4) / w);
  var sum = 0;
  var count = 0;
  var range = 2;
  
  for (var dy = -range; dy <= range; dy++) {
    for (var dx = -range; dx <= range; dx++) {
      var nx = x + dx;
      var ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        var nidx = (ny * w + nx) * 4;
        sum += data[nidx+3];
        count++;
      }
    }
  }
  
  return count > 0 ? (sum / count) : data[idx+3];
}

// 应用抠图
function applyCutout() {
  if (S.active < 0) {
    toast("请先加载图片", "wa");
    return;
  }
  
  pushUndo();
  var f = S.files[S.active];
  var src = f.workCanvas;
  
  // 创建输出画布（保留透明度）
  var out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  var outCtx = out.getContext("2d");
  
  // 绘制原图
  outCtx.drawImage(src, 0, 0);
  
  // 获取像素数据
  var imgData = outCtx.getImageData(0, 0, out.width, out.height);
  var data = imgData.data;
  
  // 容差值
  var tolerance = Cutout.tolerance * (255 / 100) * 4.4;
  
  for (var i = 0; i < data.length; i += 4) {
    var pixelColor = {r: data[i], g: data[i+1], b: data[i+2]};
    var mask = 1;
    
    if (Cutout.mode === "color") {
      var dist = colorDistance(pixelColor, Cutout.bgColor);
      mask = dist < tolerance ? 0 : 1;
    } else if (Cutout.mode === "threshold") {
      var brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      mask = brightness < Cutout.threshold ? 0 : 1;
    } else if (Cutout.mode === "magic") {
      var neighbors = getNeighborAvgFull(data, i, out.width, out.height);
      var diff = Math.abs(data[i] - neighbors.r) + Math.abs(data[i+1] - neighbors.g) + Math.abs(data[i+2] - neighbors.b);
      var edgeThreshold = Cutout.edgeStrength * 0.8;
      mask = diff > edgeThreshold ? 1 : 0;
    } else if (Cutout.mode === "alpha") {
      mask = data[i+3] > 128 ? 1 : 0;
    }
    
    // 反选
    if (Cutout.invert) mask = 1 - mask;
    
    // 羽化效果
    if (Cutout.feather > 0) {
      var neighbors = getNeighborAlphaFull(data, i, out.width, out.height);
      var alpha = Math.min(255, neighbors * (1 + Cutout.feather * 0.1));
      data[i+3] = mask === 0 ? alpha : 255;
    } else {
      data[i+3] = mask;
    }
    
    // 边缘优化
    if (Cutout.optimize && mask === 1) {
      var neighbors = getNeighborAlphaFull(data, i, out.width, out.height);
      if (neighbors < 50) {
        data[i+3] = 128; // 半透明过渡
      }
    }
  }
  
  outCtx.putImageData(imgData, 0, 0);
  
  f.workCanvas = out;
  f.modified = true;
  
  renderCanvas();
  fitCanvas();
  updateFileList();
  updateHistoryList();
  toast("抠图完成！", "ok");
}

// 获取邻域平均颜色（完整版）
function getNeighborAvgFull(data, idx, w, h) {
  var x = (idx / 4) % w;
  var y = Math.floor((idx / 4) / w);
  var sum = {r: 0, g: 0, b: 0, count: 0};
  var range = Cutout.smooth;
  
  for (var dy = -range; dy <= range; dy++) {
    for (var dx = -range; dx <= range; dx++) {
      var nx = x + dx;
      var ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        var nidx = (ny * w + nx) * 4;
        sum.r += data[nidx];
        sum.g += data[nidx+1];
        sum.b += data[nidx+2];
        sum.count++;
      }
    }
  }
  
  if (sum.count > 0) {
    return {
      r: sum.r / sum.count,
      g: sum.g / sum.count,
      b: sum.b / sum.count
    };
  }
  return {r: data[idx], g: data[idx+1], b: data[idx+2]};
}

// 获取邻域透明度（完整版）
function getNeighborAlphaFull(data, idx, w, h) {
  var x = (idx / 4) % w;
  var y = Math.floor((idx / 4) / w);
  var sum = 0;
  var count = 0;
  var range = 3;
  
  for (var dy = -range; dy <= range; dy++) {
    for (var dx = -range; dx <= range; dx++) {
      var nx = x + dx;
      var ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        var nidx = (ny * w + nx) * 4;
        sum += data[nidx+3];
        count++;
      }
    }
  }
  
  return count > 0 ? (sum / count) : data[idx+3];
}

// 重置图片
function resetCutout() {
  if (S.active < 0) return;
  var f = S.files[S.active];
  // 恢复到原图
  var c = document.createElement("canvas");
  c.width = f.origImg.naturalWidth;
  c.height = f.origImg.naturalHeight;
  c.getContext("2d").drawImage(f.origImg, 0, 0);
  f.workCanvas = c;
  f.modified = false;
  renderCanvas();
  fitCanvas();
  updateFileList();
  toast("图片已重置", "ok");
}

// 批量抠图
function batchCutout() {
  if (S.files.length === 0) {
    toast("请先加载图片", "wa");
    return;
  }
  
  var total = S.files.length;
  var processed = 0;
  var success = 0;
  
  $("#cutBatchProgress").style.display = "block";
  $("#cutProgressFill").style.width = "0%";
  $("#cutBatchResult").style.display = "none";
  
  toast("开始批量抠图...", "ok");
  
  processNextFile();
  
  function processNextFile() {
    if (processed >= total) {
      $("#cutBatchProgress").style.display = "none";
      $("#cutBatchResult").style.display = "block";
      $("#cutBatchResult").innerHTML = "处理完成：<span style='color:#10b981;'>" + success + "</span> / " + total + " 张";
      toast("批量抠图完成！成功 " + success + " 张", "ok");
      return;
    }
    
    var f = S.files[processed];
    
    // 切换到当前图片
    S.active = processed;
    renderCanvas();
    fitCanvas();
    updateFileList();
    updateHistoryList();
    
    // 应用抠图
    var src = f.workCanvas;
    var out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    var outCtx = out.getContext("2d");
    outCtx.drawImage(src, 0, 0);
    
    var imgData = outCtx.getImageData(0, 0, out.width, out.height);
    var data = imgData.data;
    var tolerance = Cutout.tolerance * (255 / 100) * 4.4;
    
    for (var i = 0; i < data.length; i += 4) {
      var pixelColor = {r: data[i], g: data[i+1], b: data[i+2]};
      var mask = 1;
      
      if (Cutout.mode === "color") {
        var dist = colorDistance(pixelColor, Cutout.bgColor);
        mask = dist < tolerance ? 0 : 1;
      } else if (Cutout.mode === "threshold") {
        var brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        mask = brightness < Cutout.threshold ? 0 : 1;
      } else if (Cutout.mode === "magic") {
        var neighbors = getNeighborAvgFull(data, i, out.width, out.height);
        var diff = Math.abs(data[i] - neighbors.r) + Math.abs(data[i+1] - neighbors.g) + Math.abs(data[i+2] - neighbors.b);
        var edgeThreshold = Cutout.edgeStrength * 0.8;
        mask = diff > edgeThreshold ? 1 : 0;
      } else if (Cutout.mode === "alpha") {
        mask = data[i+3] > 128 ? 1 : 0;
      }
      
      if (Cutout.invert) mask = 1 - mask;
      data[i+3] = mask;
    }
    
    outCtx.putImageData(imgData, 0, 0);
    f.workCanvas = out;
    f.modified = true;
    success++;
    
    // 更新进度
    var progress = ((processed + 1) / total) * 100;
    $("#cutProgressFill").style.width = progress + "%";
    
    processed++;
    
    // 延迟处理下一张
    setTimeout(processNextFile, 50);
  }
}

// 从画布选取颜色
function handleCutoutColorPick(e) {
  if (!Cutout.pickMode) return;
  
  var canvas = $("#canvas");
  var rect = canvas.getBoundingClientRect();
  var x = e.clientX - rect.left;
  var y = e.clientY - rect.top;
  
  // 获取点击位置的像素颜色
  var ctx = canvas.getContext("2d");
  var pixel = ctx.getImageData(x, y, 1, 1).data;
  
  Cutout.bgColor = {r: pixel[0], g: pixel[1], b: pixel[2]};
  Cutout.pickMode = false;
  
  // 更新UI
  var hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
  document.querySelectorAll(".cut-bg").forEach(function(s) { s.classList.remove("active"); });
  $("#cutColorSwatch").style.background = hex;
  $("#cutColorHex").textContent = hex.toUpperCase();
  $("#cutPickedColor").style.display = "inline-flex";
  
  showCutoutPreview();
  toast("已选择颜色: " + hex.toUpperCase(), "ok");
}

// ===== 智能压缩 =====
function smartCompress(){
  if(!S.work) return;
  var tgt=+$("#tgtKB").value;
  if(!tgt||tgt<5){toast("请输入有效的目标大小（KB）","er");return;}
  var tgtB=tgt*1024;
  var img=S.files[S.active];
  if(!img) return;
  var origW=img.workCanvas.width, origH=img.workCanvas.height;
  var origB=estimateFullSize(origW,origH,S.fmt,85);
  if(origB<=tgtB){
    toast("当前图片已小于目标大小","ok");
    return;
  }
  // 二分搜索最佳质量和尺寸
  var loQ=10,hiQ=100,q=85;
  for(var iter=0;iter<8;iter++){
    q=Math.round((loQ+hiQ)/2);
    var est=estimateFullSize(origW,origH,S.fmt,q);
    if(est>tgtB) hiQ=q-1;
    else loQ=q;
  }
  var finalQ=loQ;
  var estFinal=estimateFullSize(origW,origH,S.fmt,finalQ);
  var ratio=(estFinal/tgtB).toFixed(2);
  $("#scRec").textContent="质量 "+finalQ+"% · 约 "+hSize(estFinal)+"（压缩比 "+ratio+"）";
  $("#scResult").style.display="block";
  S.qual=finalQ;
  $("#eQ").value=finalQ;
  $("#eQL").textContent=finalQ+"%";
  // 应用
  var c=document.createElement("canvas");
  c.width=origW;c.height=origH;
  c.getContext("2d").drawImage(img.workCanvas,0,0);
  img.workCanvas=c;
  img.modified=true;
  renderCanvas();
  updateExportPreview();
  updateFileList();
  updateHistoryList();
  toast("智能压缩完成: 质量 "+finalQ+"%","ok");
}

function estimateFullSize(w,h,fmt,q){
  // 用 100px 缩略图估算
  var tc=document.createElement("canvas");
  tc.width=100;tc.height=Math.round(100*h/w);
  tc.getContext("2d").drawImage($("#canvas"),0,0,100,tc.height);
  var mime="image/"+fmt;
  var url=tc.toDataURL(mime,fmt==="png"?undefined:q/100);
  return Math.round(dataUrlSize(url)*(w*h)/(100*tc.height));
}

// ===== 图片拼接 =====
function stitchImages(){
  if(S.files.length<2){toast("请至少添加 2 张图片","er");return;}
  var imgs=S.files.filter(function(f){return f.workCanvas;});
  if(imgs.length<2){toast("需要至少 2 张有效图片","er");return;}
  var pad=S.stPad, gap=S.stGap, uniformH=$("#stUniformH").checked;
  var isH=S.stDir==="h";
  var canvases=imgs.map(function(f){return f.workCanvas;});
  var totalW=0,totalH=0;
  if(isH){
    var maxH=Math.max.apply(null,canvases.map(function(c){return c.height;}));
    var scaleH=uniformH?maxH:null;
    canvases.forEach(function(c){
      var h=scaleH||c.height;
      var w=Math.round(c.width*h/c.height);
      totalW+=w+(totalW>0?gap:0);
      totalH=Math.max(totalH,h);
    });
    totalW-=gap;
  } else {
    var maxW=Math.max.apply(null,canvases.map(function(c){return c.width;}));
    canvases.forEach(function(c){
      var w=uniformH?maxW:c.width;
      var h=Math.round(c.height*w/c.width);
      totalH+=h+(totalH>0?gap:0);
      totalW=Math.max(totalW,w);
    });
    totalH-=gap;
  }
  var out=document.createElement("canvas");
  out.width=totalW+pad*2;out.height=totalH+pad*2;
  var ctx=out.getContext("2d");
  ctx.fillStyle="#f8f7fc";ctx.fillRect(0,0,out.width,out.height);
  var ox=pad,oy=pad;
  canvases.forEach(function(c,i){
    if(isH){
      var h2=uniformH?Math.max.apply(null,canvases.map(function(x){return x.height;})):c.height;
      var w2=Math.round(c.width*h2/c.height);
      var h2_=uniformH?h2:c.height;
      var nh_=Math.round(c.height*(w2/c.width));
      var drawH=uniformH?h2:nh_;
      var drawW=uniformH?w2:c.width;
      ctx.drawImage(c,0,0,c.width,c.height,ox,oy+(h2_-drawH)/2,drawW,drawH);
      ox+=w2+gap;
    } else {
      var w2=uniformH?maxW:c.width;
      var h2=Math.round(c.height*w2/c.width);
      ctx.drawImage(c,0,0,c.width,c.height,ox+(w2-c.width)/2,oy,w2,h2);
      oy+=h2+gap;
    }
  });
  // 替换当前图片
  var item={id:uid(),name:"拼接图_"+new Date().getTime(),origImg:null,origSize:0,
    workCanvas:out,modified:true,thumb:null};
  var tc=document.createElement("canvas");
  var ts=Math.min(64,out.width),ths=Math.round(ts*out.height/out.width);
  tc.width=ts;tc.height=ths;tc.getContext("2d").drawImage(out,0,0,ts,ths);
  item.thumb=tc;
  S.files.push(item);
  S.active=S.files.length-1;
  loadActive();
  updateFileList();
  toast("拼接完成: "+out.width+"×"+out.height,"ok");
}

// ===== Tab 切换增强 =====
switchTab=function(name){
  $$(".pt").forEach(function(t){t.classList.toggle("active",t.dataset.t===name);});
  ["info","adjust","size","mark","export"].forEach(function(t){
    var el=$("#p-"+t);if(el) el.style.display=(t===name)?"block":"none";
  });
  if(name==="mark"){
    var cnt=$("#stCount");if(cnt) cnt.textContent=S.files.length;
  }
};

// ===== 键盘快捷键增强 =====
var _origKeyHandler=document.onkeydown;
// 已在 bindEvents 中处理，追加新快捷键（已在 bindEvents 中处理 P/A/R/O/B/T）
// ===== loadActive 增强：同步 drawCanvas =====
var _origLoadActive=loadActive;
loadActive=function(){
  _origLoadActive&&_origLoadActive.apply(this,arguments);
  var DC=$("#drawCanvas");
  var img=S.files[S.active];
  if(img&&DC.style.display==="block"){
    DC.width=img.workCanvas.width;DC.height=img.workCanvas.height;
  }
};

// ===== 更新 renderCanvas：同步 drawCanvas =====
var _origRender=renderCanvas;
renderCanvas=function(){
  _origRender&&_origRender.apply(this,arguments);
  if(S.drawTool&&S.files[S.active]){
    var DC=$("#drawCanvas");
    var img=S.files[S.active];
    DC.width=img.workCanvas.width;DC.height=img.workCanvas.height;
  }
};

function savePrefs(){
  try{
    localStorage.setItem("imgtool_prefs",JSON.stringify({fmt:S.fmt,qual:S.qual}));
  }catch(e){}
}

// 关闭前保存偏好
window.addEventListener("beforeunload",savePrefs);

// 启动
init();
})();

