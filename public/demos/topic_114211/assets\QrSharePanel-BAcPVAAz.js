import{c as T,o as i,a as d,b as e,d as c,e as f,a_ as $,f as h,as as j,aQ as F,U as L,t as m,D as V,F as w,g as y,i as N,m as b,p as v}from"./index-CdLDu4dD.js";import{F as U}from"./file-code-DL3lu1Wz.js";import{C as I}from"./copy-ZgzT3e_g.js";/**
 * @license lucide-vue-next v0.364.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=T("ShuffleIcon",[["path",{d:"M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22",key:"1wmou1"}],["path",{d:"m18 2 4 4-4 4",key:"pucp1d"}],["path",{d:"M2 6h1.9c1.5 0 2.9.9 3.6 2.2",key:"10bdb2"}],["path",{d:"M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8",key:"vgxac0"}],["path",{d:"m18 14 4 4-4 4",key:"10pe0f"}]]),R={class:"glass-card rounded-xl p-5"},q={class:"flex items-center justify-between mb-5"},P={class:"text-lg font-bold text-white flex items-center gap-2"},A={class:"grid md:grid-cols-2 gap-6"},E={class:"space-y-4"},H={class:"flex gap-2"},G={class:"bg-game-dark/50 rounded-xl p-4"},J={class:"flex items-center justify-between mb-2"},K={class:"text-sm text-gray-300 flex items-center gap-2"},O={class:"bg-game-darker rounded-lg p-3 max-h-24 overflow-y-auto"},W={class:"text-xs text-gray-400 break-all"},X={class:"flex flex-col items-center justify-center"},Y={class:"bg-white p-4 rounded-2xl shadow-2xl mb-4"},Z=["x","y","fill"],tt={class:"mt-4 w-full max-w-xs"},et={class:"flex items-center justify-between text-xs text-gray-400 mb-1"},st={class:"h-1.5 bg-game-dark rounded-full overflow-hidden"},k=200,lt=`暗黑破坏神2配装数据
职业：女巫
流派：暴风雪MF流
难度：地狱
属性点：
  力量：55
  敏捷：0
  体力：350
  精力：50
技能点：
  暴风雪：20
  冰弹：20
  冰尖柱：20
  冰冷掌握：20
  传送：1
装备：
  武器：橡树之心
  盾牌：精神盾
  护甲：谜团
  头盔：夜翼面纱
  手套：法师之拳
  靴子：战争旅者
  腰带：蜘蛛之网
  戒指：乔丹之石x2
  项链：玛拉的万花筒`,it={__name:"QrSharePanel",setup(ot){const o=b(`暗黑破坏神2 - 暴风雪法师Build
职业：女巫
难度：进阶
技能：暴风雪20/冰弹20/冰冷掌握20
装备：橡树之心+精神盾+谜团`),x=b(!1),p=v(()=>{try{return btoa(unescape(encodeURIComponent(o.value.substring(0,200))))}catch{return"编码失败"}}),_=v(()=>{const t=[];let l=0;for(let s=0;s<o.value.length;s++)l=l*31+o.value.charCodeAt(s)&4294967295;function n(){return l=l*1103515245+12345&2147483647,l/2147483647}for(let s=0;s<25;s++){const r=[];for(let a=0;a<25;a++){const g=a<8&&s<8,S=a>16&&s<8,z=a<8&&s>16,B=a>=9&&a<=15&&s>=9&&s<=15;g||S||z||B?r.push(!1):r.push(n()>.5)}t.push(r)}return t});function M(){o.value=lt}function C(){const u=["野蛮人","女巫","圣骑士","死灵法师","亚马逊","刺客","德鲁伊"],t=["旋风斩流","暴风雪流","祝福之锤流","召唤流","标枪流","陷阱流","风德流"],l=u[Math.floor(Math.random()*u.length)],n=t[Math.floor(Math.random()*t.length)],s=Math.floor(Math.random()*100)+30,r=Math.floor(Math.random()*100)+20,a=Math.floor(Math.random()*200)+150,g=Math.floor(Math.random()*50)+10;o.value=`暗黑破坏神2配装数据
职业：${l}
流派：${n}
难度：地狱
属性点：
  力量：${s}
  敏捷：${r}
  体力：${a}
  精力：${g}
生成时间：${new Date().toLocaleString()}`}function D(){navigator.clipboard.writeText(p.value),x.value=!0,setTimeout(()=>{x.value=!1},2e3)}return(u,t)=>(i(),d("div",R,[e("div",q,[e("h2",P,[c(f($),{class:"w-5 h-5 text-game-accent"}),t[1]||(t[1]=h(" 二维码分享 ",-1))])]),e("div",A,[e("div",E,[e("div",null,[t[2]||(t[2]=e("label",{class:"text-xs text-gray-400 mb-1.5 block"},"分享内容",-1)),j(e("textarea",{"onUpdate:modelValue":t[0]||(t[0]=l=>o.value=l),rows:"6",placeholder:"输入要分享的文本内容，或使用默认角色数据...",class:"w-full bg-game-dark/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-game-accent/50 resize-none"},null,512),[[F,o.value]])]),e("div",H,[e("button",{onClick:M,class:"flex-1 py-2 bg-game-dark/50 border border-white/10 hover:border-game-accent/50 rounded-lg text-sm text-gray-300 flex items-center justify-center gap-2 transition-all"},[c(f(L),{class:"w-4 h-4"}),t[3]||(t[3]=h(" 使用角色数据 ",-1))]),e("button",{onClick:C,class:"flex-1 py-2 bg-game-dark/50 border border-white/10 hover:border-game-accent/50 rounded-lg text-sm text-gray-300 flex items-center justify-center gap-2 transition-all"},[c(f(Q),{class:"w-4 h-4"}),t[4]||(t[4]=h(" 随机生成 ",-1))])]),e("div",G,[e("div",J,[e("span",K,[c(f(U),{class:"w-4 h-4 text-game-gold"}),t[5]||(t[5]=h(" Base64分享码 ",-1))]),e("button",{onClick:D,class:"text-xs text-game-accent hover:text-game-accent/80 flex items-center gap-1"},[c(f(I),{class:"w-3.5 h-3.5"}),h(" "+m(x.value?"已复制":"复制"),1)])]),e("div",O,[e("code",W,m(p.value),1)])]),t[6]||(t[6]=e("p",{class:"text-xs text-gray-500 text-center"}," 💡 扫描二维码或复制分享码即可导入数据 ",-1))]),e("div",X,[e("div",Y,[(i(),d("svg",{width:k,height:k,viewBox:"0 0 25 25",xmlns:"http://www.w3.org/2000/svg"},[t[7]||(t[7]=V('<rect x="0" y="0" width="7" height="7" fill="#000"></rect><rect x="1" y="1" width="5" height="5" fill="#fff"></rect><rect x="2" y="2" width="3" height="3" fill="#000"></rect><rect x="18" y="0" width="7" height="7" fill="#000"></rect><rect x="19" y="1" width="5" height="5" fill="#fff"></rect><rect x="20" y="2" width="3" height="3" fill="#000"></rect><rect x="0" y="18" width="7" height="7" fill="#000"></rect><rect x="1" y="19" width="5" height="5" fill="#fff"></rect><rect x="2" y="20" width="3" height="3" fill="#000"></rect>',9)),(i(!0),d(w,null,y(_.value,(l,n)=>(i(),d("g",{key:n},[(i(!0),d(w,null,y(l,(s,r)=>(i(),d("rect",{key:r,x:r,y:n,width:"1",height:"1",fill:s?"#000":"#fff"},null,8,Z))),128))]))),128)),t[8]||(t[8]=e("rect",{x:"10",y:"10",width:"5",height:"5",fill:"#fff"},null,-1)),t[9]||(t[9]=e("text",{x:"12.5",y:"14","text-anchor":"middle","font-size":"4","font-weight":"bold",fill:"#8b5cf6"},"D2",-1))]))]),t[11]||(t[11]=e("div",{class:"text-center"},[e("p",{class:"text-sm text-white font-medium mb-1"},"扫码分享"),e("p",{class:"text-xs text-gray-400"},"使用手机扫描即可查看")],-1)),e("div",tt,[e("div",et,[t[10]||(t[10]=e("span",null,"数据大小",-1)),e("span",null,m(o.value.length)+" 字符",1)]),e("div",st,[e("div",{class:"h-full bg-gradient-to-r from-game-accent to-game-gold rounded-full transition-all",style:N({width:Math.min(100,o.value.length/5)+"%"})},null,4)])])])])]))}};export{it as default};
