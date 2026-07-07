// ============================================================
// 数学星球 - 配置与题目生成器
// ============================================================

// ----- 配色方案（Messenger风格：青绿色系、低饱和）-----
const COLORS = {
    sky: 0x5DBDB6,
    skyLight: 0x7DD3CD,
    water: 0x4A9E9E,
    waterDeep: 0x3A7A7A,
    ground: 0x8BC34A,
    groundDark: 0x7CB342,
    sand: 0xE8D5A3,
    sandDark: 0xD4C08A,
    tree: 0x558B2F,
    treeLight: 0x7CB342,
    trunk: 0x8D6E63,
    rock: 0x9E9E9E,
    snow: 0xF5F5F5,
    building: 0xEFEBE9,
    buildingRoof: 0xD7CCC8,
    temple: 0xFFCC80,
    templeRoof: 0xE65100,
    factory: 0xB0BEC5,
    playground: 0xFFAB91,
    shard: 0xF5C542,
    npc: [0xE85D4E, 0x5DBDB6, 0x7CB342, 0xFFAB91, 0xBA68C8, 0xFFD54F]
};

// ----- 游戏状态 -----
var GameState = {
    score: 0, currentGrade: 0, answeredCount: 0, totalQuestions: 10,
    questionOpen: false, levelComplete: false, isPlaying: false,
    gradesCompleted: {}, currentNPCIndex: -1, dialogueOpen: false,
    energyShards: 0, shardsNeeded: 10, dialogueQueue: [], dialogueIndex: 0,
    playerStyle: { hair: 0, clothes: 0, bag: 0 },
    // NPC通关追踪：记录每个NPC是否已答完题
    npcCompleted: {},      // { npcName: true/false }
    npcScores: {},         // { npcName: score }
    totalNpcCount: 0       // 当前大陆NPC总数
};

// ----- 球形世界参数 -----
var PLANET_RADIUS = 120;
var GRAVITY = 45;
var JUMP_FORCE = 18;
var PLAYER_HEIGHT = 1.5;
var MOUSE_SENSITIVITY_X = 0.0010;
var MOUSE_SENSITIVITY_Y = 0.0007;
var MAX_PITCH = Math.PI / 2.5;

// ----- 年级配置 -----
var GradeConfig = [
    { name: '一年级大陆', color: 0xE85D4E, gen: 'g0', regions: ['居民区', '沙滩'] },
    { name: '二年级大陆', color: 0x5DBDB6, gen: 'g1', regions: ['森林', '山坡'] },
    { name: '三年级大陆', color: 0x7CB342, gen: 'g2', regions: ['工厂', '居民区'] },
    { name: '四年级大陆', color: 0xFFAB91, gen: 'g3', regions: ['寺庙', '森林'] },
    { name: '五年级大陆', color: 0xBA68C8, gen: 'g4', regions: ['游乐场', '山坡'] },
    { name: '六年级大陆', color: 0xFFD54F, gen: 'g5', regions: ['寺庙', '工厂', '游乐场'] }
];

