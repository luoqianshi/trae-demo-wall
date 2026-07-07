import { dow, wom, wn, t2m, m2t, avgTime, stdTime, medianTime, linearRegression, kernelDensityEstimation, detectModes } from './utils.js';
import { getDB, ruleByDate, getBaseEndTime, isOvertimeDay, isActivityDay, isHoliday, allRecs } from './data.js';

export function predict(ds, preTags){
  const d=dow(ds),w=wom(ds);
  const DB=getDB();
  const weights=DB.weights;
  const rule=ruleByDate(ds);
  if(rule)return{time:rule.time,conf:95,factors:[{name:'自定义规则',eff:'hit',desc:rule.desc||`${rule.time}固定模式`}],src:'rule',modes:[]};

  const baseMin=getBaseEndTime(ds);
  let comps=[];

  const sameDay=DB.records.filter(r=>dow(r.date)===d);
  if(sameDay.length){
    const sameDayStd=stdTime(sameDay);
    const sameDayMed=medianTime(sameDay);
    const useMedian=sameDayStd>30&&sameDay.length>=3;
    comps.push({key:'sameWeekday',val:useMedian?sameDayMed:avgTime(sameDay),w:weights.sameWeekday,label:'同星期'+(useMedian?'中位数':'均值'),n:sameDay.length,std:sameDayStd});
  }

  const womRecs=DB.records.filter(r=>dow(r.date)===d&&wom(r.date)===w);
  if(womRecs.length){
    const womStd=stdTime(womRecs);
    const womMed=medianTime(womRecs);
    const useMedian=womStd>25&&womRecs.length>=3;
    comps.push({key:'weekOfMonth',val:useMedian?womMed:avgTime(womRecs),w:weights.weekOfMonth,label:'同月同周'+(useMedian?'中位数':'均值'),n:womRecs.length,std:womStd});
  }

  const recent=[...DB.records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  if(recent.length>=2){
    let ts=0,div=0;
    recent.forEach((r,i)=>{const f=1-i*.1;ts+=t2m(r.time)*f;div+=f;});
    comps.push({key:'recentTrend',val:Math.round(ts/div),w:weights.recentTrend,label:'近期趋势',n:recent.length});
  }

  const lrResult=linearRegression(DB.records);
  if(lrResult&&lrResult.r2>=0.3&&DB.records.length>=5){
    comps.push({key:'linearTrend',val:lrResult.prediction,w:weights.linearTrend||0.15,label:'线性趋势',n:DB.records.length,r2:lrResult.r2});
  }

  const par=wn(ds)%2;
  const bi=DB.records.filter(r=>wn(r.date)%2===par);
  if(bi.length>=2){
    const biStd=stdTime(bi);
    const biMed=medianTime(bi);
    const useMedian=biStd>25&&bi.length>=3;
    comps.push({key:'biweekly',val:useMedian?biMed:avgTime(bi),w:weights.biweekly,label:par?'双周模式':'单周模式'+(useMedian?'中位数':'均值'),n:bi.length,std:biStd});
  }

  if(preTags&&preTags.length){
    const tagRecs=DB.records.filter(r=>r.tags&&r.tags.some(t=>preTags.includes(t)));
    if(tagRecs.length)comps.push({key:'tagInfluence',val:avgTime(tagRecs),w:weights.tagInfluence,label:preTags.join('+'),n:tagRecs.length});
  }

  const extras=[];
  if(isOvertimeDay(ds))extras.push({name:'固定加班日',eff:'up'});
  if(isActivityDay(ds))extras.push({name:'活动日',eff:'down'});
  if(d===5)extras.push({name:'周五效应',eff:'down'});
  if(isME(ds))extras.push({name:'月末效应',eff:'up'});
  if(isQE(ds))extras.push({name:'季末冲刺',eff:'up'});
  if(d===1)extras.push({name:'周一综合征',eff:'up'});
  if(preTags&&preTags.includes('节前'))extras.push({name:'节前效应',eff:'down'});
  if(preTags&&preTags.includes('应酬'))extras.push({name:'应酬效应',eff:'down'});

  if(!comps.length){
    let predMin=baseMin;
    extras.forEach(f=>{if(f.eff==='down')predMin-=15;if(f.eff==='up')predMin+=20;});
    predMin=Math.max(predMin,baseMin);
    return{time:m2t(predMin),conf:15,factors:extras.length?extras:[{name:'基准时间',eff:'none'}],src:'default',modes:[]};
  }

  let tw=0,ws=0;
  comps.forEach(c=>{ws+=c.val*c.w;tw+=c.w;});
  let predMin=Math.round(ws/tw);

  const totalRecs=comps.reduce((s,c)=>s+c.n,0);
  if(totalRecs<5){
    const blend=0.3+totalRecs*0.14;
    predMin=Math.round(predMin*blend+baseMin*(1-blend));
  }

  extras.forEach(f=>{if(f.eff==='down')predMin-=15;if(f.eff==='up')predMin+=20;});

  const hasEarlyRecs=DB.records.some(r=>t2m(r.time)<baseMin);
  if(!hasEarlyRecs)predMin=Math.max(predMin,baseMin);

  let conf=Math.min(95,Math.round(20+totalRecs*5+comps.length*8));

  const overallStd=stdTime(DB.records);
  if(overallStd>45)conf=Math.max(20,conf-15);
  else if(overallStd>30)conf=Math.max(25,conf-8);
  else if(overallStd<=15)conf=Math.min(95,conf+5);

  const compsWithStd=comps.filter(c=>c.std);
  if(compsWithStd.length){
    const avgStd=compsWithStd.reduce((s,c)=>s+c.std,0)/compsWithStd.length;
    if(avgStd>30)conf=Math.max(20,conf-5);
  }

  if(extras.length)conf=Math.min(95,conf+5);
  if(totalRecs<3)conf=Math.min(conf,40);

  conf=calibrateConfidence(conf,overallStd);

  const kdePoints=kernelDensityEstimation(DB.records);
  const modes=detectModes(kdePoints).slice(0,3).map(m=>({time:m2t(m.time),density:m.density}));

  const factors=comps.map(c=>{
    let desc=`基于${c.n}条`;
    if(c.std)desc+=` · 波动${Math.round(c.std)}min`;
    if(c.r2)desc+=` · R²=${c.r2.toFixed(2)}`;
    return{name:c.label,eff:c.val>predMin?'up':'down',desc};
  }).concat(extras);

  return{time:m2t(predMin),conf,factors,src:'calculated',overallStd:Math.round(overallStd),modes};
}

function calibrateConfidence(rawConf,std){
  const calibration={
    15:10,20:12,25:15,30:18,35:22,40:28,
    45:35,50:42,55:50,60:58,65:65,70:72,
    75:78,80:83,85:87,90:91,95:94
  };
  if(std>45){
    const penalty=Math.round((std-45)/10)*3;
    return Math.max(10,calibration[rawConf]||rawConf-penalty);
  }else if(std<=15){
    return Math.min(95,(calibration[rawConf]||rawConf)+3);
  }
  return calibration[rawConf]||rawConf;
}

function isME(ds){const d=parseInt(ds.split('-')[2]);return d>=26;}
function isQE(ds){const m=parseInt(ds.split('-')[1]);return(m===3||m===6||m===9||m===12)&&isME(ds);}

export function updateAdaptiveWeights(){
  const DB=getDB();
  if(DB.records.length<10)return;

  const sorted=[...DB.records].sort((a,b)=>a.date.localeCompare(b.date));
  const weights=DB.weights;
  const newWeights={...weights};

  const dimensionErrors={};
  const dims=['sameWeekday','weekOfMonth','recentTrend','linearTrend','biweekly','tagInfluence'];

  dims.forEach(dim=>{
    dimensionErrors[dim]=[];
  });

  for(let i=5;i<sorted.length;i++){
    const trainData=sorted.slice(0,i);
    const testRec=sorted[i];
    const testTags=testRec.tags||[];

    dims.forEach(dim=>{
      const pred=predictUsingSingleDimension(trainData,dim,testRec.date,testTags);
      if(pred){
        const error=Math.abs(t2m(pred)-t2m(testRec.time));
        dimensionErrors[dim].push(error);
      }
    });
  }

  dims.forEach(dim=>{
    if(dimensionErrors[dim].length>0){
      const avgErr=dimensionErrors[dim].reduce((s,e)=>s+e,0)/dimensionErrors[dim].length;
      const stdErr=Math.sqrt(dimensionErrors[dim].reduce((s,e)=>s+Math.pow(e-avgErr,2),0)/(dimensionErrors[dim].length-1));
      const quality=Math.max(0.1,1-avgErr/60);
      newWeights[dim]=Math.max(0.05,Math.min(0.4,weights[dim]*quality));
    }
  });

  const totalWeight=Object.values(newWeights).reduce((s,w)=>s+w,0);
  Object.keys(newWeights).forEach(k=>{
    newWeights[k]=newWeights[k]/totalWeight;
  });

  DB.weights=newWeights;
}

function predictUsingSingleDimension(records,dim,ds,tags){
  const d=dow(ds),w=wom(ds);
  const par=wn(ds)%2;

  switch(dim){
    case 'sameWeekday':{
      const recs=records.filter(r=>dow(r.date)===d);
      return recs.length?m2t(avgTime(recs)):null;
    }
    case 'weekOfMonth':{
      const recs=records.filter(r=>dow(r.date)===d&&wom(r.date)===w);
      return recs.length?m2t(avgTime(recs)):null;
    }
    case 'recentTrend':{
      const recent=[...records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
      if(recent.length<2)return null;
      let ts=0,div=0;
      recent.forEach((r,i)=>{const f=1-i*.1;ts+=t2m(r.time)*f;div+=f;});
      return m2t(Math.round(ts/div));
    }
    case 'linearTrend':{
      const lr=linearRegression(records);
      return lr&&lr.r2>=0.3?m2t(Math.round(lr.intercept+lr.slope*records.length)):null;
    }
    case 'biweekly':{
      const recs=records.filter(r=>wn(r.date)%2===par);
      return recs.length>=2?m2t(avgTime(recs)):null;
    }
    case 'tagInfluence':{
      if(!tags||!tags.length)return null;
      const recs=records.filter(r=>r.tags&&r.tags.some(t=>tags.includes(t)));
      return recs.length?m2t(avgTime(recs)):null;
    }
    default:return null;
  }
}

export function getModeAnalysis(){
  const DB=getDB();
  const kdePoints=kernelDensityEstimation(DB.records);
  const modes=detectModes(kdePoints);
  return modes.slice(0,3).map(m=>({
    time:m2t(m.time),
    density:m.density,
    count:DB.records.filter(r=>Math.abs(t2m(r.time)-m.time)<=15).length
  }));
}