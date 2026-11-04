'use strict';
let scannerActive=false,scanCandidates=[],scanResults=new Map(),scanToken=0,scanBusy=false,scanSignature='',scanEnd=0;
function scannerSignature(){return [$('#scanDays').value,$('#scanMetric').value,variant].join(':')}
function scanChange(rows,start,end,key){const p=rows.filter(r=>r.time>start&&r.time<=end&&valid(r[key])).sort((a,b)=>a.time-b.time);if(p.length<2||p[0].time===p.at(-1).time)return null;return {change:(p.at(-1)[key]/p[0][key]-1)*100,first:p[0].time,last:p.at(-1).time}}
function scannerList(ids){
 scanCandidates=ids.slice();$('#scannerTools').hidden=!scannerActive;$('#scannav').classList.toggle('active',scannerActive);document.body.classList.toggle('scanner-mode',scannerActive);$('#sort').disabled=scannerActive;
 if(!scannerActive)return ids;
 $('#allnav').classList.remove('active');$('#favnav').classList.remove('active');
 const threshold=Number($('#scanThreshold').value),direction=$('#scanDirection').value;
 if(scanSignature!==scannerSignature()||!Number.isFinite(threshold)||threshold<0)return [];
 return ids.filter(id=>{const r=scanResults.get(id);return r&&(direction==='up'?r.change>threshold:direction==='down'?r.change< -threshold:Math.abs(r.change)>threshold)}).sort((a,b)=>Number(favorites.has(b))-Number(favorites.has(a))||scanResults.get(b).change-scanResults.get(a).change||name(a).localeCompare(name(b),'zh-Hant'));
}
function scanCell(id){const r=scanSignature===scannerSignature()?scanResults.get(id):null;return `<td class="scanColumn ${r?.change>=0?'positive':'negative'}" title="${r?esc(date(r.first)+' → '+date(r.last)):''}">${r?(r.change>0?'+':'')+r.change.toFixed(2)+'%':'—'}</td>`}
function stopScan(){scanToken++;scanBusy=false;$('#scanStart').disabled=false;$('#scanStop').hidden=true}
async function startScan(){
 stopScan();const threshold=Number($('#scanThreshold').value);if(!Number.isFinite(threshold)||threshold<0){$('#scanStatus').textContent='請輸入大於或等於 0 的百分比。';return}
 renderList();const ids=scanCandidates.slice(),token=++scanToken,duration=+$('#scanDays').value,key=$('#scanMetric').value,level=variant;
 scanResults=new Map();scanSignature=scannerSignature();scanEnd=Date.now()/1000;const end=scanEnd,start=end-duration*86400;let next=0,done=0,missing=0;
 scanBusy=true;$('#scanStart').disabled=true;$('#scanStop').hidden=false;
 const progress=()=>{$('#scanStatus').textContent=`已掃描 ${done} / ${ids.length} 項 · ${missing} 項資料不足 · 截至 ${date(end)}。${done<ids.length?'可先查看已完成結果。':''}`};progress();renderList();
 async function worker(){while(token===scanToken&&next<ids.length){const id=ids[next++];let result=null;try{const h=await history(id,duration,level);result=scanChange(h.rows,start,end,key)}catch{}if(token!==scanToken)return;if(result)scanResults.set(id,result);else missing++;done++;progress();renderList()}}
 await Promise.all(Array.from({length:Math.min(4,ids.length)},worker));if(token===scanToken){stopScan();progress();renderList()}
}
function initScanner(){
 $('#scannav').onclick=()=>{scannerActive=true;onlyFav=false;page=1;renderList();$('.catalog').scrollIntoView({behavior:'smooth',block:'start'})};
 $('#scanStart').onclick=startScan;$('#scanStop').onclick=()=>{stopScan();$('#scanStatus').textContent+=' 已停止，保留已完成結果。'};
 for(const id of ['scanThreshold','scanDirection'])$('#'+id).oninput=()=>{page=1;renderList()};
 for(const id of ['scanDays','scanMetric'])$('#'+id).onchange=()=>{stopScan();page=1;renderList();$('#scanStatus').textContent='時段或報價已變更，請重新掃描。'};
}
