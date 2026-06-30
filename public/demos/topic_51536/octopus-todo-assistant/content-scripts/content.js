var content=(function(){function e(e){return e}var t=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,n=e({matches:[`*://*/*`],async main(){let e={pattern:``,matchType:`url`,todos:[],quickLinks:[],sourcePattern:``,sourceMatchType:`domain`},n=!1,r=window.innerWidth/2,i=window.innerHeight/2,a={x:window.innerWidth-90,y:window.innerHeight-110},o=!1,s={x:0,y:0},c=!1,l=performance.now(),u=null,d=null,f=null,p=`domain`,m=window.location.hostname,h=[],g=`octopus_settings`,_=.7,v=5e3,y=`⭐.🔥.✅.📌.🧠.📚.📝.🔗.🔍.🧭.⚙️.🧩.🚀.💡.⏰.📅.📈.📊.💰.🛠️.🧪.🐛.🎯.📎.📁.🗂️.🔒.👀.🌐.🧵.🧾.💬`.split(`.`),b=null,x=null;function S(e,t){let n=t.trim();if(e===`domain`)return{matchType:e,pattern:n.toLowerCase()};try{let t=new URL(n);return{matchType:e,pattern:`${t.origin}${t.pathname}${t.search}`}}catch{return{matchType:e,pattern:n}}}function C(e,t){try{let n=new URL(e).hostname.toLowerCase(),r=t.toLowerCase();if(r.startsWith(`*.`)){let e=r.slice(2);return n===e||n.endsWith(`.`+e)}return n===r}catch{return!1}}function w(e,t){try{let n=new URL(e),r=`${n.origin}${n.pathname}${n.search}`,i=new URL(t),a=`${i.origin}${i.pathname}${i.search}`;return r===a||r.startsWith(a+`/`)}catch{return!1}}function T(e){let t=h.filter(t=>t.matchType===`url`?w(e,t.pattern):C(e,t.pattern)).sort((e,t)=>{let n=e.matchType===`domain`&&e.pattern.startsWith(`*.`),r=t.matchType===`domain`&&t.pattern.startsWith(`*.`);return e.matchType===t.matchType?e.matchType===`domain`&&n!==r?n?1:-1:0:e.matchType===`url`?-1:1});return t.length>0?t[0]:null}function E(){let e=S(p,m);return h.some(t=>t.matchType===e.matchType&&t.pattern===e.pattern)}async function D(){try{let e=(await t.storage.local.get(g))[g];h=Array.isArray(e?.autoOpenRules)?e.autoOpenRules.filter(e=>e&&(e.matchType===`domain`||e.matchType===`url`)&&typeof e.pattern==`string`).map(e=>S(e.matchType,e.pattern)):[],e?.autoOpenPanel===!0&&h.length===0&&(h=[S(`domain`,window.location.hostname)],await t.storage.local.set({[g]:{autoOpenRules:h}}))}catch{h=[]}}async function O(e){let n=p===`domain`?window.location.hostname:k(),r=S(p,m||n);h=h.filter(e=>!(e.matchType===r.matchType&&e.pattern===r.pattern)),e&&h.push(r);try{await t.storage.local.set({[g]:{autoOpenRules:h}})}catch{return}}function k(){return`${window.location.origin}${window.location.pathname}${window.location.search}`}function A(e){try{return new URL(e,window.location.origin).href}catch{return e}}function j(e){let t=e.trim();if(!t)return!1;if(t.startsWith(`http://`)||t.startsWith(`https://`))try{let e=new URL(t);return e.protocol===`http:`||e.protocol===`https:`}catch{return!1}return!!(t.startsWith(`/`)||t.startsWith(`./`)||t.startsWith(`../`))}function M(){let e=document.getElementById(`octopus-container`);if(e?.shadowRoot)return e.shadowRoot;let t=document.createElement(`div`);t.id=`octopus-container`,t.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        z-index: 2147483647;
        pointer-events: auto;
      `,(document.body??document.documentElement).appendChild(t);let n=t.attachShadow({mode:`open`}),r=document.createElement(`style`);return r.textContent=`
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 0;
          height: 0;
          z-index: 2147483647;
          pointer-events: auto;
        }

        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0);
          display: none;
          pointer-events: auto;
          z-index: 2147483645;
        }

        .octopus-btn {
          position: fixed;
          width: 80px;
          height: 80px;
          cursor: grab;
          pointer-events: auto;
          opacity: ${_};
          transition: transform 0.1s ease, opacity 0.2s ease;
          z-index: 2147483647;
          display: block;
          visibility: visible;
        }

        .octopus-btn:active {
          cursor: grabbing;
        }

        .octopus-body {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 50%;
          position: relative;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5); }
          50% { transform: scale(1.05); box-shadow: 0 6px 30px rgba(99, 102, 241, 0.7); }
        }

        .eye {
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 25%;
        }

        .eye.left {
          left: 20%;
        }

        .eye.right {
          right: 20%;
        }

        .pupil {
          width: 10px;
          height: 10px;
          background: #1f2937;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.1s ease-out;
        }

        .tentacle {
          position: absolute;
          width: 10px;
          height: 28px;
          background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 8px 8px 10px 10px;
          bottom: -14px;
          transform-origin: 50% 0%;
          animation: sway 2s ease-in-out infinite;
        }

        .tentacle.t1 { left: 18%; animation-delay: 0s; }
        .tentacle.t2 { left: 36%; animation-delay: 0.2s; }
        .tentacle.t3 { left: 54%; animation-delay: 0.4s; }
        .tentacle.t4 { left: 72%; animation-delay: 0.6s; }

        @keyframes sway {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }

        .panel {
          position: fixed;
          width: min(360px, calc(100vw - 20px));
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          z-index: 2147483646;
          display: none;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
          max-height: calc(100vh - 20px);
          flex-direction: column;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .panel-header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .auto-open-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          user-select: none;
          cursor: pointer;
          opacity: 0.95;
        }

        .auto-open-toggle input {
          width: 14px;
          height: 14px;
          accent-color: #ffffff;
        }

        .panel-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .panel-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .panel-body {
          padding: 12px;
          overflow: auto;
        }

        .scope-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 10px;
        }

        .scope-select {
          height: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0 8px;
          font-size: 12px;
          background: white;
        }

        .scope-input {
          flex: 1;
          height: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 12px;
        }

        .panel-sections {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 10px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .count-badge {
          background: #eef2ff;
          color: #4338ca;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          line-height: 18px;
          flex-shrink: 0;
        }

        .section-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .section-btn {
          height: 26px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 12px;
          background: white;
          cursor: pointer;
        }

        .section-content {
          padding: 10px;
        }

        .editor {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px;
          background: white;
          margin-bottom: 10px;
        }

        .field-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .icon-sort-row {
          display: grid;
          grid-template-columns: 1fr 120px;
          gap: 8px;
          margin-bottom: 8px;
        }

        .icon-sort-row > .emoji-input-wrap {
          width: 100%;
          min-width: 0;
        }

        .icon-sort-row > .field {
          width: 100%;
          min-width: 0;
        }

        .field-row > .field {
          flex: 1;
          min-width: 0;
          width: auto;
        }

        .field {
          width: 100%;
          height: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 12px;
          box-sizing: border-box;
        }

        .emoji-input-wrap {
          flex: 1;
          min-width: 0;
          position: relative;
        }

        .emoji-input {
          padding-right: 36px;
        }

        .emoji-picker-btn {
          position: absolute;
          right: 1px;
          top: 1px;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #f3f4f6;
          color: #374151;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-picker-btn:hover {
          background: #e5e7eb;
        }

        .emoji-picker {
          position: fixed;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
          gap: 6px;
          z-index: 2147483647;
          pointer-events: auto;
          overflow: auto;
          box-sizing: border-box;
        }

        .emoji-picker-item {
          width: 100%;
          height: 32px;
          border: none;
          background: #f9fafb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-picker-item:hover {
          background: #f3f4f6;
        }

        .field-textarea {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          resize: vertical;
          min-height: 52px;
        }

        .editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
          border: none;
        }

        .btn-danger {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .list {
          overflow: visible;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-link-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 10px;
        }

        .quick-link-row:hover {
          background: #f9fafb;
        }

        .quick-link-icon {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
          flex-shrink: 0;
          font-size: 16px;
        }

        .quick-link-info {
          flex: 1;
          min-width: 0;
        }

        .quick-link-name {
          font-size: 13px;
          margin: 0;
          color: #374151;
          line-height: 1.2;
        }

        .quick-link-url {
          font-size: 11px;
          margin: 2px 0 0 0;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .todo-item {
          display: flex;
          align-items: flex-start;
          padding: 8px;
          margin-bottom: 4px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          transition: background 0.2s;
        }

        .todo-item:hover {
          background: #f9fafb;
        }

        .todo-checkbox {
          width: 18px;
          height: 18px;
          margin-right: 10px;
          margin-top: 2px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .todo-content {
          flex: 1;
          min-width: 0;
        }

        .todo-topline {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: flex-start;
        }

        .todo-title {
          font-size: 13px;
          margin: 0;
          color: #374151;
          line-height: 1.25;
        }

        .todo-description {
          font-size: 11px;
          color: #6b7280;
          margin: 4px 0 0 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .todo-completed .todo-title {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 20px;
          color: #9ca3af;
          font-size: 14px;
        }

        .badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }
      `,n.appendChild(r),n}function N(e){let t=e.querySelector(`#octopus-emoji-picker`);if(t)return t;let n=document.createElement(`div`);n.id=`octopus-emoji-picker`,n.className=`emoji-picker`,n.style.display=`none`,y.forEach(e=>{let t=document.createElement(`button`);t.type=`button`,t.className=`emoji-picker-item`,t.textContent=e,t.dataset.emoji=e,n.appendChild(t)}),n.addEventListener(`click`,e=>{let t=(e.target?.closest?.(`button.emoji-picker-item`))?.dataset?.emoji;!t||!b||(b.value=t,b.dispatchEvent(new Event(`input`,{bubbles:!0})),P(n))});let r=e=>{if(n.style.display===`none`)return;let t=e.composedPath();t.includes(n)||x&&t.includes(x)||P(n)},i=e=>{n.style.display!==`none`&&e.key===`Escape`&&P(n)},a=()=>{n.style.display!==`none`&&x&&F(n,x)};return document.addEventListener(`mousedown`,r,!0),window.addEventListener(`keydown`,i),window.addEventListener(`resize`,a),window.addEventListener(`scroll`,a,!0),e.appendChild(n),n}function P(e){e.style.display=`none`,b=null,x=null}function F(e,t){let n=t.getBoundingClientRect(),r=Math.min(320,Math.max(220,window.innerWidth-16)),i=window.innerHeight-n.bottom-8,a=n.top-8,o=i<160&&a>i,s=Math.min(260,Math.max(140,o?a:i)),c=o?Math.max(8,n.top-6-s):n.bottom+6,l=Math.max(8,Math.min(n.right-r,window.innerWidth-r-8));e.style.top=`${c}px`,e.style.left=`${l}px`,e.style.width=`${r}px`,e.style.maxHeight=`${s}px`}function ee(e,t,n){let r=N(e);if(r.style.display!==`none`&&x===t){P(r);return}b=n,x=t,r.style.display=`grid`,F(r,t)}function te(e){let t=e.querySelector(`.octopus-btn`);if(t)return t.style.left=`${a.x}px`,t.style.top=`${a.y}px`,t.style.zIndex=`2147483647`,t;let n=document.createElement(`div`);return n.className=`octopus-btn`,n.style.left=`${a.x}px`,n.style.top=`${a.y}px`,n.style.zIndex=`2147483647`,n.title=`章鱼待办助手：点击打开/关闭面板，拖拽可移动位置`,n.innerHTML=`
        <div class="octopus-body">
          <div class="eye left">
            <div class="pupil"></div>
          </div>
          <div class="eye right">
            <div class="pupil"></div>
          </div>
          <div class="tentacle t1"></div>
          <div class="tentacle t2"></div>
          <div class="tentacle t3"></div>
          <div class="tentacle t4"></div>
        </div>
      `,n.addEventListener(`mousedown`,e=>{o=!0,s={x:e.clientX-a.x,y:e.clientY-a.y},I(n),L(n),e.preventDefault()}),n.addEventListener(`click`,t=>{o||B(e),o=!1}),n.addEventListener(`mouseenter`,()=>{c=!0,I(n),L(n)}),n.addEventListener(`mouseleave`,()=>{c=!1,I(n),L(n)}),e.appendChild(n),n}function ne(e){let t=e.querySelector(`.panel`);if(t)return t;let r=`octopus-panel-backdrop`;if(!e.querySelector(`#${r}`)){let t=document.createElement(`div`);t.id=r,t.className=`backdrop`,t.addEventListener(`mousedown`,e=>{e.preventDefault(),e.stopPropagation()}),t.addEventListener(`click`,t=>{t.preventDefault(),t.stopPropagation(),n&&B(e)}),e.appendChild(t)}let i=document.createElement(`div`);i.className=`panel`,i.innerHTML=`
        <div class="panel-header">
          <div>
            <h3 class="panel-title">章鱼待办助手</h3>
          </div>
          <div class="header-actions">
            <label class="auto-open-toggle">
              <input type="checkbox" id="auto-open-toggle" />
              <span>自动打开</span>
            </label>
            <button class="panel-close" id="panel-close-btn" title="关闭面板" aria-label="关闭面板">×</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="scope-row">
            <select class="scope-select" id="scope-match-type">
              <option value="domain">域名</option>
              <option value="url">URL</option>
            </select>
            <input class="scope-input" id="scope-pattern" placeholder="输入域名或URL..." />
          </div>
          <div class="panel-sections">
            <div class="section" id="todos-section">
              <div class="section-header">
                <div class="section-title-wrap">
                  <h4 class="section-title">待办事项</h4>
                  <span class="count-badge" id="todo-count">0</span>
                </div>
                <div class="section-actions">
                  <button class="section-btn" id="todo-add-btn" title="新增待办">新增</button>
                </div>
              </div>
              <div class="section-content">
                <div class="editor" id="todo-editor" style="display:none"></div>
                <div class="list" id="todo-list"></div>
              </div>
            </div>
            <div class="section" id="links-section">
              <div class="section-header">
                <div class="section-title-wrap">
                  <h4 class="section-title">快捷链接</h4>
                  <span class="count-badge" id="link-count">0</span>
                </div>
                <div class="section-actions">
                  <button class="section-btn" id="link-add-btn" title="新增快捷链接">新增</button>
                </div>
              </div>
              <div class="section-content">
                <div class="editor" id="link-editor" style="display:none"></div>
                <div class="list" id="link-list"></div>
              </div>
            </div>
          </div>
        </div>
      `,i.querySelector(`#panel-close-btn`)?.addEventListener(`click`,()=>{B(e)});let a=i.querySelector(`#auto-open-toggle`);a&&a.addEventListener(`change`,()=>{O(a.checked)});let o=i.querySelector(`#scope-match-type`),s=i.querySelector(`#scope-pattern`);return o&&o.addEventListener(`change`,()=>{p=o.value===`url`?`url`:`domain`,s&&(p===`domain`?s.value.trim().startsWith(`http`)&&(s.value=window.location.hostname):s.value.trim().startsWith(`http`)||(s.value=k()),m=s.value.trim()),J()}),s&&s.addEventListener(`input`,()=>{m=s.value.trim()}),i.querySelector(`#todo-add-btn`)?.addEventListener(`click`,()=>{d={mode:`add`},f=null,J()}),i.querySelector(`#link-add-btn`)?.addEventListener(`click`,()=>{f={mode:`add`},d=null,J()}),e.appendChild(i),i}function re(e){let t=e.querySelectorAll(`.pupil`),n=e.getBoundingClientRect(),a=n.left+n.width/2,o=n.top+n.height/2,s=r-a,c=i-o,l=Math.sqrt(s*s+c*c),u=Math.min(l/15,1),d=Math.atan2(c,s),f=Math.cos(d)*u*6,p=Math.sin(d)*u*6;t.forEach(e=>{e.style.transform=`translate(calc(-50% + ${f}px), calc(-50% + ${p}px))`})}function I(e){let t=performance.now(),r=n||o||c&&t-l<v;e.style.opacity=String(r?1:_)}function L(e){if(u!==null&&(clearTimeout(u),u=null),n||o||!c)return;let t=v-(performance.now()-l);if(t<=0){I(e);return}u=setTimeout(()=>{u=null,I(e)},t)}function R(e){e.style.left=`${a.x}px`,e.style.top=`${a.y}px`}function z(e,t){let n=t.getBoundingClientRect(),r=e.getBoundingClientRect(),i=r.width||320,a=r.height||460,o=n.left-i-10,s=n.top-a/2+n.height/2;o<10&&(o=n.right+10);let c=window.innerHeight-a-10;s=Math.max(10,Math.min(c,s)),e.style.left=`${o}px`,e.style.top=`${s}px`}function B(e){let t=e.querySelector(`.panel`),r=e.querySelector(`.octopus-btn`),i=e.querySelector(`#octopus-panel-backdrop`),a=e.querySelector(`#octopus-emoji-picker`);!t||!r||(n=!n,n?(i&&(i.style.display=`block`),t.style.display=`flex`,J(),z(t,r)):(t.style.display=`none`,i&&(i.style.display=`none`),a&&P(a)),I(r),L(r))}async function V(e,n,r,i){let a=r.trim();a&&await t.runtime.sendMessage({type:`TODO_CREATE`,payload:{pattern:e,matchType:n,title:a,description:i?.trim()||void 0}})}async function H(e,n,r){let i=n.trim();i&&await t.runtime.sendMessage({type:`TODO_UPDATE`,payload:{pattern:e.sourcePattern,matchType:e.sourceMatchType,id:e.id,title:i,description:r?.trim()||void 0}})}async function U(e){await t.runtime.sendMessage({type:`TODO_DELETE`,payload:{pattern:e.sourcePattern,matchType:e.sourceMatchType,id:e.id}})}async function W(e,n,r,i,a,o){let s=r.trim(),c=i.trim();!s||!c||j(c)&&await t.runtime.sendMessage({type:`QUICK_LINK_CREATE`,payload:{pattern:e,matchType:n,name:s,url:c,icon:a?.trim()||void 0,sortOrder:o??0}})}async function G(e,n,r,i,a){let o=n.trim(),s=r.trim();!o||!s||j(s)&&await t.runtime.sendMessage({type:`QUICK_LINK_UPDATE`,payload:{pattern:e.sourcePattern,matchType:e.sourceMatchType,id:e.id,name:o,url:s,icon:i?.trim()||void 0,sortOrder:a}})}async function K(e){await t.runtime.sendMessage({type:`QUICK_LINK_DELETE`,payload:{pattern:e.sourcePattern,matchType:e.sourceMatchType,id:e.id}})}async function q(n,r){await t.runtime.sendMessage({type:`TODO_COMPLETE`,payload:{pattern:n.sourcePattern||e.sourcePattern,matchType:n.sourceMatchType||e.sourceMatchType,id:n.id,completed:r}})}function J(){let t=e.todos.filter(e=>!e.completed).length,r=e.todos.length,i=e.quickLinks.length,a=Q.querySelector(`#todo-count`);a&&(a.textContent=t===r?String(t):`${t}/${r}`);let o=Q.querySelector(`#link-count`);o&&(o.textContent=String(i));let s=Q.querySelector(`#scope-match-type`),c=Q.querySelector(`#scope-pattern`);s&&(s.value=p),c&&(c.value=m,c.placeholder=p===`domain`?`输入域名，如 github.com 或 *.github.com`:`输入URL，如 https://example.com/path`);let l=Q.querySelector(`#auto-open-toggle`);l&&(l.checked=E());let u=Q.querySelector(`#todo-list`),h=Q.querySelector(`#todo-editor`),g=Q.querySelector(`#link-list`),_=Q.querySelector(`#link-editor`),v=(e,t,n,r)=>{let i=document.createElement(`button`);return i.type=`button`,i.className=`icon-btn${r?` ${r}`:``}`,i.textContent=e,i.title=t,i.setAttribute(`aria-label`,t),i.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),n()}),i},y=(e,t,n)=>{let r=document.createElement(`button`);return r.type=`button`,r.className=`section-btn${n?` ${n}`:``}`,r.textContent=e,r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t()}),r},b=()=>{if(!h)return;if(!d){h.style.display=`none`,h.replaceChildren();return}h.style.display=`block`,h.replaceChildren();let e=d.mode===`edit`?d.todo:void 0,t=document.createElement(`select`);t.className=`field`,t.innerHTML=`
          <option value="domain">域名</option>
          <option value="url">URL</option>
        `;let n=document.createElement(`input`);n.className=`field`,n.placeholder=`域名或URL...`,e?(t.value=e.sourceMatchType,t.disabled=!0,n.value=e.sourcePattern,n.disabled=!0):(t.value=p,n.value=m||(p===`domain`?window.location.hostname:k()),t.addEventListener(`change`,()=>{(t.value===`url`?`url`:`domain`)==`domain`?n.value=window.location.hostname:n.value=k()}));let r=document.createElement(`input`);r.className=`field`,r.placeholder=`待办标题...`,r.value=e?e.title:``;let i=document.createElement(`textarea`);i.className=`field-textarea`,i.placeholder=`备注（可选）...`,i.value=e&&e.description||``;let a=document.createElement(`div`);a.className=`field-row`,a.append(t,n);let o=document.createElement(`div`);o.className=`field-row`,o.append(r);let s=document.createElement(`div`);s.className=`editor-actions`,s.append(y(`取消`,()=>{d=null,J()}),y(`保存`,async()=>{try{if(e)await H(e,r.value,i.value);else{let e=t.value===`url`?`url`:`domain`,a=(n.value||``).trim()||(e===`domain`?window.location.hostname:k());p=e,m=a,await V(a,e,r.value,i.value)}d=null,await Y()}catch{return}},`btn-primary`)),h.append(a,o,i,s)},x=()=>{if(!_)return;if(!f){_.style.display=`none`,_.replaceChildren();return}_.style.display=`block`,_.replaceChildren();let t=f.mode===`edit`?f.link:void 0,n=document.createElement(`select`);n.className=`field`,n.innerHTML=`
          <option value="domain">域名</option>
          <option value="url">URL</option>
        `;let r=document.createElement(`input`);r.className=`field`,r.placeholder=`域名或URL...`,t?(n.value=t.sourceMatchType,n.disabled=!0,r.value=t.sourcePattern,r.disabled=!0):(n.value=p,r.value=m||(p===`domain`?window.location.hostname:k()),n.addEventListener(`change`,()=>{(n.value===`url`?`url`:`domain`)==`domain`?r.value=window.location.hostname:r.value=k()}));let i=document.createElement(`input`);i.className=`field`,i.placeholder=`名称...`,i.value=t?t.name:``;let a=document.createElement(`input`);a.className=`field`,a.placeholder=`链接（支持绝对URL或相对路径）...`,a.value=t?t.url:``;let o=document.createElement(`input`);o.className=`field emoji-input`,o.placeholder=`图标（可选，如 🔗）...`,o.value=t&&t.icon||``;let s=document.createElement(`button`);s.type=`button`,s.className=`emoji-picker-btn`,s.textContent=`+`,s.title=`选择 emoji`,s.setAttribute(`aria-label`,`选择 emoji`),s.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),ee(X,s,o)});let c=document.createElement(`div`);c.className=`emoji-input-wrap`,c.append(o,s);let l=document.createElement(`input`);l.className=`field`,l.type=`number`,l.placeholder=`排序（可选）...`,l.value=t?String(t.sortOrder??0):``;let u=document.createElement(`div`);u.className=`field-row`,u.append(n,r);let d=document.createElement(`div`);d.className=`field-row`,d.append(i);let h=document.createElement(`div`);h.className=`field-row`,h.append(a);let g=document.createElement(`div`);g.className=`icon-sort-row`,g.append(c,l);let v=document.createElement(`div`);v.className=`editor-actions`,v.append(y(`取消`,()=>{f=null,J()}),y(`保存`,async()=>{let s=i.value.trim(),c=a.value.trim();if(!s){window.alert(`请输入名称`);return}if(!c){window.alert(`请输入链接地址`);return}if(!j(c)){window.alert(`链接地址需要是 http(s) URL，或以 /、./、../ 开头的相对路径`);return}try{let s=l.value.trim()?Number(l.value):void 0;if(t)await G(t,i.value,a.value,o.value,s);else{let t=n.value===`url`?`url`:`domain`,c=(r.value||``).trim()||(t===`domain`?window.location.hostname:k());p=t,m=c;let l=e.quickLinks.filter(e=>e.sourcePattern===c&&e.sourceMatchType===t).map(e=>e.sortOrder),u=l.length===0?0:Math.max(...l)+1;await W(c,t,i.value,a.value,o.value,s??u)}f=null,await Y()}catch{return}},`btn-primary`)),_.append(u,d,h,g,v)};if(u)if(u.replaceChildren(),e.todos.length===0){let e=document.createElement(`div`);e.className=`empty-state`,e.textContent=`暂无待办事项`,u.appendChild(e)}else e.todos.forEach(e=>{let t=document.createElement(`div`);t.className=`todo-item${e.completed?` todo-completed`:``}`;let n=document.createElement(`input`);n.type=`checkbox`,n.className=`todo-checkbox`,n.checked=e.completed,n.addEventListener(`change`,async()=>{try{await q(e,n.checked),await Y()}catch{n.checked=!n.checked}});let r=document.createElement(`div`);r.className=`todo-content`;let i=document.createElement(`div`);i.className=`todo-topline`;let a=document.createElement(`p`);a.className=`todo-title`,a.textContent=e.title;let o=document.createElement(`div`);if(o.className=`item-actions`,o.append(v(`✎`,`编辑待办`,()=>{d={mode:`edit`,todo:e},f=null,J()}),v(`🗑`,`删除待办`,async()=>{if(window.confirm(`确定删除该待办吗？`))try{await U(e),await Y()}catch{return}})),i.append(a,o),r.appendChild(i),e.description){let t=document.createElement(`p`);t.className=`todo-description`,t.textContent=e.description,r.appendChild(t)}t.append(n,r),u.appendChild(t)});if(g)if(g.replaceChildren(),e.quickLinks.length===0){let e=document.createElement(`div`);e.className=`empty-state`,e.textContent=`暂无快捷链接`,g.appendChild(e)}else e.quickLinks.forEach(e=>{let t=document.createElement(`div`);t.className=`quick-link-row`,t.addEventListener(`click`,()=>{window.location.assign(A(e.url))});let n=document.createElement(`div`);n.className=`quick-link-icon`,n.textContent=e.icon&&e.icon.trim()?e.icon:`🔗`;let r=document.createElement(`div`);r.className=`quick-link-info`;let i=document.createElement(`p`);i.className=`quick-link-name`,i.textContent=e.name;let a=document.createElement(`p`);a.className=`quick-link-url`,a.textContent=e.url,r.append(i,a);let o=document.createElement(`div`);o.className=`item-actions`,o.append(v(`→`,`当前标签打开`,()=>{window.location.assign(A(e.url))}),v(`↗`,`新标签打开`,()=>{window.open(A(e.url),`_blank`,`noopener,noreferrer`)}),v(`✎`,`编辑快捷链接`,()=>{f={mode:`edit`,link:e},d=null,J()}),v(`🗑`,`删除快捷链接`,async()=>{if(window.confirm(`确定删除该快捷链接吗？`))try{await K(e),await Y()}catch{return}})),t.append(n,r,o),g.appendChild(t)});b(),x(),n&&z(Q,Z)}async function Y(){try{let r=await t.runtime.sendMessage({type:`DOMAIN_QUERY`,payload:window.location.href});if(!r||typeof r!=`object`)return;let i=r,a=window.location.hostname;e={pattern:i.pattern||window.location.href,matchType:i.matchType===`domain`?`domain`:`url`,todos:Array.isArray(i.todos)?i.todos:[],quickLinks:Array.isArray(i.quickLinks)?i.quickLinks:[],sourcePattern:i.sourcePattern||a,sourceMatchType:i.sourceMatchType===`url`?`url`:`domain`},!n&&!d&&!f&&(p=e.sourcePattern?e.sourceMatchType:`domain`,m=e.sourcePattern||a),J()}catch(e){console.error(`Failed to fetch domain data:`,e)}}let X=M(),Z=te(X),Q=ne(X);J(),I(Z),L(Z),document.addEventListener(`mousemove`,e=>{requestAnimationFrame(()=>{r=e.clientX,i=e.clientY,l=performance.now(),re(Z),I(Z),L(Z)})}),window.addEventListener(`resize`,()=>{n&&z(Q,Z)}),document.addEventListener(`mousemove`,e=>{if(o){a={x:e.clientX-s.x,y:e.clientY-s.y};let t=window.innerWidth-80,r=window.innerHeight-110;a.x=Math.max(0,Math.min(t,a.x)),a.y=Math.max(0,Math.min(r,a.y)),R(Z),n&&z(Q,Z)}}),document.addEventListener(`mouseup`,()=>{o=!1,I(Z),L(Z)}),document.addEventListener(`click`,e=>{if(!n)return;let t=X.querySelector(`#octopus-emoji-picker`),r=e.composedPath();r.includes(Z)||r.includes(Q)||t&&r.includes(t)||B(X)}),t.runtime.onMessage.addListener(e=>{e.type===`BROADCAST`&&Y()});let $=()=>{try{let e=t.runtime.connect({name:`octopus-content`});e.onMessage.addListener(e=>{e?.type===`BROADCAST`&&Y()}),e.onDisconnect.addListener(()=>{setTimeout($,800)})}catch{setTimeout($,800)}};$(),t.storage?.onChanged?.addListener&&t.storage.onChanged.addListener((e,t)=>{if(t===`local`){if(e.octopus_todo_data){Y();return}e[g]&&D().then(()=>J())}}),await D(),await Y(),T(window.location.href)&&B(X)}}),r={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)},i=class e extends Event{static EVENT_NAME=a(`wxt:locationchange`);constructor(t,n){super(e.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function a(e){return`${t?.runtime?.id}:content:${e}`}var o=typeof globalThis.navigation?.addEventListener==`function`;function s(e){let t,n=!1;return{run(){n||(n=!0,t=new URL(location.href),o?globalThis.navigation.addEventListener(`navigate`,e=>{let n=new URL(e.destination.url);n.href!==t.href&&(window.dispatchEvent(new i(n,t)),t=n)},{signal:e.signal}):e.setInterval(()=>{let e=new URL(location.href);e.href!==t.href&&(window.dispatchEvent(new i(e,t)),t=e)},1e3))}}}var c=class e{static SCRIPT_STARTED_MESSAGE_TYPE=a(`wxt:content-script-started`);id;abortController;locationWatcher=s(this);constructor(e,t){this.contentScriptName=e,this.options=t,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return t.runtime?.id??this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener(`abort`,e),()=>this.signal.removeEventListener(`abort`,e)}block(){return new Promise(()=>{})}setInterval(e,t){let n=setInterval(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(e,t){let n=setTimeout(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(e){let t=requestAnimationFrame((...t)=>{this.isValid&&e(...t)});return this.onInvalidated(()=>cancelAnimationFrame(t)),t}requestIdleCallback(e,t){let n=requestIdleCallback((...t)=>{this.signal.aborted||e(...t)},t);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(e,t,n,r){t===`wxt:locationchange`&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(t.startsWith(`wxt:`)?a(t):t,n,{...r,signal:this.signal})}notifyInvalidated(){this.abort(`Content script context invalidated`),r.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(e.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),this.options?.noScriptStartedPostMessage||window.postMessage({type:e.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},`*`)}verifyScriptStartedEvent(e){let t=e.detail?.contentScriptName===this.contentScriptName,n=e.detail?.messageId===this.id;return t&&!n}listenForNewerScripts(){let t=e=>{!(e instanceof CustomEvent)||!this.verifyScriptStartedEvent(e)||this.notifyInvalidated()};document.addEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t),this.onInvalidated(()=>document.removeEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t))}},l={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)};return(async()=>{try{let{main:e,...t}=n;return await e(new c(`content`,t))}catch(e){throw l.error(`The content script "content" crashed on startup!`,e),e}})()})();
content;