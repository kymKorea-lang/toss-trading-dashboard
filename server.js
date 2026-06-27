import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const TOSS_BASE = 'https://openapi.tossinvest.com';

const ALLOWED_ORIGINS = [
  'https://toss-trading-dashboard-production.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tossinvest-Account'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// IP 확인용 (토스증권 IP 등록 후 삭제 가능)
app.get('/my-ip', async (req, res) => {
  const r = await fetch('https://api.ipify.org?format=json');
  const d = await r.json();
  res.json({ ip: d.ip });
});

app.all('/api/proxy', async (req, res) => {
  const targetPath = req.query.path;
  if (!targetPath) return res.status(400).json({ error: 'path 파라미터 필요' });

  const queryParams = { ...req.query };
  delete queryParams.path;
  const qs = new URLSearchParams(queryParams).toString();
  const targetUrl = `${TOSS_BASE}${targetPath}${qs ? '?' + qs : ''}`;

  try {
    const forwardHeaders = {};
    if (req.headers['authorization'])        forwardHeaders['Authorization']         = req.headers['authorization'];
    if (req.headers['x-tossinvest-account']) forwardHeaders['X-Tossinvest-Account'] = req.headers['x-tossinvest-account'];
    if (req.headers['content-type'])         forwardHeaders['Content-Type']          = req.headers['content-type'];

    let body = undefined;
    if (req.method !== 'GET') {
      const ct = req.headers['content-type'] || '';
      body = ct.includes('application/x-www-form-urlencoded')
        ? new URLSearchParams(req.body).toString()
        : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, { method: req.method, headers: forwardHeaders, body });
    const data = await response.json();

    ['x-ratelimit-limit','x-ratelimit-remaining','x-ratelimit-reset','retry-after'].forEach(h => {
      const val = response.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { code: 'proxy-error', message: err.message } });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`✅ 서버 실행: http://localhost:${PORT}`));
