export const sectors=[
['AI·반도체','NVDA AMD AVGO TSM MU AMAT','005930 000660 042700 403870 058470 240810'],
['소프트웨어·클라우드','MSFT ORCL CRM NOW ADBE SNOW','035420 035720 012510 018260 053800 030520'],
['통신·미디어','GOOGL META NFLX DIS TMUS VZ','017670 030200 032640 035760 253450 352820'],
['경기소비재','AMZN TSLA HD MCD NKE LOW','005380 000270 161390 004990 139480 023530'],
['필수소비재','WMT COST PG KO PEP MDLZ','097950 004370 271560 033780 280360 003230'],
['금융·보험','JPM BAC BRK.B WFC GS MS','105560 055550 086790 316140 032830 005830'],
['헬스케어·바이오','LLY JNJ ABBV UNH MRK ABT','207940 068270 000100 128940 326030 145020'],
['산업재·방산','GE CAT RTX HON LMT UNP','012450 079550 064350 047810 010140 267250'],
['에너지','XOM CVX COP EOG SLB MPC','096770 010950 078930 267290 004090 078000'],
['소재·금속','LIN SHW FCX NUE ECL NEM','005490 010130 051910 009830 001120 120110'],
['유틸리티·전력','NEE SO DUK CEG AEP VST','015760 036460 034020 267260 010120 298040'],
['부동산·리츠','PLD AMT EQIX WELL SPG O','395400 330590 293940 348950 088260 451800'],
['배터리·전기화','ALB ENPH FSLR ON ETN FLNC','373220 006400 247540 086520 003670 361610']
];
export const names={NVDA:'엔비디아',AMD:'AMD',AVGO:'브로드컴',TSM:'TSMC ADR',MU:'마이크론',AMAT:'어플라이드 머티어리얼즈',MSFT:'마이크로소프트',GOOGL:'알파벳',META:'메타',AMZN:'아마존',TSLA:'테슬라','005930':'삼성전자','000660':'SK하이닉스','042700':'한미반도체','403870':'HPSP','058470':'리노공업','240810':'원익IPS','005380':'현대차','000270':'기아','035420':'NAVER','035720':'카카오','373220':'LG에너지솔루션','005490':'POSCO홀딩스','207940':'삼성바이오로직스','068270':'셀트리온'};
export const nodes=['AI·반도체','채권·현금','미국주식','한국주식','코인','부동산'];
export const benchmarks={US:'SPY',KR:'KOSPI'};
export const valid=n=>typeof n==='number'&&Number.isFinite(n);
const dateValid=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
export function normalize(payload){
 if(!payload||payload.schemaVersion!==1||typeof payload.asOf!=='string'||!dateValid(payload.asOf.slice(0,10))||typeof payload.source!=='string'||!payload.source.trim())throw Error('schemaVersion 1, asOf, source가 필요합니다.');
 const series=Object.create(null);
 for(const [id, rows] of Object.entries(payload.series??{})){
  if(!Array.isArray(rows))continue;
  const byDate=new Map();
  for(const row of rows){if(!Array.isArray(row))continue;const [date,close]=row;if(dateValid(date)&&valid(close)&&close>0&&date<=payload.asOf.slice(0,10))byDate.set(date,close);}
  series[id]=[...byDate].sort(([a],[b])=>a.localeCompare(b));
 }
 return {...payload,series,assets:Array.isArray(payload.assets)?payload.assets.filter(x=>x&&typeof x.id==='string'&&['US','KR'].includes(x.market)&&Number.isInteger(x.sector)&&x.sector>=0&&x.sector<13):[],flows:Array.isArray(payload.flows)?payload.flows.filter(Boolean):[],transfers:Array.isArray(payload.transfers)?payload.transfers.filter(Boolean):[]};
}
export function sample(){
 const assets=[],series={},asOf='2026-11-19';
 for(const market of ['US','KR']) sectors.forEach(([_,us,kr],sector)=>(market==='US'?us:kr).split(' ').forEach((id,i)=>assets.push({id,market,sector,name:names[id]??id,roe:8+((sector*7+i*4)%18),fcf:1+i,debtEquity:.4+i*.16,earningsVolatility:.08+i*.025,cap:90-i*11,pbr:1.1+i*.33,pbrPercentile:13+i*13,turnover:1000+i})));
 const keys=[...new Set([...assets.map(x=>x.id),'SPY','KOSPI','SOXX','TLT','VNQ','GOLD_US','GOLD_KR','COPPER_US','COPPER_KR',...['BTC','ETH','ONDO','UNI','AAVE','TAO','NEAR','XRP','XLM','HBAR','AVAX'].flatMap(x=>[x+'_US',x+'_KR'])])];
 keys.forEach((id,k)=>{let value=100+k/2;series[id]=[];for(let n=550;n>=0;n--){const ts=Date.parse(asOf)-n*86400000;const t=new Date(ts);if([0,6].includes(t.getUTCDay()))continue;const j=550-n;
 value*=1+.00055+Math.sin(j/17+k*.47)*.006+Math.sin(j/4+k)*.0035+Math.cos(j/57)*.0018;
 series[id].push([t.toISOString().slice(0,10),Number(value.toFixed(5))]);}});
 const priorRanks={US:{0:['NVDA','AMD','AVGO','TSM','AMAT']},KR:{0:['005930','000660','042700','403870','240810']}};
 return normalize({schemaVersion:1,source:'합성 데모',asOf,assets,series,priorRanks,flows:[
 {node:0,type:'netFlow',value:-710,unit:'USD mn'},{node:1,type:'netFlow',value:1140,unit:'USD mn'},{node:2,type:'netFlow',value:825,unit:'USD mn'},{node:3,type:'netFlow',value:510,unit:'USD mn'},{node:4,type:'netFlow',value:260,unit:'USD mn'},{node:5,type:'netFlow',value:-105,unit:'USD mn'},{node:5,type:'activity',value:2300,unit:'KRW 억'}
 ].map(x=>({...x,asOf,days:90,source:'합성 데모'}))});
}
const dateAt=(date,days)=>new Date(Date.parse(date)-days*86400000).toISOString().slice(0,10);
const sma=(a,n)=>a.length>=n?a.slice(-n).reduce((s,v)=>s+v,0)/n:null;
export function stats(rows,days){
 if(!rows?.length)return {};
 const values=rows.map(x=>x[1]),last=values.at(-1),date=rows.at(-1)[0];
 const cutoff=dateAt(date,days);
 const base=rows.findLast(([d])=>d<=cutoff&&d>=dateAt(cutoff,7));
 const tail=values.slice(-15);
 const delta=tail.slice(1).map((x,i)=>x-tail[i]);
 const gains=delta.reduce((s,x)=>s+Math.max(0,x),0),losses=delta.reduce((s,x)=>s+Math.max(0,-x),0);
 const m50=sma(values,50),m200=sma(values,200),old200=sma(values.slice(0,-20),200);
 const trend=m200===null||old200===null?'자료 부족':last>m50&&m50>m200&&m200>old200?'상승 확인':last<m50&&m50<m200&&m200<old200?'하락 확인':'전환 관찰';
 const peak=Math.max(...values.slice(-252));
 return {date,last,ret:base?(last/base[1]-1)*100:null,rsi:delta.length===14?(gains+losses?100*gains/(gains+losses):50):null,dd:values.length>=252?(last/peak-1)*100:null,gap:m200?(last/m200-1)*100:null,trend};
}
export function ranking(assets,market,sector){
 const eligible=assets.filter(x=>x.market===market&&x.sector===sector&&[x.roe,x.fcf,x.cap,x.turnover,x.debtEquity,x.earningsVolatility].every(valid)&&x.roe>0&&x.fcf>0&&x.cap>0&&x.turnover>0&&x.debtEquity>=0&&x.earningsVolatility>=0);
 const fields=[['roe',1,.45],['debtEquity',-1,.25],['earningsVolatility',-1,.30]];
 const ranks=new Map(eligible.map(a=>[a,fields.reduce((acc,[field,sign,weight])=>acc+weight*eligible.filter(b=>sign*(a[field]-b[field])>0).length,0)]));
 return eligible.sort((a,b)=>ranks.get(b)-ranks.get(a)||b.cap-a.cap||a.id.localeCompare(b.id)).slice(0,5);
}
export function decision(asset,s,stale){
 if(stale||!asset||![asset.pbrPercentile,asset.roe,asset.fcf,s.dd,s.rsi,s.gap].every(valid))return '판단 보류';
 if(s.rsi>=75&&s.gap>=30)return '2차 분할매도 검토';
 if(s.rsi>=70&&s.gap>=20)return '1차 분할매도 검토';
 if(asset.roe>0&&asset.fcf>0&&asset.pbrPercentile<=25&&s.dd<=-25)return '분할매집 검토';
 return '보유·관찰';
}
export function paired(stock,other){
 const lookup=new Map(other??[]);
 return (stock??[]).filter(([d])=>lookup.has(d)).map(([d,c])=>[d,c,lookup.get(d)]);
}
export function correlations(pairs,days){
 return pairs.map(([date],end)=>{
  const start=dateAt(date,days);
  if(pairs[0][0]>start)return [date,null];
  const x=[],y=[];
  for(let i=end;i>0&&pairs[i-1][0]>=start;i--){x.push(pairs[i][1]/pairs[i-1][1]-1);y.push(pairs[i][2]/pairs[i-1][2]-1);}
  if(x.length<Math.ceil(days*.5))return [date,null];
  const mx=sma(x,x.length),my=sma(y,y.length);
  let xx=0,yy=0,xy=0;
  x.forEach((v,i)=>{const a=v-mx,b=y[i]-my;xx+=a*a;yy+=b*b;xy+=a*b;});
  return [date,xx&&yy?xy/Math.sqrt(xx*yy):null];
 });
}
