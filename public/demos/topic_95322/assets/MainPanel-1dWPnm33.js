var ct=Object.defineProperty;var Me=l=>{throw TypeError(l)};var ut=(l,e,t)=>e in l?ct(l,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):l[e]=t;var C=(l,e,t)=>ut(l,typeof e!="symbol"?e+"":e,t),pt=(l,e,t)=>e.has(l)||Me("Cannot "+t);var Ee=(l,e,t)=>e.has(l)?Me("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(l):e.set(l,t);var re=(l,e,t)=>(pt(l,e,"access private method"),t);import{ap as ht,r as L,l as q,d as _e,o as $e,b as j,c as v,e as S,f as w,g as m,u as y,h as _,S as ae,T as xe,X as ce,G as Z,t as A,W as Q,ac as be,C as P,n as dt,i as ft,aq as gt,ar as mt,E as kt,_ as Te,w as He,Q as je,V as Be,as as he,at as xt,x as qe,au as bt,av as wt,aw as yt,ax as vt,ay as _t}from"./_plugin-vue_export-helper-CYg3jxHD.js";import{h as $t,i as Tt,g as zt,j as Rt,k as St,c as Ct,l as It,m as At,r as Pt}from"./runtimeConfig-Cqy2auUS.js";import{f as Lt,a as Xe,c as Mt}from"./defaultAI-DwWw1Mla.js";import{u as Et}from"./sidepanel-Cq5ON3D3.js";import{u as Ht,c as De,d as jt}from"./exportHistoryRepository-C-fzwXcG.js";const ze=ht("screenshot",()=>{const l=L([]),e=L([]),t=L(!1),n=L([]),s=L(null),o=q(()=>e.value.length),i=q(()=>l.value.length>0),r=q(()=>s.value===null?l.value:l.value.filter(h=>h.projectId===s.value)),a=q(()=>r.value.length>0&&r.value.every(h=>h.id!==void 0&&e.value.includes(h.id)));async function p(){t.value=!0;try{await $t(),l.value=await Tt(),await c()}finally{t.value=!1}}async function c(){n.value=await zt()}function f(h){const x=e.value.indexOf(h);x>=0?e.value.splice(x,1):e.value.push(h)}function u(h){if(h===void 0)return 0;const x=e.value.indexOf(h);return x>=0?x+1:0}function d(){e.value=r.value.map(h=>h.id).filter(h=>typeof h=="number")}function z(){e.value=[]}function I(h){s.value=h,e.value=[]}async function M(h){await Rt(h);const x=e.value.indexOf(h);x>=0&&e.value.splice(x,1),await p()}function U(){const h=new Map;for(const x of l.value)x.id!==void 0&&h.set(x.id,x);return e.value.map(x=>h.get(x)).filter(x=>x!==void 0)}async function W(h,x,g){await St(h,x,g),await p(),e.value=[]}async function R(){await p()}return{records:l,filteredRecords:r,selectedIds:e,loading:t,selectedCount:o,hasRecords:i,projects:n,selectedProjectId:s,allSelected:a,loadRecords:p,loadProjects:c,setSelectedProject:I,toggleSelect:f,getSelectionOrder:u,selectAll:d,deselectAll:z,deleteRecord:M,getSelectedRecords:U,refresh:R,bulkMoveToProject:W}}),Bt={class:"screenshot-list"},qt={class:"filter-row"},Dt={class:"select-row"},Ut={class:"select-actions"},Nt={class:"selected-tip"},Zt={class:"list-items"},Ot=["title"],Ft={class:"item-thumb"},Vt=["src","alt"],Qt={key:1,class:"html-thumb-placeholder"},Wt={class:"html-thumb-title"},Xt={class:"html-thumb-subtitle"},Gt={key:2,class:"thumb-placeholder"},Jt={class:"item-info"},Kt=["title"],Yt={class:"item-tags"},en={key:0,class:"tag tag-html"},tn={key:1,class:"tag tag-prototype"},nn={key:2,class:"tag tag-project"},sn={class:"item-time"},on={class:"item-actions"},ln={key:1,class:"empty-list"},rn=["srcdoc"],an=["src","alt"],cn={key:1,class:"preview-desc"},un={class:"move-text"},pn={style:{display:"flex","justify-content":"flex-end",gap:"8px"}},hn=_e({__name:"ScreenshotList",setup(l){const e=ze(),t=q(()=>e.filteredRecords),n=L(!1),s=L(null),o=L(!1),i=q(()=>e.allSelected),r=L(!1),a=L(null),p=L(""),c=q(()=>e.projects);function f(){i.value?e.deselectAll():e.selectAll()}function u(g){g==="__all__"?e.setSelectedProject(null):e.setSelectedProject(typeof g=="number"?g:parseInt(g,10))}async function d(){const g=e.selectedIds;if(g.length===0)return;let b,E;if(a.value==="__new__"){const H=p.value.trim();if(!H){P.warning("请输入新项目名称");return}if(H.length>50){P.warning("新项目名称不超过 50 个字符");return}const V=c.value.find(N=>N.name.toLowerCase()===H.toLowerCase());V?(b=V.id,E=V.name):(b=await Ct({name:H}),E=H)}else{if(a.value===null||typeof a.value=="string"){P.warning("请选择目标项目");return}const H=c.value.find(V=>V.id===a.value);if(!H){P.warning("项目不存在");return}b=H.id,E=H.name}await e.bulkMoveToProject(g,b,E),P.success(`已移动到「${E}」`),r.value=!1,a.value=null,p.value=""}function z(){a.value=null,p.value=""}function I(g){return g===void 0?!1:e.selectedIds.includes(g)}function M(g){return(g.recordType==="html"||g.recordType==="prototype")&&At(g.thumbnail)}function U(g){return e.getSelectionOrder(g)}function W(g){if(g.id===void 0)return;const b=chrome.runtime.getURL("src/editor/index.html")+`?mode=edit&id=${g.id}`;chrome.tabs.create({url:b})}async function R(g){if(g.id!==void 0){try{await kt.confirm(`确认删除「${g.name}」？此操作不可恢复。`,"删除确认",{type:"warning",confirmButtonText:"删除",cancelButtonText:"取消",confirmButtonClass:"el-button--danger"})}catch{return}try{await e.deleteRecord(g.id),P.success("已删除")}catch(b){const E=b instanceof Error?b.message:"删除失败";P.error(E)}}}function h(g){s.value=g,n.value=!0}async function x(){const g=await It();g&&g.quota>0&&g.usage/g.quota>.8&&(o.value=!0)}return $e(()=>{x()}),(g,b)=>{const E=j("el-option"),H=j("el-select"),V=j("el-checkbox"),N=j("el-button"),ee=j("el-icon"),G=j("el-tooltip"),X=j("el-alert"),te=j("el-dialog"),at=j("el-input");return v(),S("div",Bt,[w("div",qt,[m(H,{"model-value":y(e).selectedProjectId??"__all__",placeholder:"选择项目",size:"small",style:{width:"100%"},onChange:u},{default:_(()=>[m(E,{label:"全部项目",value:"__all__"}),(v(!0),S(ae,null,xe(y(e).projects,k=>(v(),ce(E,{key:k.id,label:k.name,value:k.id},null,8,["label","value"]))),128))]),_:1},8,["model-value"])]),w("div",Dt,[m(V,{"model-value":i.value,onChange:f},{default:_(()=>[Z(A(i.value?"取消全选":"全选"),1)]),_:1},8,["model-value"]),w("div",Ut,[w("span",Nt," 已选 "+A(y(e).selectedCount)+" / "+A(t.value.length),1),m(N,{size:"small",disabled:y(e).selectedCount===0,onClick:b[0]||(b[0]=k=>r.value=!0)},{default:_(()=>[...b[6]||(b[6]=[Z(" 变更项目 ",-1)])]),_:1},8,["disabled"])])]),w("div",Zt,[(v(!0),S(ae,null,xe(t.value,k=>(v(),S("div",{key:k.id,class:dt(["card list-item",{selected:I(k.id)}])},[m(V,{"model-value":I(k.id),class:"item-checkbox",onChange:ke=>k.id!==void 0&&y(e).toggleSelect(k.id)},null,8,["model-value","onChange"]),U(k.id)>0?(v(),S("span",{key:0,class:"selection-badge",title:`第 ${U(k.id)} 个导出`},A(U(k.id)),9,Ot)):Q("",!0),w("div",Ft,[k.thumbnail&&!M(k)?(v(),S("img",{key:0,src:k.thumbnail,alt:k.name},null,8,Vt)):M(k)?(v(),S("div",Qt,[w("div",Wt,A(k.name||"未命名页面"),1),w("div",Xt,A(k.recordType==="html"?"HTML 高保真":"原型页面"),1)])):(v(),S("div",Gt,[m(ee,null,{default:_(()=>[m(y(be))]),_:1})]))]),w("div",Jt,[w("div",{class:"item-name",title:k.name},A(k.name),9,Kt),w("div",Yt,[k.recordType==="html"?(v(),S("span",en,"HTML")):k.recordType==="prototype"?(v(),S("span",tn,"原型")):Q("",!0),k.projectName?(v(),S("span",nn,A(k.projectName),1)):Q("",!0)]),w("div",sn,A(y(Lt)(k.updatedAt)),1),w("div",on,[m(G,{content:"预览",placement:"top","show-after":300},{default:_(()=>[m(N,{circle:"",size:"small",icon:y(ft),onClick:ke=>h(k)},null,8,["icon","onClick"])]),_:2},1024),m(G,{content:"编辑",placement:"top","show-after":300},{default:_(()=>[m(N,{circle:"",size:"small",icon:y(gt),onClick:ke=>W(k)},null,8,["icon","onClick"])]),_:2},1024),m(G,{content:"删除",placement:"top","show-after":300},{default:_(()=>[m(N,{circle:"",size:"small",type:"danger",icon:y(mt),onClick:ke=>R(k)},null,8,["icon","onClick"])]),_:2},1024)])])],2))),128))]),o.value?(v(),ce(X,{key:0,type:"warning",closable:!1,"show-icon":"",title:"本地存储空间不足，建议清理旧条目",class:"storage-alert"})):Q("",!0),t.value.length===0?(v(),S("div",ln,[m(ee,{size:32,class:"empty-icon"},{default:_(()=>[m(y(be))]),_:1}),b[7]||(b[7]=w("p",{class:"empty-text"},"截取页面后，标注内容会出现在这里。",-1))])):Q("",!0),m(te,{modelValue:n.value,"onUpdate:modelValue":b[1]||(b[1]=k=>n.value=k),title:s.value?.name||"预览",width:"80%",class:"preview-dialog"},{default:_(()=>[s.value?(v(),S(ae,{key:0},[s.value.recordType==="html"||s.value.recordType==="prototype"?(v(),S("iframe",{key:0,srcdoc:s.value.currentHtml||s.value.originalHtml||"",class:"preview-html-frame",sandbox:"allow-same-origin allow-scripts allow-forms allow-popups allow-modals"},null,8,rn)):(v(),S("img",{key:1,src:s.value.renderedImageData||s.value.imageData,alt:s.value.name,class:"preview-image"},null,8,an))],64)):Q("",!0),s.value?.description?(v(),S("div",cn,[w("pre",null,A(s.value.description),1)])):Q("",!0)]),_:1},8,["modelValue","title"]),m(te,{modelValue:r.value,"onUpdate:modelValue":b[5]||(b[5]=k=>r.value=k),title:"变更项目",width:"400px","close-on-click-modal":!1,"append-to-body":"","align-center":"",onClosed:z},{footer:_(()=>[w("div",pn,[m(N,{onClick:b[4]||(b[4]=k=>r.value=!1)},{default:_(()=>[...b[8]||(b[8]=[Z("取消",-1)])]),_:1}),m(N,{type:"primary",onClick:d},{default:_(()=>[...b[9]||(b[9]=[Z("确认移动",-1)])]),_:1})])]),default:_(()=>[w("p",un,"将已选 "+A(y(e).selectedCount)+" 个原型移动到：",1),m(H,{modelValue:a.value,"onUpdate:modelValue":b[2]||(b[2]=k=>a.value=k),placeholder:"请选择目标项目",style:{width:"100%"}},{default:_(()=>[(v(!0),S(ae,null,xe(c.value,k=>(v(),ce(E,{key:k.id,label:k.name,value:k.id},null,8,["label","value"]))),128)),m(E,{label:"+ 新建项目",value:"__new__"})]),_:1},8,["modelValue"]),a.value==="__new__"?(v(),ce(at,{key:0,modelValue:p.value,"onUpdate:modelValue":b[3]||(b[3]=k=>p.value=k),placeholder:"请输入新项目名称",maxlength:"50","show-word-limit":"",style:{"margin-top":"12px"}},null,8,["modelValue"])):Q("",!0)]),_:1},8,["modelValue"])])}}}),dn=Te(hn,[["__scopeId","data-v-4ce8d4c4"]]),fn={rect:"矩形框",ellipse:"椭圆",circle:"圆形",arrow:"箭头",line:"直线",path:"路径","i-text":"文字",textbox:"文字",text:"文字",group:"组合",callout:"拉线说明",marker:"编号标记",highlight:"高亮",blur:"马赛克",freehand:"自由画笔",sticky:"便签"};function gn(l,e,t){if(typeof l.left!="number"||typeof l.top!="number"||e<=0||t<=0)return"位置未知";const n=typeof l.width=="number"?l.width:0,s=typeof l.height=="number"?l.height:0,o=l.left+n/2,i=l.top+s/2,r=o/e,a=i/t,p=r<.33?"左侧":r>.66?"右侧":"中部",c=a<.33?"上方":a>.66?"下方":"中部";return p==="中部"&&c==="中部"?"页面中央":p==="中部"?c:c==="中部"?p:`${c}${p}`}function mn(l){const e=l.text;if(e&&e.trim())return e.trim();const t=l.content;if(t&&t.trim())return t.trim()}function kn(l){if(!l)return[];let e;try{e=JSON.parse(l)}catch{return[]}const t=e;if(!Array.isArray(t.objects)||t.objects.length===0)return[];const n=typeof t.width=="number"?t.width:0,s=typeof t.height=="number"?t.height:0,o=[];for(const i of t.objects){const r=i,a=typeof r.type=="string"?r.type:"";if(!a||r.data?.type==="alignment-guide")continue;const c=fn[a]??a,f=mn(r),u=gn({left:r.left,top:r.top,width:r.width,height:r.height},n,s);let d;if(a==="marker"||a==="group"){const z=r.index;typeof z=="number"&&(d=z)}o.push({type:a,label:c,text:f,position:u,index:d})}return o}function xn(l){if(l.length===0)return"无标注";const e=[];return l.forEach((t,n)=>{const s=[`${n+1}. ${t.label}`];t.index!==void 0&&s.push(`编号 #${t.index}`),t.position&&s.push(`位置：${t.position}`),t.text&&s.push(`文字："${t.text}"`),e.push(s.join(" | "))}),e.join(`
`)}function bn(l){if(l.length===0)return"无标注";const e=new Map;for(const t of l)e.set(t.label,(e.get(t.label)??0)+1);return Array.from(e.entries()).map(([t,n])=>`${n}个${t}`).join("、")}function wn(){return`你是一名资深产品需求分析师 + AI 编程提示词工程师。用户已经提供了标注截图、原型说明和标注详情，另一个导出文件会保留截图与原始原型说明。你的任务只生成一份独立 Markdown 开发提示词，把原型说明转译为更规范、可执行的开发语言。

## 核心目标

将产品经理的自然语言、截图标注和页面上下文，整理成可直接交给 AI 编程工具或开发工程师使用的开发提示词。输出应帮助开发侧理解要做什么、哪里要改、有哪些前后端任务、接口需要补什么能力、哪些信息仍需确认。

## 严格规则

1. 只输出 Markdown，不输出 HTML，不包裹为代码块，不输出 <think> 或思考过程。
2. 不要编造技术栈。只有在用户原型说明或页面上下文明示时，才写具体框架、组件库、状态管理、请求库、数据库、中间件等；否则写“未从原型中识别，需基于现有项目确认”。
3. 不要编造真实文件路径、路由路径、接口路径、表名、字段名或函数名。无法从原型判断时，用“在现有页面/模块中定位对应实现”“接口路径由后端按现有规范确定”这类开发语言表达。
4. 不要输出大量伪代码。开发提示词以自然语言需求、模块拆分、接口能力说明、交互逻辑、数据要求和验收标准为主。
5. 必须将需求拆分为“前端开发提示词”和“后端开发提示词”。如果某页只有前端展示需求，也要在后端部分说明“未识别到新增后端能力”或“需确认是否复用现有接口”。
6. 后端提示词要描述需要补充的接口能力，例如“新增查询列表接口”“在详情接口中补充字段”“新增提交/保存接口”“新增状态变更接口”。但在无法判断时，不要写具体 URL 路径，只写接口职责、请求参数、响应数据、错误处理和鉴权/权限注意点。
7. 前端提示词要基于截图标注位置、标注文字和原型说明，转译为页面结构、组件行为、交互流程、表单校验、列表状态、空态/加载/错误态、权限态、响应式注意点等开发语言。
8. 保留用户需求原意，不额外扩展未出现的功能；无法确认的信息放入“待确认问题”，不要自行拍板。
9. 验收标准必须可验证，避免“功能正常”“页面美观”这类空泛表述。

如果条目是 HTML 高保真页面或 HTML 原型页面（recordType 为 html 或 prototype），需要：
- 优先基于原始 HTML 与修改后 HTML 的差异识别需求变化。
- 结合 AI 对话历史和修改摘要判断新增字段、筛选项、接口字段、枚举值、数据库字段。
- 不要编造未知接口路径和表名，只写接口职责和数据字段。
- 完整 HTML 已保存在本地记录中，prompt 中的 HTML 可能被截断。

## 输出结构

# 开发提示词

## 需求概览
- 本次要实现/调整的业务目标：
- 涉及页面/模块：
- 技术栈识别：
- 不确定信息：

## 前端开发提示词

### 页面 1：{页面名称}
- 页面目标：
- 需要实现/调整的 UI 区域：
- 交互逻辑：
- 数据展示与状态：
- 表单/校验规则：
- 异常、空态、加载态：
- 前端验收标准：

### 页面 2：{页面名称}
...

## 后端开发提示词

### 页面 1：{页面名称}
- 后端能力需求：
- 建议补充/复用的接口能力：
- 请求参数：
- 响应数据：
- 业务规则与校验：
- 权限与安全：
- 后端验收标准：

### 页面 2：{页面名称}
...

## 联调关注点
- 前后端字段命名需基于现有项目约定确认。
- 接口路径、方法、鉴权方式需以后端现有规范为准。
- 其他基于需求内容识别出的联调风险。

## 待确认问题
- 无法从原型中确认但会影响开发落地的问题；没有则写“无”。`}function yn(l,e){if(l.recordType==="html"||l.recordType==="prototype")return vn(l,e);const t=l.name||`未命名页面 ${e+1}`,n=l.pageTitle||"未知页面",s=l.pageUrl||"未知地址",o=l.description?.trim()||"（用户未填写说明，请基于标注详情谨慎推断，并在待确认中列出假设）",i=kn(l.fabricJson),r=bn(i),a=xn(i);return`--- 条目 ${e+1} ---
名称：${t}
来源页面标题：${n}
来源 URL：${s}
标注总数：${i.length}（${r}）

【用户原始原型说明】
${o}

【标注详情】（共 ${i.length} 项，按画布顺序）
${a}

（对应的合成标注图随请求以图片形式提供，顺序与条目一致）`}function vn(l,e){const t=l.name||`未命名页面 ${e+1}`,n=l.pageTitle||"未知页面",s=l.pageUrl||"未知地址",o=l.recordType==="prototype"?"HTML原型页面":"HTML高保真页面",i=l.description?.trim()||"（用户未填写说明）",r=_n(l.htmlChatMessages),a=l.htmlRevisionSummary?.trim()||"无",p=l.originalHtml?Ue(l.originalHtml):"无",c=l.currentHtml?Ue(l.currentHtml):"无";return`--- 条目 ${e+1} ---
名称：${t}
来源页面标题：${n}
来源 URL：${s}
类型：${o}

【用户原始原型说明】
${i}

【AI 对话历史】
${r}

【修改摘要】
${a}

【原始 HTML】
${p}

【修改后 HTML】
${c}

（注意：优先基于原始 HTML 与修改后 HTML 的差异识别需求变化。不要编造接口路径和表名。）`}function _n(l){return!l||l.length===0?"无对话":l.slice(-10).map(t=>{const n=t.role==="user"?"用户":"AI",s=t.content.length>500?t.content.slice(0,500)+"...":t.content;return`${n}：${s}`}).join(`
`)}function Ue(l,e=3e4){return l.length<=e?l:l.slice(0,e)+`

（已截断，完整 HTML 保存在本地记录中）`}function $n(l){const e=l.map((t,n)=>yn(t,n));return`以下是共 ${l.length} 个原型页面条目。请根据系统规则生成一份独立 Markdown 开发提示词，并拆分为前端开发提示词、后端开发提示词：

${e.join(`

`)}`}function Re(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}let Y=Re();function Ge(l){Y=l}const Je=/[&<>"']/,Tn=new RegExp(Je.source,"g"),Ke=/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,zn=new RegExp(Ke.source,"g"),Rn={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},Ne=l=>Rn[l];function B(l,e){if(e){if(Je.test(l))return l.replace(Tn,Ne)}else if(Ke.test(l))return l.replace(zn,Ne);return l}const Sn=/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;function Cn(l){return l.replace(Sn,(e,t)=>(t=t.toLowerCase(),t==="colon"?":":t.charAt(0)==="#"?t.charAt(1)==="x"?String.fromCharCode(parseInt(t.substring(2),16)):String.fromCharCode(+t.substring(1)):""))}const In=/(^|[^\[])\^/g;function T(l,e){let t=typeof l=="string"?l:l.source;e=e||"";const n={replace:(s,o)=>{let i=typeof o=="string"?o:o.source;return i=i.replace(In,"$1"),t=t.replace(s,i),n},getRegex:()=>new RegExp(t,e)};return n}function Ze(l){try{l=encodeURI(l).replace(/%25/g,"%")}catch{return null}return l}const se={exec:()=>null};function Oe(l,e){const t=l.replace(/\|/g,(o,i,r)=>{let a=!1,p=i;for(;--p>=0&&r[p]==="\\";)a=!a;return a?"|":" |"}),n=t.split(/ \|/);let s=0;if(n[0].trim()||n.shift(),n.length>0&&!n[n.length-1].trim()&&n.pop(),e)if(n.length>e)n.splice(e);else for(;n.length<e;)n.push("");for(;s<n.length;s++)n[s]=n[s].trim().replace(/\\\|/g,"|");return n}function ue(l,e,t){const n=l.length;if(n===0)return"";let s=0;for(;s<n&&l.charAt(n-s-1)===e;)s++;return l.slice(0,n-s)}function An(l,e){if(l.indexOf(e[1])===-1)return-1;let t=0;for(let n=0;n<l.length;n++)if(l[n]==="\\")n++;else if(l[n]===e[0])t++;else if(l[n]===e[1]&&(t--,t<0))return n;return-1}function Fe(l,e,t,n){const s=e.href,o=e.title?B(e.title):null,i=l[1].replace(/\\([\[\]])/g,"$1");if(l[0].charAt(0)!=="!"){n.state.inLink=!0;const r={type:"link",raw:t,href:s,title:o,text:i,tokens:n.inlineTokens(i)};return n.state.inLink=!1,r}return{type:"image",raw:t,href:s,title:o,text:B(i)}}function Pn(l,e){const t=l.match(/^(\s+)(?:```)/);if(t===null)return e;const n=t[1];return e.split(`
`).map(s=>{const o=s.match(/^\s+/);if(o===null)return s;const[i]=o;return i.length>=n.length?s.slice(n.length):s}).join(`
`)}class de{constructor(e){C(this,"options");C(this,"rules");C(this,"lexer");this.options=e||Y}space(e){const t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){const t=this.rules.block.code.exec(e);if(t){const n=t[0].replace(/^ {1,4}/gm,"");return{type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?n:ue(n,`
`)}}}fences(e){const t=this.rules.block.fences.exec(e);if(t){const n=t[0],s=Pn(n,t[3]||"");return{type:"code",raw:n,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:s}}}heading(e){const t=this.rules.block.heading.exec(e);if(t){let n=t[2].trim();if(/#$/.test(n)){const s=ue(n,"#");(this.options.pedantic||!s||/ $/.test(s))&&(n=s.trim())}return{type:"heading",raw:t[0],depth:t[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(e){const t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:t[0]}}blockquote(e){const t=this.rules.block.blockquote.exec(e);if(t){let n=t[0].replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,`
    $1`);n=ue(n.replace(/^ *>[ \t]?/gm,""),`
`);const s=this.lexer.state.top;this.lexer.state.top=!0;const o=this.lexer.blockTokens(n);return this.lexer.state.top=s,{type:"blockquote",raw:t[0],tokens:o,text:n}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim();const s=n.length>1,o={type:"list",raw:"",ordered:s,start:s?+n.slice(0,-1):"",loose:!1,items:[]};n=s?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=s?n:"[*+-]");const i=new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`);let r="",a="",p=!1;for(;e;){let c=!1;if(!(t=i.exec(e))||this.rules.block.hr.test(e))break;r=t[0],e=e.substring(r.length);let f=t[2].split(`
`,1)[0].replace(/^\t+/,U=>" ".repeat(3*U.length)),u=e.split(`
`,1)[0],d=0;this.options.pedantic?(d=2,a=f.trimStart()):(d=t[2].search(/[^ ]/),d=d>4?1:d,a=f.slice(d),d+=t[1].length);let z=!1;if(!f&&/^ *$/.test(u)&&(r+=u+`
`,e=e.substring(u.length+1),c=!0),!c){const U=new RegExp(`^ {0,${Math.min(3,d-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),W=new RegExp(`^ {0,${Math.min(3,d-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),R=new RegExp(`^ {0,${Math.min(3,d-1)}}(?:\`\`\`|~~~)`),h=new RegExp(`^ {0,${Math.min(3,d-1)}}#`);for(;e;){const x=e.split(`
`,1)[0];if(u=x,this.options.pedantic&&(u=u.replace(/^ {1,4}(?=( {4})*[^ ])/g,"  ")),R.test(u)||h.test(u)||U.test(u)||W.test(e))break;if(u.search(/[^ ]/)>=d||!u.trim())a+=`
`+u.slice(d);else{if(z||f.search(/[^ ]/)>=4||R.test(f)||h.test(f)||W.test(f))break;a+=`
`+u}!z&&!u.trim()&&(z=!0),r+=x+`
`,e=e.substring(x.length+1),f=u.slice(d)}}o.loose||(p?o.loose=!0:/\n *\n *$/.test(r)&&(p=!0));let I=null,M;this.options.gfm&&(I=/^\[[ xX]\] /.exec(a),I&&(M=I[0]!=="[ ] ",a=a.replace(/^\[[ xX]\] +/,""))),o.items.push({type:"list_item",raw:r,task:!!I,checked:M,loose:!1,text:a,tokens:[]}),o.raw+=r}o.items[o.items.length-1].raw=r.trimEnd(),o.items[o.items.length-1].text=a.trimEnd(),o.raw=o.raw.trimEnd();for(let c=0;c<o.items.length;c++)if(this.lexer.state.top=!1,o.items[c].tokens=this.lexer.blockTokens(o.items[c].text,[]),!o.loose){const f=o.items[c].tokens.filter(d=>d.type==="space"),u=f.length>0&&f.some(d=>/\n.*\n/.test(d.raw));o.loose=u}if(o.loose)for(let c=0;c<o.items.length;c++)o.items[c].loose=!0;return o}}html(e){const t=this.rules.block.html.exec(e);if(t)return{type:"html",block:!0,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){const t=this.rules.block.def.exec(e);if(t){const n=t[1].toLowerCase().replace(/\s+/g," "),s=t[2]?t[2].replace(/^<(.*)>$/,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",o=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:n,raw:t[0],href:s,title:o}}}table(e){const t=this.rules.block.table.exec(e);if(!t||!/[:|]/.test(t[2]))return;const n=Oe(t[1]),s=t[2].replace(/^\||\| *$/g,"").split("|"),o=t[3]&&t[3].trim()?t[3].replace(/\n[ \t]*$/,"").split(`
`):[],i={type:"table",raw:t[0],header:[],align:[],rows:[]};if(n.length===s.length){for(const r of s)/^ *-+: *$/.test(r)?i.align.push("right"):/^ *:-+: *$/.test(r)?i.align.push("center"):/^ *:-+ *$/.test(r)?i.align.push("left"):i.align.push(null);for(const r of n)i.header.push({text:r,tokens:this.lexer.inline(r)});for(const r of o)i.rows.push(Oe(r,i.header.length).map(a=>({text:a,tokens:this.lexer.inline(a)})));return i}}lheading(e){const t=this.rules.block.lheading.exec(e);if(t)return{type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){const t=this.rules.block.paragraph.exec(e);if(t){const n=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:n,tokens:this.lexer.inline(n)}}}text(e){const t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){const t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:B(t[1])}}tag(e){const t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&/^<a /i.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&/^<\/a>/i.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&/^<(pre|code|kbd|script)(\s|>)/i.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&/^<\/(pre|code|kbd|script)(\s|>)/i.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){const t=this.rules.inline.link.exec(e);if(t){const n=t[2].trim();if(!this.options.pedantic&&/^</.test(n)){if(!/>$/.test(n))return;const i=ue(n.slice(0,-1),"\\");if((n.length-i.length)%2===0)return}else{const i=An(t[2],"()");if(i>-1){const a=(t[0].indexOf("!")===0?5:4)+t[1].length+i;t[2]=t[2].substring(0,i),t[0]=t[0].substring(0,a).trim(),t[3]=""}}let s=t[2],o="";if(this.options.pedantic){const i=/^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);i&&(s=i[1],o=i[3])}else o=t[3]?t[3].slice(1,-1):"";return s=s.trim(),/^</.test(s)&&(this.options.pedantic&&!/>$/.test(n)?s=s.slice(1):s=s.slice(1,-1)),Fe(t,{href:s&&s.replace(this.rules.inline.anyPunctuation,"$1"),title:o&&o.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){const s=(n[2]||n[1]).replace(/\s+/g," "),o=t[s.toLowerCase()];if(!o){const i=n[0].charAt(0);return{type:"text",raw:i,text:i}}return Fe(n,o,n[0],this.lexer)}}emStrong(e,t,n=""){let s=this.rules.inline.emStrongLDelim.exec(e);if(!s||s[3]&&n.match(/[\p{L}\p{N}]/u))return;if(!(s[1]||s[2]||"")||!n||this.rules.inline.punctuation.exec(n)){const i=[...s[0]].length-1;let r,a,p=i,c=0;const f=s[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(f.lastIndex=0,t=t.slice(-1*e.length+i);(s=f.exec(t))!=null;){if(r=s[1]||s[2]||s[3]||s[4]||s[5]||s[6],!r)continue;if(a=[...r].length,s[3]||s[4]){p+=a;continue}else if((s[5]||s[6])&&i%3&&!((i+a)%3)){c+=a;continue}if(p-=a,p>0)continue;a=Math.min(a,a+p+c);const u=[...s[0]][0].length,d=e.slice(0,i+s.index+u+a);if(Math.min(i,a)%2){const I=d.slice(1,-1);return{type:"em",raw:d,text:I,tokens:this.lexer.inlineTokens(I)}}const z=d.slice(2,-2);return{type:"strong",raw:d,text:z,tokens:this.lexer.inlineTokens(z)}}}}codespan(e){const t=this.rules.inline.code.exec(e);if(t){let n=t[2].replace(/\n/g," ");const s=/[^ ]/.test(n),o=/^ /.test(n)&&/ $/.test(n);return s&&o&&(n=n.substring(1,n.length-1)),n=B(n,!0),{type:"codespan",raw:t[0],text:n}}}br(e){const t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e){const t=this.rules.inline.del.exec(e);if(t)return{type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){const t=this.rules.inline.autolink.exec(e);if(t){let n,s;return t[2]==="@"?(n=B(t[1]),s="mailto:"+n):(n=B(t[1]),s=n),{type:"link",raw:t[0],text:n,href:s,tokens:[{type:"text",raw:n,text:n}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let n,s;if(t[2]==="@")n=B(t[0]),s="mailto:"+n;else{let o;do o=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(o!==t[0]);n=B(t[0]),t[1]==="www."?s="http://"+t[0]:s=t[0]}return{type:"link",raw:t[0],text:n,href:s,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(e){const t=this.rules.inline.text.exec(e);if(t){let n;return this.lexer.state.inRawBlock?n=t[0]:n=B(t[0]),{type:"text",raw:t[0],text:n}}}}const Ln=/^(?: *(?:\n|$))+/,Mn=/^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,En=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,oe=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Hn=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Ye=/(?:[*+-]|\d{1,9}[.)])/,et=T(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g,Ye).replace(/blockCode/g,/ {4}/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).getRegex(),Se=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,jn=/^[^\n]+/,Ce=/(?!\s*\])(?:\\.|[^\[\]\\])+/,Bn=T(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label",Ce).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),qn=T(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,Ye).getRegex(),me="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",Ie=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,Dn=T("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))","i").replace("comment",Ie).replace("tag",me).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),tt=T(Se).replace("hr",oe).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",me).getRegex(),Un=T(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",tt).getRegex(),Ae={blockquote:Un,code:Mn,def:Bn,fences:En,heading:Hn,hr:oe,html:Dn,lheading:et,list:qn,newline:Ln,paragraph:tt,table:se,text:jn},Ve=T("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",oe).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code"," {4}[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",me).getRegex(),Nn={...Ae,table:Ve,paragraph:T(Se).replace("hr",oe).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",Ve).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",me).getRegex()},Zn={...Ae,html:T(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",Ie).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:se,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:T(Se).replace("hr",oe).replace("heading",` *#{1,6} *[^
]`).replace("lheading",et).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},nt=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,On=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,st=/^( {2,}|\\)\n(?!\s*$)/,Fn=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,le="\\p{P}\\p{S}",Vn=T(/^((?![*_])[\spunctuation])/,"u").replace(/punctuation/g,le).getRegex(),Qn=/\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g,Wn=T(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/,"u").replace(/punct/g,le).getRegex(),Xn=T("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])","gu").replace(/punct/g,le).getRegex(),Gn=T("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])","gu").replace(/punct/g,le).getRegex(),Jn=T(/\\([punct])/,"gu").replace(/punct/g,le).getRegex(),Kn=T(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),Yn=T(Ie).replace("(?:-->|$)","-->").getRegex(),es=T("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",Yn).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),fe=/(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,ts=T(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label",fe).replace("href",/<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),it=T(/^!?\[(label)\]\[(ref)\]/).replace("label",fe).replace("ref",Ce).getRegex(),ot=T(/^!?\[(ref)\](?:\[\])?/).replace("ref",Ce).getRegex(),ns=T("reflink|nolink(?!\\()","g").replace("reflink",it).replace("nolink",ot).getRegex(),Pe={_backpedal:se,anyPunctuation:Jn,autolink:Kn,blockSkip:Qn,br:st,code:On,del:se,emStrongLDelim:Wn,emStrongRDelimAst:Xn,emStrongRDelimUnd:Gn,escape:nt,link:ts,nolink:ot,punctuation:Vn,reflink:it,reflinkSearch:ns,tag:es,text:Fn,url:se},ss={...Pe,link:T(/^!?\[(label)\]\((.*?)\)/).replace("label",fe).getRegex(),reflink:T(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",fe).getRegex()},we={...Pe,escape:T(nt).replace("])","~|])").getRegex(),url:T(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,"i").replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,text:/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/},is={...we,br:T(st).replace("{2,}","*").getRegex(),text:T(we.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},pe={normal:Ae,gfm:Nn,pedantic:Zn},ne={normal:Pe,gfm:we,breaks:is,pedantic:ss};class O{constructor(e){C(this,"tokens");C(this,"options");C(this,"state");C(this,"tokenizer");C(this,"inlineQueue");this.tokens=[],this.tokens.links=Object.create(null),this.options=e||Y,this.options.tokenizer=this.options.tokenizer||new de,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};const t={block:pe.normal,inline:ne.normal};this.options.pedantic?(t.block=pe.pedantic,t.inline=ne.pedantic):this.options.gfm&&(t.block=pe.gfm,this.options.breaks?t.inline=ne.breaks:t.inline=ne.gfm),this.tokenizer.rules=t}static get rules(){return{block:pe,inline:ne}}static lex(e,t){return new O(t).lex(e)}static lexInline(e,t){return new O(t).inlineTokens(e)}lex(e){e=e.replace(/\r\n|\r/g,`
`),this.blockTokens(e,this.tokens);for(let t=0;t<this.inlineQueue.length;t++){const n=this.inlineQueue[t];this.inlineTokens(n.src,n.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[]){this.options.pedantic?e=e.replace(/\t/g,"    ").replace(/^ +$/gm,""):e=e.replace(/^( *)(\t+)/gm,(r,a,p)=>a+"    ".repeat(p.length));let n,s,o,i;for(;e;)if(!(this.options.extensions&&this.options.extensions.block&&this.options.extensions.block.some(r=>(n=r.call({lexer:this},e,t))?(e=e.substring(n.raw.length),t.push(n),!0):!1))){if(n=this.tokenizer.space(e)){e=e.substring(n.raw.length),n.raw.length===1&&t.length>0?t[t.length-1].raw+=`
`:t.push(n);continue}if(n=this.tokenizer.code(e)){e=e.substring(n.raw.length),s=t[t.length-1],s&&(s.type==="paragraph"||s.type==="text")?(s.raw+=`
`+n.raw,s.text+=`
`+n.text,this.inlineQueue[this.inlineQueue.length-1].src=s.text):t.push(n);continue}if(n=this.tokenizer.fences(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.heading(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.hr(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.blockquote(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.list(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.html(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.def(e)){e=e.substring(n.raw.length),s=t[t.length-1],s&&(s.type==="paragraph"||s.type==="text")?(s.raw+=`
`+n.raw,s.text+=`
`+n.raw,this.inlineQueue[this.inlineQueue.length-1].src=s.text):this.tokens.links[n.tag]||(this.tokens.links[n.tag]={href:n.href,title:n.title});continue}if(n=this.tokenizer.table(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.lheading(e)){e=e.substring(n.raw.length),t.push(n);continue}if(o=e,this.options.extensions&&this.options.extensions.startBlock){let r=1/0;const a=e.slice(1);let p;this.options.extensions.startBlock.forEach(c=>{p=c.call({lexer:this},a),typeof p=="number"&&p>=0&&(r=Math.min(r,p))}),r<1/0&&r>=0&&(o=e.substring(0,r+1))}if(this.state.top&&(n=this.tokenizer.paragraph(o))){s=t[t.length-1],i&&s.type==="paragraph"?(s.raw+=`
`+n.raw,s.text+=`
`+n.text,this.inlineQueue.pop(),this.inlineQueue[this.inlineQueue.length-1].src=s.text):t.push(n),i=o.length!==e.length,e=e.substring(n.raw.length);continue}if(n=this.tokenizer.text(e)){e=e.substring(n.raw.length),s=t[t.length-1],s&&s.type==="text"?(s.raw+=`
`+n.raw,s.text+=`
`+n.text,this.inlineQueue.pop(),this.inlineQueue[this.inlineQueue.length-1].src=s.text):t.push(n);continue}if(e){const r="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(r);break}else throw new Error(r)}}return this.state.top=!0,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}inlineTokens(e,t=[]){let n,s,o,i=e,r,a,p;if(this.tokens.links){const c=Object.keys(this.tokens.links);if(c.length>0)for(;(r=this.tokenizer.rules.inline.reflinkSearch.exec(i))!=null;)c.includes(r[0].slice(r[0].lastIndexOf("[")+1,-1))&&(i=i.slice(0,r.index)+"["+"a".repeat(r[0].length-2)+"]"+i.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(r=this.tokenizer.rules.inline.blockSkip.exec(i))!=null;)i=i.slice(0,r.index)+"["+"a".repeat(r[0].length-2)+"]"+i.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);for(;(r=this.tokenizer.rules.inline.anyPunctuation.exec(i))!=null;)i=i.slice(0,r.index)+"++"+i.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);for(;e;)if(a||(p=""),a=!1,!(this.options.extensions&&this.options.extensions.inline&&this.options.extensions.inline.some(c=>(n=c.call({lexer:this},e,t))?(e=e.substring(n.raw.length),t.push(n),!0):!1))){if(n=this.tokenizer.escape(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.tag(e)){e=e.substring(n.raw.length),s=t[t.length-1],s&&n.type==="text"&&s.type==="text"?(s.raw+=n.raw,s.text+=n.text):t.push(n);continue}if(n=this.tokenizer.link(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(n.raw.length),s=t[t.length-1],s&&n.type==="text"&&s.type==="text"?(s.raw+=n.raw,s.text+=n.text):t.push(n);continue}if(n=this.tokenizer.emStrong(e,i,p)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.codespan(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.br(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.del(e)){e=e.substring(n.raw.length),t.push(n);continue}if(n=this.tokenizer.autolink(e)){e=e.substring(n.raw.length),t.push(n);continue}if(!this.state.inLink&&(n=this.tokenizer.url(e))){e=e.substring(n.raw.length),t.push(n);continue}if(o=e,this.options.extensions&&this.options.extensions.startInline){let c=1/0;const f=e.slice(1);let u;this.options.extensions.startInline.forEach(d=>{u=d.call({lexer:this},f),typeof u=="number"&&u>=0&&(c=Math.min(c,u))}),c<1/0&&c>=0&&(o=e.substring(0,c+1))}if(n=this.tokenizer.inlineText(o)){e=e.substring(n.raw.length),n.raw.slice(-1)!=="_"&&(p=n.raw.slice(-1)),a=!0,s=t[t.length-1],s&&s.type==="text"?(s.raw+=n.raw,s.text+=n.text):t.push(n);continue}if(e){const c="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(c);break}else throw new Error(c)}}return t}}class ge{constructor(e){C(this,"options");this.options=e||Y}code(e,t,n){const s=(t||"").match(/^\S*/)?.[0];return e=e.replace(/\n$/,"")+`
`,s?'<pre><code class="language-'+B(s)+'">'+(n?e:B(e,!0))+`</code></pre>
`:"<pre><code>"+(n?e:B(e,!0))+`</code></pre>
`}blockquote(e){return`<blockquote>
${e}</blockquote>
`}html(e,t){return e}heading(e,t,n){return`<h${t}>${e}</h${t}>
`}hr(){return`<hr>
`}list(e,t,n){const s=t?"ol":"ul",o=t&&n!==1?' start="'+n+'"':"";return"<"+s+o+`>
`+e+"</"+s+`>
`}listitem(e,t,n){return`<li>${e}</li>
`}checkbox(e){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph(e){return`<p>${e}</p>
`}table(e,t){return t&&(t=`<tbody>${t}</tbody>`),`<table>
<thead>
`+e+`</thead>
`+t+`</table>
`}tablerow(e){return`<tr>
${e}</tr>
`}tablecell(e,t){const n=t.header?"th":"td";return(t.align?`<${n} align="${t.align}">`:`<${n}>`)+e+`</${n}>
`}strong(e){return`<strong>${e}</strong>`}em(e){return`<em>${e}</em>`}codespan(e){return`<code>${e}</code>`}br(){return"<br>"}del(e){return`<del>${e}</del>`}link(e,t,n){const s=Ze(e);if(s===null)return n;e=s;let o='<a href="'+e+'"';return t&&(o+=' title="'+t+'"'),o+=">"+n+"</a>",o}image(e,t,n){const s=Ze(e);if(s===null)return n;e=s;let o=`<img src="${e}" alt="${n}"`;return t&&(o+=` title="${t}"`),o+=">",o}text(e){return e}}class Le{strong(e){return e}em(e){return e}codespan(e){return e}del(e){return e}html(e){return e}text(e){return e}link(e,t,n){return""+n}image(e,t,n){return""+n}br(){return""}}class F{constructor(e){C(this,"options");C(this,"renderer");C(this,"textRenderer");this.options=e||Y,this.options.renderer=this.options.renderer||new ge,this.renderer=this.options.renderer,this.renderer.options=this.options,this.textRenderer=new Le}static parse(e,t){return new F(t).parse(e)}static parseInline(e,t){return new F(t).parseInline(e)}parse(e,t=!0){let n="";for(let s=0;s<e.length;s++){const o=e[s];if(this.options.extensions&&this.options.extensions.renderers&&this.options.extensions.renderers[o.type]){const i=o,r=this.options.extensions.renderers[i.type].call({parser:this},i);if(r!==!1||!["space","hr","heading","code","table","blockquote","list","html","paragraph","text"].includes(i.type)){n+=r||"";continue}}switch(o.type){case"space":continue;case"hr":{n+=this.renderer.hr();continue}case"heading":{const i=o;n+=this.renderer.heading(this.parseInline(i.tokens),i.depth,Cn(this.parseInline(i.tokens,this.textRenderer)));continue}case"code":{const i=o;n+=this.renderer.code(i.text,i.lang,!!i.escaped);continue}case"table":{const i=o;let r="",a="";for(let c=0;c<i.header.length;c++)a+=this.renderer.tablecell(this.parseInline(i.header[c].tokens),{header:!0,align:i.align[c]});r+=this.renderer.tablerow(a);let p="";for(let c=0;c<i.rows.length;c++){const f=i.rows[c];a="";for(let u=0;u<f.length;u++)a+=this.renderer.tablecell(this.parseInline(f[u].tokens),{header:!1,align:i.align[u]});p+=this.renderer.tablerow(a)}n+=this.renderer.table(r,p);continue}case"blockquote":{const i=o,r=this.parse(i.tokens);n+=this.renderer.blockquote(r);continue}case"list":{const i=o,r=i.ordered,a=i.start,p=i.loose;let c="";for(let f=0;f<i.items.length;f++){const u=i.items[f],d=u.checked,z=u.task;let I="";if(u.task){const M=this.renderer.checkbox(!!d);p?u.tokens.length>0&&u.tokens[0].type==="paragraph"?(u.tokens[0].text=M+" "+u.tokens[0].text,u.tokens[0].tokens&&u.tokens[0].tokens.length>0&&u.tokens[0].tokens[0].type==="text"&&(u.tokens[0].tokens[0].text=M+" "+u.tokens[0].tokens[0].text)):u.tokens.unshift({type:"text",text:M+" "}):I+=M+" "}I+=this.parse(u.tokens,p),c+=this.renderer.listitem(I,z,!!d)}n+=this.renderer.list(c,r,a);continue}case"html":{const i=o;n+=this.renderer.html(i.text,i.block);continue}case"paragraph":{const i=o;n+=this.renderer.paragraph(this.parseInline(i.tokens));continue}case"text":{let i=o,r=i.tokens?this.parseInline(i.tokens):i.text;for(;s+1<e.length&&e[s+1].type==="text";)i=e[++s],r+=`
`+(i.tokens?this.parseInline(i.tokens):i.text);n+=t?this.renderer.paragraph(r):r;continue}default:{const i='Token with "'+o.type+'" type was not found.';if(this.options.silent)return console.error(i),"";throw new Error(i)}}}return n}parseInline(e,t){t=t||this.renderer;let n="";for(let s=0;s<e.length;s++){const o=e[s];if(this.options.extensions&&this.options.extensions.renderers&&this.options.extensions.renderers[o.type]){const i=this.options.extensions.renderers[o.type].call({parser:this},o);if(i!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(o.type)){n+=i||"";continue}}switch(o.type){case"escape":{const i=o;n+=t.text(i.text);break}case"html":{const i=o;n+=t.html(i.text);break}case"link":{const i=o;n+=t.link(i.href,i.title,this.parseInline(i.tokens,t));break}case"image":{const i=o;n+=t.image(i.href,i.title,i.text);break}case"strong":{const i=o;n+=t.strong(this.parseInline(i.tokens,t));break}case"em":{const i=o;n+=t.em(this.parseInline(i.tokens,t));break}case"codespan":{const i=o;n+=t.codespan(i.text);break}case"br":{n+=t.br();break}case"del":{const i=o;n+=t.del(this.parseInline(i.tokens,t));break}case"text":{const i=o;n+=t.text(i.text);break}default:{const i='Token with "'+o.type+'" type was not found.';if(this.options.silent)return console.error(i),"";throw new Error(i)}}}return n}}class ie{constructor(e){C(this,"options");this.options=e||Y}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}}C(ie,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens"]));var K,ye,lt;class os{constructor(...e){Ee(this,K);C(this,"defaults",Re());C(this,"options",this.setOptions);C(this,"parse",re(this,K,ye).call(this,O.lex,F.parse));C(this,"parseInline",re(this,K,ye).call(this,O.lexInline,F.parseInline));C(this,"Parser",F);C(this,"Renderer",ge);C(this,"TextRenderer",Le);C(this,"Lexer",O);C(this,"Tokenizer",de);C(this,"Hooks",ie);this.use(...e)}walkTokens(e,t){let n=[];for(const s of e)switch(n=n.concat(t.call(this,s)),s.type){case"table":{const o=s;for(const i of o.header)n=n.concat(this.walkTokens(i.tokens,t));for(const i of o.rows)for(const r of i)n=n.concat(this.walkTokens(r.tokens,t));break}case"list":{const o=s;n=n.concat(this.walkTokens(o.items,t));break}default:{const o=s;this.defaults.extensions?.childTokens?.[o.type]?this.defaults.extensions.childTokens[o.type].forEach(i=>{const r=o[i].flat(1/0);n=n.concat(this.walkTokens(r,t))}):o.tokens&&(n=n.concat(this.walkTokens(o.tokens,t)))}}return n}use(...e){const t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(n=>{const s={...n};if(s.async=this.defaults.async||s.async||!1,n.extensions&&(n.extensions.forEach(o=>{if(!o.name)throw new Error("extension name required");if("renderer"in o){const i=t.renderers[o.name];i?t.renderers[o.name]=function(...r){let a=o.renderer.apply(this,r);return a===!1&&(a=i.apply(this,r)),a}:t.renderers[o.name]=o.renderer}if("tokenizer"in o){if(!o.level||o.level!=="block"&&o.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");const i=t[o.level];i?i.unshift(o.tokenizer):t[o.level]=[o.tokenizer],o.start&&(o.level==="block"?t.startBlock?t.startBlock.push(o.start):t.startBlock=[o.start]:o.level==="inline"&&(t.startInline?t.startInline.push(o.start):t.startInline=[o.start]))}"childTokens"in o&&o.childTokens&&(t.childTokens[o.name]=o.childTokens)}),s.extensions=t),n.renderer){const o=this.defaults.renderer||new ge(this.defaults);for(const i in n.renderer){if(!(i in o))throw new Error(`renderer '${i}' does not exist`);if(i==="options")continue;const r=i,a=n.renderer[r],p=o[r];o[r]=(...c)=>{let f=a.apply(o,c);return f===!1&&(f=p.apply(o,c)),f||""}}s.renderer=o}if(n.tokenizer){const o=this.defaults.tokenizer||new de(this.defaults);for(const i in n.tokenizer){if(!(i in o))throw new Error(`tokenizer '${i}' does not exist`);if(["options","rules","lexer"].includes(i))continue;const r=i,a=n.tokenizer[r],p=o[r];o[r]=(...c)=>{let f=a.apply(o,c);return f===!1&&(f=p.apply(o,c)),f}}s.tokenizer=o}if(n.hooks){const o=this.defaults.hooks||new ie;for(const i in n.hooks){if(!(i in o))throw new Error(`hook '${i}' does not exist`);if(i==="options")continue;const r=i,a=n.hooks[r],p=o[r];ie.passThroughHooks.has(i)?o[r]=c=>{if(this.defaults.async)return Promise.resolve(a.call(o,c)).then(u=>p.call(o,u));const f=a.call(o,c);return p.call(o,f)}:o[r]=(...c)=>{let f=a.apply(o,c);return f===!1&&(f=p.apply(o,c)),f}}s.hooks=o}if(n.walkTokens){const o=this.defaults.walkTokens,i=n.walkTokens;s.walkTokens=function(r){let a=[];return a.push(i.call(this,r)),o&&(a=a.concat(o.call(this,r))),a}}this.defaults={...this.defaults,...s}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return O.lex(e,t??this.defaults)}parser(e,t){return F.parse(e,t??this.defaults)}}K=new WeakSet,ye=function(e,t){return(n,s)=>{const o={...s},i={...this.defaults,...o};this.defaults.async===!0&&o.async===!1&&(i.silent||console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."),i.async=!0);const r=re(this,K,lt).call(this,!!i.silent,!!i.async);if(typeof n>"u"||n===null)return r(new Error("marked(): input parameter is undefined or null"));if(typeof n!="string")return r(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(n)+", string expected"));if(i.hooks&&(i.hooks.options=i),i.async)return Promise.resolve(i.hooks?i.hooks.preprocess(n):n).then(a=>e(a,i)).then(a=>i.hooks?i.hooks.processAllTokens(a):a).then(a=>i.walkTokens?Promise.all(this.walkTokens(a,i.walkTokens)).then(()=>a):a).then(a=>t(a,i)).then(a=>i.hooks?i.hooks.postprocess(a):a).catch(r);try{i.hooks&&(n=i.hooks.preprocess(n));let a=e(n,i);i.hooks&&(a=i.hooks.processAllTokens(a)),i.walkTokens&&this.walkTokens(a,i.walkTokens);let p=t(a,i);return i.hooks&&(p=i.hooks.postprocess(p)),p}catch(a){return r(a)}}},lt=function(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){const s="<p>An error occurred:</p><pre>"+B(n.message+"",!0)+"</pre>";return t?Promise.resolve(s):s}if(t)return Promise.reject(n);throw n}};const J=new os;function $(l,e){return J.parse(l,e)}$.options=$.setOptions=function(l){return J.setOptions(l),$.defaults=J.defaults,Ge($.defaults),$};$.getDefaults=Re;$.defaults=Y;$.use=function(...l){return J.use(...l),$.defaults=J.defaults,Ge($.defaults),$};$.walkTokens=function(l,e){return J.walkTokens(l,e)};$.parseInline=J.parseInline;$.Parser=F;$.parser=F.parse;$.Renderer=ge;$.TextRenderer=Le;$.Lexer=O;$.lexer=O.lex;$.Tokenizer=de;$.Hooks=ie;$.parse=$;$.options;$.setOptions;$.use;$.walkTokens;$.parseInline;F.parse;O.lex;function ve(l="原型说明",e="html",t=Xe()){return`${l.trim()||"原型说明"}_${t}.${e}`}function ls(l="原型说明"){const e=Xe(),t=l.trim()||"原型说明";return{prototypeHtml:ve(t,"html",e),developmentPromptMd:ve(`${t}_开发提示词`,"md",e)}}function rs(l,e="原型说明"){const t=new Date().toLocaleString("zh-CN",{hour12:!1}),n=D(e.trim()||"原型说明"),s=l.map((i,r)=>as(i,r)).join(`
`),o=l.map((i,r)=>{const a=D(i.name||i.pageTitle||`页面 ${r+1}`);return`<li><a href="#page-${r+1}">${a}</a></li>`}).join("");return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${n}</title>
  <style>
    body {
      margin: 0;
      background: #f5f7fb;
      color: #1f2937;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.7;
    }
    .document {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 24px 56px;
    }
    .hero {
      background: linear-gradient(135deg, #b5122a, #cf1937);
      color: #fff;
      border-radius: 18px;
      padding: 28px 32px;
      box-shadow: 0 16px 36px rgba(181, 18, 42, 0.18);
    }
    .hero h1 {
      margin: 0 0 14px;
      font-size: 28px;
      line-height: 1.25;
      color: #fff;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 14px;
      margin-top: 14px;
      font-size: 13px;
    }
    .meta span {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.16);
    }
    .toc,
    .page-section {
      margin-top: 24px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    }
    .toc {
      padding: 22px 28px;
      border-left: 4px solid #dc1f3b;
    }
    .toc h2 {
      margin: 0 0 10px;
      font-size: 16px;
    }
    .toc ol {
      margin: 0;
      padding-left: 22px;
    }
    .toc a {
      color: #374151;
      text-decoration: none;
      font-weight: 600;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 20px;
    }
    .index-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #dc1f3b;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .source-badge {
      padding: 6px 10px;
      border-radius: 6px;
      background: #f3f4f6;
      color: #6b7280;
      font-size: 13px;
      white-space: nowrap;
    }
    .section-body {
      padding: 24px;
    }
    .image-block,
    .description-block,
    .annotation-block {
      margin-bottom: 22px;
    }
    .block-title {
      margin: 0 0 10px;
      font-size: 15px;
      font-weight: 700;
      color: #374151;
    }
    .screenshot-frame {
      border: 1px solid #d9e0ea;
      border-radius: 10px;
      padding: 14px;
      background: #f9fafb;
    }
    .screenshot-frame img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
    }
    .description-content {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px 20px;
      background: #fff;
    }
    .empty {
      color: #9ca3af;
      font-style: italic;
    }
    .page-url {
      margin-top: 8px;
      color: #6b7280;
      font-size: 12px;
      word-break: break-all;
    }
    .annotation-summary {
      padding: 10px 14px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
      color: #7c5a12;
      font-size: 14px;
    }
    .html-preview-frame {
      width: 100%;
      height: 600px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
    }
    .html-context-block {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 8px;
      background: #f9fafb;
      border-left: 4px solid #2563eb;
      font-size: 13px;
      line-height: 1.7;
    }
    .html-context-block .context-title {
      font-weight: 700;
      margin-bottom: 6px;
      color: #1f2937;
    }
    h1, h2, h3 {
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f9fafb;
    }
    pre {
      background: #f5f7fb;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    code {
      background: #f5f7fb;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 13px;
    }
    @media print {
      body { background: #fff; }
      .document { max-width: none; padding: 0; }
      .hero, .toc, .page-section { box-shadow: none; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main class="document">
    <header class="hero">
      <h1>${n}</h1>
      <div class="meta">
        <span>生成时间：${D(t)}</span>
        <span>截图数量：${l.length}</span>
        <span>文档内容：标注截图 + 原型说明</span>
      </div>
    </header>
    <nav class="toc">
      <h2>目录</h2>
      <ol>${o}</ol>
    </nav>
    ${s}
  </main>
</body>
</html>`}function as(l,e){if(l.recordType==="html"||l.recordType==="prototype"||l.currentHtml)return cs(l,e);const t=l.name||l.pageTitle||`页面 ${e+1}`,n=l.renderedImageData||l.imageData,s=l.description?.trim(),o=us(l),i=l.pageTitle||l.name||"未知页面";return`<section class="page-section" id="page-${e+1}">
  <header class="section-header">
    <h2 class="section-title"><span class="index-badge">${e+1}</span>${D(t)}</h2>
    <span class="source-badge">来源：${D(i)}</span>
  </header>
  <div class="section-body">
    ${l.pageUrl?`<div class="page-url">来源地址：${D(l.pageUrl)}</div>`:""}
    <div class="image-block">
      <h3 class="block-title">标注截图</h3>
      <div class="screenshot-frame">
        <img src="${Qe(n)}" alt="${Qe(t)} 的标注截图">
      </div>
    </div>
    <div class="description-block">
      <h3 class="block-title">原型说明</h3>
      <div class="description-content">
        ${s?rt(s):'<p class="empty">该截图暂无原型说明。</p>'}
      </div>
    </div>
    <div class="annotation-block">
      <h3 class="block-title">标注摘要</h3>
      <div class="annotation-summary">${D(o)}</div>
    </div>
  </div>
</section>`}function cs(l,e){const t=l.name||l.pageTitle||`页面 ${e+1}`,n=l.description?.trim(),s=l.currentHtml||l.originalHtml||"",o=l.recordType==="prototype"?"HTML 原型页面":"HTML 高保真页面",i=l.pageUrl||l.pageTitle||l.name||"未知页面",r=l.htmlRevisionSummary?.trim()?`<div class="html-context-block">
        <div class="context-title">修改摘要</div>
        ${D(l.htmlRevisionSummary.trim())}
      </div>`:"",a=hs(l.htmlChatMessages),p=a?`<div class="html-context-block">
        <div class="context-title">AI 对话摘要</div>
        ${a}
      </div>`:"",c=n?`<div class="description-block">
        <h3 class="block-title">原型说明</h3>
        <div class="description-content">${rt(n)}</div>
      </div>`:"";return`<section class="page-section" id="page-${e+1}">
  <header class="section-header">
    <h2 class="section-title"><span class="index-badge">${e+1}</span>${D(t)}</h2>
    <span class="source-badge">来源：${D(i)}</span>
  </header>
  <div class="section-body">
    ${l.pageUrl?`<div class="page-url">来源地址：${D(l.pageUrl)}</div>`:""}
    <div class="image-block">
      <h3 class="block-title">${o}</h3>
      <iframe class="html-preview-frame" srcdoc="${ps(s)}"></iframe>
    </div>
    ${r}
    ${p}
    ${c}
  </div>
</section>`}function us(l){return l.annotationSummary?.length?l.annotationSummary.map((e,t)=>{const n=e.text?.trim()?`：${e.text.trim()}`:"";return`${t+1}. ${e.type}${n}`}).join("；"):l.fabricJson?"该页包含画布标注，详见上方标注截图。":"无标注"}function rt(l){const e=$.parse(l,{breaks:!0});return typeof e=="string"?e:""}function D(l){return l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Qe(l){return D(l)}function ps(l){return l.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function hs(l){return!l||l.length===0?"":l.slice(-6).map(t=>{const n=t.role==="user"?"用户":"AI",s=t.content.length>200?t.content.slice(0,200)+"...":t.content;return`${n}：${D(s)}`}).join("<br>")}function ds(){return typeof window<"u"&&"showDirectoryPicker"in window}async function fs(l,e,t){const s=await(await l.getFileHandle(e,{create:!0})).createWritable();try{await s.write(t)}finally{await s.close()}}async function gs(l){const e=l;return!e.queryPermission||await e.queryPermission({mode:"readwrite"})==="granted"?!0:e.requestPermission?await e.requestPermission({mode:"readwrite"})==="granted":!1}async function We(l,e,t="text/plain;charset=utf-8"){const n=new Blob([e],{type:t}),s=URL.createObjectURL(n);try{await new Promise((o,i)=>{chrome.downloads.download({url:s,filename:l,saveAs:!1},r=>{const a=chrome.runtime.lastError;if(a){i(new Error(a.message||"下载失败"));return}if(r===void 0){i(new Error("下载失败：未获取到下载 ID"));return}o()})})}finally{URL.revokeObjectURL(s)}}const ms={class:"export-panel card"},ks={key:0,class:"panel-state"},xs={key:1,class:"panel-state"},bs={key:2,class:"panel-state"},ws={key:3,class:"panel-state"},ys={class:"state-text"},vs={key:4,class:"panel-state"},_s=["title"],$s={class:"success-actions"},Ts={key:5,class:"panel-state"},zs={class:"state-error"},Rs=_e({__name:"ExportPanel",setup(l){const e=Et(),t=ze(),n=Ht(),s=L("idle"),o=L(""),i=L(""),r=q(()=>n.isConfigured()),a=q(()=>t.selectedCount>0),p=q(()=>r.value?a.value?s.value:"unselected":"unconfigured"),c=q(()=>s.value==="generating"||s.value==="saving"),f=q(()=>s.value==="generating"?"AI 正在生成开发提示词...":s.value==="saving"?"正在保存 2 份文件...":"处理中..."),u=q(()=>ds());async function d(){if(!n.isConfigured()){P.warning("请先完成 AI 配置");return}if(t.selectedCount===0){P.warning("请选择至少一个条目");return}let R=n.config;if(!R){P.error("AI 配置缺失");return}o.value="",i.value="",s.value="generating";let h="";try{const x=await Pt(R);if(!x)throw new Error("AI 配置缺失");R=x;const g=t.getSelectedRecords(),b=wn(),E=$n(g),H=g.map(te=>te.renderedImageData||te.imageData),N=await Mt(R).chat({apiUrl:R.apiUrl,apiKey:R.apiKey,model:R.model,systemPrompt:b,userPrompt:E,images:H}),ee=rs(g,R.documentTitlePrefix||"原型说明"),G=N.trim()||`# 开发提示词

AI 未返回可用内容。`,X=ls(R.documentTitlePrefix||"原型说明");h=`${X.prototypeHtml} / ${X.developmentPromptMd}`,i.value=h,s.value="saving",R.exportMode==="preview-only"||(R.exportMode==="directory"?await z(R.directoryHandleId,[{fileName:X.prototypeHtml,content:ee},{fileName:X.developmentPromptMd,content:G}])||(P.warning("导出目录已失效，已降级为下载保存"),await I(X,ee,G)):await I(X,ee,G)),await De(h,"success"),s.value="success",P.success("导出成功")}catch(x){const g=x instanceof Error?x.message:"导出失败";o.value=g,s.value="failed";try{const b=h||ve(R.documentTitlePrefix||"原型说明");await De(b,"failed",g)}catch{}P.error(g)}}async function z(R,h){if(R===void 0||!u.value)return!1;const x=jt.getHandle(R);if(!x)return!1;try{if(!await gs(x))return!1;for(const b of h)await fs(x,b.fileName,b.content);return!0}catch{return!1}}async function I(R,h,x){await We(R.prototypeHtml,h,"text/html;charset=utf-8"),await We(R.developmentPromptMd,x,"text/markdown;charset=utf-8")}function M(){d()}function U(){d()}function W(){e.push("/config")}return He(()=>t.selectedCount,()=>{s.value==="generating"||s.value==="saving"||(s.value="idle")}),He(()=>n.isConfigured(),()=>{s.value==="generating"||s.value==="saving"||(s.value="idle")}),$e(async()=>{await n.load()}),(R,h)=>{const x=j("el-icon"),g=j("el-button"),b=j("el-tooltip");return v(),S("div",ms,[p.value==="unconfigured"?(v(),S("div",ks,[m(x,{size:32,class:"state-icon state-icon-warning"},{default:_(()=>[m(y(je))]),_:1}),h[1]||(h[1]=w("p",{class:"state-text"},"请先完成 AI 配置",-1)),m(b,{content:"前往配置页",placement:"top","show-after":300},{default:_(()=>[m(g,{type:"primary",icon:y(je),onClick:W},{default:_(()=>[...h[0]||(h[0]=[Z("去配置",-1)])]),_:1},8,["icon"])]),_:1})])):p.value==="unselected"?(v(),S("div",xs,[m(x,{size:32,class:"state-icon state-icon-info"},{default:_(()=>[m(y(Be))]),_:1}),h[2]||(h[2]=w("p",{class:"state-text"},"请选择至少一个条目",-1)),h[3]||(h[3]=w("p",{class:"state-tip"},"在上方暂存区勾选需要导出的截图",-1))])):p.value==="idle"?(v(),S("div",bs,[m(b,{content:`整合 ${y(t).selectedCount} 个条目生成原型说明和开发提示词`,placement:"top","show-after":300},{default:_(()=>[m(g,{type:"primary",class:"export-btn",icon:y(Be),onClick:d},{default:_(()=>[Z(" AI 整合导出（"+A(y(t).selectedCount)+" 个条目） ",1)]),_:1},8,["icon"])]),_:1},8,["content"]),h[4]||(h[4]=w("p",{class:"state-tip"},"点击后将导出截图原型说明 HTML 和开发提示词 Markdown",-1))])):c.value?(v(),S("div",ws,[m(x,{size:32,class:"state-icon state-icon-loading"},{default:_(()=>[m(y(he))]),_:1}),w("p",ys,A(f.value),1),h[5]||(h[5]=w("p",{class:"state-tip"},"请稍候，可能需要数十秒",-1))])):p.value==="success"?(v(),S("div",vs,[m(x,{size:32,class:"state-icon state-icon-success"},{default:_(()=>[m(y(xt))]),_:1}),h[7]||(h[7]=w("p",{class:"state-text"},"导出成功",-1)),w("p",{class:"state-filename",title:i.value},A(i.value),9,_s),w("div",$s,[m(b,{content:"重新生成并导出",placement:"top","show-after":300},{default:_(()=>[m(g,{type:"primary",icon:y(qe),onClick:U},{default:_(()=>[...h[6]||(h[6]=[Z(" 重新导出 ",-1)])]),_:1},8,["icon"])]),_:1})])])):p.value==="failed"?(v(),S("div",Ts,[m(x,{size:32,class:"state-icon state-icon-danger"},{default:_(()=>[m(y(bt))]),_:1}),h[9]||(h[9]=w("p",{class:"state-text"},"导出失败",-1)),w("p",zs,A(o.value),1),m(b,{content:"重新尝试导出",placement:"top","show-after":300},{default:_(()=>[m(g,{type:"primary",icon:y(qe),onClick:M},{default:_(()=>[...h[8]||(h[8]=[Z("重试",-1)])]),_:1},8,["icon"])]),_:1})])):Q("",!0)])}}}),Ss=Te(Rs,[["__scopeId","data-v-045c7e4b"]]),Cs={class:"main-panel"},Is={class:"card capture-section"},As={key:0,class:"card empty-state"},Ps={key:1,class:"list-section"},Ls={class:"section-header"},Ms={class:"section-count"},Es={class:"export-section"},Hs=_e({__name:"MainPanel",setup(l){const e=ze(),t=L(!1);let n=null;const s=L(!1),o=L(!1);let i=null,r=null;async function a(){if(!t.value){t.value=!0,n=setTimeout(()=>{t.value=!1,n=null},8e3);try{await chrome.runtime.sendMessage({type:"capture-current-page"})}catch(u){t.value=!1,n&&(clearTimeout(n),n=null);const d=u instanceof Error?u.message:"截图请求失败";P.error(d)}}}async function p(){if(!s.value){s.value=!0,i=setTimeout(()=>{s.value=!1,i=null},8e3);try{await chrome.runtime.sendMessage({type:"copy-current-page-html"})}catch(u){s.value=!1,i&&(clearTimeout(i),i=null),P.error(u instanceof Error?u.message:"复制 HTML 请求失败")}}}async function c(){if(!o.value){o.value=!0,r=setTimeout(()=>{o.value=!1,r=null},5e3);try{await chrome.runtime.sendMessage({type:"create-new-prototype"})}catch(u){o.value=!1,r&&(clearTimeout(r),r=null),P.error(u instanceof Error?u.message:"新建原型请求失败")}}}function f(u){if(!u||typeof u!="object")return;const d=u.type;if(d==="capture-error"){t.value=!1,n&&(clearTimeout(n),n=null);const z=u.message??"截图失败";P.error(z)}else if(d==="capture-completed"||d==="capture-started")t.value=!1,n&&(clearTimeout(n),n=null);else if(d==="close-sidepanel-before-capture")window.close();else if(d==="html-copy-completed"||d==="prototype-editor-opened")s.value=!1,o.value=!1,i&&(clearTimeout(i),i=null),r&&(clearTimeout(r),r=null);else if(d==="html-copy-error"){s.value=!1,i&&(clearTimeout(i),i=null);const z=u.message??"复制 HTML 失败";P.error(z)}else if(d==="prototype-editor-error"){o.value=!1,r&&(clearTimeout(r),r=null);const z=u.message??"打开原型编辑器失败";P.error(z)}}return $e(async()=>{chrome.runtime.onMessage.addListener(f),await e.loadRecords()}),wt(()=>{chrome.runtime.onMessage.removeListener(f),n&&clearTimeout(n),i&&clearTimeout(i),r&&clearTimeout(r)}),(u,d)=>{const z=j("el-button"),I=j("el-icon");return v(),S("div",Cs,[w("section",Is,[m(z,{type:"primary",size:"large",class:"capture-btn",loading:t.value,icon:t.value?y(he):y(yt),onClick:a},{default:_(()=>[Z(A(t.value?"截图中...":"截取当前页面"),1)]),_:1},8,["loading","icon"]),m(z,{size:"large",class:"capture-btn",loading:s.value,icon:s.value?y(he):y(vt),onClick:p},{default:_(()=>[Z(A(s.value?"复制中...":"复制当前页面html"),1)]),_:1},8,["loading","icon"]),m(z,{size:"large",class:"capture-btn",loading:o.value,icon:o.value?y(he):y(_t),onClick:c},{default:_(()=>[Z(A(o.value?"创建中...":"新建原型"),1)]),_:1},8,["loading","icon"])]),y(e).hasRecords?(v(),S("section",Ps,[w("div",Ls,[d[1]||(d[1]=w("h3",{class:"section-title"},"暂存区",-1)),w("span",Ms,A(y(e).records.length)+" 条",1)]),m(dn)])):(v(),S("section",As,[m(I,{size:40,class:"empty-icon"},{default:_(()=>[m(y(be))]),_:1}),d[0]||(d[0]=w("p",{class:"empty-text"},"截取页面后，标注内容会出现在这里。",-1))])),w("section",Es,[d[2]||(d[2]=w("div",{class:"section-header"},[w("h3",{class:"section-title"},"AI 整合导出")],-1)),m(Ss)])])}}}),Zs=Te(Hs,[["__scopeId","data-v-b05edfe0"]]);export{Zs as default};
