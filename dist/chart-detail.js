'use strict';
let chartStyle='detail',focusItem='/items/milk',recordPage=1,detailModel=null,detailActivate=null;
const metricNames={a:'賣方報價',b:'買方報價',p:'成交均價'};
const compact=n=>!Number.isFinite(n)?'—':Math.abs(n)>=1e9?(n/1e9).toFixed(2)+'B':Math.abs(n)>=1e6?(n/1e6).toFixed(2)+'M':Math.abs(n)>=1e3?(n/1e3).toFixed(1)+'K':n.toLocaleString('zh-TW',{maximumFractionDigits:2});
function initDetailChart(){
 syncChartStyle();
 $('#chartStyle').onclick=e=>{const style=e.target.dataset.style;if(!['detail','compare'].includes(style))return;chartStyle=style;saveWorkspace();$('#chartStyle').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.style===style);b.setAttribute('aria-pressed',String(b.dataset.style===style))});draw()};
 $('#focusItem').onchange=e=>{focusItem=e.target.value;recordPage=1;draw()};
 for(const id of ['#compressOutliers','#sqrtVolume'])$(id).onchange=draw;
 $('#recordsPrev').onclick=()=>{recordPage--;renderRecords()};$('#recordsNext').onclick=()=>{recordPage++;renderRecords()};
 $('#recordRows').onclick=e=>{let b=e.target.closest('button');if(b?.dataset.sample!==undefined){detailActivate?.(+b.dataset.sample);$('#chart').scrollIntoView({behavior:'smooth',block:'center'})}};
}
function syncChartStyle(){
 $('#tradeStats').hidden=chartStyle==='compare';
 $('#chartStyle').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.style===chartStyle);b.setAttribute('aria-pressed',String(b.dataset.style===chartStyle))});
 $('#tooltip').hidden=true;$('#chartStyleNote').textContent=chartStyle==='detail'?'價格 × 成交量 · 同步時間軸':'最多 10 張獨立價格軸 · 共用時間範圍';detailActivate=null;$('#detailTools').hidden=chartStyle!=='detail';$('#detailStats').hidden=chartStyle!=='detail';$('#detailRecords').hidden=chartStyle!=='detail';$('#detailReadout').hidden=chartStyle!=='detail';$('#chart').classList.toggle('detail-chart',chartStyle==='detail');$('#chart').classList.toggle('compare-chart',chartStyle==='compare');
 if(!selected.includes(focusItem))focusItem=selected[0]||'';
 $('#focusItem').innerHTML=selected.map(id=>`<option value="${esc(id)}">${esc(name(id))}</option>`).join('');$('#focusItem').value=focusItem;$('#focusIcon').innerHTML=focusItem?icon(focusItem):'';
}
function renderRecords(){
 $('#recordsMethod').textContent=view.find(x=>x.id===focusItem)?.source==='q7'?'Q7 每小時歷史記錄；時段成交量按每小時最新一筆去重加總。高低價取有效且成交量大於零的成交均價，並非逐筆成交極值。樣本平均與中位數不按成交量加權。':'備援歷史快照的成交量可能含重疊區間，因此只展示原值，不計算時段加總。';const rows=(detailModel?.rows||[]).map((r,index)=>({...r,index})).reverse(),pages=Math.max(1,Math.ceil(rows.length/12));recordPage=Math.min(Math.max(1,recordPage),pages);
 $('#recordsTitle').innerHTML=focusItem?icon(focusItem)+'<span>'+esc(name(focusItem))+' · 歷史樣本</span>':'歷史樣本';
 $('#recordRows').innerHTML=rows.slice((recordPage-1)*12,recordPage*12).map(r=>`<tr><td><button data-sample="${r.index}" aria-label="查看 ${date(r.time)} 的樣本">${date(r.time)}</button></td><td>${fmt(r.p)}</td><td>${fmt(r.a)}</td><td>${fmt(r.b)}</td><td>${window.MOOKET_CHART.volume(r.v)?r.v.toLocaleString('zh-TW'):'—'}</td></tr>`).join('')||'<tr><td colspan="5">所選期間沒有歷史樣本。</td></tr>';
 $('#recordsPage').textContent=`${recordPage} / ${pages} · ${rows.length} 筆`;
 $('#recordsPrev').disabled=recordPage<=1;$('#recordsNext').disabled=recordPage>=pages;
}
function drawDetailed(){
 const focus=view.find(x=>x.id===focusItem),host=$('#chart');detailModel=window.MOOKET_CHART.model(focus?.rows||[],metric,$('#compressOutliers').checked);const m=detailModel,st=m.stats;
 $('#unit').textContent=mode==='percent'?'價格軸：漲跌幅 % · 首筆有效樣本為基準':'價格軸：金幣';renderRecords();
 if(!st){$('#detailStats').innerHTML='';$('#detailReadout').textContent='所選報價類型尚無有效樣本。';host.innerHTML='<div class="empty">'+(selected.length?'沒有可繪製的有效價格。可切換報價類型、期間或強化等級。':'從市場清單選擇物品，開始觀察價格與成交量。')+'</div>';return}
 const vals=[['樣本平均',fmt(st.mean),'gold'],['樣本中位',fmt(st.median),'orange'],['期間最低',fmt(st.min),'green'],['期間最高',fmt(st.max),'gold'],['首末變化',st.change===null?'—':(st.change>0?'+':'')+st.change.toFixed(2)+'%',st.change<0?'red':'green'],['有效價格樣本',st.count.toLocaleString(),'blue']];
 $('#detailStats').innerHTML=vals.map(([label,value,color])=>`<div><span>${label}</span><strong class="${color}">${value}</strong></div>`).join('')+(m.outliers.length?`<p class="outlierNotice">↑ ${m.outliers.length} 筆高價超出聚焦範圍，原值與最高價仍保留；取消「高價聚焦」可查看全幅。</p>`:'');
 const mobile=typeof window.matchMedia==='function'&&window.matchMedia('(max-width:670px)').matches;const W=mobile?440:920,H=400,L=mobile?46:56,R=mobile?88:106,T=34,PB=232,VT=290,VB=357,PW=W-L-R;let start=(historyEnd||timestamp)-(days||365)*86400,end=historyEnd||timestamp||m.rows.at(-1).time;if(end<=start)end=start+3600;
 const value=n=>mode==='percent'?(n/st.first[metric]-1)*100:n,loRaw=st.min,hiRaw=m.cap,pad=Math.max((hiRaw-loRaw)*.12,hiRaw*.01,1),low=value(Math.max(0,loRaw-pad)),high=value(hiRaw+pad),X=t=>L+(t-start)/(end-start)*PW,Y=n=>T+(high-value(n))/(high-low)*(PB-T),f=n=>n.toFixed(2),sqrt=$('#sqrtVolume').checked,vr=n=>m.volumeMax>0?(sqrt?Math.sqrt(n/m.volumeMax):n/m.volumeMax):0;
 let svg=`<defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0cb65" stop-opacity=".23"/><stop offset="100%" stop-color="#f0cb65" stop-opacity=".015"/></linearGradient><clipPath id="priceClip"><rect x="${L}" y="${T}" width="${PW}" height="${PB-T}"/></clipPath></defs>`;
 // Taipei day boundaries: continuous UTC arithmetic avoids host-timezone drift.
 const firstDay=Math.floor((start+28800)/86400)*86400-28800;const dayCount=Math.ceil((end-firstDay)/86400),bandDays=dayCount<=45?1:Math.ceil(dayCount/24);
 for(let i=0;i<dayCount;i+=bandDays){const a=Math.max(start,firstDay+i*86400),b=Math.min(end,firstDay+(i+bandDays)*86400);svg+=`<rect x="${f(X(a))}" y="${T}" width="${f(X(b)-X(a))}" height="${VB-T}" fill="${Math.floor(i/bandDays)%2?'#91add00a':'#91add004'}"/>`;if(a>start)svg+=`<line x1="${f(X(a))}" x2="${f(X(a))}" y1="${T}" y2="${VB}" stroke="#7896bb25" stroke-dasharray="3 5"/>`}
 for(let i=0;i<4;i++){const y=T+(PB-T)*i/3,n=high-(high-low)*i/3;svg+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="#7b96b326" stroke-dasharray="3 5"/><text x="${L-9}" y="${y+4}" text-anchor="end" fill="#b9c2cb" font-size="10">${compact(n)}${mode==='percent'?'%':''}</text>`}
 const refs=[{n:st.min,label:'低',color:'#b9dfa6'},{n:st.median,label:'中位',color:'#efa75c'},{n:m.cap,label:m.outliers.length?'聚焦上界':'高',color:'#f0cb65'}];let labelY=-100;
 for(const ref of refs.sort((a,b)=>b.n-a.n)){if(ref.n>m.cap)continue;const y=Y(ref.n),textY=Math.max(y+3,labelY+16);labelY=textY;svg+=`<line x1="${L}" x2="${W-R}" y1="${f(y)}" y2="${f(y)}" stroke="${ref.color}" stroke-opacity=".32" stroke-dasharray="4 5"/><text x="${W-R+10}" y="${f(textY)}" fill="${ref.color}" font-size="11">${ref.label} ${compact(mode==='percent'?value(ref.n):ref.n)}${mode==='percent'?'%':''}</text>`}
 svg+=`<g clip-path="url(#priceClip)">`;
 for(const seg of m.segments){const path=seg.map((r,i)=>(i?'L':'M')+f(X(r.time))+' '+f(Y(r[metric]))).join(' ');if(seg.length>1)svg+=`<path d="${path} L${f(X(seg.at(-1).time))} ${PB} L${f(X(seg[0].time))} ${PB} Z" fill="url(#priceFill)"/>`;svg+=`<path d="${path}" fill="none" stroke="#f0cb65" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;for(const r of seg)svg+=`<circle cx="${f(X(r.time))}" cy="${f(Y(r[metric]))}" r="${m.valid.length>300?1.5:2.5}" fill="#f0cb65" stroke="#17202c" stroke-width=".8"/>`}
 svg+='</g>';for(const r of m.outliers)svg+=`<path d="M${f(X(r.time))} ${T+3} l-4 8 h8 Z" fill="#ff9a70"><title>高價樣本 ${esc(date(r.time))}：${fmt(r[metric])}</title></path>`;
 svg+=`<text x="${L}" y="17" fill="#dce8f4" font-size="12" font-weight="600">${metricNames[metric]}${mode==='percent'?' · 漲跌幅':''}</text><text x="${W-R}" y="17" text-anchor="end" fill="#b9c2cb" font-size="10">${mobile?'':esc(name(focusItem))+' · '}+${variant}</text><line x1="${L}" x2="${W-R}" y1="259" y2="259" stroke="#7896bb30"/><text x="${L}" y="278" fill="#94cfe5" font-size="11">成交量 · ${focus?.source==='q7'?'每小時記錄':'來源快照'}</text><text x="${W-R}" y="278" text-anchor="end" fill="#b9c2cb" font-size="10">${sqrt?'√ 平方根壓縮':'線性量軸'}${focus?.source==='q7'?'':' · 備援快照不累加'}</text>`;
 for(let i=0;i<3;i++){const ratio=i/2,y=VB-ratio*(VB-VT),n=m.volumeMax*(sqrt?ratio*ratio:ratio);svg+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="#7896bb25" stroke-dasharray="3 5"/><text x="${W-R+10}" y="${y+4}" fill="#b9c2cb" font-size="10">${compact(n)}</text>`}
 m.rows.forEach((r,i)=>{if(!window.MOOKET_CHART.volume(r.v))return;const gap=Math.min(i?X(r.time)-X(m.rows[i-1].time):12,i<m.rows.length-1?X(m.rows[i+1].time)-X(r.time):12),width=Math.max(.5,Math.min(12,gap*.65)),h=vr(r.v)*(VB-VT);svg+=`<rect x="${f(X(r.time)-width/2)}" y="${f(VB-h)}" width="${f(width)}" height="${f(h)}" fill="#83c9e7" fill-opacity="${.35+.5*vr(r.v)}" rx="1"/>`});
 const ticks=mobile?3:5;for(let i=0;i<=ticks;i++){let t=start+(end-start)*i/ticks,label=days>0&&days<=1?new Date(t*1000).toLocaleTimeString('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}):date(t,true);svg+=`<text x="${f(X(t))}" y="383" text-anchor="${i===0?'start':i===ticks?'end':'middle'}" fill="#b9c2cb" font-size="11">${label}</text>`}
 svg+=`<line id="detailCross" x1="-10" x2="-10" y1="${T}" y2="${VB}" stroke="#dce9f4" stroke-dasharray="3 3" visibility="hidden"/><circle id="detailDot" r="4" fill="#f0cb65" stroke="#f9f4d6" visibility="hidden"/><rect id="detailHover" x="${L}" y="${T}" width="${PW}" height="${VB-T}" fill="transparent"/>`;
 host.innerHTML=`<svg id="detailSvg" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${esc(name(focusItem))}價格與成交量時間軸。左右方向鍵切換樣本，明細見下方表格。"><title>價格與成交量共用時間軸；價格缺漏或超過 48 小時斷線。</title>${svg}</svg>`;
 let active=m.rows.length-1;detailActivate=index=>{active=Math.max(0,Math.min(m.rows.length-1,index));const r=m.rows[active],x=X(r.time);$('#detailCross').setAttribute('x1',x);$('#detailCross').setAttribute('x2',x);$('#detailCross').setAttribute('visibility','visible');const point=$('#detailDot'),show=valid(r[metric])&&r[metric]<=m.cap;point.setAttribute('visibility',show?'visible':'hidden');if(show){point.setAttribute('cx',x);point.setAttribute('cy',Y(r[metric]))}$('#detailReadout').innerHTML=`<strong>${esc(date(r.time))}</strong><span>${metricNames[metric]} <b class="gold">${fmt(r[metric])}</b>${valid(r[metric])&&mode==='percent'?' ('+value(r[metric]).toFixed(2)+'%)':''}</span><span>成交量 <b class="blue">${window.MOOKET_CHART.volume(r.v)?r.v.toLocaleString('zh-TW'):'—'}</b></span><small>第 ${active+1} / ${m.rows.length} 筆${r[metric]>m.cap?' · 高價超出聚焦軸':''}</small>`};
 const nearest=e=>{const svgEl=$('#detailSvg'),rect=svgEl.getBoundingClientRect();const scale=Math.min(rect.width/W,rect.height/H),left=rect.left+(rect.width-W*scale)/2;let t=start+((e.clientX-left)/scale-L)/PW*(end-start),idx=0;for(let i=1;i<m.rows.length;i++)if(Math.abs(m.rows[i].time-t)<Math.abs(m.rows[idx].time-t))idx=i;detailActivate(idx)};
 bindChartPointer($('#detailHover'),nearest);$('#detailSvg').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();detailActivate(e.key==='Home'?0:e.key==='End'?m.rows.length-1:active+(e.key==='ArrowRight'?1:-1))}};detailActivate(active);
}
function renderTradeStats(){
 if(chartStyle==='compare'){$('#tradeStats').innerHTML='';return}
 const period=days===.5?'12h':days===1?'24 小時':(days||365)+' 天',all=view.filter(x=>x.id===focusItem);
 if(!all.length){$('#tradeStats').innerHTML='';return}
 const vol=s=>s?.total===null||s?.total===undefined?'資料不足':s.total.toLocaleString('zh-TW');
 const quality=s=>!s||s.source!=='q7'?'備援快照 · 不計算成交量加總':`${s.covered} / ${s.expected} 小時${s.complete?' · 完整':' · 資料未完整，僅計已記錄量'}`;
 const heading=`<div class="tradeStatsHeading"><strong>${period} 成交統計</strong><span>截至 ${date(historyEnd||timestamp)} · 台北時間</span></div>`;
 const note='<p class="tradeStatsNote">高低值採有成交的記錄之成交均價，非逐筆成交極值；Q7 為每小時記錄，備援資料可能已彙整。成交量不隨買價／賣價類型切換。</p>';
 const x=all[0],s=x.stats;
 $('#tradeStats').innerHTML=heading+`<div class="tradeStatCards"><div><span>時段最高成交均價</span><strong class="gold">${fmt(s?.high)}</strong><small>有效成交記錄的最高 p</small></div><div><span>時段最低成交均價</span><strong class="green">${fmt(s?.low)}</strong><small>有效成交記錄的最低 p</small></div><div><span>${s?.complete?'時段成交量':'已記錄成交量'}</span><strong class="blue">${vol(s)}</strong><small>${quality(s)}</small></div></div>`+note;
}

