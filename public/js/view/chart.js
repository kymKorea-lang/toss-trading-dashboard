// 차트 렌더링 (View)

let _instance = null;
let _candles = [];
let _mode = 'candle';

export function setCandles(candles) {
  _candles = candles;
}

export function setMode(mode) {
  _mode = mode;
}

export function render(elementId = 'mainChart') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';

  if (!_candles.length) {
    el.innerHTML = '<div class="empty">데이터 없음</div>';
    return;
  }

  _instance = LightweightCharts.createChart(el, {
    width: el.offsetWidth,
    height: el.offsetHeight,
    layout: { background: { color: 'transparent' }, textColor: '#8b8fa8' },
    grid: { vertLines: { color: '#2a2d3a' }, horzLines: { color: '#2a2d3a' } },
    rightPriceScale: { borderColor: '#2a2d3a' },
    timeScale: { borderColor: '#2a2d3a', timeVisible: true },
  });

  const sorted = [..._candles].sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
  const toTime = ts => ts.slice(0, 10);

  if (_mode === 'candle') {
    const series = _instance.addCandlestickSeries({
      upColor: '#26c97a', downColor: '#ff4f6a',
      borderUpColor: '#26c97a', borderDownColor: '#ff4f6a',
      wickUpColor: '#26c97a', wickDownColor: '#ff4f6a',
    });
    series.setData(sorted.map(c => ({
      time: toTime(c.timestamp),
      open: +c.openPrice, high: +c.highPrice,
      low: +c.lowPrice,  close: +c.closePrice,
    })));
  } else {
    const series = _instance.addAreaSeries({
      lineColor: '#4f8eff',
      topColor: 'rgba(79,142,255,.2)',
      bottomColor: 'rgba(79,142,255,0)',
      lineWidth: 2,
    });
    series.setData(sorted.map(c => ({
      time: toTime(c.timestamp),
      value: +c.closePrice,
    })));
  }

  _instance.timeScale().fitContent();
  new ResizeObserver(() => {
    if (_instance) _instance.applyOptions({ width: el.offsetWidth });
  }).observe(el);
}
