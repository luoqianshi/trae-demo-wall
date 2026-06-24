(function(){let r=null,p=null,c=null,E="#ffffff",w=!1,k=0,C=0,u=window.innerWidth-400,m=20,_=[],$=[],v="",g="",f="";async function L(){if(document.getElementById("devnote-widget-host"))return;try{((await chrome.storage.local.get("devnote_settings")).devnote_settings||{}).theme==="dark"&&(E="#1f2937")}catch{}r=document.createElement("div"),r.id="devnote-widget-host",r.style.cssText="position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;",p=r.attachShadow({mode:"closed"});const e=document.createElement("style");e.textContent=X(),p.appendChild(e);const t=document.createElement("div");t.className="devnote-fab",t.innerHTML=M(),t.addEventListener("mousedown",O),p.appendChild(t),c=t,P(t),document.body.appendChild(r);try{const o=await chrome.storage.local.get("devnote_fab_position");o.devnote_fab_position&&(u=o.devnote_fab_position.x,m=o.devnote_fab_position.y)}catch{}S(),D()}function M(){return`
    <div class="devnote-fab-header">
      <span class="devnote-fab-title">📝 DevNote</span>
      <button class="devnote-fab-close" title="关闭">✕</button>
    </div>
    <div class="devnote-fab-filters">
      <div class="devnote-filter-row">
        <span class="devnote-filter-label">类型</span>
        <div class="devnote-filter-pills" data-filter="type">
          <span class="devnote-pill active" data-val="">全部</span>
          <span class="devnote-pill" data-val="bugfix">🐛 BugFix</span>
          <span class="devnote-pill" data-val="command">⚡ Command</span>
          <span class="devnote-pill" data-val="guide">📋 Guide</span>
        </div>
      </div>
      <div class="devnote-filter-row">
        <span class="devnote-filter-label">分类</span>
        <div class="devnote-filter-pills" data-filter="category">
          <span class="devnote-pill active" data-val="">全部</span>
        </div>
      </div>
    </div>
    <div class="devnote-fab-content">
      <div class="devnote-fab-loading">加载中...</div>
    </div>
  `}function P(e){const t=e.querySelector(".devnote-fab-close");t==null||t.addEventListener("click",o=>{o.stopPropagation(),F()})}function F(){r&&(r.remove(),r=null,p=null,c=null)}async function D(){try{const[e,t]=await Promise.all([chrome.storage.local.get("devnote_notes"),chrome.storage.local.get("devnote_categories")]);_=(e.devnote_notes||[]).sort((o,a)=>a.createdAt-o.createdAt),$=t.devnote_categories||[]}catch{}b()}function b(){var a;const e=p.querySelector(".devnote-fab-content");if(!e)return;q(),I();let t=_;if(v&&(t=t.filter(n=>n.category===v)),g&&(t=t.filter(n=>n.type===g)),t.length===0){e.innerHTML='<div class="devnote-fab-empty">📭 暂无卡片</div>';return}let o='<div class="devnote-fab-list">';for(let n=0;n<t.length;n++){const s=t[n],l=f===s.id,d=$.find(y=>y.value===s.category),x=(d==null?void 0:d.color)||"#8b5cf6",z=(d==null?void 0:d.label)||s.category,h=H(s.type);o+=`<div class="devnote-fab-list-item ${l?"expanded":""}" data-index="${n}" data-id="${s.id}">`,o+='<div class="devnote-fab-list-summary">',o+='<div class="devnote-fab-list-badges">',o+=`<span class="devnote-fab-list-type" style="background:${h.color}20;color:${h.color}">${h.icon}</span>`,o+=`<span class="devnote-fab-list-cat" style="background:${x}20;color:${x}">${z}</span>`,o+="</div>",o+=`<div class="devnote-fab-list-title">${i(s.title)}</div>`,o+=`<span class="devnote-fab-list-arrow">${l?"▲":"▼"}</span>`,o+="</div>",l&&(o+='<div class="devnote-fab-list-detail">',s.type==="bugfix"?o+=N(s):s.type==="command"?o+=R(s):s.type==="guide"&&(o+=A(s)),((a=s.tags)==null?void 0:a.length)>0&&(o+=`<div class="devnote-fab-tags">${s.tags.map(y=>`<span class="devnote-fab-tag">${y}</span>`).join("")}</div>`),o+="</div>"),o+="</div>"}o+="</div>",e.innerHTML=o,e.querySelectorAll(".devnote-fab-list-item").forEach(n=>{n.addEventListener("click",s=>{const d=s.currentTarget.dataset.id;s.target.closest("button")||s.target.closest("input")||s.target.closest("code")||(f===d?f="":f=d||"",b())})}),U(e),B(e,t)}function q(){const e=p.querySelector('[data-filter="type"]');if(!e)return;const t=[{value:"",label:"全部",icon:""},{value:"bugfix",label:"BugFix",icon:"🐛"},{value:"command",label:"Command",icon:"⚡"},{value:"guide",label:"Guide",icon:"📋"}];let o="";for(const a of t){const n=g===a.value?"active":"",s=a.icon?`${a.icon} ${a.label}`:a.label;o+=`<span class="devnote-pill ${n}" data-val="${a.value}">${s}</span>`}e.innerHTML=o,e.querySelectorAll(".devnote-pill").forEach(a=>{a.addEventListener("click",n=>{g=n.currentTarget.dataset.val||"",f="",b()})})}function I(){const e=p.querySelector('[data-filter="category"]');if(!e)return;let t='<span class="devnote-pill '+(v===""?"active":"")+'" data-val="">全部</span>';for(const o of $){const a=v===o.value?"active":"";t+=`<span class="devnote-pill ${a}" data-val="${o.value}" style="--cat-color:${o.color}">${o.label}</span>`}e.innerHTML=t,e.querySelectorAll(".devnote-pill").forEach(o=>{o.addEventListener("click",a=>{v=a.currentTarget.dataset.val||"",f="",b()})})}function N(e){let t="";return e.problem&&(t+=`<div class="devnote-fab-section"><div class="devnote-fab-section-label">❓ 问题</div><div class="devnote-fab-section-content">${i(e.problem)}</div></div>`),e.cause&&(t+=`<div class="devnote-fab-section"><div class="devnote-fab-section-label">🔍 原因</div><div class="devnote-fab-section-content">${i(e.cause)}</div></div>`),e.solution&&(t+=`<div class="devnote-fab-section"><div class="devnote-fab-section-label">✅ 解决</div><div class="devnote-fab-section-content">${i(e.solution)}</div></div>`),e.verify&&(t+=`<div class="devnote-fab-section"><div class="devnote-fab-section-label">🧪 验证</div><div class="devnote-fab-section-content">${i(e.verify)}</div></div>`),t}function R(e){var o;let t="";if(e.commandScene&&(t+=`<div class="devnote-fab-scene">📍 ${i(e.commandScene)}</div>`),((o=e.commands)==null?void 0:o.length)>0)for(const a of e.commands){const n=a.danger?"devnote-cmd-danger":"";t+=`<div class="devnote-fab-cmd ${n}">`,t+=`<div class="devnote-fab-cmd-row"><code>${i(a.command)}</code><button class="devnote-copy-btn" data-cmd="${encodeURIComponent(a.command)}">📋</button></div>`,t+=`<div class="devnote-fab-cmd-desc">${i(a.description)}</div>`,t+="</div>"}return t}function A(e){var o;let t="";if(e.guideScene&&(t+=`<div class="devnote-fab-scene">📍 ${i(e.guideScene)}</div>`),((o=e.steps)==null?void 0:o.length)>0){const a=e.stepProgress||{};t+='<div class="devnote-fab-steps">';for(const n of e.steps){const s=a[n.id]?"checked":"";t+='<div class="devnote-fab-step">',t+='<div class="devnote-fab-step-row">',t+=`<input type="checkbox" class="devnote-step-check" data-step="${n.id}" ${s}>`,t+=`<span class="devnote-step-title">${n.order}. ${i(n.title)}</span>`,t+="</div>",n.command&&(t+=`<div class="devnote-fab-step-cmd"><code>${i(n.command)}</code><button class="devnote-copy-btn" data-cmd="${encodeURIComponent(n.command)}">📋</button></div>`),n.note&&(t+=`<div class="devnote-fab-step-note">${i(n.note)}</div>`),t+="</div>"}t+="</div>",t+='<button class="devnote-clear-progress">🔄 清空进度</button>'}return t}function U(e){e.querySelectorAll(".devnote-copy-btn").forEach(t=>{t.addEventListener("click",o=>{o.stopPropagation();const a=decodeURIComponent(o.currentTarget.dataset.cmd||"");navigator.clipboard.writeText(a).then(()=>{const n=o.currentTarget,s=n.textContent;n.textContent="✅",setTimeout(()=>n.textContent=s,1200)})})})}function B(e,t){var a;const o=t.find(n=>n.id===f);e.querySelectorAll(".devnote-step-check").forEach(n=>{n.addEventListener("change",async s=>{const l=s.currentTarget,d=l.dataset.step;o&&(o.stepProgress||(o.stepProgress={}),o.stepProgress[d]=l.checked,await T(o.id,o.stepProgress))})}),(a=e.querySelector(".devnote-clear-progress"))==null||a.addEventListener("click",async n=>{n.stopPropagation(),o&&(o.stepProgress={},await T(o.id,{}),b())})}async function T(e,t){try{const a=(await chrome.storage.local.get("devnote_notes")).devnote_notes||[],n=a.find(s=>s.id===e);n&&(n.stepProgress=t,await chrome.storage.local.set({devnote_notes:a}))}catch{}}function H(e){return{bugfix:{label:"BugFix",icon:"🐛",color:"#ef4444"},command:{label:"Command",icon:"⚡",color:"#06b6d4"},guide:{label:"Guide",icon:"📋",color:"#f59e0b"}}[e]||{label:"Note",icon:"📝",color:"#8b5cf6"}}function S(){c&&(c.style.position="fixed",c.style.left=u+"px",c.style.top=m+"px",c.style.right="auto",c.style.bottom="auto")}function G(){try{chrome.storage.local.set({devnote_fab_position:{x:u,y:m}})}catch{}}function O(e){const t=e.target;if(t.closest("button")||t.closest("input")||t.closest("code")||t.closest(".devnote-fab-section-content")||t.closest(".devnote-pill"))return;const o=e.currentTarget;w=!0;const a=o.getBoundingClientRect();k=e.clientX-a.left,C=e.clientY-a.top;const n=l=>{w&&(u=l.clientX-k,m=l.clientY-C,S())},s=()=>{w=!1,G(),document.removeEventListener("mousemove",n),document.removeEventListener("mouseup",s)};document.addEventListener("mousemove",n),document.addEventListener("mouseup",s)}function i(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function X(){const e=E==="#1f2937";return`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .devnote-fab {
      position: fixed;
      width: 360px;
      max-height: 520px;
      background: ${e?"#1f2937":"#ffffff"};
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      pointer-events: all;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: ${e?"#f3f4f6":"#333"};
      cursor: default;
      user-select: text;
    }

    .devnote-fab-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      cursor: move;
      flex-shrink: 0;
    }
    .devnote-fab-title { font-size: 12px; font-weight: 600; }
    .devnote-fab-close {
      width: 20px; height: 20px; border: none; border-radius: 50%;
      background: rgba(255,255,255,0.2); color: white;
      cursor: pointer; font-size: 11px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
    }
    .devnote-fab-close:hover { background: rgba(255,255,255,0.35); }

    /* 筛选区 */
    .devnote-fab-filters {
      padding: 8px 12px;
      border-bottom: 1px solid ${e?"#374151":"#f0f0f0"};
      flex-shrink: 0;
    }
    .devnote-filter-row {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 4px;
    }
    .devnote-filter-row:last-child { margin-bottom: 0; }
    .devnote-filter-label {
      font-size: 10px; color: ${e?"#9ca3af":"#999"};
      width: 28px; flex-shrink: 0;
    }
    .devnote-filter-pills {
      display: flex; flex-wrap: wrap; gap: 4px;
      flex: 1;
    }
    .devnote-pill {
      display: inline-block; padding: 2px 8px;
      font-size: 10px; border-radius: 10px;
      background: ${e?"#374151":"#f3f4f6"};
      color: ${e?"#d1d5db":"#666"};
      cursor: pointer; border: 1px solid transparent;
      transition: all 0.15s;
    }
    .devnote-pill:hover {
      background: ${e?"#4b5563":"#e5e7eb"};
    }
    .devnote-pill.active {
      background: ${e?"#1e3a5f":"#eff6ff"};
      color: ${e?"#93c5fd":"#3b82f6"};
      border-color: ${e?"#3b82f6":"#bfdbfe"};
      font-weight: 500;
    }

    .devnote-fab-content {
      padding: 6px 0;
      overflow-y: auto;
      flex: 1;
      min-height: 80px;
    }

    .devnote-fab-loading, .devnote-fab-empty {
      text-align: center; padding: 20px 10px;
      color: ${e?"#9ca3af":"#999"};
      font-size: 12px;
    }

    /* 列表模式 */
    .devnote-fab-list {
      display: flex; flex-direction: column;
    }
    .devnote-fab-list-item {
      border-bottom: 1px solid ${e?"#374151":"#f5f5f5"};
      cursor: pointer;
      transition: background 0.15s;
    }
    .devnote-fab-list-item:hover {
      background: ${e?"#374151":"#fafafa"};
    }
    .devnote-fab-list-item.expanded {
      background: ${e?"#1f2937":"#fafafa"};
    }

    .devnote-fab-list-summary {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px;
    }
    .devnote-fab-list-badges {
      display: flex; gap: 3px; flex-shrink: 0;
    }
    .devnote-fab-list-type, .devnote-fab-list-cat {
      display: inline-block; padding: 1px 5px;
      font-size: 9px; font-weight: 600; border-radius: 3px;
    }
    .devnote-fab-list-title {
      flex: 1; font-size: 12px; font-weight: 500;
      color: ${e?"#e5e7eb":"#444"};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .devnote-fab-list-arrow {
      font-size: 10px; color: ${e?"#6b7280":"#ccc"};
      flex-shrink: 0; width: 16px; text-align: center;
    }

    .devnote-fab-list-detail {
      padding: 0 12px 10px 12px;
      animation: devnote-fade-in 0.2s ease;
    }
    @keyframes devnote-fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .devnote-fab-section {
      margin-bottom: 6px;
      padding: 8px;
      background: ${e?"#374151":"#f9fafb"};
      border-radius: 6px;
    }
    .devnote-fab-section-label {
      font-size: 10px; font-weight: 600;
      color: ${e?"#9ca3af":"#666"};
      margin-bottom: 3px;
    }
    .devnote-fab-section-content {
      font-size: 12px; color: ${e?"#d1d5db":"#555"};
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .devnote-fab-scene {
      font-size: 11px; color: ${e?"#9ca3af":"#888"};
      margin-bottom: 6px; padding: 4px 8px;
      background: ${e?"#374151":"#f0f0f0"};
      border-radius: 4px;
    }

    .devnote-fab-cmd {
      margin-bottom: 5px;
      padding: 5px 8px;
      background: ${e?"#111827":"#f8f9fa"};
      border-radius: 6px;
      border-left: 3px solid #22c55e;
    }
    .devnote-fab-cmd.devnote-cmd-danger {
      border-left-color: #ef4444;
    }
    .devnote-fab-cmd-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
    }
    .devnote-fab-cmd-row code {
      font-size: 11px; font-family: 'SF Mono', Monaco, monospace;
      color: ${e?"#e5e7eb":"#333"};
      flex: 1; overflow-x: auto;
    }
    .devnote-fab-cmd-desc {
      font-size: 10px; color: ${e?"#9ca3af":"#888"};
      margin-top: 2px;
    }

    .devnote-fab-steps {
      margin-bottom: 4px;
    }
    .devnote-fab-step {
      padding: 5px 8px;
      margin-bottom: 3px;
      background: ${e?"#374151":"#f9fafb"};
      border-radius: 6px;
    }
    .devnote-fab-step-row {
      display: flex; align-items: center; gap: 6px;
    }
    .devnote-step-check {
      width: 14px; height: 14px; cursor: pointer;
      accent-color: #3b82f6;
    }
    .devnote-step-title {
      font-size: 12px; font-weight: 500;
      color: ${e?"#e5e7eb":"#444"};
    }
    .devnote-fab-step-cmd {
      display: flex; align-items: center; gap: 6px;
      margin: 3px 0 0 20px;
      padding: 2px 6px;
      background: ${e?"#111827":"#f0f0f0"};
      border-radius: 4px;
    }
    .devnote-fab-step-cmd code {
      font-size: 11px; font-family: 'SF Mono', Monaco, monospace;
      color: ${e?"#e5e7eb":"#333"};
      flex: 1;
    }
    .devnote-fab-step-note {
      font-size: 10px; color: ${e?"#9ca3af":"#888"};
      margin: 2px 0 0 20px;
    }

    .devnote-copy-btn {
      padding: 2px 6px; border: none; border-radius: 4px;
      background: #3b82f6; color: white; font-size: 10px;
      cursor: pointer; white-space: nowrap;
    }
    .devnote-copy-btn:hover { background: #2563eb; }

    .devnote-clear-progress {
      width: 100%; padding: 4px;
      border: 1px dashed ${e?"#4b5563":"#d1d5db"};
      border-radius: 6px;
      background: transparent;
      color: ${e?"#9ca3af":"#666"};
      font-size: 11px; cursor: pointer;
      margin-top: 2px;
    }
    .devnote-clear-progress:hover {
      background: ${e?"#374151":"#f3f4f6"};
    }

    .devnote-fab-tags {
      display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px;
    }
    .devnote-fab-tag {
      display: inline-block; padding: 1px 5px;
      font-size: 9px; background: ${e?"#4b5563":"#f0f0f0"};
      color: ${e?"#d1d5db":"#888"}; border-radius: 3px;
    }
  `}console.log("[DevNote] Content script loaded");async function Y(){var o;const t=(await chrome.storage.local.get("devnote_settings")).devnote_settings||{};if(t.widgetEnabled===!1){console.log("[DevNote] Widget disabled by user");return}if(t.enableAllSites===!1&&((o=t.allowedDomains)==null?void 0:o.length)>0){const a=window.location.hostname;if(!t.allowedDomains.some(s=>a.includes(s))){console.log("[DevNote] Disabled on this domain:",a);return}}console.log("[DevNote] Enabled on:",window.location.href),L(),chrome.runtime.onMessage.addListener(a=>{if(a.type==="CONTEXT_MENU_TRIGGER"){const n=a.data||{};chrome.runtime.sendMessage({type:"CONTEXT_MENU_SAVE",data:{title:n.selectedText?n.selectedText.slice(0,50):n.sourceTitle||document.title,content:n.selectedText||"",tags:[],category:"tip",sourceUrl:n.sourceUrl||window.location.href,sourceTitle:n.sourceTitle||document.title,selectedText:n.selectedText||""}})}})}Y();
})()