// Horizontal drags explore prices; vertical gestures scroll the page.
function bindChartPointer(zone,select){
 let touch=null;
 zone.onpointerdown=e=>{if(e.pointerType==='touch'){touch={id:e.pointerId,x:e.clientX,y:e.clientY,gesture:null};return}select(e)};
 zone.onpointermove=e=>{
  if(e.pointerType!=='touch'){select(e);return}
  if(!touch||e.pointerId!==touch.id)return;
  const dx=Math.abs(e.clientX-touch.x),dy=Math.abs(e.clientY-touch.y);
  if(!touch.gesture&&Math.max(dx,dy)>6)touch.gesture=dx>dy?'horizontal':'vertical';
  if(touch.gesture==='horizontal')select(e);
 };
 zone.onpointerup=e=>{if(e.pointerType!=='touch')return;const t=touch;touch=null;if(t&&t.id===e.pointerId&&t.gesture!=='vertical')select(e)};
 zone.onpointercancel=()=>{touch=null};zone.onpointerleave=()=>{touch=null};
}
if(typeof window.addEventListener==='function'){
 let chartResizeTimer;window.addEventListener('resize',()=>{clearTimeout(chartResizeTimer);chartResizeTimer=setTimeout(()=>{if(view.length)draw()},150)});
}
