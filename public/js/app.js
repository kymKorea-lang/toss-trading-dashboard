import { connect, autoConnect, logout as authLogout } from './api/auth.js';
import { handleChat } from './presenter/trading.js';
import { initAutocompletes, loadChart, switchChartMode, loadPriceLimit, loadPrices, loadStockInfo, loadWarnings, loadExRate, loadKrCal, loadUsCal } from './presenter/market.js';
import { loadHoldings, loadBuyingPower, loadSellable, loadCommissions } from './presenter/asset.js';
import { loadOrders, loadOrderDetail } from './presenter/orders.js';
import { botMsg } from './view/chat.js';
import { setHTML } from './view/components.js';

function setConnected(accountSeq) {
  document.getElementById('dot').classList.add('on');
  document.getElementById('logoutBtn').style.display='';
  document.getElementById('apiSetBtn').style.display='none';
  document.getElementById('tokenInfo').textContent=`계좌 #${accountSeq}`;
}
function setDisconnected() {
  document.getElementById('dot').classList.remove('on');
  document.getElementById('logoutBtn').style.display='none';
  document.getElementById('apiSetBtn').style.display='';
  document.getElementById('tokenInfo').textContent='';
}
function showApiModal() { document.getElementById('apiModal').style.display='flex'; }
function hideApiModal() { document.getElementById('apiModal').style.display='none'; }

function initTabs() {
  document.querySelectorAll('.ntab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('[id^="tab-"]').forEach(s=>s.style.display='none');
      document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));
      document.getElementById('tab-'+btn.dataset.tab).style.display='block';
      btn.classList.add('active');
    });
  });
}

function bindEvents() {
  const chatInp=document.getElementById('chatInp');
  const send=()=>{const txt=chatInp.value.trim();if(txt){chatInp.value='';handleChat(txt);}};
  document.getElementById('sendBtn').addEventListener('click',send);
  chatInp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  document.getElementById('connectBtn').addEventListener('click',async()=>{
    const cid=document.getElementById('m-cid').value.trim(), csec=document.getElementById('m-csec').value.trim();
    if(!cid||!csec){setHTML('conn-result','키를 모두 입력하세요');return;}
    setHTML('conn-result','<span class="spin"></span>연결 중...');
    try {
      const result=await connect(cid,csec);
      setConnected(result.accountSeq);
      setHTML('conn-result',`✅ 연결 완료 · 계좌 #${result.accountSeq}`);
      setTimeout(hideApiModal,1000);
      botMsg('✅ API 연결 완료!<br><br>예) <b>삼성전자 1주 매수</b> · <b>삼성전자 얼마야?</b> · <b>잔액</b>');
    } catch(e){setHTML('conn-result',`❌ ${e.message}`);}
  });
  document.getElementById('closeApiModal').addEventListener('click',hideApiModal);
  document.getElementById('logoutBtn').addEventListener('click',()=>{authLogout();setDisconnected();botMsg('로그아웃됐습니다. 다시 연결하려면 🔑 API 설정을 눌러주세요.');});
  document.getElementById('apiSetBtn').addEventListener('click',showApiModal);
  document.getElementById('loadChartBtn').addEventListener('click',loadChart);
  document.querySelectorAll('.ctab').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');switchChartMode(btn.dataset.mode);});});
  document.getElementById('loadPriceLimitBtn').addEventListener('click',loadPriceLimit);
  document.getElementById('loadPricesBtn').addEventListener('click',loadPrices);
  document.getElementById('loadStockInfoBtn').addEventListener('click',loadStockInfo);
  document.getElementById('loadWarningsBtn').addEventListener('click',loadWarnings);
  document.getElementById('loadExRateBtn').addEventListener('click',loadExRate);
  document.getElementById('loadKrCalBtn').addEventListener('click',loadKrCal);
  document.getElementById('loadUsCalBtn').addEventListener('click',loadUsCal);
  document.getElementById('refreshHoldingsBtn').addEventListener('click',()=>loadHoldings(''));
  document.getElementById('filterHoldingsBtn').addEventListener('click',()=>loadHoldings(document.getElementById('h-sym').value.trim()));
  document.getElementById('loadOrdersBtn').addEventListener('click',loadOrders);
  document.getElementById('loadOrderDetailBtn').addEventListener('click',loadOrderDetail);
  document.getElementById('loadBuyingPowerBtn').addEventListener('click',loadBuyingPower);
  document.getElementById('loadSellableBtn').addEventListener('click',loadSellable);
  document.getElementById('loadCommissionsBtn').addEventListener('click',loadCommissions);
}

async function init() {
  initTabs(); bindEvents(); initAutocompletes();
  botMsg('안녕하세요! 토스증권 AI 트레이딩 에이전트입니다 👋<br><br>먼저 <b>🔑 API 설정</b>을 눌러 연결해주세요.<br><br><b>사용 예시</b><br>· 삼성전자 1주 매수<br>· SK하이닉스 2주 팔아<br>· 삼성전자 얼마야?<br>· 잔액 알려줘<br>· 장 열려있어?');
  const result=await autoConnect();
  if(result){setConnected(result.accountSeq);botMsg(`✅ 자동 연결됐습니다! (계좌 #${result.accountSeq})<br><br>예) <b>삼성전자 1주 매수</b> · <b>잔액</b>`);}
}
document.addEventListener('DOMContentLoaded',init);
