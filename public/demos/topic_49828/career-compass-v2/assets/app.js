// ===================== PARTICLE BG =====================
const pCanvas=document.getElementById('particle-canvas');
const pCtx=pCanvas.getContext('2d');
let pw,ph,particles=[];
function resizeP(){pw=pCanvas.width=window.innerWidth;ph=pCanvas.height=window.innerHeight}
resizeP();window.addEventListener('resize',resizeP);
class Particle{constructor(){this.x=Math.random()*pw;this.y=Math.random()*ph;this.vx=(Math.random()-.5)*.4;this.vy=(Math.random()-.5)*.4;this.r=Math.random()*1.5+.5}
update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>pw)this.vx*=-1;if(this.y<0||this.y>ph)this.vy*=-1}
draw(){pCtx.beginPath();pCtx.arc(this.x,this.y,this.r,0,Math.PI*2);pCtx.fillStyle='rgba(0,212,255,.35)';pCtx.fill()}}
for(let i=0;i<80;i++)particles.push(new Particle());
function animateP(){pCtx.clearRect(0,0,pw,ph);particles.forEach(p=>{p.update();p.draw()});
for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){let dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){pCtx.beginPath();pCtx.moveTo(particles[i].x,particles[i].y);pCtx.lineTo(particles[j].x,particles[j].y);pCtx.strokeStyle=`rgba(0,212,255,${.15*(1-d/120)})`;pCtx.stroke()}}
requestAnimationFrame(animateP)}
animateP();

// ===================== MATRIX RAIN =====================
const mCanvas=document.getElementById('matrix-canvas');
const mCtx=mCanvas.getContext('2d');
let mw,mh,mCols,mDrops=[],mChars='01アイウエオカキクケコサシスセソ';
function resizeM(){mw=mCanvas.width=window.innerWidth;mh=mCanvas.height=window.innerHeight;mCols=Math.floor(mw/14);mDrops=Array(mCols).fill(1)}
resizeM();window.addEventListener('resize',resizeM);
function drawM(){mCtx.fillStyle='rgba(5,5,8,.05)';mCtx.fillRect(0,0,mw,mh);mCtx.fillStyle='rgba(0,212,255,.2)';mCtx.font='14px monospace';
for(let i=0;i<mCols;i++){let c=mChars[Math.floor(Math.random()*mChars.length)];mCtx.fillText(c,i*14,mDrops[i]*14);if(mDrops[i]*14>mh&&Math.random()>.975)mDrops[i]=0;mDrops[i]++}
requestAnimationFrame(drawM)}
drawM();

// ===================== NAV / ROUTING =====================
const pages=['dashboard','dna','match','surgery','trial','report'];
let currentPage='dashboard';
const progress={dna:false,match:false,surgery:false,trial:false};
function goPage(id){pages.forEach(p=>{document.getElementById('page-'+p).classList.remove('active')});
document.getElementById('page-'+id).classList.add('active');
document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
let nl=document.querySelector('.nav-link[data-page="'+id+'"]');if(nl)nl.classList.add('active');
currentPage=id;window.scrollTo(0,0);updateJourney();if(id==='report')renderReport()}
document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.page)));
function enterSystem(){document.getElementById('landing').classList.add('fade-out');setTimeout(()=>{document.getElementById('landing').style.display='none';document.getElementById('main-nav').style.display='block';document.getElementById('main-wrap').style.display='block';document.getElementById('global-loader').classList.add('hidden')},1000)}
document.addEventListener('keydown',function handler(e){if(document.getElementById('landing').style.display!=='none'){enterSystem();document.removeEventListener('keydown',handler)}});

function updateJourney(){const map={dna:1,match:2,surgery:3,trial:4,report:5};
for(let k in map){let el=document.getElementById('jn-'+map[k]);let lb=el.nextElementSibling;if(!el)continue;
if(progress[k]){el.classList.add('done');el.innerHTML='&#10003;';el.classList.remove('active');lb.classList.remove('active')}
else if(currentPage===k){el.classList.add('active');lb.classList.add('active');el.classList.remove('done')}
else{el.classList.remove('active','done');lb.classList.remove('active')}}}

