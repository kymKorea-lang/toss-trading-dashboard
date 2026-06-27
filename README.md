# 📈 토스증권 트레이딩 대시보드

토스증권 Open API v1.1.5 기반의 AI 트레이딩 대시보드입니다.

## ✨ 주요 기능

| 탭 | 기능 |
|---|---|
| 💬 트레이딩 | 자연어 채팅으로 매수/매도/시세/잔액 조회 |
| 📊 시세 | 캔들/라인 차트, 상하한가, 현재가 다건 조회 |
| 🏢 종목정보 | 종목 기본정보, 매수 유의사항(VI발동 등) |
| 🕐 장운영 | 환율, 국내장/미국장 운영 일정 |
| 💼 자산/보유 | 보유주식, 손익, 매수가능금액, 수수료 |
| 📋 주문내역 | 진행중/완료 주문 조회 및 상세 |
| ℹ️ 주문정보 | 매수가능금액, 매도가능수량, 수수료율 |

## 🗂 프로젝트 구조 (MVP 패턴)

```
toss-trading-dashboard/
├── server.js                  # Express 프록시 서버
├── package.json
├── README.md
└── public/
    ├── index.html             # 진입 HTML
    ├── css/
    │   └── style.css          # 전체 스타일
    └── js/
        ├── app.js             # 진입점 (탭/이벤트 바인딩)
        ├── api/               # API 레이어
        │   ├── auth.js        # 토큰 발급/관리
        │   ├── market.js      # 시세/종목/장운영
        │   ├── order.js       # 주문 CRUD
        │   └── account.js     # 계좌/자산
        ├── model/             # 데이터 모델
        │   ├── state.js       # 전역 상태
        │   └── stocks.js      # 종목 검색/캐시
        ├── presenter/         # 비즈니스 로직
        │   ├── trading.js     # 채팅 트레이딩
        │   ├── market.js      # 시세/차트
        │   ├── asset.js       # 자산/보유
        │   └── orders.js      # 주문내역
        └── view/              # UI 렌더링
            ├── chat.js        # 채팅 렌더링
            ├── chart.js       # 차트 렌더링
            ├── autocomplete.js# 자동완성
            └── components.js  # 공통 컴포넌트
```

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 로컬 실행
```bash
npm start
# http://localhost:3000 접속
```

### 3. Railway 배포
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/본인계정/toss-trading-dashboard.git
git push -u origin main
# Railway에서 GitHub 연결 후 자동 배포
```

## 🔑 API 키 설정

1. 토스증권 PC 웹 → 설정 → Open API
2. API Key (`tsck_live_...`) / Secret Key (`tssk_live_...`) 발급
3. 대시보드 우측 상단 **🔑 API 설정** 클릭 후 입력
4. 한번 입력하면 브라우저에 저장되어 자동 로그인

## 💬 채팅 사용법

```
삼성전자 1주 매수      → 잔고 확인 후 매수 주문
SK하이닉스 2주 팔아    → 보유수량 확인 후 매도 주문
삼성전자 얼마야?       → 현재가 조회
잔액 알려줘           → 매수 가능 금액 조회
장 열려있어?          → 국내장/미국장 운영 현황
네 / 응 / ㅇㅇ        → 주문 확정
아니 / 취소           → 주문 취소
```

## ⚠️ 주의사항

- 실제 계좌와 연동되어 **실매매가 실행**됩니다
- Railway 무료 플랜은 서버 재시작 시 IP가 바뀔 수 있습니다
- IP 변경 시 `/my-ip` 접속 후 토스증권 허용 IP 업데이트 필요

## 🛠 기술 스택

- **Frontend**: Vanilla JS (ES Modules), MVP 패턴
- **Backend**: Node.js, Express
- **Chart**: Lightweight Charts
- **배포**: Railway
- **API**: 토스증권 Open API v1.1.5
