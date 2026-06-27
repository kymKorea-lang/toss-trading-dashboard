import { getOrders, getOrderDetail } from '../api/order.js';
import { setHTML, getVal, loading, empty, orderStatusBadge } from '../view/components.js';
export async function loadOrders() {
  const status=getVal('ord-status'),sym=getVal('ord-sym'),from=getVal('ord-from'),to=getVal('ord-to');
  setHTML('ord-result',loading());
  try {
    const d=await getOrders(status,sym,from,to); if(d.error){setHTML('ord-result','❌ '+d.error.message);return;}
    const orders=d.result?.orders||[];
    if(!orders.length){setHTML('ord-result',empty('주문 없음'));return;}
    setHTML('ord-result',`<div class="card"><table class="tbl"><thead><tr><th>심볼</th><th>방향</th><th>유형</th><th>수량</th><th>가격</th><th>상태</th><th>체결</th><th>시각</th></tr></thead><tbody>${orders.map(o=>`<tr><td><b>${o.symbol}</b></td><td><span class="badge ${o.side==='BUY'?'g':'r'}">${o.side}</span></td><td>${o.orderType}</td><td>${o.quantity}</td><td>${o.price??'-'}</td><td>${orderStatusBadge(o.status)}</td><td>${o.execution?.filledQuantity??'0'}</td><td style="font-size:10px">${(o.orderedAt||'').slice(5,16)}</td></tr>`).join('')}</tbody></table></div>`);
  } catch(e){setHTML('ord-result','❌ '+e.message);}
}
export async function loadOrderDetail() {
  const id=getVal('od-id'); if(!id){alert('주문 ID 입력');return;}
  setHTML('od-result',loading());
  try {
    const d=await getOrderDetail(id); if(d.error){setHTML('od-result','❌ '+d.error.message);return;}
    const o=d.result,ex=o.execution||{};
    setHTML('od-result',`심볼: <b>${o.symbol}</b> · 방향: ${o.side} · 상태: <b>${o.status}</b><br>수량: ${o.quantity} · 가격: ${o.price??'시장가'}<br>체결수량: ${ex.filledQuantity} · 평균체결가: ${ex.averageFilledPrice??'-'}<br>수수료: ${ex.commission??'-'} · 결제일: ${ex.settlementDate??'-'}`);
  } catch(e){setHTML('od-result','❌ '+e.message);}
}
