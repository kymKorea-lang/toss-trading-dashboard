import { state } from '../model/state.js';
const PROXY = '/api/proxy';

export async function issueToken() {
  const res = await fetch(`${PROXY}?path=${encodeURIComponent('/oauth2/token')}`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(state.clientId)}&client_secret=${encodeURIComponent(state.clientSecret)}`,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  state.token = data.access_token;
  state.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
}

export async function ensureToken() {
  if (!state.token) throw new Error('API 미연결');
  if (Date.now() > state.tokenExpiry) await issueToken();
}

function buildHeaders(withAccount=false) {
  const h = {Authorization:`Bearer ${state.token}`,'Content-Type':'application/json'};
  if (withAccount && state.accountSeq) h['X-Tossinvest-Account'] = state.accountSeq;
  return h;
}

export async function apiGet(path, withAccount=false) {
  await ensureToken();
  const res = await fetch(`${PROXY}?path=${encodeURIComponent(path)}`, {headers: buildHeaders(withAccount)});
  return res.json();
}

export async function apiPost(path, body, withAccount=true) {
  await ensureToken();
  const res = await fetch(`${PROXY}?path=${encodeURIComponent(path)}`, {
    method:'POST', headers: buildHeaders(withAccount), body: JSON.stringify(body),
  });
  return res.json();
}

export async function connect(cid, csec) {
  state.clientId = cid; state.clientSecret = csec;
  await issueToken();
  const acc = await apiGet('/api/v1/accounts');
  const list = acc.result || [];
  if (!list.length) throw new Error('계좌를 찾을 수 없습니다');
  state.accountSeq = list[0].accountSeq;
  state.connected = true;
  localStorage.setItem('toss_cid', cid);
  localStorage.setItem('toss_csec', csec);
  return {accountSeq: list[0].accountSeq, accountType: list[0].accountType};
}

export async function autoConnect() {
  const cid = localStorage.getItem('toss_cid');
  const csec = localStorage.getItem('toss_csec');
  if (!cid || !csec) return false;
  state.clientId = cid; state.clientSecret = csec;
  try {
    await issueToken();
    const acc = await apiGet('/api/v1/accounts');
    const list = acc.result || [];
    if (!list.length) return false;
    state.accountSeq = list[0].accountSeq;
    state.connected = true;
    return {accountSeq: list[0].accountSeq, accountType: list[0].accountType};
  } catch {
    localStorage.removeItem('toss_cid');
    localStorage.removeItem('toss_csec');
    return false;
  }
}

export function logout() {
  localStorage.removeItem('toss_cid');
  localStorage.removeItem('toss_csec');
  Object.assign(state, {token:null,clientId:null,clientSecret:null,accountSeq:null,connected:false,tokenExpiry:null});
}
