// 종목 데이터 모델 — KRX 전종목 + 미국 주요주 + 검색 로직

// ── 미국 주요 종목 (KRX에 없음) ──────────────────
const US_STOCKS = [
  {name:'애플',          abbr:'애플',       sym:'AAPL',  market:'NASDAQ'},
  {name:'엔비디아',      abbr:'엔비디아',   sym:'NVDA',  market:'NASDAQ'},
  {name:'마이크로소프트',abbr:'MS',         sym:'MSFT',  market:'NASDAQ'},
  {name:'구글',          abbr:'구글',       sym:'GOOGL', market:'NASDAQ'},
  {name:'알파벳',        abbr:'알파벳',     sym:'GOOGL', market:'NASDAQ'},
  {name:'아마존',        abbr:'아마존',     sym:'AMZN',  market:'NASDAQ'},
  {name:'메타',          abbr:'메타',       sym:'META',  market:'NASDAQ'},
  {name:'테슬라',        abbr:'테슬라',     sym:'TSLA',  market:'NASDAQ'},
  {name:'TSMC',          abbr:'TSMC',       sym:'TSM',   market:'NYSE'},
  {name:'팔란티어',      abbr:'팔란티어',   sym:'PLTR',  market:'NYSE'},
  {name:'코인베이스',    abbr:'코인베이스', sym:'COIN',  market:'NASDAQ'},
  {name:'AMD',           abbr:'AMD',        sym:'AMD',   market:'NASDAQ'},
  {name:'인텔',          abbr:'인텔',       sym:'INTC',  market:'NASDAQ'},
  {name:'넷플릭스',      abbr:'넷플릭스',   sym:'NFLX',  market:'NASDAQ'},
  {name:'브로드컴',      abbr:'브로드컴',   sym:'AVGO',  market:'NASDAQ'},
  {name:'일라이릴리',    abbr:'릴리',       sym:'LLY',   market:'NYSE'},
  {name:'JP모건',        abbr:'JP모건',     sym:'JPM',   market:'NYSE'},
  {name:'비자',          abbr:'비자',       sym:'V',     market:'NYSE'},
  {name:'버크셔해서웨이',abbr:'버크셔',     sym:'BRK.B', market:'NYSE'},
  {name:'나이키',        abbr:'나이키',     sym:'NKE',   market:'NYSE'},
  {name:'코카콜라',      abbr:'코카콜라',   sym:'KO',    market:'NYSE'},
  {name:'마이크론',      abbr:'마이크론',   sym:'MU',    market:'NASDAQ'},
  {name:'퀄컴',          abbr:'퀄컴',       sym:'QCOM',  market:'NASDAQ'},
  {name:'ARM',           abbr:'ARM',        sym:'ARM',   market:'NASDAQ'},
  {name:'스타벅스',      abbr:'스타벅스',   sym:'SBUX',  market:'NASDAQ'},
  {name:'쿠팡',          abbr:'쿠팡',       sym:'CPNG',  market:'NYSE'},
];

// ── 전체 종목 (KRX JSON + 미국) ──────────────────
// let 대신 배열을 직접 관리해 re-export 가능하게 유지
export const LOCAL_STOCKS = [...US_STOCKS];
let _loaded = false;

/**
 * KRX 전종목 JSON 로드 (앱 시작 시 1회)
 */
export async function loadStocks() {
  if (_loaded) return;
  try {
    const res = await fetch('/stocks.json');
    const krx = await res.json();
    LOCAL_STOCKS.length = 0;
    LOCAL_STOCKS.push(...krx, ...US_STOCKS);
    _loaded = true;
    console.log(`✅ 종목 로드 완료: ${LOCAL_STOCKS.length}개`);
  } catch (e) {
    console.warn('stocks.json 로드 실패, 미국 주요주만 사용:', e.message);
    _loaded = true;
  }
}

// ── 런타임 캐시 ──────────────────────────────────
const _cache = {};

// ── 검색 헬퍼 ────────────────────────────────────
function normalize(s) {
  return s.toLowerCase().replace(/[\s\(\)（）\[\]]/g, '');
}

/**
 * 심볼 직접 입력 파싱
 */
function parseDirect(input) {
  const t = input.trim();
  if (/^\d{6}$/.test(t)) {
    const found = LOCAL_STOCKS.find(s => s.sym === t);
    return found || { name: t, abbr: t, sym: t, market: 'KR' };
  }
  if (/^[A-Za-z]{1,5}(\.[A-Z])?$/.test(t)) {
    const up = t.toUpperCase();
    const found = LOCAL_STOCKS.find(s => s.sym === up);
    return found || { name: up, abbr: up, sym: up, market: 'US' };
  }
  return null;
}

/**
 * 종목 찾기 (동기)
 */
export function findStock(name) {
  const direct = parseDirect(name);
  if (direct) return direct;
  if (_cache[name]) return _cache[name];

  const n = normalize(name);
  return LOCAL_STOCKS.find(s =>
    normalize(s.name) === n ||
    normalize(s.abbr) === n ||
    normalize(s.name).includes(n) ||
    normalize(s.abbr).includes(n) ||
    n.includes(normalize(s.name)) ||
    s.sym.toLowerCase() === n
  ) || null;
}

/**
 * 종목 찾기 (비동기 - 채팅용)
 */
export async function findStockAsync(name) {
  return findStock(name);
}

/**
 * 런타임 캐시 저장
 */
export function cacheStock(key, stock) {
  _cache[key] = stock;
}

/**
 * 자동완성 검색 (최대 8개)
 */
export function searchStocks(query, limit = 8) {
  if (!query || query.length < 1) return [];
  const n = normalize(query);
  return LOCAL_STOCKS.filter(s =>
    normalize(s.name).includes(n) ||
    normalize(s.abbr).includes(n) ||
    s.sym.toLowerCase().startsWith(n)
  ).slice(0, limit);
}

/**
 * 종목명/심볼 콤마 구분 문자열 → 심볼 배열
 */
export function namesToSyms(namesStr) {
  return namesStr.split(',').map(n => {
    const s = findStock(n.trim());
    return s ? s.sym : n.trim();
  }).filter(Boolean);
}
