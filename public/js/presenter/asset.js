import { getHoldings, getBuyingPower, getSellable, getCommissions } from '../api/account.js';
import { setHTML, getVal, loading, empty, fmtM, fmt, stat } from '../view/components.js';
export async function loadHoldings(sym='') {
  setHTML('h-summary',loading('조회 중...')); setHTML('h-items','');
  try {
    const d=await getHoldings(sym); if(d.error){setHTML('h-items','❌ '+d.error.message);return;}
    const r=d.result, rate=parseFloat(r.profitLoss?.rate||0);
    setHTML('h-summary',`${stat('투자원금 KRW','₩'+fmtM(r.totalPurchaseAmount?.krw))}${stat('투자원금 USD',r.totalPurchaseAmount?.usd!=null?'$'+fmtM(r.totalPurchaseAmount.usd):'-')}${stat('평가금액 KRW','₩'+fmtM(r.marketValue?.amount?.krw))}${stat('손익률',(rate*100).toFixed(2)+'%',rate>=0?'g':'r')}`);
    const items=r.items||[];
    if(!items.length){setHTML('h-items',empty('보유 종목 없음'));return;}
    setHTML('h-items',items.map(i=>{const plRate=parseFloat(i.profitLoss?.rate||0),c=i.currency==='USD'?'$':'₩';return `<div class="holding-item"><div class="holding-top"><span style="font-weight:700">${i.name} <span style="color:var(--t2);font-size:11px">${i.symbol}</span></span><span class="badge ${plRate>=0?'g':'r'}">${(plRate*100).toFixed(2)}%</span></div><div class="holding-rows"><div class="holding-cell"><label>보유수량</label><span>${Number(i.quantity).toLocaleString()}주</span></div><div class="holding-cell"><label>현재가</label><span>${c}${fmt(i.lastPrice)}</span></div><div class="holding-cell"><label>평균단가</label><span>${c}${fmt(i.averagePurchasePrice)}</span></div><div class="holding-cell"><label>평가금액</label><span>${c}${fmtM(i.marketValue?.amount)}</span></div><div class="holding-cell"><label>손익</label><span style="color:${plRate>=0?'var(--g)':'var(--r)'}">${c}${fmtM(i.profitLoss?.amount)}</span></div><div class="holding-cell"><label>수수료</label><span style="color:var(--t2)">${c}${fmt(i.cost?.commission)}</span></div></div></div>`;}).join(''));
  } catch(e){setHTML('h-summary','');setHTML('h-items','❌ '+e.message);}
}
export async function loadBuyingPower() {
  const currency=getVal('bp-cur'); setHTML('bp-result','<span class="spin"></span>');
  try {
    const d=await getBuyingPower(currency); if(d.error){setHTML('bp-result','❌ '+d.error.message);return;}
    const sym=currency==='USD'?'$':'₩';
    setHTML('bp-result',`매수 가능 금액<br><b style="font-size:18px;color:var(--g)">${sym}${fmtM(d.result?.cashBuyingPower)}</b>`);
  } catch(e){setHTML('bp-result','❌ '+e.message);}
}
export async function loadSellable() {
  const sym=getVal('sq-sym'); if(!sym){alert('심볼 입력');return;}
  setHTML('sq-result','<span class="spin"></span>');
  try {
    const d=await getSellable(sym); if(d.error){setHTML('sq-result','❌ '+d.error.message);return;}
    setHTML('sq-result',`매도 가능 수량<br><b style="font-size:18px;color:var(--g)">${Number(d.result?.sellableQuantity).toLocaleString()}주</b>`);
  } catch(e){setHTML('sq-result','❌ '+e.message);}
}
export async function loadCommissions() {
  setHTML('comm-result','<span class="spin"></span>');
  try {
    const d=await getCommissions(); if(d.error){setHTML('comm-result','❌ '+d.error.message);return;}
    setHTML('comm-result',(d.result||[]).map(c=>`<b>${c.marketCountry==='KR'?'국내':'미국'}</b>: <b style="color:var(--acc)">${c.commissionRate}%</b> <span style="color:var(--t3);font-size:10px">(${c.startDate||'무기한'} ~ ${c.endDate||'무기한'})</span>`).join('<br>'));
  } catch(e){setHTML('comm-result','❌ '+e.message);}
}
