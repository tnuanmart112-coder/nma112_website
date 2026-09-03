# Cloudflare 資料同步設計

## 目前資料來源

- Google Sheet：
  `https://docs.google.com/spreadsheets/d/1MxKJMaBHAe4d2xEc_IcCQQGDNk8nhfRIyQXUV7zFqaw/edit?usp=sharing`
- CSV 讀取 URL：
  `https://docs.google.com/spreadsheets/d/1MxKJMaBHAe4d2xEc_IcCQQGDNk8nhfRIyQXUV7zFqaw/export?format=csv`

目前讀到的主要欄位：

- `作品編號`
- `作品名`
- `作者`
- `作品理念`
- `創作類型`
- `媒材`
- `作品尺寸(cm)`
- `主圖連結`
- `附圖1連結`
- `附圖2連結`
- `附圖3連結`
- `附圖4連結`
- `附圖5連結`

## 前端讀取方式

React 前端透過 `VITE_EXHIBITION_API_URL` 決定正式 API 位置。

目前前端會優先讀 Worker API，作品頁開著時大約每 30 秒會重新請求一次。

若 Worker API 暫時讀不到，本機開發時會退回 `/sheet.csv` 臨時文字模式；如果 Sheet CSV 也讀不到，才會使用 `src/data/mockWorks.js` 的樣本資料，避免畫面完全空白。

正式部署後建議設定：

```text
VITE_EXHIBITION_API_URL=https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions
```

## Worker 職責

`worker/src/index.js` 目前提供：

- `GET /api/exhibitions`：讀取 R2 中整理好的 `data/exhibitions.json`。
- `POST /api/sync`：手動同步資料，需要 `Authorization: Bearer <SYNC_TOKEN>`。
- `scheduled()`：由 Cloudflare Cron Trigger 定期同步。

目前同步分成兩種：

1. **快速更新**：前端每 30 秒請求 `GET /api/exhibitions`，Worker 如果發現 `data/exhibitions.json` 已超過 30 秒，會重新讀 Google Sheet 並更新文字資料。
2. **完整排程同步**：Cron Trigger 每 15 分鐘執行一次，確保背景資料和圖片定期完整整理。

同步流程：

1. 讀取 Google Sheet CSV。
2. 將 CSV 轉成作品 JSON。
3. 若作品列有 `主圖連結`，下載主圖並存入 R2。
4. 若作品列有 `附圖1連結` 到 `附圖5連結`，下載有填寫的附圖並存入 R2；空白欄位會自動略過。
5. 主圖會存成 `works/<作品id>/main.<副檔名>`。
6. 附圖會存成 `works/<作品id>/gallery-01.<副檔名>`、`gallery-02.<副檔名>` 等。
7. 將整理後 JSON 存入 R2 的 `data/exhibitions.json`。

若圖片連結沒有改變，Worker 會沿用上一版 R2 圖片 key，不會每 30 秒重複下載與寫入圖片。

## 目前部署狀態

最後更新：2026-08-23

- R2 bucket 已建立：`nma112-exhibition-assets`
- Worker 已部署：`nma112-exhibition-sync`
- Worker URL：
  `https://nma112-exhibition-sync.tnuanmart112.workers.dev`
- 作品 API：
  `https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions`
- Cron Trigger 已啟用：每 15 分鐘同步一次。
- Worker API 快速刷新已啟用：資料超過 30 秒時，下一次 `GET /api/exhibitions` 會重新讀 Google Sheet。
- Cloudflare Pages production secret 已設定：
  `VITE_EXHIBITION_API_URL`

目前測試結果：

- Worker 可成功讀取 Google Sheet。
- Worker 可成功讀取 Google Drive 圖片。
- Worker 可成功將圖片寫入 R2。
- Worker 可透過 `/api/images/<image-key>` 回傳 R2 圖片。
- R2 中已存在 `data/exhibitions.json`。
- 目前讀到 3 筆作品資料。
- 已測試主圖與附圖欄位。
- `imageErrors` 為空。
- Worker secret `SYNC_TOKEN` 已設定，可保護手動同步 API。

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
      "key": "works/001/gallery-01.jpg",
      "url": "https://.../api/images/works%2F001%2Fgallery-01.jpg"
    }
  ]
}
```

不建議只給 Worker 一個 Google Drive 資料夾連結，因為公開資料夾的檔案列表不適合直接用簡單 fetch 穩定解析；若要讀資料夾內容，會需要 Google Drive API 與更完整的權限設定。

## 手動同步 API

手動同步端點：

```text
POST https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/sync
```

必須帶：

```text
Authorization: Bearer <SYNC_TOKEN>
```

前端已新增隱藏管理頁：

```text
/admin
```

網頁組可以在 `/admin` 輸入同步密碼並按「手動同步 Google Sheet」，Worker 會立即重新讀取 Google Sheet、下載 Google Drive 圖片、寫入 R2，最後回傳：

- `updatedAt`：這次同步完成時間。
- `count`：同步到的作品數量。
- `imageErrors`：圖片下載或寫入 R2 時發生的錯誤。

`/admin` 不會放進一般導覽列，避免觀眾在前台看到後台入口。

## Cloudflare Images / Image Transformations 研究

Cloudflare Images 的 Image Transformations 可以協助「輸出給瀏覽器時」最佳化圖片，例如：

- 縮小圖片寬高。
- 設定輸出品質，例如 `quality: 80`。
- 依瀏覽器支援輸出 WebP 或 AVIF。
- 快取同一組轉換結果，後續訪客可以直接吃快取。

對目前架構來說，要分成兩件事理解：

1. **R2 仍然存原始圖片**：同學上傳到 Google Drive 的原圖同步進 R2 後，R2 裡保存的是原始檔。
2. **網站顯示時可以壓縮輸出**：訪客打開作品頁時，Worker 可以把 R2 圖片經過 Cloudflare Images 或 Image Transformations 處理後再回傳。

如果目標是讓網頁載入更快，建議下一階段改 Worker 的 `/api/images/...`，讓它回傳適合網頁尺寸的 WebP/AVIF 圖片。

如果目標是減少 R2 儲存容量，則需要在同步圖片時另外產生壓縮版並存回 R2，這是另一個流程。

目前先不直接改圖片輸出流程，因為要先決定：

- 前台卡片圖需要多大尺寸。
- 作品詳細頁是否要看原圖。
- 是否要保留下載原圖需求。
- 是否要啟用 Cloudflare Images / Transformations 的額度控管。

官方文件目前顯示 Free plan 每月包含 5,000 次 unique transformations；超過後既有快取仍會服務，但新的 transformation 會回傳錯誤，因此正式使用前要控管圖片尺寸版本數量。

## 需要你之後提供或確認

1. 是否要使用自訂網域服務 R2 圖片，或全部透過 Worker 代理。
2. 下一次 GitHub push 後，確認 Cloudflare Pages build 是否已吃到 `VITE_EXHIBITION_API_URL`。
3. 是否要把 `/api/images/...` 加上 Cloudflare Images / Image Transformations 最佳化。

## 目前限制

Google Drive 圖片下載目前假設圖片檔案是公開可讀，且能透過 file id 下載。
如果 Drive 回傳權限頁或確認頁，Worker 會記錄 image sync error，之後需要改成 Google API/OAuth 或服務帳號流程。
