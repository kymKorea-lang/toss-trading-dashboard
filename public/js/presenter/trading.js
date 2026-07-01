// 트레이딩 Presenter (채팅 로직)
import { state } from '../model/state.js';
import { findStockAsync, cacheStock } from '../model/stocks.js';
import { getPrices, getStocks, getKrCalendar, getUsCalendar } from '../api/market.js';
import { getBuyingPower, getSellable } from '../api/account.js';
import { createOrder } from '../api/order.js';
import { botMsg, userMsg, showTyping, hideTyping, showConfirmCard } from '../view/chat.js';
import { fmt, fmtM, krw } from '../view/components.js';

// ── 자연어 의도 파싱 ──────────────────────────────
function parseIntent(text) {
  const t = text.trim();

  if (/^(네|ㅇ+|응|예|yes|ok|오케|해줘|확인|ㅇㅋ|고|go|맞아)/i.test(t)) return { type: 'confirm' };
  if (/^(아니|ㄴ+|노|no|취소|안해|그만|싫어)/i.test(t))               return { type: 'cancel' };
  if (/(잔액|잔고|얼마있|balance|돈)/i.test(t))                        return { type: 'balance' };
  if (/(장|시장|개장|휴장|운영|trading|market)/i.test(t))              return { type: 'market' };

  // 현재가: "삼성전자 얼마야", "삼성전자 가격"
  const priceMatch = t.match(/(.+?)\s*(얼마|가격|시세|현재가|price)/i);
  if (priceMatch) return { type: 'price', stock: priceMatch[1].trim() };

  // 매수
  const buyMatch = t.match(/(.+?)\s+(\d+(?:\.\d+)?)\s*주\s*(매수|사줘|사|buy)?/i)
                || t.match(/(.+?)\s+(매수|사줘|사|buy)/i);
  if (buyMatch) return { type: 'buy', stock: buyMatch[1].trim(), qty: parseFloat(buyMatch[2]) || 1 };

  // 매도
const sellMatch = t.match(/(.+?)\s+(\d+(?:\.\d+)?)\s*주?\s*(매도|팔아|팔|sell)/i)
               || t.match(/(.+?)\s*(매도|팔아|팔|sell)/i);
  
  if (sellMatch) return { type: 'sell', stock: sellMatch[1].trim(), qty: parseFloat(sellMatch[2]) || 1 };

  return { type: 'unknown' };
}

// ── 장 운영 현황 ─────────────────────────────────
async function getMarketStatus() {
  try {
    const [kr, us] = await Promise.all([getKrCalendar(), getUsCalendar()]);
    const now = new Date();
    const lines = [];

    // 국내장
    const krToday = kr.result?.today?.integrated;
    const krSessions = krToday
      ? [
          { name: '프리마켓', s: krToday.preMarket },
          { name: '정규장',   s: krToday.regularMarket },
          { name: '애프터',   s: krToday.afterMarket },
        ]
      : [];
    const krOpen = krSessions.find(({ s }) => s && new Date(s.startTime) <= now && now <= new Date(s.endTime));
    lines.push(krOpen
      ? `🟢 <b>국내장</b> ${krOpen.name} 운영 중`
      : `🔴 <b>국내장</b> 휴장`);

    // 미국장
    const usToday = us.result?.today;
    const usSessions = usToday
      ? [
          { name: '데이마켓', s: usToday.dayMarket },
          { name: '프리마켓', s: usToday.preMarket },
          { name: '정규장',   s: usToday.regularMarket },
          { name: '애프터',   s: usToday.afterMarket },
        ]
      : [];
    const usOpen = usSessions.find(({ s }) => s && new Date(s.startTime) <= now && now <= new Date(s.endTime));
    lines.push(usOpen
      ? `🟢 <b>미국장</b> ${usOpen.name} 운영 중`
      : `🔴 <b>미국장</b> 휴장`);

    return lines.join('<br>');
  } catch {
    return '장 운영 정보를 가져올 수 없습니다.';
  }
}

// ── 주문 실행 ─────────────────────────────────────
async function executeOrder(order) {
  try {
    const body = {
      symbol: order.sym,
      side: order.type === 'buy' ? 'BUY' : 'SELL',
      orderType: 'MARKET',
      quantity: String(order.qty),
      confirmHighValueOrder: false,
    };
    const res = await createOrder(body);
    if (res.error) {
      botMsg(`❌ 주문 실패: ${res.error.message || res.error.code}`);
    } else {
      const emoji = order.type === 'buy' ? '🟢' : '🔴';
      botMsg(`${emoji} ${order.type === 'buy' ? '매수' : '매도'} 완료!<br><b>${order.name}</b> ${order.qty}주<br><small style="color:var(--t2)">주문 ID: ${res.result?.orderId?.slice(0, 20)}...</small>`);
    }
  } catch (e) {
    botMsg('❌ ' + e.message);
  }
}

