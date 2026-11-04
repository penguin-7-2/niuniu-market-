'use strict';
window.MOOKET_TRADES=(()=>{
 const volume=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const price=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 function uniqueHours(rows){const hours=new Map();for(const r of rows){if(!Number.isFinite(r?.time)||r.time<=0)continue;const bucket=Math.floor(r.time/3600),old=hours.get(bucket);if(!old||r.time>=old.time)hours.set(bucket,r)}return [...hours.values()].sort((a,b)=>a.time-b.time)}
 function summarize(rows,start,end,source){
  const inRange=uniqueHours(rows).filter(r=>r.time>start&&r.time<=end),expected=Math.max(1,Math.round((end-start)/3600));
  // One latest observation per hourly window, (start, end], prevents duplicate volumes.
  const bins=new Map();for(const r of inRange){const k=Math.floor((end-r.time)/3600);if(k<0||k>=expected)continue;const old=bins.get(k);if(!old||r.time>=old.time)bins.set(k,r)}
  const hourly=[...bins.values()],trades=hourly.filter(r=>price(r.p)&&volume(r.v)&&r.v>0),volumes=hourly.filter(r=>volume(r.v)),canSum=source==='q7';
  return {high:trades.length?Math.max(...trades.map(r=>r.p)):null,low:trades.length?Math.min(...trades.map(r=>r.p)):null,total:canSum&&volumes.length?volumes.reduce((n,r)=>n+r.v,0):null,covered:canSum?volumes.length:0,expected,complete:canSum&&volumes.length===expected,rows:hourly,tradePeriods:trades.length,source,start,end};
 }
 return {uniqueHours,summarize};
})();
