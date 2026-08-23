# Cloudflare 資料同步設計

## 目前資料來源

- Google Sheet：
  `https://docs.google.com/spreadsheets/d/1NnxwN4CLQGogszMpOHnaMlK2ePeUQu0PRl8DBJE5-bU/edit?usp=sharing`
- CSV 讀取 URL：
  `https://docs.google.com/spreadsheets/d/1NnxwN4CLQGogszMpOHnaMlK2ePeUQu0PRl8DBJE5-bU/export?format=csv`

目前讀到的主要欄位：

- `作品名`
- `作者`
- `作品理念`
- `創作類型`
- `媒材`
- `作品尺寸(cm)`
- `安裝方式`
- `Google Drive 圖片連結`

## 前端讀取方式

React 前端透過 `VITE_EXHIBITION_API_URL` 決定正式 API 位置。

若尚未設定此環境變數，前端會使用 `src/data/mockWorks.js` 的樣本資料，方便先開發畫面。

正式部署後建議設定：

```text
VITE_EXHIBITION_API_URL=https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions
```

## Worker 職責

`worker/src/index.js` 目前提供：

- `GET /api/exhibitions`：讀取 R2 中整理好的 `data/exhibitions.json`。
- `POST /api/sync`：手動同步資料，需要 `Authorization: Bearer <SYNC_TOKEN>`。
- `scheduled()`：由 Cloudflare Cron Trigger 定期同步。

同步流程：

1. 讀取 Google Sheet CSV。
2. 將 CSV 轉成作品 JSON。
3. 若作品列有 Google Drive 圖片連結，嘗試下載圖片。
4. 將圖片存入 R2 的 `works/<作品id>.<副檔名>`。
5. 將整理後 JSON 存入 R2 的 `data/exhibitions.json`。

## 目前部署狀態

最後更新：2026-08-23

- R2 bucket 已建立：`nma112-exhibition-assets`
- Worker 已部署：`nma112-exhibition-sync`
- Worker URL：
  `https://nma112-exhibition-sync.tnuanmart112.workers.dev`
- 作品 API：
  `https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions`
- Cron Trigger 已啟用：每 15 分鐘同步一次。
- Cloudflare Pages production secret 已設定：
  `VITE_EXHIBITION_API_URL`

目前測試結果：

- Worker 可成功讀取 Google Sheet。
- Worker 可成功讀取 Google Drive 圖片。
- Worker 可成功將圖片寫入 R2。
- Worker 可透過 `/api/images/<image-key>` 回傳 R2 圖片。
- R2 中已存在 `data/exhibitions.json`。
- 目前讀到 2 筆作品資料。
- `imageErrors` 為空。

## 多張圖片資料格式

目前 Worker 已支援主圖與附圖欄位：

```text
主圖連結
附圖1連結
附圖2連結
附圖3連結
附圖4連結
附圖5連結
```

空白附圖欄位會自動略過，所以每件作品可以有不同附圖數量。

例如：

- 作品 A：只填 `主圖連結`
- 作品 B：填 `主圖連結`、`附圖1連結`、`附圖2連結`
- 作品 C：填 `主圖連結` 到 `附圖5連結`

Worker 會將資料整理成：

```json
{
  "coverImage": {
    "key": "works/001/main.jpg",
    "url": "https://.../api/images/works%2F001%2Fmain.jpg"
  },
  "galleryImages": [
    {
      "key": "works/001/01.jpg",
      "url": "https://.../api/images/works%2F001%2F01.jpg"
    }
  ]
}
```

不建議只給 Worker 一個 Google Drive 資料夾連結，因為公開資料夾的檔案列表不適合直接用簡單 fetch 穩定解析；若要讀資料夾內容，會需要 Google Drive API 與更完整的權限設定。

## 需要你之後提供或確認

1. 是否要使用自訂網域服務 R2 圖片，或全部透過 Worker 代理。
2. Worker secret `SYNC_TOKEN`，用來保護手動同步 API。
3. 下一次 GitHub push 後，確認 Cloudflare Pages build 是否已吃到 `VITE_EXHIBITION_API_URL`。

## 目前限制

Google Drive 圖片下載目前假設圖片檔案是公開可讀，且能透過 file id 下載。
如果 Drive 回傳權限頁或確認頁，Worker 會記錄 image sync error，之後需要改成 Google API/OAuth 或服務帳號流程。
