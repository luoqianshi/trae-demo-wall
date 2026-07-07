export function today(){return new Date().toISOString().slice(0,10)}
export function parseD(s){const [y,m,d]=s.split('-');return new Date(y,parseInt(m)-1,parseInt(d))}
export function t2m(t){const [h,m]=t.split(':');return parseInt(h)*60+parseInt(m)}
export function m2t(m){const h=Math.floor(m/60),mn=m%60;return`${h.toString().padStart(2,'0')}:${mn.toString().padStart(2,'0')}`}
export function dow(ds){return parseD(ds).getDay()||7}
export function dn(d){return['日','一','二','三','四','五','六'][d%7]}
export function wn(ds){const d=parseD(ds);const wd=new Date(d.getFullYear(),0,1);return Math.ceil((d-wd)/86400000/7)}
export function wom(ds){const d=parseD(ds);return Math.ceil(d.getDate()/7)}
export function fd(s){const d=parseD(s);return (d.getMonth()+1)+'/'+d.getDate()}

export function avgTime(recs){
  if(!recs.length)return 0;
  return Math.round(recs.reduce((s,r)=>s+t2m(r.time),0)/recs.length);
}

export function stdTime(recs){
  if(recs.length<2)return 0;
  const avg=avgTime(recs);
  const variance=recs.reduce((s,r)=>s+Math.pow(t2m(r.time)-avg,2),0)/(recs.length-1);
  return Math.sqrt(variance);
}

export function medianTime(recs){
  if(!recs.length)return 0;
  const sorted=[...recs].map(r=>t2m(r.time)).sort((a,b)=>a-b);
  const mid=Math.floor(sorted.length/2);
  return sorted.length%2===0?Math.round((sorted[mid-1]+sorted[mid])/2):sorted[mid];
}

export function linearRegression(recs){
  if(recs.length<2)return null;
  const sorted=[...recs].sort((a,b)=>a.date.localeCompare(b.date));
  const n=sorted.length;
  let sumX=0,sumY=0,sumXY=0,sumX2=0;
  sorted.forEach((r,i)=>{
    const x=i;
    const y=t2m(r.time);
    sumX+=x;sumY+=y;sumXY+=x*y;sumX2+=x*x;
  });
  const denom=n*sumX2-sumX*sumX;
  if(Math.abs(denom)<0.0001)return null;
  const slope=(n*sumXY-sumX*sumY)/denom;
  const intercept=(sumY-slope*sumX)/n;
  const r2=calcR2(sorted,slope,intercept);
  return {slope,intercept,prediction:Math.round(intercept+slope*(n)),r2};
}

function calcR2(recs,slope,intercept){
  const n=recs.length;
  const meanY=recs.reduce((s,r)=>s+t2m(r.time),0)/n;
  let ssTot=0,ssRes=0;
  recs.forEach((r,i)=>{
    const y=t2m(r.time);
    const yPred=intercept+slope*i;
    ssTot+=Math.pow(y-meanY,2);
    ssRes+=Math.pow(y-yPred,2);
  });
  return ssTot===0?1:1-ssRes/ssTot;
}

export function kernelDensityEstimation(recs,bandwidth=20){
  if(recs.length<2)return [];
  const times=recs.map(r=>t2m(r.time));
  const minTime=Math.min(...times)-60;
  const maxTime=Math.max(...times)+60;
  const points=[];
  const step=5;
  for(let x=minTime;x<=maxTime;x+=step){
    let density=0;
    times.forEach(t=>{
      density+=Math.exp(-0.5*Math.pow((x-t)/bandwidth,2))/(bandwidth*Math.sqrt(2*Math.PI));
    });
    density/=times.length;
    points.push({time:x,density});
  }
  return points;
}

export function detectModes(kdePoints){
  if(kdePoints.length<3)return [];
  const modes=[];
  for(let i=1;i<kdePoints.length-1;i++){
    if(kdePoints[i].density>kdePoints[i-1].density&&kdePoints[i].density>kdePoints[i+1].density){
      modes.push({time:kdePoints[i].time,density:kdePoints[i].density});
    }
  }
  modes.sort((a,b)=>b.density-a.density);
  return modes;
}

export function calculateCalibratedConfidence(predictions,actuals){
  if(predictions.length<5)return null;
  const errors=predictions.map((p,i)=>Math.abs(t2m(p)-t2m(actuals[i])));
  const confLevels=[50,60,70,80,90];
  const calibration={};
  confLevels.forEach(targetConf=>{
    const threshold=Math.ceil(targetConf/10);
    const sortedErrors=[...errors].sort((a,b)=>a-b);
    const idx=Math.floor(sortedErrors.length*(targetConf/100));
    calibration[targetConf]=sortedErrors[idx]||0;
  });
  const avgError=errors.reduce((s,e)=>s+e,0)/errors.length;
  const stdError=Math.sqrt(errors.reduce((s,e)=>s+Math.pow(e-avgError,2),0)/(errors.length-1));
  return {calibration,avgError,stdError};
}