// ===================== SAMPLE DATA =====================
const SAMPLE_RESUME=`李明 | 前端开发工程师
138****8888 | liming@email.com

教育背景
XX大学 软件工程 本科 2019-2023

工作经历
ABC科技有限公司 | 前端工程师 | 2023.07-至今
- 负责电商后台管理系统前端开发
- 使用React + TypeScript进行组件化开发
- 参与前端性能优化，页面加载速度提升30%

XYZ互联网公司 | 前端实习生 | 2022.03-2022.09
- 协助开发企业官网和H5活动页面
- 使用Vue.js实现响应式页面

项目经验
- 电商后台管理系统：负责订单管理、商品管理模块开发
- 个人博客系统：全栈开发，使用React + Node.js

技能
HTML/CSS/JS、React、Vue、TypeScript、Git`;

const SAMPLE_JD=`【高级前端开发工程师】

岗位职责：
1. 负责核心产品前端架构设计与开发
2. 主导前端技术选型，推动工程化建设
3. 优化前端性能，提升用户体验
4. 指导初中级工程师，进行代码评审

任职要求：
1. 本科及以上学历，3年以上前端经验
2. 精通JavaScript/TypeScript，深入理解ES6+
3. 精通React生态，熟悉Redux、React Router
4. 熟悉前端工程化（Webpack/Vite/Rollup）
5. 有大型项目性能优化经验
6. 具备良好沟通能力和团队协作精神

加分项：
- Node.js全栈开发经验
- 参与过开源项目
- 熟悉微前端架构`;

function loadSampleResume(){document.getElementById('resume-text').value=SAMPLE_RESUME}
function loadSampleJD(){document.getElementById('jd-text').value=SAMPLE_JD}

// ===================== DNA ANALYSIS =====================
const DNA_DIMS=['结构完整','内容深度','技术栈宽','项目厚度','量化成果','成长潜力'];
const DNA_SCORES=[72,58,65,48,42,68];
function analyzeDNA(){let txt=document.getElementById('resume-text').value.trim();if(!txt){alert('请先输入简历');return}
document.getElementById('dna-input').style.display='none';document.getElementById('dna-loading').style.display='block';
const texts=['正在提取生物特征...','解析技能基因序列...','评估项目深度指数...','量化成果扫描中...','生成六维能力图谱...'];
let i=0,t=setInterval(()=>{if(i<texts.length)document.getElementById('dna-loading-text').textContent=texts[i++];},400);
setTimeout(()=>{clearInterval(t);document.getElementById('dna-loading').style.display='none';document.getElementById('dna-result').style.display='block';showDNARadar();showDNAChain();showDNAConclusion();progress.dna=true;updateJourney();updateDash()},2600)}

