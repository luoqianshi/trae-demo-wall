// ============ 公共工具（确定性算法 + 数据生成） ============
(function(){
  window.AgrUtils = {};
  const U = window.AgrUtils;

  U.hashStr = function(s){let h=5381;for(let i=0;i<s.length;i++){h=((h<<5)+h)+s.charCodeAt(i);h=h&0x7fffffff;}return h>>>0;};
  U.mulberry32 = function(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>15,t|65895);return((t^t>>>15)>>>0)/4294967296;};};

  const now=new Date();
  U.YEAR=now.getFullYear();
  U.MONTH=now.getMonth()+1;

  U.LOC_MAP={
    '内蒙古自治区':['包头市','呼和浩特市','赤峰市','通辽市'],
    '山西省':['大同市','太原市','运城市','晋中市'],
    '黑龙江省':['哈尔滨市','大庆市','齐齐哈尔市','牡丹江市'],
    '河南省':['郑州市','新乡市','周口市','驻马店市'],
    '山东省':['济南市','青岛市','德州市','聊城市'],
    '四川省':['成都市','德阳市','绵阳市','南充市'],
    '湖南省':['长沙市','岳阳市','衡阳市','常德市'],
    '广东省':['广州市','深圳市','佛山市','东莞市'],
    '安徽省':['合肥市','蚌埠市','阜阳市','宿州市'],
    '江苏省':['南京市','徐州市','盐城市','淮安市'],
  };
  U.DIST_MAP={
    '包头市':['昆都仑区','东河区','青山区','九原区'],
    '呼和浩特市':['新城区','回民区','赛罕区'],
    '赤峰市':['红山区','松山区'],
    '通辽市':['科尔沁区'],
    '大同市':['平城区','云冈区','新荣区'],
    '太原市':['小店区','迎泽区'],
    '运城市':['盐湖区'],
    '晋中市':['榆次区'],
    '哈尔滨市':['呼兰区','道外区','道里区'],
    '大庆市':['萨尔图区','龙凤区'],
    '齐齐哈尔市':['龙沙区'],
    '牡丹江市':['东安区'],
    '郑州市':['金水区','二七区','中原区'],
    '新乡市':['卫滨区'],
    '周口市':['川汇区'],
    '驻马店市':['驿城区'],
    '济南市':['历下区','市中区','槐荫区'],
    '青岛市':['市南区','市北区','西海岸新区'],
    '德州市':['德城区'],
    '聊城市':['东昌府区'],
    '成都市':['武侯区','锦江区','青羊区'],
    '德阳市':['旌阳区'],
    '绵阳市':['涪城区'],
    '南充市':['顺庆区'],
    '长沙市':['岳麓区','天心区','芙蓉区'],
    '岳阳市':['岳阳楼区'],
    '衡阳市':['珠晖区'],
    '常德市':['武陵区'],
    '广州市':['天河区','越秀区','海珠区'],
    '深圳市':['福田区','南山区','宝安区'],
    '佛山市':['禅城区'],
    '东莞市':['莞城区'],
    '合肥市':['瑶海区','庐阳区','蜀山区'],
    '蚌埠市':['龙子湖区'],
    '阜阳市':['颍州区'],
    '宿州市':['埇桥区'],
    '南京市':['玄武区','秦淮区','建邺区'],
    '徐州市':['鼓楼区','泉山区'],
    '盐城市':['亭湖区'],
    '淮安市':['清江浦区'],
  };

  U.PLANTING=['大豆','小麦','玉米','水稻','花生','油菜','高粱','谷子'];
  U.BREEDING=['生猪','牛','羊','鸡','鸭','鹅','鱼虾','鹌鹑'];
  U.ALL_PRODS=[...U.PLANTING,...U.BREEDING];

  U.PLANTING_METRICS=[
    {key:'sownArea',   label:'播种面积', unit:'万亩'},
    {key:'totalOutput',label:'总产量',   unit:'万吨'},
    {key:'yieldPerMu', label:'单产',     unit:'公斤/亩'},
    {key:'marketPrice',label:'市场价',   unit:'元/公斤'},
    {key:'inputPerMu', label:'亩均投入', unit:'元/亩'},
    {key:'pesticide',  label:'农药强度', unit:'公斤/亩'},
    {key:'fertilizer', label:'化肥强度', unit:'公斤/亩'},
    {key:'mechanization',label:'机械化率',unit:'%'},
  ];
  U.BREEDING_METRICS=[
    {key:'stock',       label:'存栏',     unit:'万头/万只'},
    {key:'slaughter',   label:'出栏',     unit:'万头/万只'},
    {key:'marketPrice', label:'市场价',   unit:'元/公斤'},
    {key:'feedCost',    label:'饲料成本', unit:'元/公斤'},
    {key:'breedCost',   label:'饲养成本', unit:'元'},
    {key:'diseaseRate', label:'疫病率',   unit:'%'},
    {key:'feedRatio',   label:'料肉比',   unit:''},
    {key:'subsidyRate', label:'补贴覆盖率',unit:'%'},
  ];

  U.BASE_TABLE={
    '大豆':{sownArea:20000,totalOutput:12000,yieldPerMu:300,marketPrice:2.20,inputPerMu:350,pesticide:0.22,fertilizer:18.0,mechanization:80},
    '小麦':{sownArea:35000,totalOutput:21000,yieldPerMu:350,marketPrice:2.50,inputPerMu:400,pesticide:0.25,fertilizer:22.0,mechanization:85},
    '玉米':{sownArea:45000,totalOutput:28000,yieldPerMu:400,marketPrice:2.00,inputPerMu:320,pesticide:0.20,fertilizer:25.0,mechanization:88},
    '水稻':{sownArea:30000,totalOutput:22000,yieldPerMu:450,marketPrice:3.00,inputPerMu:550,pesticide:0.35,fertilizer:28.0,mechanization:72},
    '花生':{sownArea:8000, totalOutput:3000, yieldPerMu:220,marketPrice:4.50,inputPerMu:280,pesticide:0.18,fertilizer:12.0,mechanization:68},
    '油菜':{sownArea:7000, totalOutput:1500, yieldPerMu:180,marketPrice:5.00,inputPerMu:250,pesticide:0.15,fertilizer:10.0,mechanization:65},
    '高粱':{sownArea:3000, totalOutput:1500, yieldPerMu:250,marketPrice:3.80,inputPerMu:300,pesticide:0.16,fertilizer:14.0,mechanization:70},
    '谷子':{sownArea:2500, totalOutput:700,  yieldPerMu:180,marketPrice:4.20,inputPerMu:220,pesticide:0.14,fertilizer:8.0,mechanization:62},
    '生猪':{stock:6000,slaughter:5000,marketPrice:14.00,feedCost:3.00,breedCost:1200,diseaseRate:3,feedRatio:3.2,subsidyRate:35},
    '牛':  {stock:500, slaughter:400, marketPrice:30.00,feedCost:2.80,breedCost:6000,diseaseRate:2,feedRatio:4.5,subsidyRate:40},
    '羊':  {stock:3500,slaughter:2800,marketPrice:28.00,feedCost:2.50,breedCost:800,diseaseRate:2,feedRatio:4.0,subsidyRate:38},
    '鸡':  {stock:20000,slaughter:18000,marketPrice:10.00,feedCost:1.80,breedCost:120,diseaseRate:5,feedRatio:2.2,subsidyRate:25},
    '鸭':  {stock:8000, slaughter:7000, marketPrice:9.00, feedCost:1.60,breedCost:100,diseaseRate:4,feedRatio:2.4,subsidyRate:22},
    '鹅':  {stock:1200, slaughter:1000, marketPrice:12.00,feedCost:2.00,breedCost:150,diseaseRate:3,feedRatio:2.8,subsidyRate:20},
    '鱼虾':{stock:500,  slaughter:400, marketPrice:18.00,feedCost:3.20,breedCost:300,diseaseRate:6,feedRatio:1.5,subsidyRate:30},
    '鹌鹑':{stock:15000,slaughter:12000,marketPrice:7.00,feedCost:1.20,breedCost:60,diseaseRate:4,feedRatio:2.0,subsidyRate:18},
  };

  U.BUILD_METRICS=function(province,city,district,productName){
    const isPlanting=U.PLANTING.includes(productName);
    const metrics=isPlanting?U.PLANTING_METRICS:U.BREEDING_METRICS;
    const seedInput=[province,city,district,productName,U.YEAR,U.MONTH].join('|');
    const rnd=U.mulberry32(U.hashStr(seedInput));
    const base=U.BASE_TABLE[productName]||U.BASE_TABLE['大豆'];
    const locSeed=U.mulberry32(U.hashStr([province,city,district].join('|')));
    const locFactor=0.85+locSeed()*0.30;
    const years=[];
    for(let y=U.YEAR-4;y<=U.YEAR;y++){
      const yearFactor=0.90+rnd()*0.20;
      const row={year:y};
      metrics.forEach(m=>{
        const v=(base[m.key]||10)*locFactor*yearFactor*(0.95+rnd()*0.10);
        if(['mechanization','diseaseRate','subsidyRate'].includes(m.key)){
          row[m.key]=Math.min(99,Math.max(1,Math.round(v*10)/10));
        }else{
          row[m.key]=Math.round(v*100)/100;
        }
      });
      years.push(row);
    }
    years.forEach((y,i)=>{
      if(i===0)metrics.forEach(m=>y[m.key+'Yoy']=0);
      else{
        const prev=years[i-1];
        metrics.forEach(m=>{
          const pv=prev[m.key],cv=y[m.key];
          if(pv===0)y[m.key+'Yoy']=0;
          else y[m.key+'Yoy']=Math.round(((cv-pv)/pv)*10000)/100;
        });
      }
    });
    return{years,keys:metrics,businessType:isPlanting?'planting':'breeding'};
  };

  U.CALC_CLIMATE=function(province,city,district,productName){
    const rnd=U.mulberry32(U.hashStr([province,city,district,productName,U.YEAR,U.MONTH].join('|')));
    const temp=5+rnd()*35;
    const precip=20+rnd()*400;
    const humidity=20+rnd()*70;
    const heatStress=Math.max(0,temp-30)/20;
    const drought=Math.max(0,1-precip/400)*0.6+Math.max(0,60-humidity)/100*0.4;
    const prefTable={
      '大豆':{optTemp:[20,28],optPrec:[400,700],optHum:[60,85]},
      '小麦':{optTemp:[10,22],optPrec:[350,600],optHum:[55,80]},
      '玉米':{optTemp:[22,30],optPrec:[400,650],optHum:[60,85]},
      '水稻':{optTemp:[25,35],optPrec:[700,1200],optHum:[70,90]},
      '花生':{optTemp:[20,30],optPrec:[450,750],optHum:[55,80]},
      '油菜':{optTemp:[8,20], optPrec:[350,650],optHum:[55,80]},
      '高粱':{optTemp:[20,32],optPrec:[300,700],optHum:[55,82]},
      '谷子':{optTemp:[20,30],optPrec:[300,650],optHum:[55,80]},
      '生猪':{optTemp:[16,24],optPrec:[0,1000], optHum:[55,80]},
      '牛':  {optTemp:[8,22], optPrec:[0,1200], optHum:[50,80]},
      '羊':  {optTemp:[5,25], optPrec:[0,1000], optHum:[50,75]},
      '鸡':  {optTemp:[18,28],optPrec:[0,800],  optHum:[60,85]},
      '鸭':  {optTemp:[20,30],optPrec:[0,900],  optHum:[65,90]},
      '鹅':  {optTemp:[15,26],optPrec:[0,900],  optHum:[60,85]},
      '鱼虾':{optTemp:[18,32],optPrec:[0,1500], optHum:[70,95]},
      '鹌鹑':{optTemp:[20,30],optPrec:[0,600],  optHum:[60,85]},
    };
    const pref=prefTable[productName]||prefTable['大豆'];
    function sr(v,rg){const [lo,hi]=rg;if(v>=lo&&v<=hi)return 1;const d=v<lo?lo-v:v-hi;return Math.max(0,1-d/Math.max(hi-lo,1));}
    const tScore=sr(temp,pref.optTemp);
    const pScore=sr(precip,pref.optPrec);
    const hScore=sr(humidity,pref.optHum);
    const climateScore=Math.round((tScore*0.4+pScore*0.3+hScore*0.3)*100*(1-heatStress*0.3-drought*0.15));
    return Math.max(10,Math.min(98,climateScore));
  };

  U.CALC_SEED=function(productName){
    const table={
      '大豆':70,'小麦':72,'玉米':70,'水稻':68,'花生':66,'油菜':64,'高粱':62,'谷子':60,
      '生猪':62,'牛':64,'羊':64,'鸡':60,'鸭':60,'鹅':58,'鱼虾':58,'鹌鹑':55,
    };
    return table[productName]||60;
  };

  U.LEVEL=function(v){
    if(v>=80)return'非常适宜';
    if(v>=60)return'基本适宜';
    if(v>=40)return'风险较高';
    if(v>=20)return'风险很高';
    return'高风险';
  };

  U.ADVICE=function(province,city,district,productName,composite,climate,seed){
    const lines=[];
    lines.push(`📍 ${province} ${city} ${district}`);
    lines.push(`🌱 ${productName} · 综合${composite}分 · 预核${seed}分 · 气候${climate}分`);
    if(composite>=80)lines.push('✅ 综合评分优秀，可扩大规模，保持现有管理+优化病虫害防控。');
    else if(composite>=60)lines.push('✅ 综合评分良好，结合当年天气预报调整播期/出栏节奏，关注极端天气。');
    else if(composite>=40)lines.push('⚠️ 综合评分一般，建议小面积试种/试养，配套农业保险。');
    else lines.push('⚠️ 综合评分偏低，建议换品种/转品类，或延迟决策1季度再观察。');
    if(climate<50)lines.push('🌡️ 气候分较低：重点关注高温/干旱/暴雨预警。');
    if(seed<65)lines.push('📦 预核分较低：提前落实农资、农机、销路、保险四项。');
    return lines.join('\n');
  };

  // 价格数据（确定性，同比公式）
  U.PRICE_BASE={
    '大豆':{price:5400,pyoy:0.08,category:'种植'},
    '小麦':{price:2700,pyoy:0.05,category:'种植'},
    '玉米':{price:2600,pyoy:-0.02,category:'种植'},
    '水稻':{price:3000,pyoy:0.03,category:'种植'},
    '花生':{price:7200,pyoy:0.10,category:'种植'},
    '油菜':{price:5600,pyoy:-0.05,category:'种植'},
    '高粱':{price:3800,pyoy:0.04,category:'种植'},
    '谷子':{price:4500,pyoy:0.06,category:'种植'},
    '生猪':{price:15.2,pyoy:-0.12,category:'养殖'},
    '牛':  {price:32.0,pyoy:0.08,category:'养殖'},
    '羊':  {price:28.0,pyoy:0.05,category:'养殖'},
    '鸡':  {price:11.0,pyoy:0.06,category:'养殖'},
    '鸭':  {price:9.5,pyoy:-0.03,category:'养殖'},
    '鹅':  {price:13.0,pyoy:0.02,category:'养殖'},
    '鱼虾':{price:20.0,pyoy:0.10,category:'养殖'},
    '鹌鹑':{price:7.2,pyoy:-0.01,category:'养殖'},
  };
  U.GET_PRICES=function(province,city,keyword){
    const rnd=U.mulberry32(U.hashStr([province,city,keyword||'',U.YEAR,U.MONTH].join('|')));
    return U.ALL_PRODS.filter(n=>!keyword||n.includes(keyword)).map(name=>{
      const b=U.PRICE_BASE[name];
      const pyoy=b.pyoy+(-0.05+rnd()*0.10);
      const yoyStr=(pyoy*100>=0?'+':'-')+Math.abs(pyoy*100).toFixed(2)+'%';
      const now=b.price*(1+pyoy/2)*(0.95+rnd()*0.10);
      return{
        name,
        category:b.category,
        price:Math.round(now*10)/10,
        yoy:yoyStr,
        yoyNum:pyoy*100,
      };
    });
  };
})();
