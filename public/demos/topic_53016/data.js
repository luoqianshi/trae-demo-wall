import { today, parseD } from './utils.js';

const STORE_KEY='boss_time_db';
let DB=null;
let dbFileHandle=null;

export function getDB(){return DB;}

export function getDefaultAtt(){
  return {endTime:'18:00',workSystem:'5',flexEnabled:false,flexEarly:0,flexLate:0,overtimeDays:[],activityDays:[]};
}

const HOLIDAYS={
  '2026-01-01':'元旦',
  '2026-01-29':'春节',
  '2026-01-30':'春节',
  '2026-01-31':'春节',
  '2026-02-01':'春节',
  '2026-02-02':'春节',
  '2026-02-03':'春节',
  '2026-02-04':'春节',
  '2026-04-05':'清明节',
  '2026-05-01':'劳动节',
  '2026-05-02':'劳动节',
  '2026-05-03':'劳动节',
  '2026-06-19':'端午节',
  '2026-09-26':'中秋节',
  '2026-10-01':'国庆节',
  '2026-10-02':'国庆节',
  '2026-10-03':'国庆节',
  '2026-10-04':'国庆节',
  '2026-10-05':'国庆节',
  '2026-10-06':'国庆节',
  '2026-10-07':'国庆节'
};

export function isHoliday(ds){
  return HOLIDAYS[ds]||false;
}

export function getHolidayName(ds){
  return HOLIDAYS[ds]||'';
}

export function isWorkday(ds){
  if(isHoliday(ds))return false;
  const att=getAtt(),d=getDayOfWeek(ds);
  if(att.workSystem==='5')return d>=1&&d<=5;
  if(att.workSystem==='6')return d>=1&&d<=6;
  if(att.workSystem==='5b'||att.workSystem==='6b'){
    const par=getWeekNum(ds)%2;
    if(att.workSystem==='6b')return par===0?(d>=1&&d<=6):(d>=1&&d<=5);
    return par===0?(d>=1&&d<=5):(d===7?false:true);
  }
  return true;
}

function getDayOfWeek(ds){return parseD(ds).getDay()||7;}
function getWeekNum(ds){const d=parseD(ds);const wd=new Date(d.getFullYear(),0,1);return Math.ceil((d-wd)/86400000/7);}

export function getAtt(){return DB.attendance||getDefaultAtt();}

export function getBaseEndTime(ds){
  const att=getAtt();
  let base=t2m(att.endTime||'18:00');
  if(att.flexEnabled){
    if(att.flexEarly)base-=att.flexEarly;
    if(att.flexLate)base+=att.flexLate;
  }
  return base;
}

export function isOvertimeDay(ds){
  const att=getAtt(),d=getDayOfWeek(ds);
  return (att.overtimeDays||[]).includes(d);
}

export function isActivityDay(ds){
  const att=getAtt(),d=getDayOfWeek(ds);
  return (att.activityDays||[]).includes(d);
}

export function allRecs(){return DB.records;}
export function allRules(){return DB.rules;}
export function recByDate(d){return DB.records.find(r=>r.date===d)||null;}

export function ruleByDate(ds){
  const dv=getDayOfWeek(ds),wv=Math.ceil(parseD(ds).getDate()/7),dayVal=parseD(ds).getDate();
  return DB.rules.find(r=>{
    if(r.type==='dayOfMonth'&&dayVal===r.dayOfMonth)return true;
    if(r.type==='weekOfMonth'&&r.dayOfWeek===dv&&(r.weekOfMonth===0||r.weekOfMonth===wv))return true;
    if(r.type==='weekOfYear'){
      const wNum=getWeekNum(ds),wFromStart=Math.ceil(dayVal/7);
      return r.dayOfWeek===dv&&(r.weekOfMonth===0||r.weekOfMonth===wFromStart||r.weekOfMonth===wNum);
    }
    return r.dayOfWeek===dv&&(r.weekOfMonth===0||r.weekOfMonth===wv);
  })||null;
}

