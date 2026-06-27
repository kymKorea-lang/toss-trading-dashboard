let _inst=null, _candles=[], _mode='candle';
export const setCandles = c => { _candles=c; };
export const setMode    = m => { _mode=m; };
export function render(elId='mainChart') {
  const el=document.getElementById(elId); if(!el) return;
  el.innerHTML='';
  if(!_candles.length){el.innerHTML='<div class="empty">데이터 없음</div>';return;}
  _inst=LightweightCharts.createChart(el,{
    width:el.offsetWidth,height:el.offsetHeight,
    layout:{background:{color:'transparent'},textColor:'#8b8fa8'},
    grid:{vertLines:{color:'#2a2d3a'},horzLines:{color:'#2a2d3a'}},
    rightPriceScale:{borderColor:'#2a2d3a'},timeScale:{borderColor:'#2a2d3a',timeVisible:true},
  });
  const sorted=[..._candles].sort((a,b)=>a.timestamp>b.timestamp?1:-1);
  const toT=ts=>ts.slice(0,10);
  if(_mode==='candle'){
    const s=_inst.addCandlestickSeries({upColor:'#26c97a',downColor:'#ff4f6a',borderUpColor:'#26c97a',borderDownColor:'#ff4f6a',wickUpColor:'#26c97a',wickDownColor:'#ff4f6a'});
    s.setData(sorted.map(c=>({time:toT(c.timestamp),open:+c.openPrice,high:+c.highPrice,low:+c.lowPrice,close:+c.closePrice})));
  } else {
    const s=_inst.addAreaSeries({lineColor:'#4f8eff',topColor:'rgba(79,142,255,.2)',bottomColor:'rgba(79,142,255,0)',lineWidth:2});
    s.setData(sorted.map(c=>({time:toT(c.timestamp),value:+c.closePrice})));
  }
  _inst.timeScale().fitContent();
  new ResizeObserver(()=>{if(_inst)_inst.applyOptions({width:el.offsetWidth});}).observe(el);
}
