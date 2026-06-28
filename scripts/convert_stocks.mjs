// scripts/convert-stocks.mjs
// 실행: node scripts/convert-stocks.mjs
// KRX CSV → public/stocks.json 변환

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import iconv from 'iconv-lite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CSV 파일 경로 (루트에 놔두세요) ──────────────
const CSV_PATH  = path.join(__dirname, '..', 'data_5210_20260628.csv');
const OUT_PATH  = path.join(__dirname, '..', 'public', 'stocks.json');

// CP949 인코딩으로 읽기
const buf  = fs.readFileSync(CSV_PATH);
const text = iconv.decode(buf, 'cp949');
const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

// 헤더 파싱
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
console.log('헤더:', headers);

// 시장구분 매핑
const MARKET_MAP = {
  'KOSPI'  : 'KOSPI',
  'KOSDAQ' : 'KOSDAQ',
  'KONEX'  : 'KONEX',
};

const stocks = [];

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
  if (cols.length < 7) continue;

  // 컬럼 순서: 표준코드, 단축코드, 한글종목명, 한글종목약명, 영문종목명, 상장일, 시장구분, ...
  const sym    = cols[1]?.trim(); // 단축코드 (6자리)
  const name   = cols[2]?.trim(); // 한글종목명
  const abbr   = cols[3]?.trim(); // 한글종목약명
  const market = cols[6]?.trim(); // 시장구분

  if (!sym || !name || sym.length !== 6) continue;
  // 숫자 코드만 허용 (ETF/주식)
  if (!/^\d{6}$/.test(sym)) continue;

  stocks.push({
    name,
    abbr: abbr || name,
    sym,
    market: MARKET_MAP[market] || market,
  });
}

// 중복 제거 (심볼 기준)
const unique = [...new Map(stocks.map(s => [s.sym, s])).values()];
unique.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

fs.writeFileSync(OUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');
console.log(`✅ 완료: ${unique.length}개 종목 → public/stocks.json`);