// ── 메인 핸들러 ──────────────────────────────────
export async function handleChat(text) {
  if (!state.connected) {
    botMsg('먼저 🔑 API 설정을 완료해주세요.');
    return;
  }

  userMsg(text);
  const intent = parseIntent(text);

  // 확인 / 취소
  if (intent.type === 'confirm' && state.pendingOrder) {
    await executeOrder(state.pendingOrder);
    state.pendingOrder = null;
    return;
  }
  if (intent.type === 'cancel' && state.pendingOrder) {
    botMsg('주문을 취소했습니다.');
    state.pendingOrder = null;
    return;
  }

  // 잔액 조회
  if (intent.type === 'balance') {
    showTyping();
    try {
      const [krwRes, usdRes, market] = await Promise.all([
        getBuyingPower('KRW'),
        getBuyingPower('USD'),
        getMarketStatus(),
      ]);
      hideTyping();
      botMsg(`💰 <b>매수 가능 금액</b><br>KRW: <b>${krw(krwRes.result?.cashBuyingPower)}</b><br>USD: <b>$${fmtM(usdRes.result?.cashBuyingPower)}</b><br><br>📈 <b>장 운영 현황</b><br>${market}`);
    } catch (e) { hideTyping(); botMsg('❌ ' + e.message); }
    return;
  }

  // 장 운영
  if (intent.type === 'market') {
    showTyping();
    const market = await getMarketStatus();
    hideTyping();
    botMsg(`📈 <b>현재 장 운영 현황</b><br>${market}`);
    return;
  }

  // 현재가
  if (intent.type === 'price') {
    const stock = await findStockAsync(intent.stock);
    if (!stock) {
      botMsg(`"${intent.stock}" 종목을 찾지 못했습니다.<br><small style="color:var(--t2)">심볼 직접 입력 가능 (예: 018260, AAPL)</small>`);
      return;
    }
    showTyping();
    try {
      const d = await getPrices(stock.sym);
      hideTyping();
      const p = (d.result || [])[0];
      if (!p) { botMsg('시세 정보를 가져오지 못했습니다.'); return; }
      const c = p.currency === 'USD' ? '$' : '₩';
      botMsg(`📊 <b>${stock.name}</b> 현재가<br><b style="font-size:16px">${c}${fmt(p.lastPrice)}</b> (${p.currency})`);
    } catch (e) { hideTyping(); botMsg('❌ ' + e.message); }
    return;
  }

  // 매수 / 매도
  if (intent.type === 'buy' || intent.type === 'sell') {
    showTyping();
    const stock = await findStockAsync(intent.stock);
    if (!stock) {
      hideTyping();
      botMsg(`"${intent.stock}" 종목을 찾지 못했습니다.<br><br>💡 <b>두 가지 방법으로 시도해보세요:</b><br>① 심볼 직접 입력: <b>${intent.stock.toUpperCase()} 1주 ${intent.type === 'buy' ? '매수' : '매도'}</b><br>② 종목코드 입력: <b>005930 1주 매수</b> (6자리 숫자)<br><br>찾으시는 종목 심볼을 모르신다면 <a href="https://finance.naver.com" target="_blank" style="color:var(--acc)">네이버 금융</a>에서 확인해보세요.`);
      return;
    }

    try {
      const [priceRes, stockRes] = await Promise.all([
        getPrices(stock.sym),
        getStocks(stock.sym),
      ]);

      const p = (priceRes.result || [])[0];
      const info = (stockRes.result || [])[0];
      if (!p) throw new Error('시세 정보를 가져올 수 없습니다');

      const realName = info?.name || stock.name;
      cacheStock(intent.stock, { name: realName, sym: stock.sym, market: info?.market || stock.market });

      const price = parseFloat(p.lastPrice);
      const qty   = intent.qty || 1;
      const total = price * qty;
      const c     = p.currency === 'USD' ? '$' : '₩';

      if (intent.type === 'buy') {
        const bpRes = await getBuyingPower(p.currency);
        const avail = parseFloat(bpRes.result?.cashBuyingPower || 0);
        const market = await getMarketStatus();
        hideTyping();

        if (avail < total) {
          botMsg(`잔액 부족 😢<br>필요: <b>${c}${fmtM(total)}</b> / 가능: <b>${c}${fmtM(avail)}</b>`);
          return;
        }

        state.pendingOrder = { type: 'buy', sym: stock.sym, name: realName, qty, price, currency: p.currency };
        botMsg(`📈 장 운영 현황<br>${market}`);
        showConfirmCard(
          { ...state.pendingOrder, isMarket: true },
          async () => { await executeOrder(state.pendingOrder); state.pendingOrder = null; },
          () => { botMsg('주문을 취소했습니다.'); state.pendingOrder = null; }
        );

      } else {
        const sqRes  = await getSellable(stock.sym);
        const sellable = parseFloat(sqRes.result?.sellableQuantity || 0);
        const market = await getMarketStatus();
        hideTyping();

        if (sellable < qty) {
          botMsg(`보유 수량 부족 😢<br>요청: ${qty}주 / 매도 가능: ${sellable}주`);
          return;
        }

        state.pendingOrder = { type: 'sell', sym: stock.sym, name: realName, qty, price, currency: p.currency };
        botMsg(`📈 장 운영 현황<br>${market}`);
        showConfirmCard(
          { ...state.pendingOrder, isMarket: true },
          async () => { await executeOrder(state.pendingOrder); state.pendingOrder = null; },
          () => { botMsg('주문을 취소했습니다.'); state.pendingOrder = null; }
        );
      }
    } catch (e) { hideTyping(); botMsg('❌ ' + e.message); }
    return;
  }

  // unknown
  botMsg('💡 이렇게 입력해보세요<br>· <b>삼성전자 1주 매수</b><br>· <b>SK하이닉스 2주 팔아</b><br>· <b>삼성전자 얼마야?</b><br>· <b>잔액 알려줘</b><br>· <b>장 열려있어?</b>');
}
