# nma112_website

新媒體藝術學系 112 級畢業展網站。

目前已從單一 HTML/CSS/JS 靜態頁整理為 React + Vite 前端架構，並預留 Cloudflare Workers + R2 的作品資料同步流程。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

Cloudflare Pages 建議設定：

- Build command: `npm run build`
- Build output directory: `dist`

## 資料流

前端會透過 `VITE_EXHIBITION_API_URL` 讀取作品 API。尚未設定時會使用本地 mock data。

完整資料同步設計請看 `docs/cloudflare-data-sync.md`。

網站維護流程請看 `docs/maintenance-manual.md`。
