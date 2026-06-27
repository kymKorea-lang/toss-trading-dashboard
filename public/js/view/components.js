export const fmt  = n => n!=null ? Number(n).toLocaleString('ko-KR',{maximumFractionDigits:4}) : '-';
export const fmtN = n => n!=null ? Number(n).toLocaleString('ko-KR') : '-';
export const fmtM = n => n!=null ? Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2}) : '-';
export const krw  = n => n!=null ? '₩'+Number(n).toLocaleString('ko-KR')+'원' : '-';
export const setHTML = (id,html) => { const el=document.getElementById(id); if(el) el.innerHTML=html; };
export const getVal  = id => document.getElementById(id)?.value?.trim()??'';
export const spinner = () => '<span class="spin"></span>';
export const loading = (t='조회 중...') => `<div class="loading">${spinner()}${t}</div>`;
export const empty   = (t='데이터 없음') => `<div class="empty">${t}</div>`;
export const badge   = (t,c='d') => `<span class="badge ${c}">${t}</span>`;
export const stat    = (label,value,cls='') => `<div class="stat"><label>${label}</label><span class="val ${cls}">${value}</span></div>`;
export const session = (name,start,end) => {
  const now=new Date(), s=start?new Date(start):null, e=end?new Date(end):null;
  const isOpen=s&&e&&now>=s&&now<=e;
  return `<div class="session ${isOpen?'open':'closed'}"><div class="sess-dot"></div><span class="sess-name">${name}</span><span class="sess-time">${start?start.slice(11,16):'-'} ~ ${end?end.slice(11,16):'-'}</span></div>`;
};
export const orderStatusBadge = s => {
  const m={PENDING:'d',PARTIAL_FILLED:'y',FILLED:'g',CANCELED:'r',REJECTED:'r',REPLACED:'b',PENDING_CANCEL:'y'};
  return badge(s, m[s]||'d');
};
