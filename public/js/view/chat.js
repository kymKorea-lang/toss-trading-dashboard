// 채팅 UI 렌더링 (View)
import { fmt, fmtM } from './components.js';

const WRAP_ID = 'chatMsgs';

function append(html) {
  const wrap = document.getElementById(WRAP_ID);
  const div = document.createElement('div');
  div.innerHTML = html;
  wrap.appendChild(div.firstElementChild);
  wrap.scrollTop = wrap.scrollHeight;
}

export function botMsg(html) {
  append(`
    <div class="msg bot">
      <div class="av">🤖</div>
      <div><div class="bbl">${html}</div></div>
    </div>`);
}

export function userMsg(html) {
  append(`
    <div class="msg user">
      <div class="av">👤</div>
      <div><div class="bbl">${html}</div></div>
    </div>`);
}

export function showTyping() {
  const wrap = document.getElementById(WRAP_ID);
  const div = document.createElement('div');
  div.className = 'msg bot t-msg';
  div.innerHTML = `
    <div class="av">🤖</div>
    <div><div class="bbl">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div></div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

export function hideTyping() {
  document.querySelectorAll('.t-msg').forEach(el => el.remove());
}

export function showConfirmCard(order, onConfirm, onCancel) {
  const isBuy = order.type === 'buy';
  const c = order.currency === 'USD' ? '$' : '₩';
  const total = order.price * order.qty;

  const wrap = document.getElementById(WRAP_ID);
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `
    <div class="av">🤖</div>
    <div>
      <div class="bbl">${isBuy ? '📗 매수' : '📕 매도'} 주문을 확인해주세요.</div>
      <div class="conf-card">
        <div class="conf-row"><span class="lbl">종목</span><span><b>${order.name}</b> (${order.sym})</span></div>
        <div class="conf-row"><span class="lbl">수량</span><span>${order.qty}주</span></div>
        <div class="conf-row"><span class="lbl">현재가</span><span>${c}${fmt(order.price)}</span></div>
        <div class="conf-row"><span class="lbl">예상금액</span>
          <span style="color:${isBuy ? 'var(--r)' : 'var(--g)'}">${c}${fmtM(total)}</span>
        </div>
        <div class="conf-btns">
          <button class="cbtn yes" id="confirmBtn">✅ ${isBuy ? '매수' : '매도'} 확정</button>
          <button class="cbtn no" id="cancelBtn">취소</button>
        </div>
      </div>
    </div>`;

  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;

  div.querySelector('#confirmBtn').addEventListener('click', () => {
    div.querySelectorAll('.cbtn').forEach(b => b.disabled = true);
    onConfirm();
  });
  div.querySelector('#cancelBtn').addEventListener('click', () => {
    div.querySelectorAll('.cbtn').forEach(b => b.disabled = true);
    onCancel();
  });
}
