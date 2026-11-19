# MASTER MARKET COMPASS · GitHub Pages

미국·한국 주식 섹터, 장기 사이클, 글로벌 자금순환, 금·구리·코인 비교를 제공하는 정적 웹앱입니다. 기존 KOSPI 50과 코인 컴퍼스 화면은 각각 `docs/legacy/`에서 열립니다.

## GitHub Pages 배포

1. ZIP을 풀고 저장소 루트에 `docs` 폴더를 올립니다. `docs/index.html`과 함께 CSS, JS, `legacy` 하위 폴더를 모두 올립니다.
2. GitHub 저장소의 **Settings → Pages → Build and deployment**에서 **Deploy from a branch**를 선택합니다. 브랜치를 **main**, 폴더를 **/docs**로 지정하고 저장합니다.
3. 배포 후 **Settings → Pages**에 표시되는 주소를 엽니다. `kospi50_pbr`의 기존 루트 `index.html`과 `worker.js`는 그대로 보관할 수 있습니다. 이미 해당 저장소가 GitHub Pages의 배포 소스로 사용 중이면 이 설정을 바꿀 때 기존 Pages 주소의 첫 화면이 새 앱으로 바뀝니다. 두 주소를 각각 유지하려면 새 저장소를 사용하세요.

GitHub 안내 문서  
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 실측 데이터와 Worker 연결

- 처음 열면 합성 데모가 표시됩니다. **데이터 설정**의 **JSON 예제 받기**에서 스키마 샘플을 내려받을 수 있습니다. 실측 스냅샷 JSON을 직접 불러오거나 CORS를 허용하는 HTTPS 주소를 입력합니다. 결측·지연 상태가 화면에 표시됩니다.
- 한국주식 Worker를 이미 운영 중이면 **데이터 설정**에 해당 주소를 입력합니다. 한국주식의 **장기 사이클 → 시세·기존 분석 조회**에서 기존 `/detail` API를 호출합니다. Worker 원본은 `workers/korea/worker.js`입니다.
- 코인 컴퍼스는 기존 Worker 주소를 기본 사용합니다. 코인 Worker 참고 소스는 `workers/crypto/worker.js`에 있습니다. 기존 Worker의 KV와 Telegram 환경 설정은 Cloudflare에서 관리합니다. API 키나 Telegram 토큰을 공개 저장소에 올리지 마세요.
- 두 Worker는 별도 서비스입니다. GitHub Pages 배포만 진행하면 기존 Worker는 계속 운영할 수 있습니다. 주식 데이터 자동 수집·월말 배치·신규 Telegram 발송은 별도 운영 작업입니다.

## 로컬 확인

압축을 푼 폴더에서 `python3 -m http.server 8000 --directory docs`를 실행하고 `http://localhost:8000`을 엽니다.
