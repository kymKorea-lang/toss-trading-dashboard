export const LOCAL_STOCKS = [
  {name:'삼성전자',sym:'005930',market:'KOSPI'},{name:'SK하이닉스',sym:'000660',market:'KOSPI'},
  {name:'LG에너지솔루션',sym:'373220',market:'KOSPI'},{name:'삼성바이오로직스',sym:'207940',market:'KOSPI'},
  {name:'현대차',sym:'005380',market:'KOSPI'},{name:'기아',sym:'000270',market:'KOSPI'},
  {name:'셀트리온',sym:'068270',market:'KOSPI'},{name:'KB금융',sym:'105560',market:'KOSPI'},
  {name:'신한지주',sym:'055550',market:'KOSPI'},{name:'LG화학',sym:'051910',market:'KOSPI'},
  {name:'삼성SDI',sym:'006400',market:'KOSPI'},{name:'삼성전기',sym:'009150',market:'KOSPI'},
  {name:'삼성SDS',sym:'018260',market:'KOSPI'},{name:'삼성생명',sym:'032830',market:'KOSPI'},
  {name:'삼성화재',sym:'000810',market:'KOSPI'},{name:'포스코홀딩스',sym:'005490',market:'KOSPI'},
  {name:'카카오',sym:'035720',market:'KOSPI'},{name:'네이버',sym:'035420',market:'KOSPI'},
  {name:'하나금융지주',sym:'086790',market:'KOSPI'},{name:'SK이노베이션',sym:'096770',market:'KOSPI'},
  {name:'LG전자',sym:'066570',market:'KOSPI'},{name:'현대모비스',sym:'012330',market:'KOSPI'},
  {name:'삼성물산',sym:'028260',market:'KOSPI'},{name:'SK텔레콤',sym:'017670',market:'KOSPI'},
  {name:'카카오뱅크',sym:'323410',market:'KOSPI'},{name:'크래프톤',sym:'259960',market:'KOSPI'},
  {name:'두산에너빌리티',sym:'034020',market:'KOSPI'},{name:'한화에어로스페이스',sym:'012450',market:'KOSPI'},
  {name:'고려아연',sym:'010130',market:'KOSPI'},{name:'한국전력',sym:'015760',market:'KOSPI'},
  {name:'LG이노텍',sym:'011070',market:'KOSPI'},{name:'HMM',sym:'011200',market:'KOSPI'},
  {name:'대한항공',sym:'003490',market:'KOSPI'},{name:'KODEX200',sym:'069500',market:'KOSPI'},
  {name:'KODEX레버리지',sym:'122630',market:'KOSPI'},{name:'KODEX인버스',sym:'114800',market:'KOSPI'},
  {name:'에코프로비엠',sym:'247540',market:'KOSDAQ'},{name:'에코프로',sym:'086520',market:'KOSDAQ'},
  {name:'알테오젠',sym:'196170',market:'KOSDAQ'},{name:'HLB',sym:'028300',market:'KOSDAQ'},
  {name:'애플',sym:'AAPL',market:'NASDAQ'},{name:'엔비디아',sym:'NVDA',market:'NASDAQ'},
  {name:'마이크로소프트',sym:'MSFT',market:'NASDAQ'},{name:'구글',sym:'GOOGL',market:'NASDAQ'},
  {name:'알파벳',sym:'GOOGL',market:'NASDAQ'},{name:'아마존',sym:'AMZN',market:'NASDAQ'},
  {name:'메타',sym:'META',market:'NASDAQ'},{name:'테슬라',sym:'TSLA',market:'NASDAQ'},
  {name:'TSMC',sym:'TSM',market:'NYSE'},{name:'팔란티어',sym:'PLTR',market:'NYSE'},
  {name:'코인베이스',sym:'COIN',market:'NASDAQ'},{name:'AMD',sym:'AMD',market:'NASDAQ'},
  {name:'인텔',sym:'INTC',market:'NASDAQ'},{name:'넷플릭스',sym:'NFLX',market:'NASDAQ'},
  {name:'브로드컴',sym:'AVGO',market:'NASDAQ'},{name:'JP모건',sym:'JPM',market:'NYSE'},
  {name:'비자',sym:'V',market:'NYSE'},{name:'버크셔해서웨이',sym:'BRK.B',market:'NYSE'},
  {name:'나이키',sym:'NKE',market:'NYSE'},{name:'코카콜라',sym:'KO',market:'NYSE'},
  {name:'마이크론',sym:'MU',market:'NASDAQ'},{name:'퀄컴',sym:'QCOM',market:'NASDAQ'},
  {name:'ARM',sym:'ARM',market:'NASDAQ'},
];

const _cache = {};

function parseDirect(input) {
  const t = input.trim();
  if (/^\d{6}$/.test(t)) return {name:t, sym:t, market:'KR'};
  if (/^[A-Za-z]{1,5}(\.[A-Z])?$/.test(t)) return {name:t.toUpperCase(), sym:t.toUpperCase(), market:'US'};
  return null;
}

function findLocal(name) {
  const n = name.trim().toLowerCase().replace(/\s/g,'');
  return LOCAL_STOCKS.find(s =>
    s.name.toLowerCase().replace(/\s/g,'') === n ||
    s.name.toLowerCase().replace(/\s/g,'').includes(n) ||
    n.includes(s.name.toLowerCase().replace(/\s/g,'')) ||
    s.sym.toLowerCase() === n
  );
}

export const findStock      = name => parseDirect(name) || findLocal(name) || _cache[name.trim()] || null;
export const findStockAsync = async name => parseDirect(name) || findLocal(name) || _cache[name.trim()] || null;
export const cacheStock     = (key, stock) => { _cache[key] = stock; };
export const searchStocks   = (q, limit=8) => {
  if (!q) return [];
  const n = q.toLowerCase().replace(/\s/g,'');
  return LOCAL_STOCKS.filter(s => s.name.toLowerCase().replace(/\s/g,'').includes(n) || s.sym.toLowerCase().includes(n)).slice(0, limit);
};
export const namesToSyms = str =>
  str.split(',').map(n => { const s = findStock(n.trim()); return s ? s.sym : n.trim(); }).filter(Boolean);
