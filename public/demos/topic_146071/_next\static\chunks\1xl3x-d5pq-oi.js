(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,84834,e=>{"use strict";var t=e.i(18050),r=e.i(22016),n=e.i(18566);let a=(0,e.i(56420).default)("settings",[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);var i=e.i(20864);let o=[{href:"/chat",label:"聊天对话"},{href:"/style",label:"风格分析"},{href:"/inspirations",label:"灵感收藏"},{href:"/projects",label:"项目列表"}];e.s(["default",0,function(){let e=(0,n.usePathname)(),s=(0,i.useApiKeyStore)(e=>e.openDialog);return(0,t.jsx)("nav",{className:"bg-white border-b border-slate-200 sticky top-0 z-40",children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-6 h-[52px] flex items-center justify-between",children:[(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsxs)("span",{className:"text-[15px] font-semibold text-slate-900 mr-6 flex items-center gap-2",children:[(0,t.jsx)("span",{className:"w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm",children:"✍"}),"Novel Writer"]}),o.map(n=>{let a=e===n.href;return(0,t.jsx)(r.default,{href:n.href,className:`px-3 py-1.5 text-xs font-normal rounded-md transition-all duration-150 ${a?"bg-indigo-50 text-indigo-600 font-medium":"text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`,children:n.label},n.href)})]}),(0,t.jsx)("button",{onClick:s,className:"w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-all duration-150",title:"设置",children:(0,t.jsx)(a,{className:"w-4 h-4 text-slate-500"})})]})})}],84834)},69648,e=>{"use strict";var t=e.i(18050),r=e.i(71645),n=e.i(20864);function a({open:e,forceOpen:i=!1}){let[o,s]=(0,r.useState)(""),l=(0,n.useApiKeyStore)(e=>e.setApiKey),c=(0,n.useApiKeyStore)(e=>e.closeDialog);if(!e)return null;let d=()=>{let e=o.trim();e&&(l(e),window.location.reload())},p=()=>{i||(s(""),c())};return(0,t.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/40",onClick:i?void 0:p,children:(0,t.jsxs)("div",{className:"bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6",onClick:e=>e.stopPropagation(),children:[(0,t.jsx)("h3",{className:"text-base font-semibold text-slate-900 mb-2",children:"配置 DeepSeek API Key"}),(0,t.jsx)("p",{className:"text-sm text-slate-600 mb-4 leading-relaxed",children:"你的 key 仅存储在浏览器本地，不会上传到任何服务器。"}),(0,t.jsx)("input",{type:"password",value:o,onChange:e=>s(e.target.value),onKeyDown:e=>{"Enter"===e.key&&o.trim()&&d()},placeholder:"sk-...",autoFocus:!0,className:"w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 mb-3"}),(0,t.jsx)("a",{href:"https://platform.deepseek.com/api_keys",target:"_blank",rel:"noopener noreferrer",className:"inline-block text-xs text-indigo-600 hover:text-indigo-700 hover:underline mb-4 transition-all duration-150",children:"没有 key？点击注册，免费送 500 万 token →"}),(0,t.jsxs)("div",{className:"flex justify-end gap-2",children:[(0,t.jsx)("button",{onClick:p,disabled:i,className:"px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",children:"取消"}),(0,t.jsx)("button",{onClick:d,disabled:!o.trim(),className:"px-3 py-1.5 text-sm text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",children:"保存"})]})]})})}e.i(47167);let i=[];function o(e){i.push(...e)}async function s(e,t){let r="string"==typeof e?e:e instanceof URL?e.href:e.url,n=new URL(r,window.location.origin),a=n.pathname,o=(t?.method||"GET").toUpperCase();if(!a.startsWith("/api/"))return window.__originalFetch(e,t);let s=null;if(t?.body)try{s=JSON.parse(t.body)}catch{s=t.body}let l={method:o,url:n.href,pathname:a,searchParams:n.searchParams,body:s,signal:t?.signal??void 0};for(let e of i){if(e.method!==o)continue;let t=function(e,t){let r=e.split("/").filter(Boolean),n=t.split("/").filter(Boolean);if(r.length!==n.length)return null;let a={};for(let e=0;e<r.length;e++){let t=r[e],i=n[e];if(t.startsWith(":"))a[t.slice(1)]=decodeURIComponent(i);else if(t!==i)return null}return{params:a}}(e.pattern,a);if(t){l.params=t.params;try{let t=await e.handler(l);return new Response(JSON.stringify(t.body),{status:t.status||200,headers:{"Content-Type":"application/json",...t.headers}})}catch(e){return new Response(JSON.stringify({error:e instanceof Error?e.message:"Mock handler 错误"}),{status:500,headers:{"Content-Type":"application/json"}})}}}return window.__originalFetch(e,t)}var l=e.i(43555),c=e.i(58056),d=e.i(70564);function p(e){return{id:e.book_id,title:e.display_name,uploadedAt:e.created_at,vectorized:!0}}function u(){d.useBookStore.setState({books:(0,c.listBooks)().map(p)})}async function h(e){return e.body??{}}function m(e,t=200){return{status:t,body:e}}function f(e,t){return{status:t,body:{error:e}}}function y(e,t=200){return{status:t,body:e}}function _(e,t=200){return{status:t,body:e}}function g(e,t){return{status:t,body:{error:e}}}o([{method:"GET",pattern:"/api/books",handler:async()=>m((0,c.listBooks)())},{method:"POST",pattern:"/api/books",handler:async e=>{let{displayName:t}=await h(e);if(!t||"string"!=typeof t||!t.trim())return f("缺少 displayName",400);let r=(0,c.findOrCreateBook)(t);return u(),m(r)}},{method:"PUT",pattern:"/api/books/:id",handler:async e=>{let t=e.params?.id;if(!t)return f("缺少 id",400);let{displayName:r}=await h(e);if(!r||"string"!=typeof r||!r.trim())return f("缺少 displayName",400);try{let e=(0,c.updateBookName)(t,r);if(!e)return f("书不存在",404);return u(),m(e)}catch(e){return f(e instanceof Error?e.message:"更新失败",400)}}},{method:"DELETE",pattern:"/api/books/:id",handler:async e=>{let t=e.params?.id;return t?(0,c.deleteBook)(t)?(u(),m({success:!0})):f("书不存在",404):f("缺少 id",400)}},{method:"POST",pattern:"/api/ingest",handler:async e=>{let{bookId:t,text:r}=await h(e);return t&&r?m({stored:Math.max(1,Math.ceil(String(r).length/1e3))}):f("缺少 bookId 或 text 参数",400)}}]),o([{method:"GET",pattern:"/api/stories",handler:async e=>{let t=e.searchParams.get("bookId")||void 0;return y((0,c.listStories)(t))}},{method:"POST",pattern:"/api/stories",handler:async e=>{let{storyName:t,bookIds:r}=e.body??{};return t&&Array.isArray(r)&&0!==r.length?y((0,c.findOrCreateStory)(t,r)):{status:400,body:{error:"缺少 storyName 或 bookIds（需非空数组）"}}}}]),o([{method:"GET",pattern:"/api/inspirations",handler:async()=>_((0,c.listInspirations)())},{method:"POST",pattern:"/api/inspirations",handler:async e=>{let{content:t,book_id:r}=e.body??{};return t&&r?_((0,c.createInspiration)(t,r)):g("缺少 content 或 book_id",400)}},{method:"PATCH",pattern:"/api/inspirations",handler:async e=>{let{id:t,sent_to_outline:r}=e.body??{};if(!t)return g("缺少 id",400);let n=(0,c.updateInspiration)(t,!!r);return n?_(n):g("灵感不存在",404)}}]);var x=e.i(9159);function b(e){let t=e.trim();return t.startsWith("```")&&(t=t.replace(/^```(?:json)?\n?/,"").replace(/\n?```$/,"")),JSON.parse(t=t.replace(/"(?:[^"\\]|\\.)*"/g,e=>e.replace(/[\x00-\x1F\x7F]/g,e=>{switch(e){case"\n":return"\\n";case"\r":return"\\r";case"	":return"\\t";case"\b":return"\\b";case"\f":return"\\f";default:return"\\u"+e.charCodeAt(0).toString(16).padStart(4,"0")}})))}let S=`你是一个文本风格分析专家。请分析以下用户提供的废稿文本，提取语言层面的风格特征。

请从以下 8 个维度进行分析，输出标准 JSON：

1. sentence_length: 句子长度偏好（如"偏短，平均8-15字"）
2. dialogue_ratio: 对话占比（如"约30-40%"）
3. verb_preference: 偏好使用的动词列表（如 ["走","停","看","翻"]）
4. punctuation_style: 标点符号使用习惯（如 ["——","……","句号多于逗号"]）
5. emotion_delivery: 情感表达方式（如"通过动作和沉默传递，不直接写'他感到'"）
6. abstraction_level: 抽象程度（如"低，少用抽象名词"）
7. chapter_pacing: 章节节奏（如"日常场景慢，关键事件快"）
8. narrative_distance: 叙事距离（如"第三人称有限，紧贴主角感知"）

输出格式要求：
- 输出标准 JSON，不要 markdown 代码块包裹
- JSON 的 key 为上述 8 个字段名
- verb_preference 和 punctuation_style 为字符串数组，其余为字符串

以下是用户提供的废稿文本：

---
{manuscripts}
---

请基于以上文本分析，输出 JSON：`,w=`你是一个叙事风格分析专家。用户会用自然语言描述自己的创作偏好，请从中提取叙事层面的风格特征。

请从以下 6 个维度进行分析，输出标准 JSON：

1. pace: 叙事节奏（如"平缓中带微澜，日常场景占比高"）
2. conflict_preference: 冲突偏好（如"冲突是人物立场不同时自然产生的，不靠外力强行制造"）
3. coincidence_usage: 巧合使用（如"喜欢'表面巧合、实则必然'的展开"）
4. plot_architecture: 情节结构（如"偏好编织型结构——多条线各自发展，最后交汇"）
5. emotional_turning_points: 情感转折点（如"不靠大事件推动，情感藏在日常细节里"）
6. revelation_style: 揭示方式（如"喜欢让读者自己发现线索，而非由角色主动揭晓"）

输出格式要求：
- 输出标准 JSON，不要 markdown 代码块包裹
- 所有字段值均为字符串

用户的偏好描述如下：

---
{description}
---

请基于以上描述，输出 JSON：`,O=`你是一个文本风格分析专家。我会给你一份【现有风格档案】和【新输入内容】（可能是新的废稿分析或新的偏好描述）。

请基于新输入更新风格档案，规则：
1. 保留现有档案中未受影响的字段
2. 新输入能体现的特征，覆盖或补充现有字段
3. 在输出JSON末尾增加一个"changes"数组，列出本次发生变化的字段路径及变化说明
4. 如果新输入与现有档案冲突，以新输入为准（用户审美在演进）

输出格式要求：
- 输出标准 JSON，不要 markdown 代码块包裹
- 保留 textual_style（8个字段）和 narrative_style（6个字段）的结构
- changes 数组每项包含：field_path（字段路径）、previous（旧值）、updated（新值）、reason（变化原因）
- 如果没有字段变化，changes 为空数组
- 末尾加 updated_at 字段，值为当前时间的 ISO8601 格式

【现有风格档案】：
{existing_profile}

【新输入内容】：
{new_analysis}

请合并更新，输出完整 JSON：`;async function v(e,t,r){let n=(0,x.getClient)(),a=await n.chat.completions.create({model:t,messages:e,stream:!1},{signal:r});return a.choices[0]?.message?.content||""}async function I(e,t){let r=e.map((e,t)=>`【废稿 ${t+1}】
${e}`).join("\n\n---\n\n"),n=S.replace("{manuscripts}",r);return b(await v([{role:"user",content:n}],x.DEEPSEEK_MODELS.reasoner,t))}async function E(e,t){let r=w.replace("{description}",e);return b(await v([{role:"user",content:r}],x.DEEPSEEK_MODELS.reasoner,t))}async function k(e,t,r){let n=e??{textual_style:{sentence_length:"",dialogue_ratio:"",verb_preference:[],punctuation_style:[],emotion_delivery:"",abstraction_level:"",chapter_pacing:"",narrative_distance:""},narrative_style:{pace:"",conflict_preference:"",coincidence_usage:"",plot_architecture:"",emotional_turning_points:"",revelation_style:""},changes:[],updated_at:new Date().toISOString()},a=O.replace("{existing_profile}",JSON.stringify(n,null,2)).replace("{new_analysis}",JSON.stringify(t,null,2));return b(await v([{role:"user",content:a}],x.DEEPSEEK_MODELS.reasoner,r))}function P(e,t=200){return{status:t,body:e}}function N(e,t){return{status:t,body:{error:e}}}function C(e,t){let r=(0,c.loadProfileRecord)(e),n=new Date().toISOString();r?(0,c.saveProfileRecord)({...r,profile:t}):(0,c.saveProfileRecord)({profile_id:e,profile_name:"默认方案",book_id:null,profile:t,created_at:n,updated_at:n})}o([{method:"GET",pattern:"/api/style-profiles",handler:async()=>P((0,c.listProfileSummaries)())},{method:"POST",pattern:"/api/style-profiles",handler:async e=>{let{profileName:t,bookId:r}=e.body??{};return t&&"string"==typeof t&&t.trim()?P((0,c.createProfileRecord)(t,"string"==typeof r?r:null)):N("缺少 profileName",400)}},{method:"GET",pattern:"/api/style-profiles/:profileId",handler:async e=>{let t=e.params?.profileId;if(!t)return N("缺少 profileId",400);let r=(0,c.loadProfileRecord)(t);return r?P(r):N("方案不存在",404)}},{method:"PUT",pattern:"/api/style-profiles/:profileId",handler:async e=>{let t=e.params?.profileId;if(!t)return N("缺少 profileId",400);let r=(0,c.loadProfileRecord)(t);if(!r)return N("方案不存在",404);let n=e.body??{},a={...r};return n.profile&&"object"==typeof n.profile&&(a.profile=n.profile),"string"==typeof n.profileName&&(a.profile_name=n.profileName),void 0!==n.bookId&&(a.book_id="string"==typeof n.bookId?n.bookId:null),P((0,c.saveProfileRecord)(a))}},{method:"DELETE",pattern:"/api/style-profiles/:profileId",handler:async e=>{let t=e.params?.profileId;return t?(0,c.deleteProfileRecord)(t)?P({success:!0}):N("方案不存在",404):N("缺少 profileId",400)}},{method:"POST",pattern:"/api/style/analyze-textual",handler:async e=>{let{manuscripts:t,profileId:r}=e.body??{};if(!t||!Array.isArray(t)||0===t.length)return N("请提供至少一篇废稿文本",400);if(t.length>10)return N("一次最多上传 10 篇废稿",400);if(!r||"string"!=typeof r)return N("缺少 profileId",400);let n=await I(t,e.signal),a=(0,c.loadProfileRecord)(r),i=a?.profile??null,o=await k(i,{textual_style:n},e.signal);return C(r,o),P({profile:o})}},{method:"POST",pattern:"/api/style/analyze-narrative",handler:async e=>{let{description:t,profileId:r}=e.body??{};if(!t||"string"!=typeof t||0===t.trim().length)return N("请提供偏好描述文本",400);if(!r||"string"!=typeof r)return N("缺少 profileId",400);let n=await E(t,e.signal),a=(0,c.loadProfileRecord)(r),i=a?.profile??null,o=await k(i,{narrative_style:n},e.signal);return C(r,o),P({profile:o})}}]);var T=e.i(55544),j=e.i(61583),A=e.i(16529);let D=`你是一位资深同人小说策划师。请基于以下信息，为用户生成一份同人小说的总体大纲。

要求：
1. 300-500 字
2. 包含：故事起点和终点、主要矛盾线（1-2 条）、核心角色变化方向
3. 风格要符合用户的写作偏好
4. 不要写具体章节内容，只写总体走向
5. 如果用户提供了自己的想法或半成品大纲，请在此基础上扩展和完善，而非另起炉灶

【原作参考】：
{rag_context}

【用户风格偏好】：
{style_profile}

【用户讨论历史】：
{chat_history}

【用户的想法/半成品大纲】：
{user_idea}

请生成总体大纲：`,J=`你是一位资深同人小说策划师。请将以下总体大纲拆解为若干"单元"，每个单元包含 {chapters_per_unit} 章。

要求：
1. 每个单元用 2-3 句话描述该单元的故事推进目标
2. 单元之间要有递进关系，整体节奏合理
3. 标注每个单元覆盖的章节范围（如"第1-{chapters_per_unit}章"）
4. 输出 JSON 数组，每个元素包含：unit_index（从1开始）、chapters_range、goal

【总体大纲】：
{overall_content}

请输出单元列表（JSON 数组，不要 markdown 代码块包裹）：`,K=`你是一位资深同人小说策划师。请为以下单元生成每章的具体章纲。

要求：
1. 每章用 1-2 句话概括该章的核心事件和情感走向
2. 章与章之间要有连贯性和递进感
3. 风格要符合用户的写作偏好
4. 输出 JSON 数组，每个元素包含：chapter_index（从1开始）、summary

【总体大纲】：
{overall_content}

【当前单元目标】（{chapters_range}）：
{unit_goal}

【用户风格偏好】：
{style_profile}

请输出章纲列表（JSON 数组，不要 markdown 代码块包裹）：`,$=`你是一位资深同人小说策划师。故事已经写到第 {start_chapter} 章之前，现在需要重新规划从第 {start_chapter} 章到第 {end_chapter} 章的章纲。

要求：
1. 必须严格接续已完成章节的情节，不能与前文矛盾
2. 充分参考用户的"新方向说明"
3. 每章用 1-2 句话概括该章的核心事件和情感走向
4. 章与章之间要有连贯性和递进感
5. 风格要符合用户的写作偏好
6. 输出 JSON 数组，每个元素包含：chapter_index（从 {start_chapter} 开始）、summary

【总体大纲】：
{overall_content}

【已完成章节摘要】（必须接续这些情节）：
{completed_chapters_summary}

【最近章节完整正文】（参考文风和细节）：
{recent_chapter_texts}

【用户的新方向说明】：
{user_direction}

【用户风格偏好】：
{style_profile}

请输出从第 {start_chapter} 章到第 {end_chapter} 章的章纲列表（JSON 数组，不要 markdown 代码块包裹）：`;async function R(e,t,r){let n=(0,x.getClient)(),a=await n.chat.completions.create({model:t,messages:e,stream:!1},{signal:r});return a.choices[0]?.message?.content||""}async function z(e,t){let{bookIds:r,chatHistory:n,styleProfile:a,userIdea:i}=e,o=(await (0,A.mockRetrieve)("故事主线、核心角色、重要设定",r)).map(e=>`[相关度${e.score.toFixed(2)}] ${e.text}`).join("\n\n")||"无";return R([{role:"user",content:D.replace("{rag_context}",o).replace("{style_profile}",a||"未提供").replace("{chat_history}",n||"无").replace("{user_idea}",i||"无")}],x.DEEPSEEK_MODELS.chat,t)}async function M(e,t){let{overallContent:r,chaptersPerUnit:n=10}=e,a=J.replace(/{chapters_per_unit}/g,String(n)).replace("{overall_content}",r);return b(await R([{role:"user",content:a}],x.DEEPSEEK_MODELS.chat,t)).map((e,t)=>({unit_index:t+1,chapters_range:e.chapters_range,goal:e.goal,confirmed_at:null}))}async function G(e,t){let{overallContent:r,unitGoal:n,chaptersRange:a,styleProfile:i,wordsPerChapter:o}=e,s=K.replace("{overall_content}",r).replace("{unit_goal}",n).replace("{chapters_range}",a).replace("{style_profile}",i||"未提供");return b(await R([{role:"user",content:s}],x.DEEPSEEK_MODELS.chat,t)).map((e,t)=>({chapter_index:t+1,summary:e.summary,status:"draft",notes:"",word_count:o||3e3}))}async function L(e,t){let{overallContent:r,startChapter:n,endChapter:a,completedChaptersSummary:i,recentChapterTexts:o,userDirection:s,styleProfile:l,wordsPerChapter:c}=e,d=$.replace(/{overall_content}/g,r).replace(/{start_chapter}/g,String(n)).replace(/{end_chapter}/g,String(a)).replace("{completed_chapters_summary}",i||"（暂无已完成章节）").replace("{recent_chapter_texts}",o.join("\n\n")||"（无完整正文）").replace("{user_direction}",s||"（用户未提供具体方向，请基于已完成章节自然推进）").replace("{style_profile}",l||"未提供");return b(await R([{role:"user",content:d}],x.DEEPSEEK_MODELS.chat,t)).map((e,t)=>({chapter_index:n+t,summary:e.summary,status:"draft",notes:"",word_count:c||3e3}))}function B(e,t=200){return{status:t,body:e}}function U(e,t){return{status:t,body:{error:e}}}async function F(e,t,r,n,a){let i=[],o=`你是一位专业的小说细纲策划师。根据章节大纲摘要，生成该章的【细纲】—— 即该章需要写的 5-8 个场景概述。每个场景概述 100-200 字，描述该场景发生的核心事件。

严格要求：
- 返回纯 JSON 数组，不要包含任何其他文字
- 数组格式：[{"scene_index": 1, "summary": "场景概述..."}, ...]
- scene_index 从 1 开始递增
- 场景数量 5-8 个，不要多也不要少`;n&&(o+=`

以下是小说的风格档案，所有生成内容必须严格遵循此风格：
${n}`),i.push({role:"system",content:o}),i.push({role:"user",content:`章纲摘要：
${r}`});let s=(0,x.getClient)(),l=await s.chat.completions.create({model:x.DEEPSEEK_MODELS.chat,messages:i,stream:!1,temperature:.7,max_tokens:3e3},a?{signal:a}:void 0),d=(l.choices[0]?.message?.content||"").trim(),p=d.match(/```(?:json)?\s*([\s\S]*?)```/);p&&(d=p[1].trim());let u=JSON.parse(d);if(!Array.isArray(u)||0===u.length)throw Error("细纲生成失败：未返回有效的场景数组");let h=new Date().toISOString(),m={story_id:e,chapter_index:t,scenes:u.map((e,t)=>({scene_index:t+1,summary:e.summary})),status:"draft",created_at:h,confirmed_at:null};return(0,c.saveChapterDetail)(e,t,m),u}o([{method:"GET",pattern:"/api/outline",handler:async e=>{let t=e.searchParams.get("storyId");if(!t)return U("缺少 storyId",400);let r=(0,c.loadOutline)(t);return B({outline:r?(0,T.normalizeOutline)(r):null})}},{method:"POST",pattern:"/api/outline",handler:async e=>{let t=e.body??{};return t.story_id?((0,c.saveOutline)(t.story_id,t),B({success:!0})):U("缺少 story_id",400)}},{method:"POST",pattern:"/api/outline/generate-overall",handler:async e=>{let{bookIds:t,chatHistory:r,styleProfile:n,userIdea:a}=e.body??{};return Array.isArray(t)&&0!==t.length?B({content:await z({bookIds:t,chatHistory:r,styleProfile:n,userIdea:a},e.signal)}):U("缺少 bookIds（需非空数组）",400)}},{method:"POST",pattern:"/api/outline/split-units",handler:async e=>{let{overallContent:t,chaptersPerUnit:r}=e.body??{};return t?B({units:await M({overallContent:t,chaptersPerUnit:r||10},e.signal)}):U("缺少总体大纲内容",400)}},{method:"POST",pattern:"/api/outline/generate-chapters",handler:async e=>{let{overallContent:t,unitGoal:r,chaptersRange:n,styleProfile:a,wordsPerChapter:i}=e.body??{};return t&&r&&n?B({chapters:await G({overallContent:t,unitGoal:r,chaptersRange:n,styleProfile:a,wordsPerChapter:i},e.signal)}):U("缺少总体大纲、单元目标或章节范围",400)}},{method:"PATCH",pattern:"/api/outline/chapter",handler:async e=>{let{storyId:t,unitIndex:r,chapterIndex:n,summary:a,notes:i,word_count:o}=e.body??{};if(!t||null==r||null==n)return U("缺少 storyId / unitIndex / chapterIndex",400);if(void 0===a&&void 0===i&&void 0===o)return U("未提供任何修改字段",400);let s=(0,c.loadOutline)(t);if(!s)return U("未找到大纲文件",404);let l=(0,T.normalizeOutline)(s);if("locked"!==l.state)return U(`当前状态 ${l.state} 不允许此操作，仅 locked 状态下可编辑未写章节大纲`,400);let d=l.unit_chapter_outlines[r];if(!Array.isArray(d))return U("未找到该单元的章纲",404);let p=d.findIndex(e=>e.chapter_index===n);if(p<0)return U("未找到该章节",404);let u=(0,c.loadChapterSegments)(t,n);if(u&&Array.isArray(u.segments)&&u.segments.length>0)return U("该章节已有段落，不能修改大纲。如需调整，请先清理该章段落。",400);let h={...d[p]};return void 0!==a&&(h.summary=a),void 0!==i&&(h.notes=i),void 0!==o&&(h.word_count=Math.max(500,o)),d[p]=h,l.unit_chapter_outlines[r]=d,(0,c.saveOutline)(t,l),B({chapter:h})}},{method:"POST",pattern:"/api/outline/regenerate-chapters",handler:async e=>{let{storyId:t,startChapterIndex:r,userDirection:n,styleProfile:a}=e.body??{};if(!t||!r)return U("缺少 storyId 或 startChapterIndex",400);let i=(0,c.loadOutline)(t);if(!i)return U("未找到大纲文件",404);let o=(0,T.normalizeOutline)(i);if("locked"!==o.state)return U(`当前状态 ${o.state} 不允许此操作`,400);let s=(0,j.flattenChapters)(o);if(0===s.length)return U("大纲为空",400);let l=s[s.length-1].chapter_index;if(r>l)return U("起始章超过总章数",400);for(let e of s.filter(e=>e.chapter_index>=r)){let r=(0,c.loadChapterSegments)(t,e.chapter_index);if(r&&Array.isArray(r.segments)&&r.segments.length>0)return U(`第 ${e.chapter_index} 章已有段落，无法重新规划。请从该章之后开始。`,400)}let d=(0,c.loadChapterSummaries)(t).filter(e=>e.chapter_index<r).sort((e,t)=>e.chapter_index-t.chapter_index).map(e=>`第${e.chapter_index}章：${e.summary}`).join("\n"),p=s.filter(e=>e.chapter_index<r),u=[];for(let e of p.slice(-2)){let r=function(e,t){let r=(0,c.loadChapterSegments)(e,t);return r&&Array.isArray(r.segments)&&0!==r.segments.length?r.segments.map(e=>e.content).join("\n\n"):""}(t,e.chapter_index);r&&u.push(`第${e.chapter_index}章：
${r}`)}return B({chapters:await L({overallContent:o.overall_outline.content,startChapter:r,endChapter:l,completedChaptersSummary:d,recentChapterTexts:u,userDirection:n||"",styleProfile:a,wordsPerChapter:o.words_per_chapter},e.signal),startChapterIndex:r,endChapterIndex:l})}},{method:"POST",pattern:"/api/outline/replace-chapters",handler:async e=>{let{storyId:t,startChapterIndex:r,chapters:n}=e.body??{};if(!t||!r||!Array.isArray(n))return U("参数不完整",400);let a=(0,c.loadOutline)(t);if(!a)return U("未找到大纲文件",404);let i=(0,T.normalizeOutline)(a);if("locked"!==i.state)return U(`当前状态 ${i.state} 不允许此操作`,400);let o=(0,j.flattenChapters)(i),s=new Map;for(let e of o)s.set(e.chapter_index,{unitIndex:e.unit_index,chapterIndex:e.chapter_index});let l={};for(let e of Object.keys(i.unit_chapter_outlines))l[Number(e)]=i.unit_chapter_outlines[Number(e)].map(e=>({...e}));let d=0;for(let e of n){let r=s.get(e.chapter_index);if(!r)return U(`未找到第 ${e.chapter_index} 章在大纲中的位置`,400);let n=l[r.unitIndex];if(!n)return U(`单元 ${r.unitIndex} 不存在`,400);let a=n.findIndex(e=>e.chapter_index===r.chapterIndex),o=(0,c.loadChapterSegments)(t,r.chapterIndex);if(o&&Array.isArray(o.segments)&&o.segments.length>0)return U(`第 ${e.chapter_index} 章已完成，不能替换`,400);let p={chapter_index:r.chapterIndex,summary:e.summary,status:"draft",notes:e.notes||"",word_count:e.word_count||i.words_per_chapter};a>=0?n[a]=p:n.push(p),d++}let p={...i,unit_chapter_outlines:l};return(0,c.saveOutline)(t,p),B({success:!0,replacedCount:d,startChapterIndex:r})}}]);var W=e.i(65188);function H(e,t=200){return{status:t,body:e}}function q(e,t){return{status:t,body:{error:e}}}o([{method:"GET",pattern:"/api/writing/chapters",handler:async e=>{let t=e.searchParams.get("storyId");if(!t)return q("缺少 storyId 参数",400);let r=(0,c.loadOutline)(t);if(!r)return q("未找到该故事的大纲",404);let n=(0,T.normalizeOutline)(r);return"locked"!==n.state?q("大纲尚未锁定，请先完成大纲共创",400):H({chapters:(0,j.flattenChapters)(n),totalWordCount:n.total_word_count})}},{method:"GET",pattern:"/api/writing/detail",handler:async e=>{let t=e.searchParams.get("storyId"),r=parseInt(e.searchParams.get("chapterIndex")||"",10);return!t||isNaN(r)?q("缺少 storyId 或 chapterIndex 参数",400):H({detail:(0,c.loadChapterDetail)(t,r)})}},{method:"POST",pattern:"/api/writing/detail",handler:async e=>{let{storyId:t,chapterIndex:r,chapterSummary:n,styleProfile:a}=e.body??{};if(!t||null==r||!n)return q("缺少 storyId / chapterIndex / chapterSummary",400);try{let i=await F(t,r,n,a,e.signal);return H({scenes:i})}catch(e){return q(e instanceof Error?e.message:"生成失败",500)}}},{method:"PUT",pattern:"/api/writing/detail",handler:async e=>{let{storyId:t,chapterIndex:r,scenes:n,confirmed:a}=e.body??{};if(!t||null==r||!Array.isArray(n))return q("缺少 storyId / chapterIndex / scenes",400);let i=new Date().toISOString(),o={story_id:t,chapter_index:r,scenes:n,status:a?"confirmed":"draft",created_at:i,confirmed_at:a?i:null},s=(0,c.loadChapterDetail)(t,r);return s&&(o.created_at=s.created_at),(0,c.saveChapterDetail)(t,r,o),H({detail:o})}},{method:"GET",pattern:"/api/writing/segments",handler:async e=>{let t=e.searchParams.get("storyId"),r=parseInt(e.searchParams.get("chapterIndex")||"",10);if(!t||isNaN(r))return q("缺少 storyId 或 chapterIndex 参数",400);let n=(0,c.loadChapterSegments)(t,r);return H({segments:n?.segments||[]})}},{method:"PUT",pattern:"/api/writing/segments",handler:async e=>{let{storyId:t,chapterIndex:r,segmentIndex:n,content:a}=e.body??{};if(!t||null==r||null==n||!a)return q("缺少必要参数",400);let i=(0,c.loadChapterSegments)(t,r),o=i?.segments||[],s=o.findIndex(e=>e.segment_index===n),l={segment_index:n,content:a,status:"confirmed",created_at:new Date().toISOString()};return s>=0?o[s]=l:o.push(l),o.sort((e,t)=>e.segment_index-t.segment_index),(0,c.saveChapterSegments)(t,r,{story_id:t,chapter_index:r,segments:o}),H({segment:l})}},{method:"POST",pattern:"/api/writing/summarize",handler:async e=>{let{storyId:t,chapterIndex:r}=e.body??{};if(!t||null==r)return q("缺少 storyId / chapterIndex",400);try{let n=await (0,W.demoSummarizeChapter)(t,r,e.signal);return H({summary:n})}catch(e){return q(e instanceof Error?e.message:"生成摘要失败",500)}}},{method:"GET",pattern:"/api/writing/export-story",handler:async e=>{let t=e.searchParams.get("storyId");if(!t)return q("缺少 storyId 参数",400);let r=(0,c.getStoryById)(t),n=r?.story_name||t,a=(0,c.loadOutline)(t);if(!a)return q("未找到该故事的大纲",404);let i=(0,T.normalizeOutline)(a);return"locked"!==i.state?q("大纲尚未锁定，请先完成大纲共创",400):H({storyName:n,chapters:(0,j.flattenChapters)(i).map(e=>{var r;let n,a=(r=e.chapter_index,(n=(0,c.loadChapterSegments)(t,r))&&Array.isArray(n.segments)&&0!==n.segments.length?n.segments.map(e=>e.content).join("\n\n"):"");return{chapter_index:e.chapter_index,global_index:e.global_index,summary:e.summary,content:a}}).filter(e=>e.content)})}}]),window.__originalFetch||((0,l.seedDemoData)(),window.__originalFetch=window.fetch,window.fetch=s,console.log("[demo] fetch monkey patch installed + sample book seeded")),e.s(["ApiKeyGate",0,function({children:e}){let[i,o]=(0,r.useState)(!1),s=(0,n.useApiKeyStore)(e=>e.apiKey),l=(0,n.useApiKeyStore)(e=>e.dialogOpen);return((0,r.useEffect)(()=>{o(!0)},[]),i)?s?(0,t.jsxs)(t.Fragment,{children:[e,(0,t.jsx)(a,{open:l})]}):(0,t.jsx)(a,{open:!0,forceOpen:!0}):null}],69648)}]);