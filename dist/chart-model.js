'use strict';
// Statistics describe sampled prices, never a reconstruction of individual trades.
window.MOOKET_CHART = (()=>{
 const price=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 const volume=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 function quantile(sorted,q){if(!sorted.length)return null;const pos=(sorted.length-1)*q,lo=Math.floor(pos),hi=Math.ceil(pos);return sorted[lo]+(sorted[hi]-sorted[lo])*(pos-lo)}
 function model(rows,metric,compress=false){
  const ordered=rows.filter(r=>Number.isFinite(r.time)).slice().sort((a,b)=>a.time-b.time),valid=ordered.filter(r=>price(r[metric])),values=valid.map(r=>r[metric]).sort((a,b)=>a-b);
  if(!values.length)return {rows:ordered,valid,stats:null,segments:[],cap:null,outliers:[]};
  const min=values[0],max=values.at(-1),median=quantile(values,.5),q1=quantile(values,.25),q3=quantile(values,.75),threshold=q3+2.5*Math.max(q3-q1,.03*median,1),cap=compress&&values.length>=5&&max>threshold?threshold:max;
  const segments=[];let segment=[];for(const r of ordered){if(!price(r[metric])||r[metric]>cap){if(segment.length)segments.push(segment);segment=[];continue}if(segment.length&&r.time-segment.at(-1).time>172800){segments.push(segment);segment=[]}segment.push(r)}if(segment.length)segments.push(segment);
  return {rows:ordered,valid,stats:{min,max,median,mean:values.reduce((a,b)=>a+b,0)/values.length,count:values.length,last:valid.at(-1),first:valid[0],change:values.length>1?(valid.at(-1)[metric]/valid[0][metric]-1)*100:null},cap,segments,outliers:valid.filter(r=>r[metric]>cap),volumeMax:Math.max(0,...ordered.filter(r=>volume(r.v)).map(r=>r.v))};
 }
 return {price,volume,quantile,model};
})();
