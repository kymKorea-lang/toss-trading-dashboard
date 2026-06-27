import { searchStocks } from '../model/stocks.js';
export function initAutocomplete(inputId, acId, onSelect) {
  const input=document.getElementById(inputId), ac=document.getElementById(acId);
  if(!input||!ac) return;
  input.addEventListener('input',()=>{
    const results=searchStocks(input.value.trim());
    if(!input.value.trim()||!results.length){ac.style.display='none';return;}
    ac.innerHTML=results.map(s=>`<div class="ac-item" data-name="${s.name}" data-sym="${s.sym}"><span>${s.name}</span><span class="sym">${s.sym} · ${s.market}</span></div>`).join('');
    ac.style.display='block';
    ac.querySelectorAll('.ac-item').forEach(item=>{
      item.addEventListener('mousedown',e=>{e.preventDefault();input.value=item.dataset.name;ac.style.display='none';onSelect?.(item.dataset.name,item.dataset.sym);});
    });
  });
  input.addEventListener('blur',()=>setTimeout(()=>{ac.style.display='none';},150));
}
