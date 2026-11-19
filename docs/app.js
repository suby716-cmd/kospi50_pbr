import {sectors,nodes,benchmarks,valid,normalize,sample,stats,ranking,decision,paired,correlations} from './model.js';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,d=1)=>valid(v)?v.toLocaleString('ko-KR',{maximumFractionDigits:d}):'—';
const pct=v=>valid(v)?(v>0?'+':'')+number(v)+'%':'—';
const ret=v=>'<span class="'+(v>0?'pos':v<0?'neg':'')+'">'+pct(v)+'</span>';
const panel=(title,content)=>'<section class="panel wide"><h2>'+title+'</h2>'+content+'</section>';
const table=(heads,rows)=>'<div class="table-wrap"><table><thead><tr>'+heads.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const cards=items=>'<div class="grid">'+items.map(([label,value,detail])=>'<div class="panel"><small>'+label+'</small><div class="big">'+value+'</div><small>'+detail+'</small></div>').join('')+'</div>';
const labels={overview:['시장 개요','미국·한국 주식의 장기 사이클과 글로벌 자금 흐름을 살펴봅니다.'],sectors:['섹터 랭킹','시장별 13개 섹터에서 품질 기준을 통과한 상위 5개 종목을 확인합니다.'],cycle:['장기 사이클','밸류에이션과 추세를 바탕으로 분할매집·보유·분할매도 조건을 점검합니다.'],rotation:['글로벌 자금순환','AI·반도체, 채권·현금, 미국·한국 주식, 코인, 부동산의 자금 흐름을 검증합니다.'],compare:['자산 비교','주식 대비 금·구리·코인 비율과 수익률 상관관계를 비교합니다.'],watch:['관심종목','체크한 주식을 시장별로 모아 확인합니다.'],crypto:['코인 컴퍼스','기존 MASTER MARKET COMPASS 코인 도구입니다.'],korea:['KOSPI 50 원본','첨부하신 kospi50_pbr의 시세 및 종목 화면입니다.'],settings:['데이터 설정','Worker와 데이터 스냅샷을 연결하고 계산 기준을 확인합니다.']};
let data=sample(),demo=true,market='US',sector=0,assetId='NVDA',days=90,indicator='GOLD',coin='BTC',chartMode='ratio',view='overview',status='',quote=null;
let watched=new Set(read('mmc-watch',[])),settings=read('mmc-settings',{feed:'',kr:''});
const candidates=(m=market,s=sector)=>data.assets.filter(a=>a.market===m&&a.sector===s);
const asset=()=>candidates().find(x=>x.id===assetId);
const series=id=>data.series[id]??[];
const stale=s=>!s.date||!demo&&(Date.now()-Date.parse(s.date)>7*86400000);
const score=x=>decision(x,stats(series(x?.id),days),stale(stats(series(x?.id),days)));
const name=a=>esc(a?.name??a?.id??'자료 없음');
const option=(v,text)=>'<option value="'+esc(v)+'">'+esc(text)+'</option>';
const watchButton=a=>'<label><input type="checkbox" data-watch="'+esc(a.market+'|'+a.id)+'" '+(watched.has(a.market+'|'+a.id)?'checked':'')+' aria-label="'+name(a)+' 관심종목"> ☆</label>';
function selectedRows(rows){if(!rows.length)return [];const limit=Date.parse(rows.at(-1)[0])-days*86400000;return rows.filter(([d])=>Date.parse(d)>=limit);}
function draw(lines,percent=false){
 const canvas=$('.chart');if(!canvas)return;
 const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height,r=devicePixelRatio;
 if(!w)return;
 canvas.width=w*r;canvas.height=h*r;
 const ctx=canvas.getContext('2d');ctx.scale(r,r);ctx.font='12px system-ui';ctx.lineWidth=1;
 const rows=lines.flatMap(x=>x[0]),points=rows.filter(x=>valid(x[1])),left=51,top=20,bottom=h-35,right=w-17;
 if(points.length<2){ctx.fillStyle='#52647e';ctx.fillText('표시할 데이터가 부족합니다.',15,h/2);return;}
 const lo=percent?-1:Math.min(...points.map(x=>x[1])),hi=percent?1:Math.max(...points.map(x=>x[1]));
 const first=Math.min(...rows.map(x=>Date.parse(x[0]))),last=Math.max(...rows.map(x=>Date.parse(x[0])));
 const x=d=>left+(Date.parse(d)-first)/(last-first||1)*(right-left);
 const y=v=>bottom-(v-lo)/(hi-lo||1)*(bottom-top);
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,yy=bottom-(bottom-top)*i/4;ctx.strokeStyle='#e1e9f4';ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();ctx.fillStyle='#52647e';ctx.fillText(number(v,2),3,yy+4);}
 ctx.fillText(new Date(first).toISOString().slice(0,10),left,bottom+21);ctx.fillText(new Date(last).toISOString().slice(0,10),Math.max(left,right-74),bottom+21);
 for(const [points,color] of lines){let open=false;ctx.lineWidth=2.4;ctx.strokeStyle=color;ctx.beginPath();for(const [d,v] of points){if(!valid(v)){open=false;continue;}if(open)ctx.lineTo(x(d),y(v));else ctx.moveTo(x(d),y(v));open=true;}ctx.stroke();}
}
const canvas='<canvas class="chart" role="img" aria-label="선택 범위 시계열 차트"></canvas>';
const rebased=rows=>{const v=rows[0]?.[1];return rows.map(([d,c])=>[d,c/v*100]);};
function stockRows(rows){
 return table(['순위','종목','ROE','기간 수익률','시장 대비','사이클','관심'],rows.map(([a,i])=>{const s=stats(series(a.id),days),b=stats(series(benchmarks[a.market]),days);return [i??'—','<button data-stock="'+esc(a.id)+'" data-sector="'+a.sector+'">'+name(a)+' <small>'+esc(a.id)+'</small></button>',valid(a.roe)?number(a.roe)+'%':'—',ret(s.ret),ret(valid(s.ret)&&valid(b.ret)&&s.date===b.date?s.ret-b.ret:null),esc(score(a)),watchButton(a)];}));
}
const flow=(i,type)=>data.flows.find(x=>x.node===i&&x.type===type&&x.days===days&&valid(x.value)&&typeof x.source==='string'&&x.source.trim()&&typeof x.asOf==='string'&&x.asOf.slice(0,10)===data.asOf.slice(0,10)&&typeof x.unit==='string');
const flowText=f=>f?'<span class="'+(f.type==='netFlow'?(f.value<0?'neg':'pos'):'')+'">'+number(f.value)+' '+esc(f.unit)+'</span>':'—';
const proxies=['SOXX','TLT','SPY','KOSPI','BTC_US','VNQ'];
const instruments=['반도체 ETF 순설정','채권·현금성 펀드 순유입','미국 주식형 펀드 순유입','한국 주식형 펀드 순유입','BTC·ETH 현물 ETF 순유입','상장 리츠 ETF 순설정'];
function render(){
 if(!Object.hasOwn(labels,view))view='overview';
 const [title,desc]=labels[view];
 $('#crumb').textContent=title;
 $('#mode').textContent=demo?'합성 데모 · 실측 아님':'연결 데이터 · '+data.asOf.slice(0,10);
 $('#heading').innerHTML='<span class="eyebrow">'+(view==='rotation'?'GLOBAL CAPITAL ROTATION ENGINE':'MASTER MARKET COMPASS')+'</span><h1>'+title+'</h1><p>'+desc+'</p>';
 $('#filters').hidden=['crypto','korea','settings'].includes(view);
 document.querySelectorAll('nav [data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 document.querySelectorAll('[data-market]').forEach(b=>b.classList.toggle('active',b.dataset.market===market));
 $('#sector').innerHTML=sectors.map(([v],i)=>option(i,v)).join('');$('#sector').value=sector;
 const list=candidates();if(!list.some(x=>x.id===assetId))assetId=ranking(data.assets,market,sector)[0]?.id??list[0]?.id??'';
 $('#asset').innerHTML=list.map(x=>option(x.id,(x.name??x.id)+' · '+x.id)).join('')||option('','자료 없음');$('#asset').value=assetId;
 const a=asset(),s=stats(series(assetId),days),b=stats(series(benchmarks[market]),days);
 const quality=demo?'합성':stale(s)?'낮음 · 가격 지연 또는 결측':data.seriesMeta?.[assetId]?.verified===true?'제공처 검증 표기':'미검증 · 출처 확인 필요';
 let body='<div class="note">'+(demo?'합성 시계열과 예시 후보입니다. 날짜와 수치는 화면 검증용입니다.':'출처 '+esc(data.source)+' · 기준일 '+esc(data.asOf)+' · 신뢰도 '+quality+(stale(s)?' · 선택 종목 가격 7일 초과 또는 결측':' · 선택 종목 날짜 '+esc(s.date)))+'</div>',chart=null;
 if(view==='overview'){
  body+=cards([['시장 추세',esc(b.trend??'자료 부족'),benchmarks[market]+' · 50/200일 이동평균'],['시장 수익률',ret(b.ret),days+'일 · '+esc(b.date??'기준일 없음')],['선택 종목',name(a),esc(s.date??'가격 결측')],['장기 투자 조건',esc(score(a)),'규칙 기반 점검']]);
  body+='<div class="subgrid"><section class="panel"><h2>'+name(a)+' · 시장 비교</h2><small><span class="link">●</span> '+name(a)+' &nbsp; <span class="pos">●</span> '+benchmarks[market]+' · 기간 시작 100</small>'+canvas+'</section><section class="panel"><h2>자금순환 요약</h2>'+nodes.map((n,i)=>'<p class="split"><span>'+n+'</span><strong>'+flowText(flow(i,'netFlow'))+'</strong></p>').join('')+'<p><a class="link" href="#rotation">자금순환 상세</a></p></section></div>';
  const common=selectedRows(paired(series(assetId),series(benchmarks[market])));
  chart=[[rebased(common.map(([d,v])=>[d,v])),'#2457d6'],[rebased(common.map(([d,_,v])=>[d,v])),'#0e986f']];
  body+=panel('선택 섹터 상위 종목',stockRows(ranking(data.assets,market,sector).map((a,i)=>[a,i+1])));
 }
 if(view==='sectors'){
  body+=panel('13개 섹터',table(['섹터','편입 종목','상위 종목 평균 수익률','시장 대비'],sectors.map(([label],i)=>{const top=ranking(data.assets,market,i),rss=top.map(a=>stats(series(a.id),days));const vals=rss.map(r=>r.ret).filter(valid);const avg=top.length&&vals.length===top.length&&rss.every(r=>r.date===b.date)?vals.reduce((sum,x)=>sum+x,0)/vals.length:null;return ['<button data-pick="'+i+'">'+label+'</button>',top.length+'/5',ret(avg),ret(valid(avg)&&valid(b.ret)?avg-b.ret:null)];})));
  const top=ranking(data.assets,market,sector);
  const prior=data.priorRanks?.[market]?.[sector],ids=top.map(x=>x.id);
  const change=Array.isArray(prior)&&top.length?'편입 '+esc(ids.filter(x=>!prior.includes(x)).join(', ')||'없음')+' · 제외 '+esc(prior.filter(x=>!ids.includes(x)).join(', ')||'없음'):'편입·제외 비교 자료 부족';
  body+=panel(sectors[sector][0]+' · 상위 5개','<p class="muted">'+change+'</p>'+stockRows(top.map((a,i)=>[a,i+1])));
 }
 if(view==='cycle'){
  body+=cards([['판정',esc(score(a)),name(a)],['PBR 5년 백분위',valid(a?.pbrPercentile)?number(a.pbrPercentile)+'%':'—','낮을수록 과거 대비 낮은 밸류에이션'],['252거래일 고점 대비',ret(s.dd),'조정 종가'],['종목 추세',esc(s.trend??'자료 부족'),'50/200일 및 200일 기울기']]);
  body+=panel('장기 투자 체크리스트',table(['지표','현재','판정 기준'],[['분할매집','PBR '+number(a?.pbrPercentile)+' 백분위 · 낙폭 '+pct(s.dd),'PBR 하위 25% · 고점 대비 25% 이상 하락 · ROE와 FCF 양수'],['상승·하락 확인',esc(s.trend??'자료 부족'),'종가·50일선·200일선 배열과 200일선 20거래일 변화 방향 일치'],['과열 1차·2차','RSI '+number(s.rsi)+' · 200일 괴리 '+pct(s.gap),'RSI 70·75 이상과 200일선 괴리 +20%·+30% 이상'],['시장 대비',ret(valid(b.ret)&&valid(s.ret)&&b.date===s.date?s.ret-b.ret:null),'동일 기간 수익률 차이 (%p)']]));
  body+=panel('선택 종목 · 조정 종가',canvas);chart=[[selectedRows(series(assetId)),'#2457d6']];
  if(market==='KR')body+=panel('한국주식 Worker 시세','<button id="quote">시세·기존 분석 조회</button><p id="quote-result">'+esc(quote?.id===assetId?quote.text:'네이버 시세 및 기존 PBR·PER 분석')+'</p>');
 }
 if(view==='rotation'){
  const transfers=demo?[]:data.transfers.filter(t=>t.days===days&&t.asOf?.slice?.(0,10)===data.asOf.slice(0,10)&&/^https:\/\//.test(t.evidence??'')&&t.from!==t.to&&nodes[t.from]&&nodes[t.to]&&valid(t.value)&&t.value>0&&typeof t.unit==='string'&&t.unit.trim());
  body+=cards([['관찰 시장','6개','코인과 부동산 포함'],['순유입 관측',nodes.filter((_,i)=>flow(i,'netFlow')).length+'/6','선택 기간과 기준일 일치'],['이동 근거',transfers.length?transfers.length+'건':'자료 없음','출발지·도착지 직접 근거'],['판정',transfers.length?'근거 검토':'이동 미확인','동시 순유입은 참고 신호']]);
  body+=panel('시장별 가격과 자금흐름',table(['시장','가격 수익률','순유입 측정 항목','순유입·순설정','기준일 · 출처'],nodes.map((n,i)=>{const f=flow(i,'netFlow');return [n,ret(stats(series(proxies[i]),days).ret),instruments[i],flowText(f),f?esc(f.asOf+' · '+f.source):'결측'];})));
  body+=panel('부동산 · 실물 거래활동','<p>실물 거래대금 '+flowText(flow(5,'activity'))+' · '+esc(flow(5,'activity')?.source??'자료 없음')+'</p><p class="muted">거래대금은 거래 활동 지표입니다. 상장 리츠의 순설정과 별도로 해석합니다.</p>');
  body+=panel('시장 간 이동 가설',table(['가설 경로','출발 순유입','도착 순유입','판정'],[[0,1],[1,2],[2,3],[3,4],[4,5],[2,5]].map(([from,to])=>[nodes[from]+' → '+nodes[to],flowText(flow(from,'netFlow')),flowText(flow(to,'netFlow')),transfers.some(t=>t.from===from&&t.to===to)?'제출 근거 검토':flow(from,'netFlow')&&flow(to,'netFlow')?'동일 자금 이동 미확인':'결측'])));
  body+=panel('유동성 환경',table(['지표','관측값','기준일 · 출처'],[['WALCL','연준 총자산'],['DFII10','미국 10년 실질금리'],['HY_OAS','미국 하이일드 스프레드']].map(([key,label])=>{const m=data.macro?.[key];return [label,valid(m?.value)?number(m.value,2)+' '+esc(m.unit):'—',valid(m?.value)?esc((m.asOf??'날짜 결측')+' · '+(m.source??'출처 결측')):'결측'];})));
  body+=panel('시장 간 이동 근거',transfers.length?table(['출발','도착','금액','근거'],transfers.map(t=>[nodes[t.from],nodes[t.to],number(t.value)+' '+esc(t.unit),'<a class="link" target="_blank" rel="noopener" href="'+esc(t.evidence)+'">근거 열기</a>'])):'<p>동일 자금의 이동을 연결할 수 있는 공시 또는 추적 근거가 없습니다.</p>');
 }
 if(view==='compare'){
  const key=(indicator==='COIN'?coin:indicator)+'_'+market;
  const pairs=paired(series(assetId),series(key)),windows=[30,90,365],corr=windows.map(n=>correlations(pairs,n));
  const ratio=pairs.map(([d,x,y])=>[d,y/x]);
  body+='<div class="chips"><label>보조자산 <select id="indicator">'+[['GOLD','금'],['COPPER','구리'],['COIN','코인']].map(([k,v])=>option(k,v)).join('')+'</select></label><label>코인 <select id="coin">'+['BTC','ETH','ONDO','UNI','AAVE','TAO','NEAR','XRP','XLM','HBAR','AVAX'].map(x=>option(x,x)).join('')+'</select></label><label>표시 <select id="chartMode">'+option('ratio','보조자산/주식 비율')+option('corr','롤링 상관관계')+'</select></label></div>';
  body+=cards([...windows.map((n,i)=>[n+'일 상관',number(corr[i].at(-1)?.[1],2),'수익률 Pearson r']),['공통 관측일',number(pairs.length,0),esc(pairs.at(-1)?.[0]??'결측')]]);
  body+=panel(esc(key.replace(/_(US|KR)$/,''))+' / '+name(a),'<small>'+(chartMode==='ratio'?'비율 · 표시 시작일 100':'<span class="link">●</span> 30일 &nbsp; <span class="pos">●</span> 90일 &nbsp; <span class="neg">●</span> 365일')+'</small>'+canvas+'<p class="muted">동일 통화·공통 날짜의 수익률로 계산합니다. 전체 기간과 최소 관측치가 확보될 때 상관계수를 표시합니다.</p>');
  chart=chartMode==='ratio'?[[rebased(selectedRows(ratio)),'#2457d6']]:corr.map((x,i)=>[selectedRows(x),['#2457d6','#0e986f','#ba3553'][i]]);
 }
 if(view==='watch'){
  const rows=data.assets.filter(a=>a.market===market&&watched.has(a.market+'|'+a.id));
  const missing=[...watched].filter(k=>k.startsWith(market+'|')&&!rows.some(a=>k===market+'|'+a.id));
  body+=panel('관심종목 · '+rows.length+'개',(rows.length?stockRows(rows.map(a=>[a])):'<p>섹터 랭킹에서 관심 체크를 하면 여기에 표시됩니다.</p>')+ (missing.length?'<p>현재 데이터에 없는 관심종목 '+missing.map(x=>esc(x.split('|')[1])).join(', ')+'</p>':''));
 }
 if(view==='crypto')body='<p><a class="link" href="https://suby716-cmd.github.io/btc-alt-scalper-v7/" target="_blank" rel="noopener">기존 배포 사이트 열기</a></p><iframe class="legacy" title="기존 코인 컴퍼스" src="legacy/crypto.html"></iframe>';
 if(view==='korea')body='<iframe class="legacy" title="첨부 한국주식 화면" src="legacy/korea.html"></iframe>';
 if(view==='settings')body=settingsView();
 $('#body').innerHTML=body;
 if(view==='compare'){$('#indicator').value=indicator;$('#coin').value=coin;$('#chartMode').value=chartMode;}
 lastChart=chart?()=>draw(chart,view==='compare'&&chartMode==='corr'):null;
 lastChart?.();
}
let lastChart=null;
const links={
 buffett:'https://www.berkshirehathaway.com/letters/2023ltr.pdf',
 druck:'https://www.fullertreacymoney.com/system/data/files/PDFs/2020/May/18th/Druckenmiller%20comments.pdf',
 blackrock:'https://www.blackrock.com/us/financial-professionals/products/256101/ishares-msci-usa-quality-factor-etf-qual',
 jpm:'https://am.jpmorgan.com/us/en/asset-management/adv/insights/market-insights/guide-to-the-markets/',
 ici:'https://www.ici.org/research/stats/etf_flows',
 krx:'https://data.krx.co.kr/contents/MDC/MDI/outerLoader/index.cmd?screenId=MDCSTAT022'
};
const source=(k,label)=>'<a class="link" href="'+links[k]+'" target="_blank" rel="noopener">'+label+'</a>';
function settingsView(){
 return panel('시세와 분석 데이터 연결','<form class="form" id="connect"><label>통합 스냅샷 주소 <input name="feed" type="url" value="'+esc(settings.feed)+'" placeholder="https://…/market-snapshot.json"></label><label>한국주식 Cloudflare Worker 주소 <input name="kr" type="url" value="'+esc(settings.kr)+'" placeholder="https://…workers.dev"></label><label>또는 분석 스냅샷 JSON 불러오기 <input id="snapshot" type="file" accept=".json,application/json"></label><div class="chips"><button class="primary" type="submit">설정 저장 및 조회</button><button type="button" id="demo">합성 데모 열기</button><button type="button" id="sample-file">JSON 예제 받기</button></div></form><p id="connection-status" role="status">'+esc(status||'기존 코인 화면은 기존 Worker 주소를 사용합니다. 한국주식 Worker 주소는 첨부 파일에 포함되어 있지 않습니다.')+'</p>')+
 panel('투자 원칙과 앱 적용',table(['참고 자료','적용한 기준','후속 검증'],[
 [source('buffett','버핏 · Berkshire 연례서한'),'ROE·현금창출을 품질 기준으로 사용하고 가격 조건을 별도 점검','5년 영업이익과 FCF 지속성, 회계 품질 및 자본배분 검토'],
 [source('druck','드러켄밀러 · 뉴욕경제클럽 대담'),'채권·현금과 위험자산 수급을 함께 표시하고 추세를 확인','연준 자산·실질금리 및 신용스프레드의 동행 여부 검증'],
 [source('blackrock','BlackRock · iShares QUAL'),'섹터 내 ROE 45%·낮은 부채비율 25%·낮은 이익변동성 30%','업종별 레버리지와 회계 차이를 반영해 점수 민감도 점검'],
 [source('jpm','J.P. Morgan · Guide to the Markets'),'섹터 수익률과 시장 수익률을 비교하며 밸류에이션을 별도 표시','이익 전망·마진과 시장 폭을 추가해 추세 신호 교차검증']
 ])+'<p class="muted">가중치와 매집·과열 임계값은 이 앱의 초기 연구 규칙입니다. 금융·리츠는 규제자본·FFO에 맞춘 업종별 기준을 생산 적용 전에 검증해야 합니다.</p>')+
 panel('데이터 모델과 운영 흐름','<details open><summary>입력 스키마</summary><p><code>schemaVersion: 1, asOf, source, assets[], series{}, flows[], transfers[], priorRanks{}, macro{}, seriesMeta{}</code></p><p>종목은 <code>id, name, market, sector, roe, fcf, cap, turnover, debtEquity, earningsVolatility, pbrPercentile</code>를 사용합니다. 각 시계열은 <code>[YYYY-MM-DD, 조정종가]</code> 배열입니다. 금·구리·코인은 USD에 <code>_US</code>, KRW에 <code>_KR</code>를 붙이며 시장 지표에는 <code>SPY, KOSPI, SOXX, TLT, VNQ</code>를 사용합니다. 순위 비교는 이전 월말 스냅샷의 편입 ID를 시장·섹터별로 입력합니다.</p></details><details><summary>업데이트와 검증</summary><ol><li>미국·한국 종목 마스터와 당시 공개된 SEC·DART 재무, 일별 조정가격을 수집하고 공시일·통화·시간대·라이선스를 기록합니다.</li><li>매월 거래일 종료 후 직전 확정 스냅샷을 보존하고 재무·거래대금 누락, 중복 종목, 분할·배당·상장폐지 여부를 검증합니다. 섹터 내 품질 점수 상위 5개를 새로 계산합니다.</li><li>ETF 설정·환매는 발행사 및 '+source('ici','ICI')+'로 확인하고, '+source('krx','KRX 투자자별 순매수')+'는 주문 수급 참고값으로 저장합니다. 실물 부동산 거래는 계약일·취소분·신고 지연을 반영합니다.</li><li>날짜 기준으로 학습·검증을 분리하고, 상장폐지 종목과 편입 이력을 유지한 워크포워드에서 초과수익·최대낙폭·회전율·비용을 비교합니다. 원시 수치와 확정 여부를 함께 보존합니다.</li></ol></details><details><summary>Worker 및 Telegram 운영</summary><p>한국주식 Worker는 기존 /quotes, /index, /detail 경로를 사용합니다. 코인 화면의 알림은 기존 Cloudflare Worker에 연결됩니다. Telegram 발송은 기존 Worker에서 관리하며 배포 환경의 설정을 별도로 확인해야 합니다. 주식 알림은 Worker에서 확정 데이터의 단계 변화 또는 편입·제외를 확인한 후 종목·규칙 버전·기준일 단위 키로 중복을 막도록 설계합니다. 봇 토큰은 Worker 비밀 환경변수에 보관합니다.</p></details>');
}
const httpUrl=value=>{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw Error('인증정보가 없는 HTTPS 주소를 입력하세요.');return u;};
async function loadFeed(url){
 const res=await fetch(httpUrl(url),{signal:AbortSignal.timeout(12000),cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);
 const next=normalize(await res.json());data=next;demo=false;
}
async function quoteStock(){
 const id=assetId;
 if(!settings.kr){quote={id,text:'데이터 설정에서 한국주식 Worker 주소를 입력하세요.'};render();return;}
 try{
  const u=new URL('/detail',httpUrl(settings.kr));u.searchParams.set('code',id);
  $('#quote-result').textContent='조회 중…';
  const res=await fetch(u,{signal:AbortSignal.timeout(12000)});const j=await res.json();if(!res.ok||j.ok!==true||!valid(j.quote?.price))throw Error('시세 응답 없음');
  quote={id,text:'₩'+number(j.quote.price,0)+' · '+pct(j.quote.change)+' · PBR '+number(j.metrics?.pbr,2)+' · PER '+number(j.metrics?.per,2)+' · '+(j.quote.updatedAt??'시각 결측')+' · '+(j.source??'한국주식 Worker')};
 }catch(e){quote={id,text:'Worker 조회 실패 · '+e.message};}
 if(view==='cycle'&&assetId===id)render();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.view){location.hash=b.dataset.view;return;}
 if(b.dataset.market){market=b.dataset.market;render();}
 if(b.dataset.pick!==undefined){sector=Number(b.dataset.pick);render();}
 if(b.dataset.stock){assetId=b.dataset.stock;sector=Number(b.dataset.sector);if(view==='cycle')render();else location.hash='cycle';}
 if(b.id==='quote')quoteStock();
 if(b.id==='demo'){data=sample();demo=true;status='합성 데모가 열렸습니다.';render();}
 if(b.id==='sample-file'){const href=URL.createObjectURL(new Blob([JSON.stringify(sample())],{type:'application/json'}));const a=document.createElement('a');a.href=href;a.download='compass-example.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
});
document.addEventListener('change',async e=>{
 const el=e.target;
 if(el.dataset.watch){if(el.checked)watched.add(el.dataset.watch);else watched.delete(el.dataset.watch);save('mmc-watch',[...watched]);if(view==='watch')render();return;}
 if(el.id==='snapshot'&&el.files[0]){
  try{data=normalize(JSON.parse(await el.files[0].text()));demo=data.source==='합성 데모';status='JSON 적용 완료 · '+data.asOf;}catch(err){status='읽기 실패 · '+err.message;}
  render();return;
 }
 if(el.id==='period')days=+el.value;
 if(el.id==='sector')sector=+el.value;
 if(el.id==='asset')assetId=el.value;
 if(el.id==='indicator')indicator=el.value;
 if(el.id==='coin'){coin=el.value;indicator='COIN';}
 if(el.id==='chartMode')chartMode=el.value;
 if(['period','sector','asset','indicator','coin','chartMode'].includes(el.id))render();
});
document.addEventListener('submit',async e=>{
 if(e.target.id!=='connect')return;e.preventDefault();
 const form=new FormData(e.target);
 const next={feed:form.get('feed').trim(),kr:form.get('kr').trim()};
 try{
  for(const v of Object.values(next))if(v)httpUrl(v);
  settings=next;save('mmc-settings',settings);
  if(next.feed){$('#connection-status').textContent='스냅샷 조회 중…';await loadFeed(next.feed);demo=data.source==='합성 데모';}
  status=next.feed?'스냅샷 조회 완료 · '+data.asOf:'Worker 주소 설정을 저장했습니다.';
 }catch(err){status='연결 실패 · '+err.message;}
 if(view==='settings')render();
});
function route(){view=location.hash.slice(1)||'overview';render();}
window.addEventListener('hashchange',route);window.addEventListener('resize',()=>lastChart?.());
route();
if(settings.feed)loadFeed(settings.feed).then(()=>{demo=data.source==='합성 데모';render();}).catch(e=>{status='저장된 스냅샷 연결 실패 · '+e.message;});