function showDNARadar(){const c=document.getElementById('radar-canvas'),ctx=c.getContext('2d'),cx=190,cy=190,r=140,n=6;
ctx.clearRect(0,0,380,380);const angle=k=>(Math.PI*2*k/n)-Math.PI/2;
for(let i=1;i<=5;i++){ctx.beginPath();for(let j=0;j<n;j++){let a=angle(j),x=cx+Math.cos(a)*r*(i/5),y=cy+Math.sin(a)*r*(i/5);if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.strokeStyle='rgba(255,255,255,.06)';ctx.stroke()}
for(let j=0;j<n;j++){let a=angle(j);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.strokeStyle='rgba(255,255,255,.06)';ctx.stroke();ctx.fillStyle='rgba(0,212,255,.7)';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(DNA_DIMS[j],cx+Math.cos(a)*(r+22),cy+Math.sin(a)*(r+22))}
ctx.beginPath();for(let j=0;j<n;j++){let a=angle(j),v=DNA_SCORES[j]/100,x=cx+Math.cos(a)*r*v,y=cy+Math.sin(a)*r*v;if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fillStyle='rgba(0,212,255,.2)';ctx.fill();ctx.strokeStyle='#00d4ff';ctx.lineWidth=2;ctx.stroke();DNA_SCORES.forEach((s,j)=>{let a=angle(j),v=s/100,x=cx+Math.cos(a)*r*v,y=cy+Math.sin(a)*r*v;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle='#00d4ff';ctx.shadowColor='#00d4ff';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0})
let total=Math.round(DNA_SCORES.reduce((a,b)=>a+b,0)/n);document.getElementById('dna-total').textContent=total}

function showDNAChain(){const genes=[{n:'React',s:75,c:'var(--cyan)'},{n:'Vue',s:60,c:'var(--cyan)'},{n:'TypeScript',s:55,c:'var(--cyan)'},{n:'工程化',s:40,c:'var(--red)'},{n:'性能优化',s:48,c:'var(--red)'},{n:'Node.js',s:35,c:'var(--red)'},{n:'量化表达',s:30,c:'var(--red)'},{n:'架构设计',s:25,c:'var(--red)'},{n:'团队协作',s:50,c:'var(--purple)'},{n:'学习能力',s:70,c:'var(--purple)'}];
document.getElementById('dna-chain').innerHTML=genes.map(g=>`<div class="dna-item"><div class="dna-node" style="background:${g.c};box-shadow:0 0 10px ${g.c}"></div><div class="dna-text">${g.n}</div><div class="dna-val" style="color:${g.c}">${g.s}%</div></div>`).join('')}

function showDNAConclusion(){const html=`<div class="result-item" style="display:flex;gap:12px;padding:12px;background:var(--bg2);border-radius:10px;margin-bottom:10px;border-left:3px solid var(--cyan)"><div style="font-size:1.3rem">&#128302;</div><div><div style="font-weight:700;font-size:.9rem;margin-bottom:4px">职业基因型：成长型前端工程师</div><div style="font-size:.85rem;color:var(--muted)">基础扎实，技术栈覆盖主流框架，但工程化深度和量化表达是明显短板。</div></div></div>
<div class="grid-2" style="margin-top:16px">
<div class="glass" style="padding:16px"><div style="color:var(--green);font-weight:700;margin-bottom:6px">&#9650; 优势基因</div><div style="font-size:.8rem;color:var(--muted)">React/Vue双栈、有电商项目实战、学习能力较强</div></div>
<div class="glass" style="padding:16px"><div style="color:var(--red);font-weight:700;margin-bottom:6px">&#9660; 缺陷基因</div><div style="font-size:.8rem;color:var(--muted)">工程化深度不足、量化成果匮乏、架构经验缺失</div></div>
</div>`;
document.getElementById('dna-conclusion').innerHTML=html}
function resetDNA(){document.getElementById('dna-result').style.display='none';document.getElementById('dna-input').style.display='block';progress.dna=false;updateJourney()}

// ===================== MATCH ANALYSIS =====================
const MATCH_DIMS={skills:62,exp:48,edu:95,level:55,culture:58};
function analyzeMatch(){let txt=document.getElementById('jd-text').value.trim();if(!txt){alert('请先输入JD');return}
document.getElementById('match-input').style.display='none';document.getElementById('match-loading').style.display='block';
setTimeout(()=>{document.getElementById('match-loading').style.display='none';document.getElementById('match-result').style.display='block';showMatchResult();progress.match=true;updateJourney();updateDash()},2200)}

function showMatchResult(){let total=Math.round(Object.values(MATCH_DIMS).reduce((a,b)=>a+b,0)/5);
let orb=document.getElementById('match-orb');let sc=document.getElementById('orb-score');
sc.textContent=total+'%';sc.className='orb-score glow-'+((total>=70)?'green':(total>=50)?'yellow':'red');
orb.className='match-orb orb-glow-'+(total>=70?'green':total>=50?'yellow':'red');
let spectrum=[{n:'技能',v:MATCH_DIMS.skills,c:'var(--cyan)'},{n:'经验',v:MATCH_DIMS.exp,c:'var(--red)'},{n:'学历',v:MATCH_DIMS.edu,c:'var(--green)'},{n:'职级',v:MATCH_DIMS.level,c:'var(--yellow)'},{n:'文化',v:MATCH_DIMS.culture,c:'var(--purple)'}];
document.getElementById('match-spectrum').innerHTML=spectrum.map(s=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px"><span>${s.n}</span><span style="color:${s.c}">${s.v}%</span></div><div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;width:0%;background:${s.c};border-radius:3px;transition:width 1s ease" class="spec-bar"></div></div></div>`).join('');
setTimeout(()=>document.querySelectorAll('.spec-bar').forEach((el,i)=>el.style.width=spectrum[i].v+'%'),300);
const words=[{t:'React',s:1.4,c:'match'},{t:'TypeScript',s:1.3,c:'match'},{t:'3年经验',s:1.2,c:'req'},{t:'工程化',s:1.2,c:'req'},{t:'性能优化',s:1.1,c:'match'},{t:'Redux',s:1,c:'bonus'},{t:'Webpack',s:1,c:'match'},{t:'微前端',s:.9,c:'bonus'},{t:'Node.js',s:.9,c:'bonus'},{t:'开源',s:.8,c:'bonus'},{t:'团队协作',s:.8,c:'soft'},{t:'代码评审',s:.8,c:'soft'}];
document.getElementById('word-cloud').innerHTML=words.map((w,i)=>`<span class="word-tag ${w.c}" style="font-size:${.7+w.s*.4}rem;animation-delay:${i*.15}s">${w.t}</span>`).join('');
let dimsHtml=`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">`+Object.entries(MATCH_DIMS).map(([k,v])=>`<div class="glass" style="padding:14px;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:${v>=70?'var(--green)':v>=50?'var(--yellow)':'var(--red)'}">${v}%</div><div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;margin-top:4px">${k}</div></div>`).join('')+`</div>`;
document.getElementById('match-dims').innerHTML=dimsHtml;
document.getElementById('match-conclusion').innerHTML=`<div class="result-item" style="display:flex;gap:12px;padding:12px;background:var(--bg2);border-radius:10px;margin-bottom:10px;border-left:3px solid var(--yellow)"><div style="font-size:1.3rem">&#127919;</div><div><div style="font-weight:700;font-size:.9rem;margin-bottom:4px">匹配诊断：有差距但可优化</div><div style="font-size:.85rem;color:var(--muted)">核心技能基本覆盖，但经验年限和工程化深度是主要缺口。建议通过简历优化突出项目深度。</div></div></div>
<div class="grid-2" style="margin-top:16px"><div class="glass" style="padding:16px"><div style="color:var(--green);font-weight:700;margin-bottom:6px">&#9989; 匹配亮点</div><div style="font-size:.8rem;color:var(--muted)">React/TS技术栈对齐；学历达标；有电商相关项目经验</div></div><div class="glass" style="padding:16px"><div style="color:var(--red);font-weight:700;margin-bottom:6px">&#10060; 关键缺口</div><div style="font-size:.8rem;color:var(--muted)">工作年限不足(1年vs3年)；缺少工程化深度；无架构/开源经验</div></div></div>`}
function resetMatch(){document.getElementById('match-result').style.display='none';document.getElementById('match-input').style.display='block';progress.match=false;updateJourney()}

// ===================== SURGERY / IDE DIFF =====================
const ORIG_TEXT=`工作经历
ABC科技有限公司 | 前端工程师 | 2023.07-至今
- 负责公司电商后台管理系统前端开发
- 使用React + TypeScript进行组件化开发
- 参与前端性能优化，页面加载速度提升30%

项目经验
- 电商后台管理系统：负责订单管理、商品管理模块开发`;

const OPT_TEXT=`工作经历
ABC科技有限公司 | 前端工程师 | 2023.07-至今
- <span class="add">主导</span>电商后台管理系统<span class="add">前端架构设计</span>，覆盖订单/商品/用户<span class="add">三大核心模块，支撑日均10万+订单处理</span>
- <span class="add">基于React 18 + TypeScript搭建前端工程体系</span>，开发30+可复用业务组件，<span class="add">代码复用率提升60%</span>
- <span class="add">主导前端性能优化专项</span>：通过组件懒加载+代码分割+CDN加速，<span class="add">首屏加载从3.2s降至1.1s，用户跳出率降低18%</span>
- <span class="add">推动团队工程化建设</span>：接入ESLint/Prettier/Husky规范，<span class="add">代码评审效率提升40%</span>

项目经验
电商后台管理系统 | <span class="add">前端负责人</span>
- <span class="add">【背景】</span>随着订单量增长，后台管理页面出现严重卡顿，影响运营效率
- <span class="add">【行动】</span>设计虚拟滚动+分页加载方案，重构订单列表组件；引入React Query优化数据缓存策略
- <span class="add">【结果】</span>列表渲染耗时从2s降至200ms，运营人员日处理效率提升3倍`;

const DIFF_TEXT=`<span style="color:var(--muted)">工作经历</span>
ABC科技有限公司 | 前端工程师 | 2023.07-至今
<span class="del">- 负责公司电商后台管理系统前端开发</span>
<span class="add">+ 主导电商后台管理系统前端架构设计，覆盖订单/商品/用户三大核心模块，支撑日均10万+订单处理</span>
<span class="del">- 使用React + TypeScript进行组件化开发</span>
<span class="add">+ 基于React 18 + TypeScript搭建前端工程体系，开发30+可复用业务组件，代码复用率提升60%</span>
<span class="del">- 参与前端性能优化，页面加载速度提升30%</span>
<span class="add">+ 主导前端性能优化专项：通过组件懒加载+代码分割+CDN加速，首屏加载从3.2s降至1.1s，用户跳出率降低18%</span>
<span class="add">+ 推动团队工程化建设：接入ESLint/Prettier/Husky规范，代码评审效率提升40%</span>

<span style="color:var(--muted)">项目经验</span>
<span class="del">- 电商后台管理系统：负责订单管理、商品管理模块开发</span>
<span class="add">+ 电商后台管理系统 | 前端负责人</span>
<span class="add">+ 【背景】随着订单量增长，后台管理页面出现严重卡顿，影响运营效率</span>
<span class="add">+ 【行动】设计虚拟滚动+分页加载方案，重构订单列表组件</span>
<span class="add">+ 【结果】列表渲染耗时从2s降至200ms，运营人员日处理效率提升3倍`;

function renderSurgery(){document.getElementById('ide-orig').textContent=ORIG_TEXT;document.getElementById('ide-opt').innerHTML=OPT_TEXT;document.getElementById('ide-diff').innerHTML=DIFF_TEXT;
const plans=[{t:'量化指标增强',d:'将所有"负责开发"改为可量化的数据描述，突出业务价值'},{t:'STAR法则重构',d:'项目经验按情境-任务-行动-结果四段式重写'},{t:'关键词植入',d:'增加"前端架构""工程化""组件库"等JD高频词'},{t:'职级对齐',d:'通过"主导""推动""负责"等词汇提升角色定位'}];
document.getElementById('surgery-plans').innerHTML=plans.map((p,i)=>`<div class="suggestion-item"><div class="si-num">${i+1}</div><div class="si-text"><strong>${p.t}</strong>：${p.d}</div></div>`).join('')}
function switchTab(el,type){document.querySelectorAll('.ide-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
['orig','opt','diff'].forEach(id=>document.getElementById('ide-'+id).style.display='none');
if(type==='diff'){document.getElementById('ide-diff').style.display='block'}
else{document.getElementById('ide-orig').style.display='block';document.getElementById('ide-opt').style.display='block'}}
renderSurgery();

// ===================== TRIAL / INTERVIEW =====================
const ROLES={tech:{name:'陈总工',role:'技术总监',avatar:'&#128104;&#8205;&#128187;',tag:'tag-red',tagT:'&#9889; 地狱难度',
qs:['请先做一个自我介绍，重点突出技术深度。','你提到做过性能优化，具体用了哪些手段？数据如何？','React 18的并发特性了解吗？useTransition在实际中怎么用？','如果让你设计一个支持10万QPS的前端架构，你会怎么考虑？','你只有1年经验，凭什么认为自己能胜任高级岗位？']},
hr:{name:'林HR',role:'资深HR',avatar:'&#128105;&#8205;&#128188;',tag:'tag-cyan',tagT:'&#127775; 标准难度',
qs:['请简单介绍一下自己。','你为什么想离开现在的公司？','你的职业规划是什么？3-5年后想成为什么样的人？','请描述一次你与同事产生分歧的经历，如何解决的？','你期望的薪资是多少？']},
pm:{name:'张产品',role:'产品总监',avatar:'&#128104;&#8205;&#127912;',tag:'tag-purple',tagT:'&#127922; 随机难度',
qs:['请介绍一下你做过的一个项目。','如果用户反馈页面加载慢，你会怎么分析？','技术和产品有冲突时，你会怎么处理？','如何平衡开发效率和用户体验？','你觉得我们产品最大的改进空间在哪里？']}};

let trialState=null;
function startTrial(role){trialState={role:role,round:0,answers:[]};let r=ROLES[role];
document.getElementById('role-select').style.display='none';document.getElementById('trial-room').style.display='block';document.getElementById('trial-report').style.display='none';
document.getElementById('trial-role-name').textContent=r.name;document.getElementById('trial-role-desc').textContent=r.role;
document.getElementById('trial-avatar').innerHTML=r.avatar;document.getElementById('chat-name').textContent=r.name;document.getElementById('chat-role').textContent=r.role;
document.getElementById('trial-tag').className='tag '+r.tag;document.getElementById('trial-tag').innerHTML=r.tagT;
document.getElementById('chat-mid').innerHTML='';addTrialMsg('ai',r.name+'：'+r.qs[0]);updateTrialUI()}

function addTrialMsg(role,text){const mid=document.getElementById('chat-mid');const div=document.createElement('div');div.className='msg '+role;
div.innerHTML=`<div class="msg-bubble">${text}</div><div class="msg-meta">${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>`;
mid.appendChild(div);mid.scrollTop=mid.scrollHeight}

function sendTrialMsg(){const inp=document.getElementById('chat-input');const txt=inp.value.trim();if(!txt)return;inp.value='';
addTrialMsg('user',txt);trialState.answers.push(txt);trialState.round++;
if(trialState.round>=5){setTimeout(()=>{addTrialMsg('ai',ROLES[trialState.role].name+'：今天的面试就到这里，感谢你的参与。');showTrialReport()},1000);return}
setTimeout(()=>{const think=document.createElement('div');think.className='msg ai';think.innerHTML='<div class="thinking-bubble"><div class="td"></div><div class="td"></div><div class="td"></div></div>';document.getElementById('chat-mid').appendChild(think);document.getElementById('chat-mid').scrollTop=document.getElementById('chat-mid').scrollHeight;
setTimeout(()=>{think.remove();let q=ROLES[trialState.role].qs[trialState.round];addTrialMsg('ai',ROLES[trialState.role].name+'：'+q);updateTrialUI()},1400)},600)}

function updateTrialUI(){document.getElementById('trial-round').textContent=(trialState.round+1)+'/5';let stress=['正常','略微紧张','紧张','高度紧张','肾上腺素飙升'][trialState.round];document.getElementById('trial-stress').textContent=stress}
function endTrialEarly(){showTrialReport()}

function showTrialReport(){document.getElementById('trial-room').style.display='none';document.getElementById('trial-report').style.display='block';
let scores=[{n:'技术深度',v:68,c:'var(--cyan)'},{n:'沟通表达',v:75,c:'var(--purple)'},{n:'应变能力',v:62,c:'var(--yellow)'},{n:'岗位匹配',v:58,c:'var(--green)'}];
let avg=Math.round(scores.reduce((a,s)=>a+s.v,0)/4);
let tier=avg>=85?'王者':avg>=70?'钻石':avg>=60?'黄金':avg>=50?'白银':'青铜';
document.getElementById('trial-tier').textContent=tier+'段位';
document.getElementById('trial-stats').innerHTML=scores.map(s=>`<div class="glass report-card"><div class="rc-num" style="color:${s.c}">${s.v}</div><div class="rc-label">${s.n}</div></div>`).join('');
progress.trial=true;updateJourney();updateDash()}

function resetTrial(){document.getElementById('trial-report').style.display='none';document.getElementById('role-select').style.display='block';trialState=null}

// ===================== REPORT =====================
function renderReport(){let dnaAvg=Math.round(DNA_SCORES.reduce((a,b)=>a+b,0)/6);
let matchAvg=Math.round(Object.values(MATCH_DIMS).reduce((a,b)=>a+b,0)/5);
let intAvg=progress.trial?66:0;let potential=Math.round((dnaAvg+matchAvg+(intAvg||0))/3);
let final=Math.round(dnaAvg*.3+matchAvg*.3+(intAvg||0)*.4);
let tier=final>=80?'钻石猎手':final>=65?'黄金战士':final>=50?'白银勇者':'青铜学徒';
document.getElementById('final-tier').textContent=tier;document.getElementById('fs-score').textContent=dnaAvg;
document.getElementById('fs-match').textContent=matchAvg+'%';document.getElementById('fs-interview').textContent=intAvg||'--';
document.getElementById('fs-potential').textContent=potential;
const advice=[{t:'短期（1-2周）',d:'用STAR法则重写项目经验，补充3-5个量化指标，植入JD关键词'},{t:'中期（1-3月）',d:'深入学习React 18并发特性，搭建一个组件库或工具链，积累可展示的作品'},{t:'长期（3-6月）',d:'参与开源项目或撰写技术博客，建立个人技术品牌，弥补年限差距'}];
document.getElementById('final-advice').innerHTML=advice.map(a=>`<div class="suggestion-item"><div class="si-text"><strong style="color:var(--cyan)">${a.t}</strong><br>${a.d}</div></div>`).join('');
renderGrowthChart(dnaAvg,matchAvg,intAvg||0)}

function renderGrowthChart(d,m,i){const c=document.getElementById('growth-canvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,480,260);
const labels=['起点','诊断后','匹配后','优化后','面试后'],data=[40,dnaAvg-10,dnaAvg,Math.min(100,dnaAvg+8),Math.round((dnaAvg+m+(i||0))/3)];
const pad=40,w=480-pad*2,h=260-pad*2;const max=100;
ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;for(let i=0;i<=4;i++){let y=pad+h*(i/4);ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(480-pad,y);ctx.stroke()}
ctx.fillStyle='var(--muted)';ctx.font='11px sans-serif';ctx.textAlign='center';labels.forEach((l,i)=>ctx.fillText(l,pad+(w/4)*i,260-pad+18));
ctx.beginPath();data.forEach((v,i)=>{let x=pad+(w/4)*i,y=pad+h*(1-v/max);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});
ctx.strokeStyle='#00d4ff';ctx.lineWidth=3;ctx.shadowColor='#00d4ff';ctx.shadowBlur=15;ctx.stroke();ctx.shadowBlur=0;
data.forEach((v,i)=>{let x=pad+(w/4)*i,y=pad+h*(1-v/max);ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='#00d4ff';ctx.shadowColor='#00d4ff';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.fillText(v,x,y-12)})}

// ===================== DASHBOARD UPDATE =====================
function updateDash(){let dnaAvg=Math.round(DNA_SCORES.reduce((a,b)=>a+b,0)/6);let matchAvg=progress.match?Math.round(Object.values(MATCH_DIMS).reduce((a,b)=>a+b,0)/5):'--';
let final=Math.round(dnaAvg*.3+(progress.match?parseInt(matchAvg)*.3:0)+(progress.trial?66*.4:0));
let tier=final>=80?'钻石':final>=65?'黄金':final>=50?'白银':'青铜';
document.getElementById('dash-score').textContent=dnaAvg;document.getElementById('dash-match').textContent=matchAvg==='--'?'--':matchAvg+'%';
document.getElementById('dash-tier').textContent=progress.trial?tier:'未评级'}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{document.getElementById('global-loader').classList.add('hidden')},800)});
