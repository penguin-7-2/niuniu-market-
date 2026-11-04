'use strict';
// Each item has its own price axis. All slots share the selected time window.
function drawComparisonCharts(){
 const host=$('#chart'),end=historyEnd||timestamp||Date.now()/1000,start=end-(days||365)*86400;
 $('#unit').textContent=mode==='percent'?'各圖價格軸：漲跌幅 % · 各自首筆有效價格為基準':'各圖價格軸：金幣 · 個別刻度';
 const mobile=typeof window.matchMedia==='function'&&window.matchMedia('(max-width:670px)').matches;const W=mobile?440:640,H=252,L=mobile?46:57,R=mobile?88:108,T=26,B=210,PW=W-L-R,PH=B-T;
 const f=n=>Number(n).toFixed(2),X=t=>L+(t-start)/(end-start)*PW;
 const period=days>0&&days<=1?'hour':'day';
 const tick=t=>period==='hour'?new Date(t*1000).toLocaleTimeString('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}):date(t,true);
 const cards=[],slots=Math.max(1,Math.min(MAX_COMPARE,selected.length));
 for(let i=0;i<slots;i++){
  const x=view[i],id=x?.id,accent=colors[i];
  if(!id){cards.push(`<article class="compareCard compareVacant"><div class="compareHead"><span class="compareIndex">${String(i+1).padStart(2,'0')}</span><strong>選擇比較物品</strong></div><div class="compareEmpty">在市場清單按「＋」加入第 ${i+1} 項</div></article>`);continue}
  const m=window.MOOKET_CHART.model(x.rows,metric,false),s=m.stats;
  if(!s){cards.push(`<article class="compareCard"><div class="compareHead"><span class="compareIndex" style="color:${accent}">${String(i+1).padStart(2,'0')}</span>${icon(id)}<strong>${esc(name(id))}</strong><small>+${variant}</small></div><div class="compareEmpty">此期間沒有有效的${metricNames[metric]}樣本；可切換時段、報價或強化等級。</div></article>`);continue}
  const value=n=>mode==='percent'?(n/s.first[metric]-1)*100:n;
  const lo=value(s.min),hi=value(s.max),padding=Math.max((hi-lo)*.13,mode==='percent'?1:Math.abs(hi)*.015,mode==='percent'?.5:1),floor=mode==='percent'?lo-padding:Math.max(0,lo-padding),ceiling=hi+padding;
  const Y=n=>T+(ceiling-value(n))/(ceiling-floor)*PH;
  let svg=`<defs><linearGradient id="compareFill${i}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${accent}" stop-opacity=".21"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/></linearGradient><clipPath id="compareClip${i}"><rect x="${L}" y="${T}" width="${PW}" height="${PH}"/></clipPath></defs>`;
  const dayStart=Math.floor((start+28800)/86400)*86400-28800,count=Math.ceil((end-dayStart)/86400),step=count<=20?1:Math.ceil(count/20);
  for(let j=0;j<count;j+=step){const a=Math.max(start,dayStart+j*86400),b=Math.min(end,dayStart+(j+step)*86400);svg+=`<rect x="${f(X(a))}" y="${T}" width="${f(X(b)-X(a))}" height="${PH}" fill="${Math.floor(j/step)%2?'#91add00a':'#91add004'}"/>`}
  for(let j=0;j<4;j++){const n=ceiling-(ceiling-floor)*j/3,y=T+PH*j/3;svg+=`<line x1="${L}" x2="${W-R}" y1="${f(y)}" y2="${f(y)}" stroke="#7b96b326" stroke-dasharray="3 5"/><text x="${L-8}" y="${f(y+4)}" text-anchor="end" fill="#b9c2cb" font-size="10">${compact(n)}${mode==='percent'?'%':''}</text>`}
  let lastLabel=-100;for(const ref of [{n:s.max,label:'高',color:'#f0cb65'},{n:s.median,label:'中',color:'#efa75c'},{n:s.min,label:'低',color:'#b9dfa6'}]){const y=Y(ref.n),labelY=Math.max(y+4,lastLabel+14);lastLabel=labelY;svg+=`<line x1="${L}" x2="${W-R}" y1="${f(y)}" y2="${f(y)}" stroke="${ref.color}" stroke-opacity=".48" stroke-dasharray="4 5"/><text x="${W-R+8}" y="${f(labelY)}" fill="${ref.color}" font-size="11">${ref.label} ${compact(value(ref.n))}${mode==='percent'?'%':''}</text>`}
  svg+=`<g clip-path="url(#compareClip${i})">`;
  for(const segment of m.segments){const d=segment.map((r,j)=>(j?'L':'M')+f(X(r.time))+' '+f(Y(r[metric]))).join(' ');if(segment.length>1)svg+=`<path d="${d} L${f(X(segment.at(-1).time))} ${B} L${f(X(segment[0].time))} ${B} Z" fill="url(#compareFill${i})"/>`;svg+=`<path d="${d}" fill="none" stroke="${accent}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`;if(m.valid.length<=80)for(const r of segment)svg+=`<circle cx="${f(X(r.time))}" cy="${f(Y(r[metric]))}" r="2.4" fill="${accent}"/>`}
  svg+='</g>';
  const ticks=mobile?3:4;for(let j=0;j<=ticks;j++){const t=start+(end-start)*j/ticks;svg+=`<text x="${f(X(t))}" y="${H-13}" text-anchor="${j===0?'start':j===ticks?'end':'middle'}" fill="#b9c2cb" font-size="10">${esc(tick(t))}</text>`}
  svg+=`<line id="compareCross${i}" x1="-10" x2="-10" y1="${T}" y2="${B}" stroke="#dce9f4" stroke-dasharray="3 3" visibility="hidden"/><circle id="compareDot${i}" r="4" fill="${accent}" stroke="#e4eff4" visibility="hidden"/><rect data-compare-hover="${i}" x="${L}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  const delta=s.change===null?'—':(s.change>0?'+':'')+s.change.toFixed(2)+'%';
  cards.push(`<article class="compareCard"><div class="compareHead"><span class="compareIndex" style="color:${accent}">${String(i+1).padStart(2,'0')}</span>${icon(id)}<strong>${esc(name(id))}</strong><small>+${variant}</small></div><div class="compareSummary"><span>${metricNames[metric]} · ${s.count.toLocaleString('zh-TW')} 筆</span><b class="${s.change<0?'red':'green'}">${delta}</b></div><svg id="compareSvg${i}" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${esc(name(id))}${metricNames[metric]}走勢，低位、中位、高位。左右方向鍵切換樣本。"><title>價格折線與區間低、中、高位；缺漏超過 48 小時斷線。右側標籤是各圖自己的刻度。</title>${svg}</svg><div class="compareReadout" id="compareReadout${i}" aria-live="polite"></div></article>`);
 }
 host.innerHTML=`<div class="compareGrid">${cards.join('')}</div>`;
 for(let i=0;i<slots;i++){
  const x=view[i];if(!x)continue;const m=window.MOOKET_CHART.model(x.rows,metric,false),s=m.stats;if(!s)continue;
  const svg=$(`#compareSvg${i}`),zone=host.querySelector(`[data-compare-hover="${i}"]`),cross=$(`#compareCross${i}`),dot=$(`#compareDot${i}`),readout=$(`#compareReadout${i}`),rows=m.valid;
  const value=n=>mode==='percent'?(n/s.first[metric]-1)*100:n,lo=value(s.min),hi=value(s.max),pad=Math.max((hi-lo)*.13,mode==='percent'?1:Math.abs(hi)*.015,mode==='percent'?.5:1),floor=mode==='percent'?lo-pad:Math.max(0,lo-pad),ceiling=hi+pad;
  let active=rows.length-1;
  const activate=k=>{active=Math.max(0,Math.min(rows.length-1,k));const r=rows[active],px=X(r.time),py=T+(ceiling-value(r[metric]))/(ceiling-floor)*PH;cross.setAttribute('x1',px);cross.setAttribute('x2',px);cross.setAttribute('visibility','visible');dot.setAttribute('cx',px);dot.setAttribute('cy',py);dot.setAttribute('visibility','visible');readout.innerHTML=`<strong>${esc(date(r.time))}</strong><span>${metricNames[metric]} <b>${fmt(r[metric])}</b>${mode==='percent'?' · '+value(r[metric]).toFixed(2)+'%':''}</span><small>${active+1} / ${rows.length}</small>`};
  const nearest=e=>{const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/W,rect.height/H),left=rect.left+(rect.width-W*scale)/2,px=Math.max(L,Math.min(W-R,(e.clientX-left)/scale)),time=start+(px-L)/PW*(end-start);let a=0,b=rows.length;while(a<b){const mid=(a+b)>>1;if(rows[mid].time<time)a=mid+1;else b=mid}activate(a===0?0:a===rows.length?rows.length-1:Math.abs(rows[a].time-time)<Math.abs(rows[a-1].time-time)?a:a-1)};
  bindChartPointer(zone,nearest);svg.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();activate(e.key==='Home'?0:e.key==='End'?rows.length-1:active+(e.key==='ArrowRight'?1:-1))}};
  activate(active);
 }
}
