import { findStock, namesToSyms, LOCAL_STOCKS } from '../model/stocks.js';
import { getPrices, getPriceLimit, getCandles, getStocks, getWarnings, getExchangeRate, getKrCalendar, getUsCalendar } from '../api/market.js';
import { setCandles, setMode, render } from '../view/chart.js';
import { setHTML, getVal, loading, empty, fmt, session } from '../view/components.js';
import { initAutocomplete } from '../view/autocomplete.js';

export function initAutocompletes() {
  initAutocomplete('m-name','m-ac');
  initAutocomplete('pl-name','pl-ac');
  initAutocomplete('sw-name','sw-ac');
}
export async function loadChart() {
  const name=getVal('m-name'),interval=getVal('m-interval'),count=getVal('m-count')||100;
  if(!name){alert('종목명 입력');return;}
  const stock=findStock(name); if(!stock){alert('종목을 찾을 수 없습니다');return;}
  try {
    const d=await getCandles(stock.sym,interval,count);
    console.log('캔들 응답:', JSON.stringify(d));  // ← 이 줄 추가
    setCandles(d.result?.candles||[]);
    render('mainChart');
  }
  catch(e){alert(e.message);}
}

export function switchChartMode(mode){setMode(mode);render('mainChart');}
export async function loadPriceLimit() {
  const name=getVal('pl-name'); if(!name) return;
  const stock=findStock(name); if(!stock){setHTML('pl-result','종목을 찾을 수 없습니다');return;}
  setHTML('pl-result',loading());
  try {
    const d=await getPriceLimit(stock.sym); if(d.error){setHTML('pl-result','❌ '+d.error.message);return;}
    const r=d.result;
    setHTML('pl-result',`<b>${stock.name}</b><br>상한가: <span style="color:var(--r)">${r.upperLimitPrice??'없음'}</span><br>하한가: <span style="color:var(--g)">${r.lowerLimitPrice??'없음'}</span>`);
  } catch(e){setHTML('pl-result','❌ '+e.message);}
}
export async function loadPrices() {
  const names=getVal('mp-names'); if(!names) return;
  const syms=namesToSyms(names); if(!syms.length){setHTML('mp-result','종목을 찾을 수 없습니다');return;}
  setHTML('mp-result',loading());
  try {
    const d=await getPrices(syms.join(','));
    setHTML('mp-result',(d.result||[]).map(p=>{const s=LOCAL_STOCKS.find(x=>x.sym===p.symbol),c=p.currency==='USD'?'$':'₩';return `<b>${s?.name||p.symbol}</b>: ${c}${fmt(p.lastPrice)} (${p.currency})`;}).join('<br>'));
  } catch(e){setHTML('mp-result','❌ '+e.message);}
}
export async function loadStockInfo() {
  const names=getVal('si-names'); if(!names) return;
  const syms=namesToSyms(names); if(!syms.length){setHTML('si-result','종목을 찾을 수 없습니다');return;}
  setHTML('si-result',loading());
  try {
    const d=await getStocks(syms.join(','));
    setHTML('si-result',(d.result||[]).map(s=>`
      <div style="background:var(--s2);border:1px solid var(--br);border-radius:9px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-weight:700">${s.name} <span style="color:var(--t2);font-weight:400">(${s.symbol})</span></span>
          <span class="badge ${s.status==='ACTIVE'?'g':'r'}">${s.status}</span>
        </div>
        <div class="grid3" style="font-size:10px;gap:4px">
          <div><span style="color:var(--t2)">시장 </span>${s.market}</div>
          <div><span style="color:var(--t2)">유형 </span>${s.securityType}</div>
          <div><span style="color:var(--t2)">통화 </span>${s.currency}</div>
          <div><span style="color:var(--t2)">상장일 </span>${s.listDate||'-'}</div>
          <div><span style="color:var(--t2)">발행주식 </span>${Number(s.sharesOutstanding).toLocaleString()}</div>
          <div><span style="color:var(--t2)">보통주 </span>${s.isCommonShare?'✅':'❌'}</div>
        </div>
      </div>`).join(''));
  } catch(e){setHTML('si-result','❌ '+e.message);}
}
export async function loadWarnings() {
  const name=getVal('sw-name'); if(!name) return;
  const stock=findStock(name); if(!stock){setHTML('sw-result','종목을 찾을 수 없습니다');return;}
  setHTML('sw-result',loading());
  try {
    const d=await getWarnings(stock.sym);
    const items=d.result||[];
    if(!items.length){setHTML('sw-result','<div style="color:var(--g)">✅ 활성 유의사항 없음</div>');return;}
    const wMap={LIQUIDATION_TRADING:'정리매매',OVERHEATED:'단기과열',INVESTMENT_WARNING:'투자경고',INVESTMENT_RISK:'투자위험',VI_STATIC:'VI정적',VI_DYNAMIC:'VI동적',VI_STATIC_AND_DYNAMIC:'VI복합',STOCK_WARRANTS:'신주인수권'};
    setHTML('sw-result',items.map(w=>`<div style="background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.2);border-radius:8px;padding:8px;margin-bottom:6px"><span class="warn-tag">${wMap[w.warningType]||w.warningType}</span><span style="font-size:10px;color:var(--t2)"> ${w.exchange||''} ${w.startDate||''} ~ ${w.endDate||'진행중'}</span></div>`).join(''));
  } catch(e){setHTML('sw-result','❌ '+e.message);}
}
export async function loadExRate() {
  const base=getVal('er-base'),quote=getVal('er-quote');
  if(base===quote){setHTML('er-result','기준통화와 표시통화가 같을 수 없습니다');return;}
  setHTML('er-result',loading());
  try {
    const d=await getExchangeRate(base,quote); if(d.error){setHTML('er-result','❌ '+d.error.message);return;}
    const r=d.result,col=r.rateChangeType==='UP'?'var(--r)':'var(--g)',arrow=r.rateChangeType==='UP'?'▲':'▼';
    setHTML('er-result',`<b>${r.baseCurrency}→${r.quoteCurrency}</b><br>환율: <b>${r.rate}</b> <span style="color:${col}">${arrow}</span><br>기준율: ${r.midRate}`);
  } catch(e){setHTML('er-result','❌ '+e.message);}
}
export async function loadKrCal() {
  const date=getVal('kr-date');
  try {
    const d=await getKrCalendar(date); if(d.error){setHTML('kr-result','❌ '+d.error.message);return;}
    setHTML('kr-result',['today','previousBusinessDay','nextBusinessDay'].map(k=>{
      const day=d.result[k]; if(!day) return '';
      const label=k==='today'?'오늘':k==='previousBusinessDay'?'전일':'익일';
      const ig=day.integrated;
      return `<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--t2);margin-bottom:4px">${label} · ${day.date}</div>${ig?[ig.preMarket?session('프리마켓',ig.preMarket.startTime,ig.preMarket.endTime):'',ig.regularMarket?session('정규장',ig.regularMarket.startTime,ig.regularMarket.endTime):'',ig.afterMarket?session('애프터',ig.afterMarket.startTime,ig.afterMarket.endTime):''].join(''):'<div class="session closed"><div class="sess-dot"></div><span class="sess-name">휴장</span></div>'}</div>`;
    }).join(''));
  } catch(e){setHTML('kr-result','❌ '+e.message);}
}
export async function loadUsCal() {
  const date=getVal('us-date');
  try {
    const d=await getUsCalendar(date); if(d.error){setHTML('us-result','❌ '+d.error.message);return;}
    setHTML('us-result',['today','previousBusinessDay','nextBusinessDay'].map(k=>{
      const day=d.result[k]; if(!day) return '';
      const label=k==='today'?'오늘':k==='previousBusinessDay'?'전일':'익일';
      const has=day.dayMarket||day.preMarket||day.regularMarket||day.afterMarket;
      return `<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--t2);margin-bottom:4px">${label} · ${day.date}</div>${has?[day.dayMarket?session('데이마켓',day.dayMarket.startTime,day.dayMarket.endTime):'',day.preMarket?session('프리마켓',day.preMarket.startTime,day.preMarket.endTime):'',day.regularMarket?session('정규장',day.regularMarket.startTime,day.regularMarket.endTime):'',day.afterMarket?session('애프터',day.afterMarket.startTime,day.afterMarket.endTime):''].join(''):'<div class="session closed"><div class="sess-dot"></div><span class="sess-name">휴장</span></div>'}</div>`;
    }).join(''));
  } catch(e){setHTML('us-result','❌ '+e.message);}
}
