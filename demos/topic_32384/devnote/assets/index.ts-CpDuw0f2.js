(function(){let c=null,v=null,l=null,T="#ffffff",w=!1,z=0,L=0,x=window.innerWidth-400,h=20,A=[],_=[],u="",m="",r="",E="",f="",k=null,C=null;async function F(){if(document.getElementById("devnote-widget-host"))return;try{const a=(await chrome.storage.local.get("devnote_settings")).devnote_settings||{};a.theme==="dark"?T="#1f2937":a.theme==="system"&&(T=window.matchMedia("(prefers-color-scheme: dark)").matches?"#1f2937":"#ffffff")}catch{}c=document.createElement("div"),c.id="devnote-widget-host",c.style.cssText="position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;",v=c.attachShadow({mode:"closed"});const e=document.createElement("style");e.textContent=Q(),v.appendChild(e);const o=document.createElement("div");o.className="devnote-fab",o.innerHTML=D(),o.addEventListener("mousedown",K),v.appendChild(o),l=o,q(o),document.body.appendChild(c);try{const t=await chrome.storage.local.get("devnote_fab_position");t.devnote_fab_position&&(x=t.devnote_fab_position.x,h=t.devnote_fab_position.y)}catch{}I(),N()}function D(){return`
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
  `}function q(e){const o=e.querySelector(".devnote-fab-close");o==null||o.addEventListener("click",t=>{t.stopPropagation(),H()})}function H(){c&&(c.remove(),c=null,v=null,l=null)}async function N(){try{const[e,o]=await Promise.all([chrome.storage.local.get("devnote_notes"),chrome.storage.local.get("devnote_categories")]);A=(e.devnote_notes||[]).sort((t,a)=>a.createdAt-t.createdAt),_=o.devnote_categories||[]}catch{}g()}function R(e){E=e,k&&clearTimeout(k),k=setTimeout(()=>{E=""},1500)}function U(e){f=e,C&&clearTimeout(C),C=setTimeout(()=>{f=""},1500)}function g(){var a;const e=v.querySelector(".devnote-fab-content");if(!e)return;B(),G();let o=A;if(u&&(o=o.filter(n=>n.category===u)),m&&(o=o.filter(n=>n.type===m)),o.length===0){e.innerHTML='<div class="devnote-fab-empty">📭 暂无卡片</div>';return}let t='<div class="devnote-fab-list">';for(let n=0;n<o.length;n++){const i=o[n],s=r===i.id,b=E===i.id,p=_.find($=>$.value===i.category),S=(p==null?void 0:p.color)||"#8b5cf6",P=(p==null?void 0:p.label)||i.category,y=V(i.type);t+=`<div class="devnote-fab-list-item ${s?"expanded":""} ${b?"devnote-card-active":""}" data-index="${n}" data-id="${i.id}">`,t+='<div class="devnote-fab-list-summary">',t+='<div class="devnote-fab-list-badges">',t+=`<span class="devnote-fab-list-type" style="background:${y.color}20;color:${y.color}">${y.icon}</span>`,t+=`<span class="devnote-fab-list-cat" style="background:${S}20;color:${S}">${P}</span>`,t+="</div>",t+=`<div class="devnote-fab-list-title">${d(i.title)}</div>`,t+=`<span class="devnote-fab-list-arrow">${s?"▲":"▼"}</span>`,t+="</div>",s&&(t+='<div class="devnote-fab-list-detail">',i.type==="bugfix"?t+=O(i):i.type==="command"?t+=X(i):i.type==="guide"&&(t+=Y(i)),((a=i.tags)==null?void 0:a.length)>0&&(t+=`<div class="devnote-fab-tags">${i.tags.map($=>`<span class="devnote-fab-tag">${$}</span>`).join("")}</div>`),t+="</div>"),t+="</div>"}t+="</div>",e.innerHTML=t,e.querySelectorAll(".devnote-fab-list-item").forEach(n=>{n.addEventListener("click",i=>{const b=i.currentTarget.dataset.id;i.target.closest("button")||i.target.closest("input")||i.target.closest("code")||(r===b?r="":r=b||"",g())})}),W(e),j(e,o)}function B(){const e=v.querySelector('[data-filter="type"]');if(!e)return;const o=[{value:"",label:"全部",icon:""},{value:"bugfix",label:"BugFix",icon:"🐛"},{value:"command",label:"Command",icon:"⚡"},{value:"guide",label:"Guide",icon:"📋"}];let t="";for(const a of o){const n=m===a.value?"active":"",i=a.icon?`${a.icon} ${a.label}`:a.label;t+=`<span class="devnote-pill ${n}" data-val="${a.value}">${i}</span>`}e.innerHTML=t,e.querySelectorAll(".devnote-pill").forEach(a=>{a.addEventListener("click",n=>{m=n.currentTarget.dataset.val||"",r="",g()})})}function G(){const e=v.querySelector('[data-filter="category"]');if(!e)return;let o='<span class="devnote-pill '+(u===""?"active":"")+'" data-val="">全部</span>';for(const t of _){const a=u===t.value?"active":"";o+=`<span class="devnote-pill ${a}" data-val="${t.value}" style="--cat-color:${t.color}">${t.label}</span>`}e.innerHTML=o,e.querySelectorAll(".devnote-pill").forEach(t=>{t.addEventListener("click",a=>{u=a.currentTarget.dataset.val||"",r="",g()})})}function O(e){let o="";if(e.problem){const t=f===`bf-${e.id}-problem`;o+=`<div class="devnote-fab-section ${t?"devnote-item-active":""}" data-item-id="bf-${e.id}-problem"><div class="devnote-fab-section-label">❓ 问题</div><div class="devnote-fab-section-content">${d(e.problem)}</div></div>`}if(e.cause){const t=f===`bf-${e.id}-cause`;o+=`<div class="devnote-fab-section ${t?"devnote-item-active":""}" data-item-id="bf-${e.id}-cause"><div class="devnote-fab-section-label">🔍 原因</div><div class="devnote-fab-section-content">${d(e.cause)}</div></div>`}if(e.solution){const t=f===`bf-${e.id}-solution`;o+=`<div class="devnote-fab-section ${t?"devnote-item-active":""}" data-item-id="bf-${e.id}-solution"><div class="devnote-fab-section-label">✅ 解决</div><div class="devnote-fab-section-content">${d(e.solution)}</div></div>`}if(e.verify){const t=f===`bf-${e.id}-verify`;o+=`<div class="devnote-fab-section ${t?"devnote-item-active":""}" data-item-id="bf-${e.id}-verify"><div class="devnote-fab-section-label">🧪 验证</div><div class="devnote-fab-section-content">${d(e.verify)}</div></div>`}return o}function X(e){var t;let o="";if(e.commandScene&&(o+=`<div class="devnote-fab-scene">📍 ${d(e.commandScene)}</div>`),((t=e.commands)==null?void 0:t.length)>0)for(const a of e.commands){const n=a.danger?"devnote-cmd-danger":"",i=f===`cmd-${e.id}-${a.id}`;o+=`<div class="devnote-fab-cmd ${n} ${i?"devnote-item-active":""}" data-item-id="cmd-${e.id}-${a.id}">`,o+=`<div class="devnote-fab-cmd-row"><code>${d(a.command)}</code><button class="devnote-copy-btn" data-cmd="${encodeURIComponent(a.command)}">📋</button></div>`,o+=`<div class="devnote-fab-cmd-desc">${d(a.description)}</div>`,o+="</div>"}return o}function Y(e){var t;let o="";if(e.guideScene&&(o+=`<div class="devnote-fab-scene">📍 ${d(e.guideScene)}</div>`),((t=e.steps)==null?void 0:t.length)>0){const a=e.stepProgress||{};o+='<div class="devnote-fab-steps">';for(const n of e.steps){const i=a[n.id]?"checked":"",s=f===`step-${e.id}-${n.id}`;o+=`<div class="devnote-fab-step ${s?"devnote-item-active":""}" data-item-id="step-${e.id}-${n.id}">`,o+='<div class="devnote-fab-step-row">',o+=`<input type="checkbox" class="devnote-step-check" data-step="${n.id}" ${i}>`,o+=`<span class="devnote-step-title">${n.order}. ${d(n.title)}</span>`,o+="</div>",n.command&&(o+=`<div class="devnote-fab-step-cmd"><code>${d(n.command)}</code><button class="devnote-copy-btn" data-cmd="${encodeURIComponent(n.command)}">📋</button></div>`),n.note&&(o+=`<div class="devnote-fab-step-note">${d(n.note)}</div>`),o+="</div>"}o+="</div>",o+='<button class="devnote-clear-progress">🔄 清空进度</button>'}return o}function W(e){e.querySelectorAll(".devnote-copy-btn").forEach(o=>{o.addEventListener("click",t=>{t.stopPropagation();const a=decodeURIComponent(t.currentTarget.dataset.cmd||""),n=t.currentTarget.closest("[data-item-id]");n&&(R(r),U(n.dataset.itemId||""),g()),navigator.clipboard.writeText(a).then(()=>{const i=t.currentTarget,s=i.textContent;i.textContent="✅",setTimeout(()=>i.textContent=s,1200)})})})}function j(e,o){var a;const t=o.find(n=>n.id===r);e.querySelectorAll(".devnote-step-check").forEach(n=>{n.addEventListener("change",async i=>{const s=i.currentTarget,b=s.dataset.step;t&&(t.stepProgress||(t.stepProgress={}),t.stepProgress[b]=s.checked,await M(t.id,t.stepProgress))})}),(a=e.querySelector(".devnote-clear-progress"))==null||a.addEventListener("click",async n=>{n.stopPropagation(),t&&(t.stepProgress={},await M(t.id,{}),g())})}async function M(e,o){try{const a=(await chrome.storage.local.get("devnote_notes")).devnote_notes||[],n=a.find(i=>i.id===e);n&&(n.stepProgress=o,await chrome.storage.local.set({devnote_notes:a}))}catch{}}function V(e){return{bugfix:{label:"BugFix",icon:"🐛",color:"#ef4444"},command:{label:"Command",icon:"⚡",color:"#06b6d4"},guide:{label:"Guide",icon:"📋",color:"#f59e0b"}}[e]||{label:"Note",icon:"📝",color:"#8b5cf6"}}function I(){l&&(l.style.position="fixed",l.style.left=x+"px",l.style.top=h+"px",l.style.right="auto",l.style.bottom="auto")}function J(){try{chrome.storage.local.set({devnote_fab_position:{x,y:h}})}catch{}}function K(e){const o=e.target;if(o.closest("button")||o.closest("input")||o.closest("code")||o.closest(".devnote-fab-section-content")||o.closest(".devnote-pill"))return;const t=e.currentTarget;w=!0;const a=t.getBoundingClientRect();z=e.clientX-a.left,L=e.clientY-a.top;const n=s=>{w&&(x=s.clientX-z,h=s.clientY-L,I())},i=()=>{w=!1,J(),document.removeEventListener("mousemove",n),document.removeEventListener("mouseup",i)};document.addEventListener("mousemove",n),document.addEventListener("mouseup",i)}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Q(){const e=T==="#1f2937";return`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* 滚动条样式 */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${e?"#4b5563":"#d1d5db"}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${e?"#6b7280":"#9ca3af"}; }

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
    .devnote-fab-list-item.devnote-card-active {
      background: ${e?"#1e3a5f":"#dbeafe"} !important;
      border-left: 3px solid #3b82f6;
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

    /* 点击高亮 */
    .devnote-item-active {
      background: ${e?"#1e3a5f":"#dbeafe"} !important;
      border: 1px solid #3b82f6 !important;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
      transition: all 0.15s ease;
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
  `}console.log("[DevNote] Content script loaded");async function Z(){var t;const o=(await chrome.storage.local.get("devnote_settings")).devnote_settings||{};if(o.widgetEnabled===!1){console.log("[DevNote] Widget disabled by user");return}if(o.enableAllSites===!1&&((t=o.allowedDomains)==null?void 0:t.length)>0){const a=window.location.hostname;if(!o.allowedDomains.some(i=>a.includes(i))){console.log("[DevNote] Disabled on this domain:",a);return}}console.log("[DevNote] Enabled on:",window.location.href),F(),chrome.runtime.onMessage.addListener(a=>{if(a.type==="CONTEXT_MENU_TRIGGER"){const n=a.data||{};chrome.runtime.sendMessage({type:"CONTEXT_MENU_SAVE",data:{title:n.selectedText?n.selectedText.slice(0,50):n.sourceTitle||document.title,content:n.selectedText||"",tags:[],category:"tip",sourceUrl:n.sourceUrl||window.location.href,sourceTitle:n.sourceTitle||document.title,selectedText:n.selectedText||""}})}})}Z();
})()
