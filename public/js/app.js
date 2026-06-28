// 앱 진입점 - 탭/모달 제어 및 이벤트 바인딩
import { connect, autoConnect, logout as authLogout } from './api/auth.js';
import { handleChat } from './presenter/trading.js';
import { initAutocompletes, loadChart, switchChartMode, loadPriceLimit, loadPrices, loadStockInfo, loadWarnings, loadExRate, loadKrCal, loadUsCal } from './presenter/market.js';
import { loadHoldings, loadBuyingPower, loadSellable, loadCommissions } from './presenter/asset.js';
import { loadOrders, loadOrderDetail } from './presenter/orders.js';
import { botMsg } from './view/chat.js';
import { setHTML } from './view/components.js';

// ── 탭 전환 ──────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.ntab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[id^="tab-"]').forEach(s => s.style.display = 'none');
      document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
      btn.classList.add('active');
    });
  });
}

// ── 연결 상태 UI ──────────────────────────────────
function setConnected(accountSeq) {
  document.getElementById('dot').classList.add('on');
  document.getElementById('logoutBtn').style.display = '';
  document.getElementById('apiSetBtn').style.display = 'none';
  document.getElementById('tokenInfo').textContent = `계좌 #${accountSeq}`;
}

function setDisconnected() {
  document.getElementById('dot').classList.remove('on');
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('apiSetBtn').style.display = '';
  document.getElementById('tokenInfo').textContent = '';
}

// ── 모달 ─────────────────────────────────────────
export function showApiModal() {
  document.getElementById('apiModal').style.display = 'flex';
}

function hideApiModal() {
  document.getElementById('apiModal').style.display = 'none';
}

// ── 로그아웃 ──────────────────────────────────────
export function logout() {
  authLogout();
  setDisconnected();
  botMsg('로그아웃됐습니다. 다시 연결하려면 🔑 API 설정을 눌러주세요.');
}

// ── 토큰 만료 타이머 ──────────────────────────────
function startTokenTimer() {
  setInterval(() => {
    const expiry = window._tokenExpiry;
    if (!expiry) return;
    const m = Math.round((expiry - Date.now()) / 60000);
    document.getElementById('tokenInfo').textContent = `계좌 #${window._accountSeq} · 토큰 ${m}분 후 만료`;
  }, 30000);
}

// ── 이벤트 바인딩 ─────────────────────────────────
function bindEvents() {
  // 채팅
  const chatInp = document.getElementById('chatInp');
  document.getElementById('sendBtn').addEventListener('click', () => {
    const txt = chatInp.value.trim();
    if (txt) { chatInp.value = ''; handleChat(txt); }
  });
  chatInp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const txt = chatInp.value.trim(); if (txt) { chatInp.value = ''; handleChat(txt); } }
  });

  // API 연결
  document.getElementById('connectBtn').addEventListener('click', async () => {
    const cid  = document.getElementById('m-cid').value.trim();
    const csec = document.getElementById('m-csec').value.trim();
    if (!cid || !csec) { setHTML('conn-result', '키를 모두 입력하세요'); return; }
    setHTML('conn-result', '<span class="spin"></span>연결 중...');
    try {
      const result = await connect(cid, csec);
      setConnected(result.accountSeq);
      setHTML('conn-result', `✅ 연결 완료 · 계좌 #${result.accountSeq}`);
      setTimeout(hideApiModal, 1000);
      botMsg('✅ API 연결 완료!<br><br>예) <b>삼성전자 1주 매수</b> · <b>삼성전자 얼마야?</b> · <b>잔액</b>');
    } catch (e) {
      setHTML('conn-result', `❌ ${e.message}`);
    }
  });

  // 모달 닫기
  document.getElementById('closeApiModal').addEventListener('click', hideApiModal);
  document.getElementById('closeOrderModal').addEventListener('click', () => {
    document.getElementById('orderModal').style.display = 'none';
  });

  // 헤더
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('apiSetBtn').addEventListener('click', showApiModal);

  // 시세 탭
  document.getElementById('loadChartBtn').addEventListener('click', loadChart);
  document.querySelectorAll('.ctab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ctab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      switchChartMode(btn.dataset.mode);
    });
  });
  document.getElementById('loadPriceLimitBtn').addEventListener('click', loadPriceLimit);
  document.getElementById('loadPricesBtn').addEventListener('click', loadPrices);

  // 종목정보 탭
  document.getElementById('loadStockInfoBtn').addEventListener('click', loadStockInfo);
  document.getElementById('loadWarningsBtn').addEventListener('click', loadWarnings);

  // 장운영 탭
  document.getElementById('loadExRateBtn').addEventListener('click', loadExRate);
  document.getElementById('loadKrCalBtn').addEventListener('click', loadKrCal);
  document.getElementById('loadUsCalBtn').addEventListener('click', loadUsCal);

  // 자산 탭
  document.getElementById('refreshHoldingsBtn').addEventListener('click', () => loadHoldings(''));
  document.getElementById('filterHoldingsBtn').addEventListener('click', () => {
    loadHoldings(document.getElementById('h-sym').value.trim());
  });

  // 주문내역 탭
  document.getElementById('loadOrdersBtn').addEventListener('click', loadOrders);
  document.getElementById('loadOrderDetailBtn').addEventListener('click', loadOrderDetail);

  // 주문정보 탭
  document.getElementById('loadBuyingPowerBtn').addEventListener('click', loadBuyingPower);
  document.getElementById('loadSellableBtn').addEventListener('click', loadSellable);
  document.getElementById('loadCommissionsBtn').addEventListener('click', loadCommissions);
}

// ── 초기화 ────────────────────────────────────────
async function init() {
  initTabs();
  bindEvents();
  initAutocompletes();

  // 웰컴 메시지
  botMsg('안녕하세요! 토스증권 AI 트레이딩 에이전트입니다 👋<br><br>먼저 <b>🔑 API 설정</b>을 눌러 연결해주세요.<br><br><b>사용 예시</b><br>· 삼성전자 1주 매수<br>· SK하이닉스 2주 팔아<br>· 삼성전자 얼마야?<br>· 잔액 알려줘<br>· 장 열려있어?');

  // 자동 연결
  const result = await autoConnect();
  if (result) {
    setConnected(result.accountSeq);
    botMsg(`✅ 자동 연결됐습니다! (계좌 #${result.accountSeq})<br><br>예) <b>삼성전자 1주 매수</b> · <b>잔액</b>`);
  }

  startTokenTimer();
}

document.addEventListener('DOMContentLoaded', init);