export async function loadDB(){
  try{
    if(window.showOpenFilePicker){
      try{
        const opts={types:[{description:'JSON文件',accept:{'application/json':['.json']}}]};
        const [handle]=await window.showOpenFilePicker(opts);
        dbFileHandle=handle;
        const file=await handle.getFile();
        const raw=await file.text();
        DB=JSON.parse(raw);
        if(!DB.attendance)DB.attendance=getDefaultAtt();
        if(DB.weights&&!DB.weights.linearTrend)DB.weights.linearTrend=.17;
        if(!DB.weights)DB.weights={sameWeekday:.25,weekOfMonth:.20,recentTrend:.18,biweekly:.12,tagInfluence:.08,linearTrend:.17};
        toast('📂 已从文件加载数据');
        return;
      }catch(e){}
    }
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){
      DB=JSON.parse(raw);
      if(!DB.attendance)DB.attendance=getDefaultAtt();
      if(DB.weights&&!DB.weights.linearTrend)DB.weights.linearTrend=.17;
      if(!DB.weights)DB.weights={sameWeekday:.25,weekOfMonth:.20,recentTrend:.18,biweekly:.12,tagInfluence:.08,linearTrend:.17};
      if(window.showSaveFilePicker&&!dbFileHandle){
        setTimeout(askSaveLocation,500);
      }
      return;
    }
  }catch(e){}
  DB={records:[],rules:[],weights:{sameWeekday:.25,weekOfMonth:.20,recentTrend:.18,biweekly:.12,tagInfluence:.08,linearTrend:.17},attendance:getDefaultAtt()};
}

async function askSaveLocation(){
  try{
    const opts={
      suggestedName:'boss-time-data.json',
      types:[{description:'JSON文件',accept:{'application/json':['.json']}}]
    };
    dbFileHandle=await window.showSaveFilePicker(opts);
    await writeDBFile();
    toast('📂 数据将自动保存到 boss-time-data.json');
  }catch(e){}
}

async function writeDBFile(){
  if(!dbFileHandle)return;
  try{
    const writable=await dbFileHandle.createWritable();
    await writable.write(JSON.stringify(DB,null,2));
    await writable.close();
  }catch(e){}
}

export async function saveDB(){
  localStorage.setItem(STORE_KEY,JSON.stringify(DB));
  await writeDBFile();
}

export async function exportData(){
  const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='boss-time-data.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('✅ 已导出');
}

export async function importData(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.records||!Array.isArray(data.records)){toast('❌ 文件格式错误');return;}
      if(!data.attendance)data.attendance=getDefaultAtt();
      if(!data.weights)data.weights={sameWeekday:.25,weekOfMonth:.20,recentTrend:.18,biweekly:.12,tagInfluence:.08,linearTrend:.17};
      if(!data.weights.linearTrend)data.weights.linearTrend=.17;
      DB=data;saveDB();refreshAll();toast('✅ 数据已恢复：'+file.name);
    }catch(err){toast('❌ 导入失败：'+err.message);}
  };
  reader.readAsText(file);input.value='';
}

export async function saveToFile(){
  try{
    const opts={
      suggestedName:'boss-time-data.json',
      types:[{description:'JSON文件',accept:{'application/json':['.json']}}]
    };
    dbFileHandle=await window.showSaveFilePicker(opts);
    await writeDBFile();
    toast('✅ 数据已保存到文件');
  }catch(e){
    const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='boss-time-data.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    toast('📥 已下载，保存到 index.html 同级目录');
  }
}

export async function loadFromFile(){
  try{
    const opts={types:[{description:'JSON文件',accept:{'application/json':['.json']}}]};
    const [handle]=await window.showOpenFilePicker(opts);
    dbFileHandle=handle;
    const file=await handle.getFile();
    const raw=await file.text();
    DB=JSON.parse(raw);
    if(!DB.attendance)DB.attendance=getDefaultAtt();
    if(DB.weights&&!DB.weights.linearTrend)DB.weights.linearTrend=.17;
    if(!DB.weights)DB.weights={sameWeekday:.25,weekOfMonth:.20,recentTrend:.18,biweekly:.12,tagInfluence:.08,linearTrend:.17};
    saveDB();refreshAll();
    toast('✅ 已从文件加载数据');
  }catch(e){
    toast('❌ 加载失败');
  }
}

export function clearData(){
  if(!confirm('确定清空所有数据？不可恢复！'))return;
  DB={records:[],rules:[],weights:{sameWeekday:.25,weekOfMonth:.20,recentTrend:.18,biweekly:.12,tagInfluence:.08,linearTrend:.17},attendance:getDefaultAtt()};
  saveDB();toast('🗑️ 已清空');refreshAll();
}

function t2m(t){const [h,m]=t.split(':');return parseInt(h)*60+parseInt(m)}

function toast(msg){
  const t=document.getElementById('toast');t.textContent=msg;
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);
}

window.refreshAll=function(){
  renderHome();
  renderWeek();
  renderHistory();
  renderSettings();
  renderStats();
};