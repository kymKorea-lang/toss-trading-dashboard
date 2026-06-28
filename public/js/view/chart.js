// LightweightCharts v5 기준
let _instance = null;
let _candles  = [];
let _mode     = 'candle';

export const setCandles = c => { _candles = c; };
export const setMode    = m => { _mode = m; };

export function render(elId = 'mainChart') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '';

  if (!_candles.length) {
    el.innerHTML = '<div class="empty">데이터 없음</div>';
    return;
  }

  const parent = el.parentElement;
  const width  = parent?.offsetWidth  || 600;
  const height = parent?.offsetHeight || 260;

  _instance = LightweightCharts.createChart(el, {
    width,
    height,
    layout: { background: { color: 'transparent' }, textColor: '#8b8fa8' },
    grid:   { vertLines: { color: '#2a2d3a' }, horzLines: { color: '#2a2d3a' } },
    rightPriceScale: { borderColor: '#2a2d3a' },
    timeScale:       { borderColor: '#2a2d3a', timeVisible: true },
  });

  // 중복 날짜 제거 + 정렬
  const seen   = new Set();
  const sorted = [..._candles]
    .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))
    .filter(c => {
      const key = c.timestamp.slice(0, 10);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const toTime = ts => ts.slice(0, 10);

  // ── 통계 배지 ──────────────────────────────────
  const prices       = sorted.map(c => +c.closePrice);
  const currentPrice = prices[prices.length - 1];
  const highPrice    = Math.max(...prices);
  const lowPrice     = Math.min(...prices);
  const fromLow      = ((currentPrice - lowPrice)  / lowPrice  * 100).toFixed(2);
  const fromHigh     = ((currentPrice - highPrice) / highPrice * 100).toFixed(2);
  const currency     = _candles[0]?.currency === 'USD' ? '$' : '₩';
  const fmt          = n => Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 });

  const statsEl = document.getElementById('chartStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <span class="chart-stat">현재가 <b>${currency}${fmt(currentPrice)}</b></span>
      <span class="chart-stat g">최저점 대비 <b>+${fromLow}%</b> <span class="chart-stat-sub">(${currency}${fmt(lowPrice)})</span></span>
      <span class="chart-stat r">최고점 대비 <b>${fromHigh}%</b> <span class="chart-stat-sub">(${currency}${fmt(highPrice)})</span></span>`;
  }

  // ── 시리즈 (v5 API) ────────────────────────────
  if (_mode === 'candle') {
    const s = _instance.addSeries(LightweightCharts.CandlestickSeries, {
      upColor:        '#26c97a',
      downColor:      '#ff4f6a',
      borderUpColor:  '#26c97a',
      borderDownColor:'#ff4f6a',
      wickUpColor:    '#26c97a',
      wickDownColor:  '#ff4f6a',
    });
    s.setData(sorted.map(c => ({
      time:  toTime(c.timestamp),
      open:  +c.openPrice,
      high:  +c.highPrice,
      low:   +c.lowPrice,
      close: +c.closePrice,
    })));
  } else {
    const s = _instance.addSeries(LightweightCharts.AreaSeries, {
      lineColor:   '#4f8eff',
      topColor:    'rgba(79,142,255,.2)',
      bottomColor: 'rgba(79,142,255,0)',
      lineWidth:   2,
    });
    s.setData(sorted.map(c => ({
      time:  toTime(c.timestamp),
      value: +c.closePrice,
    })));
  }

  _instance.timeScale().fitContent();

  new ResizeObserver(() => {
    if (_instance) _instance.applyOptions({ width: el.offsetWidth });
  }).observe(el);
}