// ----- 题目生成器 -----
var QGen = {
    g0: {
        '加法小精灵': function(i) { var a=rand(1,20),b=rand(1,20); return {q:a+' + '+b+' = ?',a:(a+b),opts:shuffle([a+b,a+b+rand(1,5),a+b-rand(1,5),a+b+rand(-3,3)]),type:'加法',exp:a+' + '+b+' = '+(a+b)+'，把两个数合起来就是答案。'}; },
        '减法小精灵': function(i) { var a=rand(10,30),b=rand(1,a); return {q:a+' - '+b+' = ?',a:(a-b),opts:shuffle([a-b,a-b+rand(1,5),a+b,a-b-rand(1,5)]),type:'减法',exp:a+' - '+b+' = '+(a-b)+'，从'+a+'里去掉'+b+'。'}; },
        '数字小精灵': function(i) { 
            var types = [
                function(){ var n=rand(1,100); return {q:'数字 '+n+' 读作？',a:num2cn(n),opts:shuffle([num2cn(n),num2cn(n+1),num2cn(n-1),num2cn(n+10)]),type:'数字认知',exp:n+' 读作 '+num2cn(n)+'。'}; },
                function(){ var n=rand(2,9),m=rand(2,9); return {q:n+' 个 '+m+' 是多少？',a:n*m,opts:shuffle([n*m,n+m,n*m+1,n*m-1]),type:'数字认知',exp:n+' 个 '+m+' = '+n+'×'+m+' = '+(n*m)+'。'}; },
                function(){ var a=rand(1,20),b=rand(1,20); return {q:'比 '+a+' 大 '+b+' 的数是？',a:a+b,opts:shuffle([a+b,a-b,a*b,a+b+1]),type:'数字认知',exp:'比'+a+'大'+b+'就是 '+a+'+'+b+' = '+(a+b)+'。'}; },
                function(){ var nums=[rand(1,9),rand(1,9),rand(1,9)]; var mx=Math.max.apply(null,nums); return {q:nums.join('、')+' 中最大的数是？',a:mx,opts:shuffle(nums.concat([mx+1])),type:'数字认知',exp:'比较后，最大的数是 '+mx+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '图形小精灵': function(i) { 
            var allShapes=[
                {id:'triangle',name:'三角形',desc:'三条边',color:'#5DBDB6'},
                {id:'square',name:'正方形',desc:'四条相等的边和四个直角',color:'#F5C542'},
                {id:'rectangle',name:'长方形',desc:'对边相等、四个直角',color:'#E85D4E'},
                {id:'circle',name:'圆形',desc:'一条曲线围成，没有角',color:'#7CB342'},
                {id:'diamond',name:'菱形',desc:'四条边都相等',color:'#FF8FAB'},
                {id:'trapezoid',name:'梯形',desc:'只有一组对边平行',color:'#64B5F6'},
                {id:'pentagon',name:'五边形',desc:'五条边和五个角',color:'#FFB74D'},
                {id:'hexagon',name:'六边形',desc:'六条边和六个角',color:'#CE93D8'},
                {id:'ellipse',name:'椭圆形',desc:'像压扁的圆形',color:'#4DB6AC'},
                {id:'parallelogram',name:'平行四边形',desc:'两组对边分别平行且相等',color:'#A1887F'},
                {id:'star',name:'五角星',desc:'五个尖角，像星星',color:'#FFD54F'},
                {id:'semicircle',name:'半圆形',desc:'圆形的一半',color:'#90CAF9'}
            ];
            // 随机选4个作为选项
            var indices=[]; while(indices.length<4){ var r=rand(0,allShapes.length-1); if(indices.indexOf(r)<0) indices.push(r); }
            var opts=indices.map(function(idx){ return allShapes[idx].id; });
            var correctIdx=indices[rand(0,3)];
            var s=allShapes[correctIdx];
            return {q:'下面哪个是'+s.name+'？',a:s.id,opts:shuffle(opts),type:'图形认知',exp:s.name+'有'+s.desc+'。', isShape: true}; },
        '比较大小': function(i) { 
            var types = [
                function(){ var a=rand(1,50),b=rand(1,50); return {q:a+' 和 '+b+' 哪个大？',a:Math.max(a,b),opts:shuffle([a,b,a+b,Math.abs(a-b)]),type:'比较大小',exp:Math.max(a,b)+' > '+Math.min(a,b)+'，所以 '+Math.max(a,b)+' 更大。'}; },
                function(){ var a=rand(10,99),b=rand(10,99); return {q:a+' 和 '+b+' 哪个小？',a:Math.min(a,b),opts:shuffle([a,b,a+1,b-1]),type:'比较大小',exp:Math.min(a,b)+' < '+Math.max(a,b)+'，所以 '+Math.min(a,b)+' 更小。'}; },
                function(){ var a=rand(1,9),b=rand(1,9),c=rand(1,9); var mx=Math.max(a,b,c); return {q:a+'、'+b+'、'+c+' 中最大的是？',a:mx,opts:shuffle([a,b,c,mx+1]),type:'比较大小',exp:'三个数中最大的是 '+mx+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '时间小精灵': function(i) { 
            var types = [
                function(){ var h=rand(1,12); return {q:h+' 点整，时针指向几？',a:h,opts:shuffle([h,h+1,h-1,12-h]),type:'时间认知',exp:h+'点整时，时针正好指向 '+h+'。'}; },
                function(){ var h=rand(1,11); return {q:h+' 点半，时针在 '+h+' 和几之间？',a:h+1,opts:shuffle([h,h+1,h+2,h-1]),type:'时间认知',exp:h+'点半时，时针在 '+h+' 和 '+(h+1)+' 之间。'}; },
                function(){ var h=rand(1,12),m=rand(0,5)*5; return {q:h+' 点 '+m+' 分，分针指向几？',a:m===0?12:m/5,opts:shuffle([m===0?12:m/5, (m===0?12:m/5)+1, (m===0?12:m/5)-1, 6]),type:'时间认知',exp:m+'分时，分针指向 '+(m===0?12:m/5)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        }
    },
    g1: {
        '乘法小精灵': function(i) { 
            var types = [
                function(){ var a=rand(2,9),b=rand(2,9); return {q:a+' × '+b+' = ?',a:(a*b),opts:shuffle([a*b,a*b+rand(1,5),a+b,a*b-rand(1,5)]),type:'乘法',exp:a+' × '+b+' = '+(a*b)+'，就是'+a+'个'+b+'相加。'}; },
                function(){ var a=rand(2,9); return {q:a+' × '+a+' = ?',a:(a*a),opts:shuffle([a*a,a*a+1,a*2,a+a]),type:'乘法',exp:a+' × '+a+' = '+(a*a)+'，这是'+a+'的平方。'}; },
                function(){ var a=rand(2,9),b=rand(2,9); return {q:'几个 '+a+' 相加等于 '+a*b+'？',a:b,opts:shuffle([b,a,a*b,a+b]),type:'乘法',exp:a+' × '+b+' = '+(a*b)+'，所以'+b+'个'+a+'相加。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '除法小精灵': function(i) { 
            var types = [
                function(){ var b=rand(2,9),a=b*rand(2,9); return {q:a+' ÷ '+b+' = ?',a:(a/b),opts:shuffle([a/b,a/b+rand(1,3),a-b,a+b]),type:'除法',exp:a+' ÷ '+b+' = '+(a/b)+'，因为 '+b+' × '+(a/b)+' = '+a+'。'}; },
                function(){ var b=rand(2,9),a=b*rand(2,9); return {q:'? × '+b+' = '+a+'，? = ?',a:(a/b),opts:shuffle([a/b,b,a/b+1,a]),type:'除法',exp:'? = '+a+' ÷ '+b+' = '+(a/b)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,9); return {q:(a*b)+' 平均分成 '+b+' 份，每份？',a:a,opts:shuffle([a,a+1,b,a*b]),type:'除法',exp:(a*b)+' ÷ '+b+' = '+a+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '长度单位': function(i) { 
            var units=[
                {q:'课桌长约 60 ?',a:'厘米',opts:['厘米','米','分米','毫米'],exp:'课桌约60厘米，也就是6分米。'},
                {q:'教室长约 8 ?',a:'米',opts:['米','厘米','分米','千米'],exp:'教室长约8米。'},
                {q:'铅笔长约 15 ?',a:'厘米',opts:['厘米','米','分米','毫米'],exp:'铅笔约15厘米。'},
                {q:'操场跑道一圈约 200 ?',a:'米',opts:['米','厘米','千米','分米'],exp:'跑道一圈约200米。'},
                {q:'一本书厚约 5 ?',a:'毫米',opts:['毫米','厘米','分米','米'],exp:'一本书约5毫米厚。'},
                {q:'1 米 = ? 厘米',a:'100',opts:['100','10','1000','50'],exp:'1米 = 100厘米。'}
            ]; return units[rand(0,units.length-1)]; },
        '角的认识': function(i) { 
            var types = [
                function(){ return {q:'小于90°的角叫什么？',a:'锐角',opts:shuffle(['锐角','直角','钝角','平角']),type:'角的认识',exp:'锐角 < 90°，直角 = 90°，钝角 > 90°。'}; },
                function(){ return {q:'等于90°的角叫什么？',a:'直角',opts:shuffle(['锐角','直角','钝角','平角']),type:'角的认识',exp:'直角 = 90°，像课本的角。'}; },
                function(){ return {q:'大于90°小于180°的角叫什么？',a:'钝角',opts:shuffle(['锐角','直角','钝角','平角']),type:'角的认识',exp:'钝角在90°到180°之间。'}; },
                function(){ return {q:'三角形的三个内角之和是多少度？',a:'180',opts:shuffle(['180','90','360','270']),type:'角的认识',exp:'三角形内角和 = 180°。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '乘法口诀': function(i) { 
            var types = [
                function(){ var a=rand(2,9),b=rand(2,9); return {q:a+' × '+b+' = ?',a:(a*b),opts:shuffle([a*b,a*b+1,a*b-1,a+b]),type:'乘法口诀',exp:'根据乘法口诀：'+a+' × '+b+' = '+(a*b)+'。'}; },
                function(){ var a=rand(2,9); return {q:'三七 ?',a:'21',opts:shuffle(['21','24','18','27']),type:'乘法口诀',exp:'三七二十一。'}; },
                function(){ var tables=[{a:6,b:8,r:48},{a:7,b:9,r:63},{a:8,b:8,r:64},{a:9,b:6,r:54}]; var t=tables[rand(0,tables.length-1)]; return {q:t.a+' × '+t.b+' = ?',a:t.r,opts:shuffle([t.r,t.r+1,t.r-1,t.a+t.b]),type:'乘法口诀',exp:t.a+' × '+t.b+' = '+t.r+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '应用题': function(i) { 
            var types = [
                function(){ var a=rand(5,20),b=rand(3,15); return {q:'小明有'+a+'支笔，小红有'+b+'支，一共有？',a:(a+b),opts:shuffle([a+b,a-b,a*b,a+b+1]),type:'应用题',exp:'求一共用加法：'+a+' + '+b+' = '+(a+b)+'。'}; },
                function(){ var a=rand(10,30),b=rand(1,a); return {q:'树上有'+a+'只鸟，飞走'+b+'只，还剩？',a:a-b,opts:shuffle([a-b,a+b,a,a*b]),type:'应用题',exp:'求剩余用减法：'+a+' - '+b+' = '+(a-b)+'。'}; },
                function(){ var a=rand(2,8),b=rand(2,8); return {q:'每排坐'+a+'人，'+b+'排坐多少人？',a:a*b,opts:shuffle([a*b,a+b,a*b+1,a]),type:'应用题',exp:'用乘法：'+a+' × '+b+' = '+(a*b)+'人。'}; }
            ];
            return types[rand(0,types.length-1)]();
        }
    },
    g2: {
        '大数认识': function(i) {
            var types = [
                function(){ var n=rand(1000,9999); return {q:n+' 读作？',a:num2cn(n),opts:shuffle([num2cn(n),num2cn(n+100),num2cn(n-100),num2cn(n*10)]),type:'大数认识',exp:n+' 读作 '+num2cn(n)+'。'}; },
                function(){ var n=rand(10000,99999); return {q:n+' 读作？',a:num2cn(n),opts:shuffle([num2cn(n),num2cn(n+1000),num2cn(n-1000),num2cn(n+100)]),type:'大数认识',exp:n+' 读作 '+num2cn(n)+'。'}; },
                function(){ var n=rand(1000,9999); return {q:'比 '+n+' 大 1 的数是？',a:(n+1),opts:shuffle([n+1,n-1,n+10,n+100]),type:'大数认识',exp:n+' + 1 = '+(n+1)+'。'}; },
                function(){ var n=rand(1000,9999); return {q:n+' 的最高位是哪一位？',a:'千位',opts:shuffle(['千位','百位','万位','十位']),type:'大数认识',exp:n+' 是四位数，最高位是千位。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '周长计算': function(i) {
            var types = [
                function(){ var l=rand(5,15),w=rand(3,10); return {q:'长'+l+'宽'+w+'的长方形周长？',a:2*(l+w),opts:shuffle([2*(l+w),l+w,l*w,2*l+w]),type:'周长',exp:'周长 = (长+宽)×2 = ('+l+'+'+w+')×2 = '+2*(l+w)+'。'}; },
                function(){ var s=rand(3,15); return {q:'边长'+s+'的正方形周长？',a:4*s,opts:shuffle([4*s,s*3,s*s,2*s]),type:'周长',exp:'正方形周长 = 边长×4 = '+s+'×4 = '+4*s+'。'}; },
                function(){ var w=rand(3,10),l=w*2; return {q:'长方形长是宽的2倍，宽'+w+'，周长？',a:2*(l+w),opts:shuffle([2*(l+w),l+w,l*w,3*w]),type:'周长',exp:'长='+w+'×2='+l+'，周长 = ('+l+'+'+w+')×2 = '+2*(l+w)+'。'}; },
                function(){ var l=rand(5,15),w=rand(3,10); return {q:'长方形长'+l+'宽'+w+'，用一根'+(2*(l+w))+'长的绳子围一圈，够吗？剩多少？',a:0,opts:shuffle([0,1,2,5]),type:'周长',exp:'周长 = ('+l+'+'+w+')×2 = '+2*(l+w)+'，绳子刚好够，剩0。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '分数初识': function(i) {
            var types = [
                function(){ var a=rand(1,5),b=rand(a+1,10); return {q:'一个饼分成'+b+'份，吃'+a+'份，是几分之几？',a:(a+'/'+b),opts:shuffle([a+'/'+b,b+'/'+a,a+'/'+b+'0',b+'0/'+a]),type:'分数',exp:'吃'+a+'份，总共'+b+'份，就是 '+a+'/'+b+'。'}; },
                function(){ var b=rand(2,10); return {q:'把一条绳子平均分成'+b+'段，每段是全长的几分之几？',a:(1+'/'+b),opts:shuffle(['1/'+b,'1/'+(b+1),'1/'+(b-1),'2/'+b]),type:'分数',exp:'平均分成'+b+'段，每段是 1/'+b+'。'}; },
                function(){ var a=rand(1,5),b=rand(a+1,10); return {q:a+'/'+b+' 的分子和分母分别是？',a:(a+'和'+b),opts:shuffle([a+'和'+b,b+'和'+a,(a+1)+'和'+b,a+'和'+(b+1)]),type:'分数',exp:a+'/'+b+' 的分子是 '+a+'，分母是 '+b+'。'}; },
                function(){ var b=rand(2,6); return {q:'分母是'+b+'的最大真分数是？',a:((b-1)+'/'+b),opts:shuffle([(b-1)+'/'+b,b+'/'+b,(b-2)+'/'+b,b+'/'+(b-1)]),type:'分数',exp:'真分数分子小于分母，最大是 '+(b-1)+'/'+b+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '时间计算': function(i) {
            var types = [
                function(){ var h=rand(1,10),m=rand(1,3)*15; return {q:'从 '+h+':'+(m<10?'0':'')+m+' 过30分钟是？',a:timeStr(h,m+30),opts:shuffle([timeStr(h,m+30),timeStr(h+1,m),timeStr(h,m+15),timeStr(h-1,m+30)]),type:'时间计算',exp:'30分钟后：'+timeStr(h,m+30)+'。'}; },
                function(){ var h=rand(3,12),m=rand(1,3)*15; return {q:'从 '+h+':'+(m<10?'0':'')+m+' 过'+(m)+'分钟是？',a:timeStr(h,m+m),opts:shuffle([timeStr(h,m+m),timeStr(h+1,m),timeStr(h,m),timeStr(h-1,m+m)]),type:'时间计算',exp:m+'分钟后：'+timeStr(h,m+m)+'。'}; },
                function(){ var h=rand(8,18),m=rand(0,3)*15; return {q:h+':'+(m<10?'0':'')+m+' 再过2小时是几点？',a:timeStr(h+2,m),opts:shuffle([timeStr(h+2,m),timeStr(h+1,m),timeStr(h+2,m+30),timeStr(h,m)]),type:'时间计算',exp:'2小时后是 '+timeStr(h+2,m)+'。'}; },
                function(){ var h1=rand(1,8),h2=h1+rand(1,4),m1=rand(0,3)*15; return {q:'从 '+h1+':'+(m1<10?'0':'')+m1+' 到 '+h2+':'+(m1<10?'0':'')+m1+' 经过了几小时？',a:(h2-h1),opts:shuffle([h2-h1,h2-h1+1,h2-h1-1,h2+h1]),type:'时间计算',exp:'从'+h1+'点到'+h2+'点，经过了 '+(h2-h1)+' 小时。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '倍数问题': function(i) {
            var types = [
                function(){ var a=rand(2,9),b=rand(2,6); return {q:a+' 的 '+b+' 倍是？',a:(a*b),opts:shuffle([a*b,a+b,a*b+1,a-b]),type:'倍数',exp:a+' × '+b+' = '+(a*b)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,6); return {q:'什么数是 '+a+' 的 '+b+' 倍？',a:(a*b),opts:shuffle([a*b,a+b,a*b-1,a*b+1]),type:'倍数',exp:a+' × '+b+' = '+(a*b)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,6); return {q:a+' 和 '+a*b+'，后者是前者的几倍？',a:b,opts:shuffle([b,a,b+1,b-1]),type:'倍数',exp:a*b+' ÷ '+a+' = '+b+'。'}; },
                function(){ var a=rand(2,8),b=rand(2,8); return {q:a+' 的 '+b+' 倍比 '+a+' 大多少？',a:a*(b-1),opts:shuffle([a*(b-1),a*b,a+b,a*(b-1)+1]),type:'倍数',exp:a*b+' - '+a+' = '+a*(b-1)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '混合运算': function(i) {
            var types = [
                function(){ var a=rand(2,9),b=rand(2,5),c=rand(1,10); return {q:a+' × '+b+' + '+c+' = ?',a:(a*b+c),opts:shuffle([a*b+c,a+b+c,a*b*c,a*b-c]),type:'混合运算',exp:'先乘后加：'+a+'×'+b+'='+(a*b)+'，再加'+c+'='+(a*b+c)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,5),c=rand(1,10); return {q:a+' × '+b+' - '+c+' = ?',a:(a*b-c),opts:shuffle([a*b-c,a*b+c,a*b,a*b*c]),type:'混合运算',exp:'先乘后减：'+a+'×'+b+'='+(a*b)+'，再减'+c+'='+(a*b-c)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,5),c=rand(2,5); return {q:a+' + '+b+' × '+c+' = ?',a:(a+b*c),opts:shuffle([a+b*c,(a+b)*c,a*b+c,a+b+c]),type:'混合运算',exp:'先乘后加：'+b+'×'+c+'='+(b*c)+'，再加'+a+'='+(a+b*c)+'。'}; },
                function(){ var a=rand(10,30),b=rand(2,5),c=rand(2,5); return {q:a+' ÷ '+b+' + '+c+' = ?',a:(Math.floor(a/b)+c),opts:shuffle([Math.floor(a/b)+c,a/b+c,a+b+c,a*b+c]),type:'混合运算',exp:'先除后加：'+a+'÷'+b+'='+Math.floor(a/b)+'，再加'+c+'='+(Math.floor(a/b)+c)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        }
    },
    g3: {
        '大数运算': function(i) {
            var types = [
                function(){ var a=rand(100,999),b=rand(100,999); return {q:a+' + '+b+' = ?',a:(a+b),opts:shuffle([a+b,a+b+rand(1,10),a-b,a+b-rand(1,10)]),type:'大数加法',exp:a+' + '+b+' = '+(a+b)+'。'}; },
                function(){ var a=rand(200,999),b=rand(100,a-1); return {q:a+' - '+b+' = ?',a:(a-b),opts:shuffle([a-b,a+b,a-b+rand(1,10),a-b-rand(1,10)]),type:'大数减法',exp:a+' - '+b+' = '+(a-b)+'。'}; },
                function(){ var a=rand(10,99),b=rand(10,99); return {q:a+' × '+b+' = ?',a:(a*b),opts:shuffle([a*b,a*b+rand(1,10),a*b-rand(1,10),a+b]),type:'大数乘法',exp:a+' × '+b+' = '+(a*b)+'。'}; },
                function(){ var a=rand(100,500),b=rand(100,500); return {q:a+' + '+b+' 的个位是几？',a:(a+b)%10,opts:shuffle([(a+b)%10,(a+b)%10+1,(a+b)%10+2,(a+b)%10+3]),type:'大数加法',exp:a+' + '+b+' = '+(a+b)+'，个位是 '+(a+b)%10+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '面积计算': function(i) {
            var types = [
                function(){ var l=rand(5,20),w=rand(3,15); return {q:'长'+l+'宽'+w+'的长方形面积？',a:(l*w),opts:shuffle([l*w,2*(l+w),l+w,l*w+1]),type:'面积',exp:'面积 = 长×宽 = '+l+'×'+w+' = '+(l*w)+'。'}; },
                function(){ var s=rand(3,15); return {q:'边长'+s+'的正方形面积？',a:(s*s),opts:shuffle([s*s,4*s,s*s+1,2*s]),type:'面积',exp:'面积 = 边长×边长 = '+s+'×'+s+' = '+(s*s)+'。'}; },
                function(){ var b=rand(4,15),h=rand(3,12); return {q:'底'+b+'高'+h+'的三角形面积？',a:(b*h/2),opts:shuffle([b*h/2,b*h,b*h/2+1,b+h]),type:'面积',exp:'三角形面积 = 底×高÷2 = '+b+'×'+h+'÷2 = '+(b*h/2)+'。'}; },
                function(){ var l=rand(5,20),w=rand(3,15); return {q:'长方形长'+l+'宽'+w+'，面积和周长分别是？',a:(l*w),opts:shuffle([l*w,2*(l+w),l+w,l*w+2*(l+w)]),type:'面积',exp:'面积 = '+l+'×'+w+' = '+(l*w)+'，周长 = ('+l+'+'+w+')×2 = '+2*(l+w)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '小数认识': function(i) {
            var types = [
                function(){ var a=rand(1,9),b=rand(1,9); return {q:a+'.'+b+' 读作？',a:(a+'点'+b),opts:shuffle([a+'点'+b,b+'点'+a,a+'十'+b,b+'十'+a]),type:'小数',exp:a+'.'+b+' 读作 '+a+'点'+b+'。'}; },
                function(){ var a=rand(1,9),b=rand(1,9),c=rand(1,9); return {q:a+'.'+b+c+' 读作？',a:(a+'点'+b+c),opts:shuffle([a+'点'+b+c,b+'点'+a+c,a+'点'+c+b,a+'十'+b+c]),type:'小数',exp:a+'.'+b+c+' 读作 '+a+'点'+b+c+'。'}; },
                function(){ var a=rand(1,9),b=rand(1,9); return {q:a+'.'+b+' 元 = ? 角？',a:(a*10+b),opts:shuffle([a*10+b,a*10+b+1,a*10+b-1,a+b]),type:'小数',exp:a+'.'+b+'元 = '+a+'元'+b+'角 = '+(a*10+b)+'角。'}; },
                function(){ var a=rand(1,9),b=rand(1,9); return {q:'0.'+b+' 和 '+a+'.'+b+' 哪个大？',a:(a+'.'+b),opts:shuffle([a+'.'+b,'0.'+b,a+'.'+(b+1),'0.'+(b+1)]),type:'小数',exp:a+'.'+b+' > 0.'+b+'，因为整数部分 '+a+' > 0。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '四则运算': function(i) {
            var types = [
                function(){ var a=rand(10,50),b=rand(2,9),c=rand(1,20); return {q:a+' + '+b+' × '+c+' = ?',a:(a+b*c),opts:shuffle([a+b*c,(a+b)*c,a*b+c,a+b+c]),type:'四则运算',exp:'先乘后加：'+b+'×'+c+'='+(b*c)+'，再加'+a+'='+(a+b*c)+'。'}; },
                function(){ var a=rand(50,100),b=rand(2,9),c=rand(2,9); return {q:a+' - '+b+' × '+c+' = ?',a:(a-b*c),opts:shuffle([a-b*c,a-b+c,(a-b)*c,a-b-c]),type:'四则运算',exp:'先乘后减：'+b+'×'+c+'='+(b*c)+'，'+a+'-'+(b*c)+'='+(a-b*c)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,9),c=rand(2,9); return {q:a+' × '+b+' ÷ '+c+' = ?（能整除）',a:(a*b/c),opts:shuffle([a*b/c,a*b+c,a*b-c,(a+b)/c]),type:'四则运算',exp:'从左到右：'+a+'×'+b+'='+(a*b)+'，÷'+c+'='+(a*b/c)+'。'}; },
                function(){ var a=rand(10,50),b=rand(2,9),c=rand(2,9); return {q:'('+a+' + '+b+') × '+c+' = ?',a:((a+b)*c),opts:shuffle([(a+b)*c,a+b*c,a*b+c,a+b+c]),type:'四则运算',exp:'先算括号：'+a+'+'+b+'='+(a+b)+'，再乘'+c+'='+((a+b)*c)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '平均数': function(i) {
            var types = [
                function(){ var nums=[rand(60,100),rand(60,100),rand(60,100)]; var sum=nums[0]+nums[1]+nums[2]; return {q:nums.join(',')+' 的平均数？',a:Math.round(sum/3),opts:shuffle([Math.round(sum/3),sum,sum/2,Math.round(sum/4)]),type:'平均数',exp:'平均数 = ('+nums.join('+')+')÷3 = '+sum+'÷3 ≈ '+Math.round(sum/3)+'。'}; },
                function(){ var nums=[rand(60,100),rand(60,100),rand(60,100),rand(60,100)]; var sum=nums[0]+nums[1]+nums[2]+nums[3]; return {q:nums.join(',')+' 的平均数？',a:Math.round(sum/4),opts:shuffle([Math.round(sum/4),sum,Math.round(sum/3),Math.round(sum/2)]),type:'平均数',exp:'平均数 = ('+nums.join('+')+')÷4 = '+sum+'÷4 = '+Math.round(sum/4)+'。'}; },
                function(){ var a=rand(70,95),b=rand(70,95),c=rand(70,95); var avg=Math.round((a+b+c)/3); return {q:'三门成绩 '+a+'、'+b+'、'+c+'，平均分？',a:avg,opts:shuffle([avg,a,b,c]),type:'平均数',exp:'('+a+'+'+b+'+'+c+')÷3 = '+(a+b+c)+'÷3 = '+avg+'。'}; },
                function(){ var nums=[rand(10,50),rand(10,50),rand(10,50)]; var sum=nums[0]+nums[1]+nums[2]; var avg=Math.round(sum/3); return {q:'三个数的平均数是'+avg+'，和是？',a:sum,opts:shuffle([sum,avg,sum+avg,sum-avg]),type:'平均数',exp:'和 = 平均数×3 = '+avg+'×3 = '+sum+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '应用题': function(i) {
            var types = [
                function(){ var s=rand(30,100),t=rand(2,10); return {q:'速度'+s+'米/分，走'+t+'分钟，路程？',a:(s*t),opts:shuffle([s*t,s+t,s/t,s-t]),type:'应用题',exp:'路程 = 速度×时间 = '+s+'×'+t+' = '+(s*t)+'米。'}; },
                function(){ var t=rand(2,10),s=rand(30,100); return {q:'路程'+(s*t)+'米，速度'+s+'米/分，需要几分钟？',a:t,opts:shuffle([t,s,(s*t),t+1]),type:'应用题',exp:'时间 = 路程÷速度 = '+(s*t)+'÷'+s+' = '+t+'分钟。'}; },
                function(){ var a=rand(10,50),b=rand(10,50),c=rand(10,50); return {q:'买三件分别花'+a+'、'+b+'、'+c+'元，一共？',a:(a+b+c),opts:shuffle([a+b+c,a*b+c,a+b-c,a*b]),type:'应用题',exp:'一共 '+a+'+'+b+'+'+c+' = '+(a+b+c)+' 元。'}; },
                function(){ var a=rand(5,20),b=rand(2,8); return {q:'每个苹果'+a+'元，买'+b+'个，付了'+(a*b+10)+'元，找回？',a:10,opts:shuffle([10,a*b,a*b+10,5]),type:'应用题',exp:'找回 = '+(a*b+10)+' - '+a+'×'+b+' = '+(a*b+10)+' - '+(a*b)+' = 10 元。'}; }
            ];
            return types[rand(0,types.length-1)]();
        }
    },
    g4: {
        '小数运算': function(i) {
            var types = [
                function(){ var a=(rand(1,50)/10).toFixed(1),b=(rand(1,50)/10).toFixed(1); var sa=parseFloat(a),sb=parseFloat(b); return {q:a+' + '+b+' = ?',a:(sa+sb).toFixed(1),opts:shuffle([(sa+sb).toFixed(1),(sa+sb+0.1).toFixed(1),(sa-sb).toFixed(1),(sa*sb).toFixed(1)]),type:'小数运算',exp:a+' + '+b+' = '+(sa+sb).toFixed(1)+'。'}; },
                function(){ var a=(rand(30,99)/10).toFixed(1),b=(rand(10,parseInt(a)-1)/10).toFixed(1); var sa=parseFloat(a),sb=parseFloat(b); return {q:a+' - '+b+' = ?',a:(sa-sb).toFixed(1),opts:shuffle([(sa-sb).toFixed(1),(sa+sb).toFixed(1),(sa-sb+0.1).toFixed(1),(sa-sb-0.1).toFixed(1)]),type:'小数运算',exp:a+' - '+b+' = '+(sa-sb).toFixed(1)+'。'}; },
                function(){ var a=(rand(1,9)/10).toFixed(1),b=rand(2,9); var sa=parseFloat(a); return {q:a+' × '+b+' = ?',a:(sa*b).toFixed(1),opts:shuffle([(sa*b).toFixed(1),(sa*b+0.1).toFixed(1),(sa*b-0.1).toFixed(1),(sa+b).toFixed(1)]),type:'小数运算',exp:a+' × '+b+' = '+(sa*b).toFixed(1)+'。'}; },
                function(){ var a=(rand(10,50)/10).toFixed(1),b=(rand(10,50)/10).toFixed(1); var sa=parseFloat(a),sb=parseFloat(b); return {q:a+' × '+b+' = ?（保留一位小数）',a:(sa*sb).toFixed(1),opts:shuffle([(sa*sb).toFixed(1),(sa*sb+0.1).toFixed(1),(sa*sb-0.1).toFixed(1),(sa+sb).toFixed(1)]),type:'小数运算',exp:a+' × '+b+' = '+(sa*sb).toFixed(1)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '因数倍数': function(i) {
            var types = [
                function(){ var n=rand(2,20); return {q:n+' 的因数有几个？',a:countFactors(n),opts:shuffle([countFactors(n),countFactors(n)+1,n,n-1]),type:'因数倍数',exp:n+' 的因数有 '+factorsOf(n).join(',')+'，共'+countFactors(n)+'个。'}; },
                function(){ var n=rand(2,20); return {q:n+' 的因数有哪些？（选最小的）',a:1,opts:shuffle([1,2,n,n-1]),type:'因数倍数',exp:n+' 的因数有 '+factorsOf(n).join(',')+'，最小的是1。'}; },
                function(){ var n=rand(2,12); return {q:n+' 的倍数中，以下哪个是？',a:n*rand(2,9),opts:shuffle([n*rand(2,9),n*rand(2,9)+1,n+1,n-1]),type:'因数倍数',exp:n+' 的倍数是 '+n+', '+(n*2)+', '+(n*3)+' ...'}; },
                function(){ var a=rand(2,12),b=rand(2,12); var g=1; for(var k=Math.min(a,b);k>=1;k--){if(a%k===0&&b%k===0){g=k;break;}} return {q:a+' 和 '+b+' 的最大公因数？',a:g,opts:shuffle([g,g+1,Math.min(a,b),1]),type:'因数倍数',exp:a+' 和 '+b+' 的最大公因数是 '+g+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '分数运算': function(i) {
            var types = [
                function(){ var a=rand(1,5),b=rand(a+1,10),c=rand(1,5),d=rand(c+1,10); return {q:a+'/'+b+' + '+c+'/'+d+' = ?',a:((a*d+b*c)+'/'+(b*d)),opts:shuffle([(a*d+b*c)+'/'+(b*d),(a+c)+'/'+(b+d),a+c+'/'+b*d,(a*d+c*b)+'/'+(b*d+1)]),type:'分数运算',exp:'通分后：'+a+'/'+b+'='+(a*d)+'/'+(b*d)+'，'+c+'/'+d+'='+(c*b)+'/'+(b*d)+'，相加得 '+(a*d+b*c)+'/'+(b*d)+'。'}; },
                function(){ var a=rand(1,5),b=rand(a+1,10),c=rand(1,5),d=rand(c+1,10); return {q:a+'/'+b+' - '+c+'/'+d+' = ?（结果为正）',a:((a*d-b*c)+'/'+(b*d)),opts:shuffle([(a*d-b*c)+'/'+(b*d),(a-c)+'/'+(b-d),(a*d+b*c)+'/'+(b*d),(a*d-b*c)+'/'+(b*d+1)]),type:'分数运算',exp:'通分后相减得 '+(a*d-b*c)+'/'+(b*d)+'。'}; },
                function(){ var a=rand(1,5),b=rand(a+1,10),c=rand(2,5); return {q:a+'/'+b+' × '+c+' = ?',a:((a*c)+'/'+b),opts:shuffle([(a*c)+'/'+b,(a+c)+'/'+b,(a*c)+'/'+(b+c),(a*c+1)+'/'+b]),type:'分数运算',exp:a+'/'+b+' × '+c+' = '+(a*c)+'/'+b+'。'}; },
                function(){ var a=rand(1,5),b=rand(a+1,10),c=rand(2,5); var num=a*c,dn=b*c; return {q:num+'/'+dn+' ÷ '+c+' = ?',a:(a+'/'+b),opts:shuffle([a+'/'+b,num+'/'+dn,(a+1)+'/'+b,num+'/'+b]),type:'分数运算',exp:num+'/'+dn+' ÷ '+c+' = '+a+'/'+b+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '方程': function(i) {
            var types = [
                function(){ var a=rand(2,9),b=rand(10,50); return {q:'x + '+a+' = '+b+'，x = ?',a:(b-a),opts:shuffle([b-a,b+a,b*a,b/a]),type:'简易方程',exp:'x = '+b+' - '+a+' = '+(b-a)+'。'}; },
                function(){ var a=rand(2,9),b=rand(10,50); return {q:'x - '+a+' = '+b+'，x = ?',a:(b+a),opts:shuffle([b+a,b-a,b*a,b/a]),type:'简易方程',exp:'x = '+b+' + '+a+' = '+(b+a)+'。'}; },
                function(){ var a=rand(2,9),b=rand(2,9); return {q:a+' × x = '+(a*b)+'，x = ?',a:b,opts:shuffle([b,a,a*b,a+b]),type:'简易方程',exp:'x = '+(a*b)+' ÷ '+a+' = '+b+'。'}; },
                function(){ var a=rand(2,5),b=rand(2,5),c=rand(1,10); return {q:a+'x + '+c+' = '+(a*b+c)+'，x = ?',a:b,opts:shuffle([b,a,a*b,a+b]),type:'简易方程',exp:a+'x = '+(a*b+c)+' - '+c+' = '+(a*b)+'，x = '+b+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '体积': function(i) {
            var types = [
                function(){ var l=rand(2,10),w=rand(2,10),h=rand(2,10); return {q:'长'+l+'宽'+w+'高'+h+'的长方体体积？',a:(l*w*h),opts:shuffle([l*w*h,2*(l*w+w*h+l*h),l+w+h,l*w+h]),type:'体积',exp:'体积 = 长×宽×高 = '+l+'×'+w+'×'+h+' = '+(l*w*h)+'。'}; },
                function(){ var s=rand(2,8); return {q:'棱长'+s+'的正方体体积？',a:(s*s*s),opts:shuffle([s*s*s,s*s*6,s*s+s,s*3]),type:'体积',exp:'体积 = 棱长³ = '+s+'×'+s+'×'+s+' = '+(s*s*s)+'。'}; },
                function(){ var l=rand(2,10),w=rand(2,10),h=rand(2,10); return {q:'长方体长'+l+'宽'+w+'高'+h+'，底面积？',a:(l*w),opts:shuffle([l*w,l*w*h,2*(l+w),l+w+h]),type:'体积',exp:'底面积 = 长×宽 = '+l+'×'+w+' = '+(l*w)+'。'}; },
                function(){ var l=rand(2,10),w=rand(2,10),h=rand(2,10); return {q:'长方体长'+l+'宽'+w+'高'+h+'，表面积？',a:(2*(l*w+w*h+l*h)),opts:shuffle([2*(l*w+w*h+l*h),l*w*h,l*w+w*h+l*h,l+w+h]),type:'体积',exp:'表面积 = 2×(长×宽+宽×高+长×高) = 2×('+l*w+'+'+w*h+'+'+l*h+') = '+2*(l*w+w*h+l*h)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '百分数': function(i) {
            var types = [
                function(){ var a=rand(10,90); return {q:a+'% 写成小数是？',a:(a/100),opts:shuffle([a/100,a/10,a*10,a/1000]),type:'百分数',exp:a+'% = '+a+'÷100 = '+(a/100)+'。'}; },
                function(){ var a=rand(10,90); return {q:a+'% 写成分数是？',a:(a+'/100'),opts:shuffle([a+'/100','100/'+a,a+'/10','1/'+a]),type:'百分数',exp:a+'% = '+a+'/100。'}; },
                function(){ var a=rand(10,90); return {q:'0.'+a+' 化成百分数是？',a:(a+'%'),opts:shuffle([a+'%','0.'+a+'%','10'+a+'%','1/'+a]),type:'百分数',exp:'0.'+a+' = '+a+'%。'}; },
                function(){ var total=rand(50,200),pct=rand(10,90); var part=Math.round(total*pct/100); return {q:total+' 的 '+pct+'% 是多少？',a:part,opts:shuffle([part,total-pct,Math.round(total/100),pct]),type:'百分数',exp:total+' × '+pct+'% = '+total+' × '+(pct/100)+' = '+part+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        }
    },
    g5: {
        '比例': function(i) {
            var types = [
                function(){ var a=rand(2,8),b=rand(2,8),c=rand(2,8); return {q:a+':'+b+' = '+c+':? ',a:Math.round(b*c/a),opts:shuffle([Math.round(b*c/a),b*c,a*c,a+b+c]),type:'比例',exp:'内项积=外项积：'+b+'×'+c+'='+b*c+'，? = '+b*c+'÷'+a+' = '+Math.round(b*c/a)+'。'}; },
                function(){ var a=rand(2,8),b=rand(2,8),c=rand(2,8); return {q:a+':? = '+c+':'+b+'，? = ?',a:Math.round(a*b/c),opts:shuffle([Math.round(a*b/c),a*b,a+c,b+c]),type:'比例',exp:'内项积=外项积：'+a+'×'+b+'='+(a*b)+'，? = '+(a*b)+'÷'+c+' = '+Math.round(a*b/c)+'。'}; },
                function(){ var a=rand(2,8),b=rand(2,8); return {q:a+':'+b+' 的比值是？',a:Math.round(a/b*100)/100,opts:shuffle([Math.round(a/b*100)/100,Math.round(b/a*100)/100,a+b,Math.round(a*b*100)/100]),type:'比例',exp:'比值 = '+a+'÷'+b+' = '+(Math.round(a/b*100)/100)+'。'}; },
                function(){ var a=rand(2,6),b=rand(2,6),k=rand(2,5); return {q:'如果 x:y = '+a+':'+b+'，且 x = '+(a*k)+'，y = ?',a:(b*k),opts:shuffle([b*k,a*k,b*k+1,b+k]),type:'比例',exp:'x:y = '+a+':'+b+'，x='+a+'时 y='+b+'，x='+(a*k)+'时 y='+b*k+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '负数': function(i) {
            var types = [
                function(){ var a=rand(-20,20),b=rand(-20,20); return {q:a+' + ('+b+') = ?',a:(a+b),opts:shuffle([a+b,a-b,Math.abs(a+b),a*b]),type:'负数运算',exp:a+' + ('+b+') = '+(a+b)+'。'}; },
                function(){ var a=rand(-20,20),b=rand(-20,20); return {q:a+' - ('+b+') = ?',a:(a-b),opts:shuffle([a-b,a+b,Math.abs(a-b),a*b]),type:'负数运算',exp:a+' - ('+b+') = '+a+' + '+(-b)+' = '+(a-b)+'。'}; },
                function(){ var a=rand(-10,10),b=rand(-10,10); return {q:a+' × '+b+' = ?',a:(a*b),opts:shuffle([a*b,a+b,Math.abs(a*b),a-b]),type:'负数运算',exp:a+' × '+b+' = '+(a*b)+'。'}; },
                function(){ var a=rand(-20,20),b=rand(-20,20); return {q:a+' 和 '+b+' 哪个大？',a:Math.max(a,b),opts:shuffle([Math.max(a,b),Math.min(a,b),0,Math.abs(a)]),type:'负数运算',exp:Math.max(a,b)+' > '+Math.min(a,b)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '圆': function(i) {
            var types = [
                function(){ var r=rand(2,10); return {q:'半径'+r+'的圆周长？(π取3.14)',a:(2*3.14*r).toFixed(2),opts:shuffle([(2*3.14*r).toFixed(2),(3.14*r*r).toFixed(2),(2*r).toFixed(2),(3.14*r).toFixed(2)]),type:'圆的周长',exp:'周长 = 2πr = 2×3.14×'+r+' = '+(2*3.14*r).toFixed(2)+'。'}; },
                function(){ var r=rand(2,10); return {q:'半径'+r+'的圆面积？(π取3.14)',a:(3.14*r*r).toFixed(2),opts:shuffle([(3.14*r*r).toFixed(2),(2*3.14*r).toFixed(2),(3.14*r).toFixed(2),(r*r).toFixed(2)]),type:'圆的面积',exp:'面积 = πr² = 3.14×'+r+'×'+r+' = '+(3.14*r*r).toFixed(2)+'。'}; },
                function(){ var d=rand(4,20); return {q:'直径'+d+'的圆周长？(π取3.14)',a:(3.14*d).toFixed(2),opts:shuffle([(3.14*d).toFixed(2),(3.14*d/2).toFixed(2),(d*d).toFixed(2),(2*d).toFixed(2)]),type:'圆的周长',exp:'周长 = πd = 3.14×'+d+' = '+(3.14*d).toFixed(2)+'。'}; },
                function(){ var d=rand(4,20); return {q:'直径'+d+'的圆半径是？',a:(d/2),opts:shuffle([d/2,d,d*2,d/4]),type:'圆',exp:'半径 = 直径÷2 = '+d+'÷2 = '+(d/2)+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '统计': function(i) {
            var types = [
                function(){ var nums=[rand(60,100),rand(60,100),rand(60,100),rand(60,100),rand(60,100)]; var sorted=[...nums].sort((a,b)=>a-b); return {q:nums.join(',')+' 的中位数？',a:sorted[2],opts:shuffle([sorted[2],sorted[0],sorted[4],Math.round(nums.reduce((a,b)=>a+b)/5)]),type:'中位数',exp:'排序后：'+sorted.join(',')+'，中位数是第3个数 '+sorted[2]+'。'}; },
                function(){ var nums=[rand(1,20),rand(1,20),rand(1,20),rand(1,20)]; var freq={}; nums.forEach(function(n){freq[n]=(freq[n]||0)+1;}); var modes=Object.keys(freq).filter(function(k){return freq[k]===Math.max.apply(null,Object.values(freq));}); var mode=parseInt(modes[0]); return {q:nums.join(',')+' 的众数是？',a:mode,opts:shuffle([mode,nums[0],nums[3],Math.round(nums.reduce((a,b)=>a+b)/4)]),type:'众数',exp:'出现次数最多的是 '+mode+'。'}; },
                function(){ var nums=[rand(10,50),rand(10,50),rand(10,50),rand(10,50)]; var sum=nums.reduce((a,b)=>a+b); return {q:nums.join(',')+' 的平均数是？',a:Math.round(sum/4),opts:shuffle([Math.round(sum/4),sum,Math.round(sum/3),Math.max.apply(null,nums)]),type:'平均数',exp:'('+nums.join('+')+')÷4 = '+sum+'÷4 = '+Math.round(sum/4)+'。'}; },
                function(){ var nums=[rand(10,50),rand(10,50),rand(10,50),rand(10,50),rand(10,50)]; var sorted=[...nums].sort((a,b)=>a-b); return {q:nums.join(',')+' 的最大值和最小值的差（极差）？',a:sorted[4]-sorted[0],opts:shuffle([sorted[4]-sorted[0],sorted[4],sorted[0],sorted[4]+sorted[0]]),type:'极差',exp:'最大值 '+sorted[4]+' - 最小值 '+sorted[0]+' = '+(sorted[4]-sorted[0])+'。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '浓度': function(i) {
            var types = [
                function(){ var s=rand(10,50),w=rand(50,200); return {q:s+'克盐溶于'+w+'克水，浓度？',a:((s/(s+w)*100).toFixed(1)+'%'),opts:shuffle([(s/(s+w)*100).toFixed(1)+'%',(s/w*100).toFixed(1)+'%',(s+s+w)+'%',(w/(s+w)*100).toFixed(1)+'%']),type:'浓度',exp:'浓度 = 盐÷(盐+水)×100% = '+s+'÷'+(s+w)+'×100% = '+((s/(s+w)*100).toFixed(1))+'%。'}; },
                function(){ var s=rand(10,50),w=rand(50,200); var total=s+w; var pct=(s/total*100).toFixed(1); return {q:'浓度'+pct+'%的盐水共'+total+'克，含盐多少克？',a:s,opts:shuffle([s,w,total-s,total]),type:'浓度',exp:'含盐 = 总量×浓度 = '+total+'×'+pct+'% = '+s+'克。'}; },
                function(){ var s=rand(10,50),w=rand(50,200); var total=s+w; return {q:s+'克盐和'+w+'克水混合，溶液共多少克？',a:total,opts:shuffle([total,s,w,s+w+s]),type:'浓度',exp:'溶液 = 盐+水 = '+s+'+'+w+' = '+total+'克。'}; },
                function(){ var s1=rand(10,30),w=rand(50,150); var s2=rand(5,s1); var total1=s1+w; var newTotal=s1+w+s2; var newPct=((s1+s2)/newTotal*100).toFixed(1); var oldPct=(s1/total1*100).toFixed(1); return {q:'现有'+total1+'克'+oldPct+'%盐水，再加'+s2+'克盐，新浓度？',a:newPct+'%',opts:shuffle([newPct+'%',oldPct+'%',s2+'%',(parseFloat(oldPct)+10).toFixed(1)+'%']),type:'浓度',exp:'新浓度 = '+(s1+s2)+'÷'+newTotal+' = '+newPct+'%。'}; }
            ];
            return types[rand(0,types.length-1)]();
        },
        '行程': function(i) {
            var types = [
                function(){ var v1=rand(40,80),v2=rand(40,80),t=rand(1,5); return {q:'两车相向，速度'+v1+'和'+v2+','+t+'小时后相遇，距离？',a:((v1+v2)*t),opts:shuffle([(v1+v2)*t,v1*v2*t,v1+v2+t,(v1-v2)*t]),type:'行程问题',exp:'距离 = (速度1+速度2)×时间 = ('+v1+'+'+v2+')×'+t+' = '+((v1+v2)*t)+'。'}; },
                function(){ var v=rand(30,80),t=rand(2,8); var d=v*t; return {q:'速度'+v+'千米/时，行驶'+t+'小时，路程？',a:d,opts:shuffle([d,v+t,v*t+t,v-t]),type:'行程问题',exp:'路程 = 速度×时间 = '+v+'×'+t+' = '+d+'千米。'}; },
                function(){ var d=rand(100,500),v=rand(30,80); return {q:'路程'+d+'千米，速度'+v+'千米/时，需要几小时？',a:Math.round(d/v*10)/10,opts:shuffle([Math.round(d/v*10)/10,d/v+1,d*v,d+v]),type:'行程问题',exp:'时间 = 路程÷速度 = '+d+'÷'+v+' ≈ '+Math.round(d/v*10)/10+'小时。'}; },
                function(){ var v1=rand(40,80),v2=rand(40,80); var d=rand(100,400); var t=Math.round(d/(v1+v2)*10)/10; return {q:'两地相距'+d+'千米，两车相向出发，速度'+v1+'和'+v2+'，几小时相遇？',a:t,opts:shuffle([t,d/(v1),d/(v2),d/(v1+v2)+1]),type:'行程问题',exp:'时间 = 路程÷速度和 = '+d+'÷('+v1+'+'+v2+') = '+t+'小时。'}; }
            ];
            return types[rand(0,types.length-1)]();
        }
    }
};

// ----- 工具函数 -----
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function num2cn(n) {
    var cn = ['零','一','二','三','四','五','六','七','八','九','十','百','千','万'];
    if (n < 11) return cn[n];
    if (n < 20) return '十' + (n % 10 === 0 ? '' : cn[n % 10]);
    if (n < 100) return cn[Math.floor(n / 10)] + '十' + (n % 10 === 0 ? '' : cn[n % 10]);
    if (n < 1000) return cn[Math.floor(n / 100)] + '百' + (n % 100 === 0 ? '' : (n % 100 < 10 ? '零' : '') + num2cn(n % 100));
    if (n < 10000) return cn[Math.floor(n / 1000)] + '千' + (n % 1000 === 0 ? '' : num2cn(n % 1000));
    return n + '';
}
function shapeDesc(s) { return s === 'triangle' ? '三条边' : s === 'square' ? '四条相等的边' : s === 'rectangle' ? '对边相等' : '一条曲线围成'; }
function timeStr(h, m) { if (m >= 60) { h += Math.floor(m / 60); m = m % 60; } return h + ':' + (m < 10 ? '0' : '') + m; }
function countFactors(n) { var c = 0; for (var i = 1; i <= n; i++) if (n % i === 0) c++; return c; }
function factorsOf(n) { var f = []; for (var i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; }

function getGradeLatRange(gradeIndex) {
    var ranges = [
        { min: -75 * Math.PI / 180, max: -55 * Math.PI / 180 },
        { min: -40 * Math.PI / 180, max: -20 * Math.PI / 180 },
        { min: -5 * Math.PI / 180, max: 15 * Math.PI / 180 },
        { min: 30 * Math.PI / 180, max: 50 * Math.PI / 180 },
        { min: 55 * Math.PI / 180, max: 75 * Math.PI / 180 },
        { min: -10 * Math.PI / 180, max: 10 * Math.PI / 180 }
    ];
    return ranges[gradeIndex];
}
