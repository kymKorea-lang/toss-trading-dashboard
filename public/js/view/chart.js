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

  // 툴팁 제거 후 재생성
  const existingTooltip = document.getElementById('chartTooltip');
  if (existingTooltip) existingTooltip.remove();

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

  const toTime   = ts => ts.slice(0, 10);
  const isCrypto = _candles[0]?.currency === 'USD';
  const currSym  = isCrypto ? '$' : '₩';
  const fmt      = n => Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 });

  // ── 통계 계산 ──────────────────────────────────
  const closes       = sorted.map(c => +c.closePrice);
  const highs        = sorted.map(c => +c.highPrice);
  const lows         = sorted.map(c => +c.lowPrice);
  const currentPrice = closes[closes.length - 1];
  const highPrice    = Math.max(...highs);
  const lowPrice     = Math.min(...lows);
  const highDate     = sorted[highs.indexOf(highPrice)]?.timestamp?.slice(0, 10) ?? '';
  const lowDate      = sorted[lows.indexOf(lowPrice)]?.timestamp?.slice(0, 10)  ?? '';
  const fromLow      = ((currentPrice - lowPrice)  / lowPrice  * 100).toFixed(2);
  const fromHigh     = ((currentPrice - highPrice) / highPrice * 100).toFixed(2);

  // ── 통계 배지 (차트 상단) ──────────────────────
  const statsEl = document.getElementById('chartStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <span class="chart-stat">현재가 <b>${currSym}${fmt(currentPrice)}</b></span>
      <span class="chart-stat g">최저 대비 <b>+${fromLow}%</b> <span class="chart-stat-sub">(${currSym}${fmt(lowPrice)} · ${lowDate})</span></span>
      <span class="chart-stat r">최고 대비 <b>${fromHigh}%</b> <span class="chart-stat-sub">(${currSym}${fmt(highPrice)} · ${highDate})</span></span>`;
  }

  // ── 시리즈 생성 ────────────────────────────────
  let series;
  if (_mode === 'candle') {
    series = _instance.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: '#26c97a', downColor: '#ff4f6a',
      borderUpColor: '#26c97a', borderDownColor: '#ff4f6a',
      wickUpColor: '#26c97a', wickDownColor: '#ff4f6a',
    });
    series.setData(sorted.map(c => ({
      time: toTime(c.timestamp),
      open: +c.openPrice, high: +c.highPrice,
      low: +c.lowPrice,   close: +c.closePrice,
    })));
  } else {
    series = _instance.addSeries(LightweightCharts.AreaSeries, {
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

  // ── 최고/최저 수평선 ───────────────────────────
  series.createPriceLine({
    price:       highPrice,
    color:       '#ff4f6a',
    lineWidth:   1,
    lineStyle:   LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title:       `최고 ${currSym}${fmt(highPrice)}`,
  });
  series.createPriceLine({
    price:       lowPrice,
    color:       '#26c97a',
    lineWidth:   1,
    lineStyle:   LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title:       `최저 ${currSym}${fmt(lowPrice)}`,
  });

  // ── 크로스헤어 툴팁 ───────────────────────────
  const tooltip = document.createElement('div');
  tooltip.id = 'chartTooltip';
  tooltip.style.cssText = `
    position:absolute;pointer-events:none;display:none;z-index:10;
    background:rgba(22,24,31,.92);border:1px solid #2a2d3a;
    border-radius:8px;padding:8px 12px;font-size:11px;color:#e8eaf0;
    line-height:1.7;min-width:160px;box-shadow:0 4px 16px rgba(0,0,0,.4);`;
  el.style.position = 'relative';
  el.appendChild(tooltip);

  _instance.subscribeCrosshairMove(param => {
    if (!param.time || !param.seriesData?.size) {
      tooltip.style.display = 'none';
      return;
    }

    const data = param.seriesData.get(series);
    if (!data) { tooltip.style.display = 'none'; return; }

    const price   = data.close ?? data.value ?? 0;
    const open    = data.open  ?? price;
    const high    = data.high  ?? price;
    const low     = data.low   ?? price;
    const close   = data.close ?? price;
    const chg     = ((close - open) / open * 100).toFixed(2);
    const chgCol  = chg >= 0 ? '#26c97a' : '#ff4f6a';
    const fromL   = ((close - lowPrice)  / lowPrice  * 100).toFixed(2);
    const fromH   = ((close - highPrice) / highPrice * 100).toFixed(2);

    tooltip.innerHTML = `
      <div style="color:#8b8fa8;margin-bottom:4px">${param.time}</div>
      ${_mode === 'candle' ? `
        <div>시가 <b>${currSym}${fmt(open)}</b></div>
        <div>고가 <b>${currSym}${fmt(high)}</b></div>
        <div>저가 <b>${currSym}${fmt(low)}</b></div>
        <div>종가 <b>${currSym}${fmt(close)}</b></div>
        <div>등락 <b style="color:${chgCol}">${chg >= 0 ? '+' : ''}${chg}%</b></div>
      ` : `
        <div>가격 <b>${currSym}${fmt(price)}</b></div>
      `}
      <div style="border-top:1px solid #2a2d3a;margin-top:4px;padding-top:4px">
        <div style="color:#26c97a">최저 대비 <b>+${fromL}%</b></div>
        <div style="color:#ff4f6a">최고 대비 <b>${fromH}%</b></div>
      </div>`;

    tooltip.style.display = 'block';

    // 툴팁 위치 계산 (화면 밖으로 나가지 않게)
    const x = param.point?.x ?? 0;
    const y = param.point?.y ?? 0;
    const tw = tooltip.offsetWidth  || 170;
    const th = tooltip.offsetHeight || 160;
    const left = x + 16 + tw > width  ? x - tw - 8 : x + 16;
    const top  = y + 8  + th > height ? y - th - 8 : y + 8;
    tooltip.style.left = `${Math.max(0, left)}px`;
    tooltip.style.top  = `${Math.max(0, top)}px`;
  });

  _instance.timeScale().fitContent();
  new ResizeObserver(() => {
    if (_instance) _instance.applyOptions({ width: el.offsetWidth });
  }).observe(el);
}
