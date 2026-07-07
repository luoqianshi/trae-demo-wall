import { t2m, m2t } from './utils.js';
import { allRecs } from './data.js';

export function renderTrendChart(containerId){
  const recs=allRecs();
  if(recs.length<3)return;

  const sorted=[...recs].sort((a,b)=>a.date.localeCompare(b.date));
  const times=sorted.map(r=>t2m(r.time));
  const minTime=Math.min(...times)-60;
  const maxTime=Math.max(...times)+60;

  const container=document.getElementById(containerId);
  if(!container)return;

  const width=container.offsetWidth;
  const height=200;
  const padding={top:20,right:20,bottom:30,left:40};
  const chartWidth=width-padding.left-padding.right;
  const chartHeight=height-padding.top-padding.bottom;

  let svg=container.querySelector('svg');
  if(svg)container.removeChild(svg);

  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width',width);
  svg.setAttribute('height',height);
  svg.classList.add('chart-canvas');

  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  const gradient=document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
  gradient.setAttribute('id','chartGradient');
  gradient.setAttribute('x1','0%');gradient.setAttribute('y1','0%');
  gradient.setAttribute('x2','0%');gradient.setAttribute('y2','100%');
  const stop1=document.createElementNS('http://www.w3.org/2000/svg','stop');
  stop1.setAttribute('offset','0%');stop1.setAttribute('stop-color','#ff6b35');stop1.setAttribute('stop-opacity','0.4');
  const stop2=document.createElementNS('http://www.w3.org/2000/svg','stop');
  stop2.setAttribute('offset','100%');stop2.setAttribute('stop-color','#ff6b35');stop2.setAttribute('stop-opacity','0');
  gradient.appendChild(stop1);gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  for(let y=0;y<=4;y++){
    const yPos=padding.top+(chartHeight/4)*y;
    const grid=document.createElementNS('http://www.w3.org/2000/svg','line');
    grid.setAttribute('x1',padding.left);grid.setAttribute('y1',yPos);
    grid.setAttribute('x2',width-padding.right);grid.setAttribute('y2',yPos);
    grid.classList.add('chart-grid');
    svg.appendChild(grid);

    const timeVal=maxTime-((maxTime-minTime)/4)*y;
    const label=document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x',padding.left-5);label.setAttribute('y',yPos+4);
    label.setAttribute('text-anchor','end');
    label.classList.add('chart-label');
    label.textContent=m2t(Math.max(0,timeVal));
    svg.appendChild(label);
  }

  const points=[];
  sorted.forEach((r,i)=>{
    const x=padding.left+(chartWidth/(sorted.length-1))*i;
    const y=padding.top+chartHeight-((t2m(r.time)-minTime)/(maxTime-minTime))*chartHeight;
    points.push(`${x},${y}`);

    const point=document.createElementNS('http://www.w3.org/2000/svg','circle');
    point.setAttribute('cx',x);point.setAttribute('cy',y);
    point.setAttribute('r',4);
    point.classList.add('chart-point');
    svg.appendChild(point);
  });

  const areaD=`M${points.join(' L')} L${padding.left+chartWidth},${padding.top+chartHeight} L${padding.left},${padding.top+chartHeight} Z`;
  const area=document.createElementNS('http://www.w3.org/2000/svg','path');
  area.setAttribute('d',areaD);
  area.classList.add('chart-area');
  svg.appendChild(area);

  const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
  line.setAttribute('points',points.join(' '));
  line.classList.add('chart-line');
  svg.appendChild(line);

  container.appendChild(svg);
}

export function renderHistogram(containerId){
  const recs=allRecs();
  if(recs.length<5)return;

  const times=recs.map(r=>t2m(r.time));
  const minTime=Math.min(...times)-30;
  const maxTime=Math.max(...times)+30;
  const binSize=15;
  const bins=[];

  for(let t=minTime;t<maxTime;t+=binSize){
    bins.push({start:t,end:t+binSize,count:0});
  }

  times.forEach(t=>{
    const binIdx=Math.floor((t-minTime)/binSize);
    if(binIdx>=0&&binIdx<bins.length){
      bins[binIdx].count++;
    }
  });

  const maxCount=Math.max(...bins.map(b=>b.count));

  const container=document.getElementById(containerId);
  if(!container)return;

  const width=container.offsetWidth;
  const height=200;
  const padding={top:20,right:20,bottom:30,left:40};
  const chartWidth=width-padding.left-padding.right;
  const chartHeight=height-padding.top-padding.bottom;

  let svg=container.querySelector('svg');
  if(svg)container.removeChild(svg);

  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width',width);
  svg.setAttribute('height',height);
  svg.classList.add('chart-canvas');

  for(let y=0;y<=4;y++){
    const yPos=padding.top+(chartHeight/4)*y;
    const grid=document.createElementNS('http://www.w3.org/2000/svg','line');
    grid.setAttribute('x1',padding.left);grid.setAttribute('y1',yPos);
    grid.setAttribute('x2',width-padding.right);grid.setAttribute('y2',yPos);
    grid.classList.add('chart-grid');
    svg.appendChild(grid);

    const label=document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x',padding.left-5);label.setAttribute('y',yPos+4);
    label.setAttribute('text-anchor','end');
    label.classList.add('chart-label');
    label.textContent=Math.round(maxCount-((maxCount/4)*y));
    svg.appendChild(label);
  }

  const barWidth=chartWidth/bins.length-2;

  bins.forEach((bin,i)=>{
    const x=padding.left+i*(chartWidth/bins.length)+1;
    const barHeight=(bin.count/maxCount)*chartHeight;
    const y=padding.top+chartHeight-barHeight;

    const bar=document.createElementNS('http://www.w3.org/2000/svg','rect');
    bar.setAttribute('x',x);bar.setAttribute('y',y);
    bar.setAttribute('width',barWidth);bar.setAttribute('height',barHeight);
    bar.classList.add('chart-bar');
    svg.appendChild(bar);

    if(i%4===0){
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.setAttribute('x',x+barWidth/2);label.setAttribute('y',height-10);
      label.setAttribute('text-anchor','middle');
      label.classList.add('chart-label');
      label.textContent=m2t(bin.start);
      svg.appendChild(label);
    }
  });

  container.appendChild(svg);
}