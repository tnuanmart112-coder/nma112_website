# 網站維護教學手冊

這份文件給網頁組與展覽團隊維護使用。

## 一句話版本

平常更新作品資料時，主要改 Google Sheet 和 Google Drive；網站程式碼不用每次都改。

正式串接完成後，流程會是：

```text
改 Google Sheet / Google Drive
        |
        v
Cloudflare Worker 定期同步
        |
        v
Cloudflare R2 儲存圖片與整理後資料
        |
        v
網站自動讀到更新後的資料
```

## 開會講解順序

如果要跟夥伴解釋整個專案，可以照這個順序講：

1. 先講資料更新方式：平常改 Google Sheet 和 Google Drive，不需要改程式。
2. 再講雲端同步：作品頁每 30 秒向 Worker 要資料；Worker 會快速刷新 Sheet 文字，並每 15 分鐘做一次完整背景同步。
3. 再講前端架構：`src/pages/` 是分頁，`src/components/` 是畫面零件，`src/services/` 是資料來源。
4. 接著講每個資料夾和檔案：照「資料夾總覽」與「每個檔案的作用與修改時機」講。
5. 補充後台同步頁：`/admin` 可以手動同步資料，但不會出現在觀眾導覽列。
6. 最後講 Git 流程：開分支、commit、push、Pull Request、Cloudflare Pages 自動部署。

## 目前維護狀態

最後確認日期：2026-09-03

- 正式前端部署專案：Cloudflare Pages 的 `nma112-website`。
- 正式後端同步專案：Cloudflare Worker 的 `nma112-exhibition-sync`。
- 正式程式分支：`main`。
- 作品資料來源已改為目前這份 Google Sheet。
- Google Sheet 可以有一列表格大標題；程式會自動找到包含 `作品名` 和 `作者` 的欄位列開始讀資料。
- Worker 已啟用 R2 同步，會把 Google Drive 圖片存進 `nma112-exhibition-assets`。
- 自動完整同步頻率目前維持每 15 分鐘一次。
- 作品頁會每 30 秒重新向 Worker 要資料；Worker 也會在資料超過 30 秒時重新讀 Google Sheet 文字。
- `/admin` 後台手動同步已啟用。
- 後台同步密碼已於 2026-09-03 更新，實際密碼由網頁組私下保存，不寫進 GitHub 文件。

## 作品文字資料在哪裡改

作品文字資料請改 Google Sheet：

`https://docs.google.com/spreadsheets/d/1MxKJMaBHAe4d2xEc_IcCQQGDNk8nhfRIyQXUV7zFqaw/edit?usp=sharing`

目前前端會讀的主要欄位：

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

目前不會在觀眾頁面顯示：

- `安裝方式`
- 展場需求
- 用電設備
- 系上器材
- 備註等內部規劃欄位

## 作品圖片在哪裡改

圖片請放在 Google Drive，並在 Google Sheet 的 `主圖連結`、`附圖1連結` 到 `附圖5連結` 欄位貼上對應圖片連結。

注意事項：

1. 圖片檔案或資料夾要設定成「知道連結者可檢視」或更高權限。
2. 每件作品建議放一張主要展示圖。
3. 圖片檔名建議包含作者或作品名稱，方便日後查找。
4. 不建議直接在網站程式裡放作品圖片，後續會統一由 Cloudflare R2 供應。

## 作品圖片整理規範

目前網站程式已支援：

- 1 張主圖
- 0 到 5 張附圖

Google Sheet 圖片欄位目前使用：

```text
主圖連結
附圖1連結
附圖2連結
附圖3連結
附圖4連結
附圖5連結
```

如果某件作品只有 2 張附圖，就只填 `附圖1連結` 和 `附圖2連結`，後面的欄位保持空白即可。

如果某件作品有 5 張附圖，就填到 `附圖5連結`。

Worker 同步時會自動忽略空白欄位，所以每件作品可以有不同數量的附圖。

如果 `主圖連結` 空白但 `附圖1連結` 有填，作品列表會暫時用第一張附圖當封面。不過正式資料整理時，仍建議每件作品都填 `主圖連結`，封面會比較穩定。

原因是：

1. Worker 比較容易知道哪張是主圖、哪張是附圖。
2. 前端可以穩定顯示封面與輪播/圖集。
3. 不需要額外串 Google Drive API 來讀資料夾內容。
4. 同學換圖時，只要換掉 Sheet 裡對應欄位的圖片連結。

仍然建議每位同學在 Google Drive 建立自己的作品資料夾，但 Sheet 裡要貼「單張圖片檔案連結」，不要只貼資料夾連結。

建議資料夾命名：

```text
作品編號_作者_作品名
```

例如：

```text
001_黃塏升_Rominator
002_陳品蓁_測試02作品名稱
```

建議圖片檔名：

```text
作品編號_作品名_main
作品編號_作品名_01
作品編號_作品名_02
作品編號_作品名_03
作品編號_作品名_04
作品編號_作品名_05
```

例如：

```text
001_Rominator_main.png
001_Rominator_01.jpg
001_Rominator_02.jpg
001_Rominator_03.jpg
```

不要只用：

```text
IMG_0001.jpg
截圖.png
作品照片.jpg
```

這樣之後資料多了會很難維護。

### 同學更新圖片後會不會重新進 R2

會。

只要同學更新 Google Sheet 裡的圖片連結，Worker 下一次同步時會重新讀取連結並把圖片存進 R2。

目前完整同步頻率是每 15 分鐘一次。另有一個 30 秒快速更新機制：作品頁每 30 秒向 Worker 要資料，Worker 發現資料超過 30 秒時會重新讀 Google Sheet 文字。

注意：

- 如果是同一件作品、同一個圖片欄位換新連結，R2 會用新的圖片覆蓋對應位置。
- 如果圖片格式從 `.png` 換成 `.jpg`，舊的 R2 圖片可能會殘留，之後需要加清理機制。
- 如果只是 Google Drive 裡同一個檔案內容被替換，但分享連結不變，Worker 是否能抓到最新版取決於 Google Drive 回傳內容與快取狀態；比較穩定的做法是換圖後更新 Sheet 裡的連結。

## 網站什麼時候會更新

正式部署後，Cloudflare Worker 會定期同步 Google Sheet 與 Google Drive。

目前規則：

- 自動完整同步：每 15 分鐘一次。
- 手動同步：由網頁組或管理者透過 Worker 的後台 API 觸發。
- 前端重新抓資料：作品頁開著時，測試期間大約每 30 秒會重新向 Worker 要一次資料。
- Worker 快速刷新：Worker 會在資料超過 30 秒時重新讀 Google Sheet 文字。
- Worker API 快取：目前作品 JSON 回應不使用瀏覽器快取，讓 30 秒測試比較容易看出變化。

因此一般狀況下：

1. 你改完 Google Sheet 或 Drive 圖片。
2. 文字資料通常 30 秒左右會被 Worker 重新讀取，作品頁開著時也會每 30 秒重新抓資料。
3. 圖片連結如果有變，Worker 也會在快速刷新時嘗試同步新圖片；圖片連結沒變時會沿用 R2 裡既有圖片，不會每 30 秒重複寫入。

如果正在開會、測試資料或需要立刻確認畫面，建議不要等排程，直接進 `/admin` 按手動同步。

可以用這個方式判斷：

- 不急：改完 Sheet 後等作品頁自動更新，文字資料約 30 秒左右會更新。
- 急著看：進 `/admin` 手動同步，成功後回 `/作品介紹` 重新整理。
- 只改程式碼：需要 commit、push，等 Cloudflare Pages 自動部署。
- 只改作品文字或圖片：不需要 commit、push，只需要等 Worker 同步或手動同步。

## 後台手動同步

如果想立刻同步，或正在開會測試資料，可以由網頁組使用隱藏管理頁手動同步。

管理頁網址：

```text
http://127.0.0.1:5173/admin
```

正式網站也可以直接在正式網域後面加：

```text
/admin
```

使用方式：

1. 打開 `/admin`。
2. 在「同步密碼」輸入 Worker 的 `SYNC_TOKEN`。目前密碼已於 2026-09-03 更新為簡短版本，請向網頁負責人索取。
3. 按「手動同步 Google Sheet」。
4. 成功後會看到更新時間、作品數量、圖片錯誤數。
5. 再回到 `/作品介紹` 重新整理頁面確認。

注意事項：

- `/admin` 不會出現在一般導覽列，觀眾正常瀏覽不會看到。
- `SYNC_TOKEN` 是後台密碼，不要貼在公開文件、Google Sheet、GitHub commit 或前台程式。
- 如果同步成功但作品頁沒更新，先重新整理作品頁；Cloudflare 快取最多可能等約 1 分鐘。
- 如果「圖片錯誤」不是 0，代表某些 Google Drive 圖片可能權限不對、連結不是單一圖片檔，或 Drive 回傳了非圖片內容。

## 觀眾會看到哪些分頁

目前網站分為：

- `/`：主畫面
- `/作品介紹`
- `/活動資訊`
- `/周邊商品`
- `/參觀地圖`

目前 `活動資訊`、`周邊商品`、`參觀地圖` 是頁面骨架，之後可以再補正式內容。

另外有一個隱藏管理頁：

- `/admin`：後台手動同步，不放在觀眾導覽列。

## 程式碼在哪裡

現在網站已經不是單一 HTML，而是 React + Vite 專案。

可以先用這個方式理解：

```text
index.html
  -> src/main.jsx
    -> src/App.jsx
      -> src/pages/*
        -> src/components/*
          -> src/hooks/*
            -> src/services/*
              -> src/utils/*
```

意思是：

1. `index.html` 只是網站最外層入口。
2. `src/main.jsx` 把 React 掛到網頁上。
3. `src/App.jsx` 決定目前顯示哪一個分頁。
4. `src/pages/` 放每個頁面。
5. `src/components/` 放頁面裡會重複使用的畫面零件。
6. `src/hooks/` 放資料載入與狀態管理。
7. `src/services/` 負責跟外部資料來源溝通。
8. `src/utils/` 負責資料整理、CSV 解析等工具。

## 資料夾總覽

### 專案根目錄

根目錄放的是整個網站專案的設定檔與入口檔。

常見會看到：

- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `wrangler.jsonc`
- `.env.example`
- `.gitignore`
- `README.md`
- `style.css`
- `script.js`

其中 `style.css` 和 `script.js` 是原本單一 HTML 時代留下的檔案，目前主要前端已改由 `src/` 裡的 React 檔案接管。之後如果確認完全不需要，可以再整理移除；目前先保留是為了對照舊版。

### `src/`

`src/` 是前端主要程式碼所在處。

之後只要是改畫面、改分頁、改作品卡片、改資料顯示，大部分都會在這裡。

### `src/components/`

放「可以被頁面使用的畫面元件」。

例如：

- 導覽列
- 背景
- 首頁介紹文字
- 作品列表容器
- 作品卡片
- 載入/錯誤狀態訊息

如果只是想改某個畫面區塊的長相，通常先找這裡。

### `src/pages/`

放「每一個分頁」。

目前對應：

- `/`
- `/作品介紹`
- `/活動資訊`
- `/周邊商品`
- `/參觀地圖`
- `/admin`：隱藏後台同步頁，不放在一般導覽列。

如果要新增一個完整分頁，通常會在這裡新增檔案，然後去 `src/App.jsx` 和 `src/components/SiteNav.jsx` 註冊。

### `src/hooks/`

放 React 的資料狀態邏輯。

目前主要是 `useExhibitionData.js`，負責：

- 載入作品資料
- 管理 `loading`
- 管理 `error`
- 管理 `data`
- 每 300 秒重新抓一次資料

如果要改作品資料多久更新一次，會改這裡。

### `src/services/`

放「跟外部資料來源溝通」的程式。

目前主要是 `googleSheetsService.js`。

目前本機和正式部署都會優先讀 Cloudflare Worker API。只有 Worker API 讀不到時，本機才會退回 `/sheet.csv` 臨時文字模式。

### `src/utils/`

放工具函式。

目前有：

- `csvParser.js`：把 CSV 文字拆成一列一列資料。
- `dataFormatter.js`：把 Sheet 欄位整理成前端作品卡片需要的格式。

如果 Google Sheet 欄位名稱改掉，或新增要顯示的欄位，通常會改這裡。

### `src/data/`

放本地樣本資料。

目前 `mockWorks.js` 是當 Google Sheet 或 Worker API 讀不到時的備用資料。

正式上線後，這裡不是主要資料來源，只是開發備援。

### `src/styles/`

放網站樣式。

目前主要樣式在 `global.css`。

如果要改顏色、字距、版面寬度、卡片樣式、手機版樣式，通常會改這裡。

### `public/`

放會直接被網站公開取用的靜態檔案。

目前有：

- `_redirects`

`_redirects` 是給 Cloudflare Pages 用的設定，讓 `/作品介紹`、`/活動資訊` 這種分頁網址重新整理時，也能回到 React 網站入口。

如果之後要放 favicon、固定不變的小圖示，也可以放在 `public/`。

### `worker/`

放 Cloudflare Worker 後端同步程式。

目前主要檔案是 `worker/src/index.js`。

正式啟用 R2 後，Worker 會負責：

- 讀 Google Sheet
- 讀 Google Drive 圖片
- 把圖片存到 R2
- 把整理後資料提供給前端

如果只是改前端畫面，不需要動 `worker/`。

### `docs/`

放專案文件與交接說明。

目前有：

- `maintenance-manual.md`
- `cloudflare-data-sync.md`

如果之後有新的後台流程、部署流程、資料欄位規則，建議都補到 `docs/`。

## 每個檔案的作用與修改時機

### 根目錄檔案

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `index.html` | 網站最外層 HTML 入口，裡面有 `<div id="root"></div>` 讓 React 掛上去。 | 很少改。通常只有改網站標題、meta、外部字體或 SEO 設定時才改。 |
| `package.json` | 記錄專案名稱、指令、依賴套件。 | 新增套件、改 npm 指令時會改。 |
| `package-lock.json` | 鎖定套件版本，確保大家安裝到一樣的依賴。 | 跑 `npm install` 後可能自動更新。要一起 commit。 |
| `vite.config.js` | Vite 開發伺服器與建置設定。現在包含本機 `/sheet.csv` proxy。 | 要改本機代理、建置設定、Vite plugin 時會改。 |
| `wrangler.jsonc` | Cloudflare Worker 設定，包含 Worker 名稱、R2 bucket、Cron 排程、環境變數。 | 部署 Worker、改 R2 bucket、改同步排程時會改。 |
| `.env.example` | 環境變數範例，給大家知道本機或 Pages 可以設定什麼。 | 新增環境變數時會改。 |
| `.gitignore` | 告訴 Git 哪些檔案不要追蹤，例如 `node_modules/`、`dist/`、`.env`。 | 有新的本機產物不想 commit 時會改。 |
| `README.md` | 專案簡介與快速指令。 | 專案流程大改、指令更新時會改。 |
| `style.css` | 舊版單頁 HTML 使用的樣式。現在主要樣式已移到 `src/styles/global.css`。 | 通常不改。之後若清理舊檔才處理。 |
| `script.js` | 舊版單頁 HTML 使用的 JavaScript。現在主要邏輯已移到 React。 | 通常不改。之後若清理舊檔才處理。 |

### `src/` 前端入口

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/main.jsx` | React 入口，把 `App` 掛到 `index.html` 的 `root`。 | 幾乎不改。通常只有新增全域套件或全域設定時才改。 |
| `src/App.jsx` | 網站分頁路由中心，決定 `/`、`/作品介紹` 等網址要顯示哪個頁面。 | 新增、刪除、改分頁路徑時會改。 |

### `src/pages/` 分頁檔案

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/pages/MainPage.jsx` | 主畫面，現在放首頁介紹內容。 | 主畫面要加區塊或調整首頁結構時改。 |
| `src/pages/WorksPage.jsx` | 作品介紹頁，載入作品列表。 | 作品頁整體排版要改時改。 |
| `src/pages/ActivityInfoPage.jsx` | 活動資訊頁，目前是骨架。 | 要放講座、活動時程、表演資訊時改。 |
| `src/pages/MerchandisePage.jsx` | 周邊商品頁，目前是骨架。 | 要放商品照片、價格、購買資訊時改。 |
| `src/pages/MapPage.jsx` | 參觀地圖頁，目前是骨架。 | 要放展場地圖、交通方式、動線資訊時改。 |
| `src/pages/AdminPage.jsx` | 隱藏後台同步頁，讓網頁組手動同步 Google Sheet 與圖片。 | 要改後台同步畫面、結果顯示、錯誤提示時改。 |

### `src/components/` 畫面元件

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/components/SiteNav.jsx` | 上方導覽列，包含主畫面、作品介紹、活動資訊、周邊商品、參觀地圖。 | 新增分頁、改分頁名稱、改導覽順序時改。 |
| `src/components/SiteBackground.jsx` | 網站固定背景。 | 背景結構要大改時改；只改顏色通常去 `global.css`。 |
| `src/components/IntroSection.jsx` | 首頁展覽介紹文字，中英介紹都在這裡。 | 改首頁展覽論述、標題、英文文案時改。 |
| `src/components/DataContainer.jsx` | 作品資料容器，負責呼叫 hook、處理 loading/error/empty 狀態，並渲染作品卡片列表。 | 改作品列表區整體結構、載入狀態、空資料提示時改。 |
| `src/components/ExhibitionCard.jsx` | 單張作品卡片。 | 改作品卡片顯示欄位、排版、圖片位置時改。 |
| `src/components/StatusMessage.jsx` | 狀態訊息，例如載入中、錯誤、沒有資料。 | 改提示文字版型或狀態樣式時改。 |

### `src/hooks/` 資料狀態

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/hooks/useExhibitionData.js` | 作品資料狀態管理。會呼叫資料服務、設定 loading/error/data，並每 300 秒更新一次。 | 改更新頻率、錯誤處理、資料載入策略時改。 |

目前作品頁重新抓資料頻率在這行：

```js
const POLL_INTERVAL_MS = 30000;
```

`30000` 毫秒等於 30 秒。

### `src/services/` 資料來源

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/services/googleSheetsService.js` | 前端資料服務。優先讀 Worker API；讀不到時，本機會退回 `/sheet.csv` 臨時文字模式；再失敗才用 mock data。 | 改 API URL 邏輯、改資料取得方式、改 fallback 策略時改。 |
| `src/services/exhibitionApi.js` | 保留相容用，現在轉接到 `googleSheetsService.js`。 | 通常不改。之後若確認沒人引用，可以清掉。 |
| `src/services/syncService.js` | 後台同步服務。`/admin` 會透過它呼叫 Worker 的 `POST /api/sync`。 | 改手動同步 API 位置、授權 header、錯誤處理時改。 |

### `src/utils/` 工具

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/utils/csvParser.js` | 把 Google Sheet CSV 文字解析成 JavaScript 物件陣列。 | 通常不改。除非 CSV 格式或解析方式出問題。 |
| `src/utils/dataFormatter.js` | 把 Sheet 欄位轉成作品卡片需要的格式，例如 `作品名` 轉成 `title`。 | Sheet 欄位名稱改掉、新增顯示欄位、作品資料格式改變時改。 |

例如如果 Sheet 新增 `展區` 欄位，而且作品卡要顯示，就通常要改：

1. `src/utils/dataFormatter.js`
2. `src/components/ExhibitionCard.jsx`
3. 可能也要改 `worker/src/index.js`

### `src/data/` 樣本資料

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/data/mockWorks.js` | 本地備用作品資料。當 Sheet 或 Worker 讀不到時，前端用它避免畫面完全空白。 | 想更新開發用假資料、測試卡片排版時改。 |

### `src/styles/` 樣式

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `src/styles/global.css` | 全站主要樣式，包含背景、導覽列、首頁、作品卡片、分頁骨架、手機版樣式。 | 改視覺設計、顏色、間距、排版、手機版時改。 |

### `public/` 靜態檔案

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `public/_redirects` | Cloudflare Pages 路由設定。讓使用者直接開 `/作品介紹` 時也能載入 React 網站。 | 新增 React 分頁通常不需要改；除非部署路由規則要調整。 |

### `worker/` Cloudflare Worker

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `worker/src/index.js` | Cloudflare Worker 程式。負責同步 Sheet、處理 Drive 圖片、讀寫 R2、提供 API 給前端。 | R2 啟用後要調整同步流程、改 Sheet 欄位、改圖片處理、改 API 時改。 |

### `docs/` 文件

| 檔案 | 作用 | 什麼時候會改 |
| --- | --- | --- |
| `docs/maintenance-manual.md` | 網站維護教學手冊，也就是這份文件。 | 流程改變、新增指令、新增頁面、新增維護規則時改。 |
| `docs/cloudflare-data-sync.md` | Cloudflare Worker / R2 / Google Sheet 同步設計。 | 後端同步架構、R2 bucket、Worker API、環境變數改變時改。 |

## 常見修改情境要去哪裡改

### 改首頁文字

修改：

```text
src/components/IntroSection.jsx
```

### 改導覽列文字或新增分頁

通常修改：

```text
src/components/SiteNav.jsx
src/App.jsx
src/pages/<新分頁>.jsx
```

### 改作品卡片顯示欄位

通常修改：

```text
src/components/ExhibitionCard.jsx
src/utils/dataFormatter.js
```

如果正式 Worker 已啟用，也可能需要改：

```text
worker/src/index.js
```

### 改作品資料來源

通常修改：

```text
src/services/googleSheetsService.js
worker/src/index.js
wrangler.jsonc
```

### 改網站顏色、字體、間距、手機版

通常修改：

```text
src/styles/global.css
```

### 改活動資訊頁

修改：

```text
src/pages/ActivityInfoPage.jsx
```

### 改周邊商品頁

修改：

```text
src/pages/MerchandisePage.jsx
```

### 改參觀地圖頁

修改：

```text
src/pages/MapPage.jsx
```

### 改 Sheet 欄位名稱

如果只是 Google Sheet 內容改了，不需要改程式。

如果是欄位名稱改了，例如 `作品名` 改成 `作品名稱`，可能要改：

```text
src/utils/dataFormatter.js
worker/src/index.js
```

### 改同步時間

前端本機輪詢時間：

```text
src/hooks/useExhibitionData.js
```

Cloudflare Worker 定期同步時間：

```text
wrangler.jsonc
```

### 改 Cloudflare Worker 或 R2 設定

通常修改：

```text
wrangler.jsonc
worker/src/index.js
docs/cloudflare-data-sync.md
```

### 只改作品文字

只要改 Google Sheet。

不需要改程式、不需要 commit、不需要 push。

### 只改作品圖片

目前先改 Google Drive 圖片與 Sheet 的 `主圖連結` / `附圖1連結` 到 `附圖5連結`。

Worker 會同步圖片到 R2。

不需要改前端程式。

## 第一次從 GitHub 拿專案

如果夥伴還沒有這份專案，先安裝 Node.js，再從 GitHub clone 專案。

```bash
git clone <GitHub repo URL>
cd nma112_website
npm install
npm run dev
```

執行後終端機會顯示本機網址，通常是：

```text
http://127.0.0.1:5173/
```

開啟作品頁：

```text
http://127.0.0.1:5173/作品介紹
```

第一次一定要跑 `npm install`。之後如果 `package.json` 或 `package-lock.json` 有更新，也要再跑一次 `npm install`。

## 每次開始修改前

開始改網站程式前，先把 GitHub 上最新版本拉回來。

```bash
git pull
npm install
npm run dev
```

如果只是改 Google Sheet 的作品文字資料，不需要 pull、commit 或 push 程式碼。

## 本機常用指令

啟動本機預覽：

```bash
npm run dev
```

檢查正式建置是否成功：

```bash
npm run build
```

預覽 build 後的正式版本：

```bash
npm run preview
```

建議每次 push 前至少跑一次：

```bash
npm run build
```

如果 build 失敗，先不要 push，應該先修錯誤。

## Cloudflare Pages 設定

Cloudflare Pages 建議設定：

- Build command：`npm run build`
- Build output directory：`dist`
- Production branch：依 GitHub repo 實際分支，例如 `main`

正式串 Worker 後，需要在 Cloudflare Pages 設定環境變數：

```text
VITE_EXHIBITION_API_URL=https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions
```

設定後要重新部署 Pages，前端才會讀正式 Worker API。

## Cloudflare Worker / R2 設定

R2 bucket 名稱：

```text
nma112-exhibition-assets
```

Worker 名稱：

```text
nma112-exhibition-sync
```

Worker URL：

```text
https://nma112-exhibition-sync.tnuanmart112.workers.dev
```

Worker 主要 API：

- `GET /api/exhibitions`：前端讀作品資料。
- `GET /api/images/<image-key>`：讀 R2 裡的作品圖片。
- `POST /api/sync`：手動同步資料，僅管理者使用。

手動同步 API 需要 `SYNC_TOKEN`，不要公開給觀眾或放在前端。

目前後台同步密碼已於 2026-09-03 更新，請由網頁負責人私下保管。不要把實際密碼寫進 GitHub、Google Sheet、公開文件或前台程式。

如果之後要更換後台同步密碼，由負責 Cloudflare 的人執行：

```bash
npx wrangler secret put SYNC_TOKEN
```

終端機會要求輸入新的密碼。輸入後不要把密碼 commit 到 GitHub。

## 發佈網站更新

修改程式後：

1. 在本機確認畫面。
2. 執行 `npm run build` 確認可以建置。
3. commit 並 push 到 GitHub。
4. Cloudflare Pages 會自動部署。

平常只改作品文字或圖片時，不需要 push 程式碼。

## Git commit 與 push 流程

確認目前修改了哪些檔案：

```bash
git status
```

把修改加入 commit：

```bash
git add .
```

建立 commit：

```bash
git commit -m "更新網站內容"
```

推上 GitHub：

```bash
git push
```

完整流程通常會長這樣：

```bash
git pull
npm install
npm run dev
npm run build
git status
git add .
git commit -m "更新網站內容"
git push
```

commit 訊息可以依實際修改內容調整，例如：

```bash
git commit -m "新增活動資訊頁內容"
git commit -m "調整作品卡片樣式"
git commit -m "更新參觀地圖頁"
```

如果 `git pull` 時出現衝突，不要亂刪檔案，先找負責程式的人一起處理。

## Git 分支協作流程

多人一起改網站時，建議使用分支。

基本原則：

- `main`：穩定版本，通常會連到 Cloudflare Pages 自動部署。
- 功能分支：每個人改自己的功能，不直接在 `main` 上改。
- 修改完成後，再透過 GitHub Pull Request 合回 `main`。

常見分支名稱：

```text
feature/works-page
feature/activity-info
feature/map-page
fix/mobile-layout
docs/maintenance-manual
```

### 建立新分支

開始做新功能前，先回到 `main` 並拉最新版本：

```bash
git switch main
git pull
```

建立並切到新分支：

```bash
git switch -c feature/activity-info
```

接著就可以修改檔案。

### 把分支推到 GitHub

修改完成後：

```bash
npm run build
git status
git add .
git commit -m "新增活動資訊頁內容"
git push -u origin feature/activity-info
```

第一次 push 新分支時要加：

```bash
-u origin <分支名稱>
```

之後同一個分支再 push，只需要：

```bash
git push
```

### 切換既有分支

查看所有分支：

```bash
git branch
```

切換到某個分支：

```bash
git switch feature/activity-info
```

如果分支在 GitHub 上，但本機還沒有：

```bash
git fetch
git switch <分支名稱>
```

### 合回 main 的建議方式

建議在 GitHub 網頁上開 Pull Request，請另一位夥伴看過後再合併。

流程：

1. push 功能分支到 GitHub。
2. 到 GitHub 開 Pull Request。
3. 確認沒有衝突。
4. 合併到 `main`。
5. Cloudflare Pages 會因為 `main` 更新而自動部署。

### 什麼時候不需要開分支

只改 Google Sheet 作品資料或 Google Drive 圖片時，不需要開分支，因為那不是程式碼修改。

### 目前這個專案的狀態

目前正式分支是：

```text
main
```

遠端已看到：

```text
origin/main
origin/englishTest
```

如果之後要多人同時改網站，建議每個人都從 `main` 開自己的功能分支。

## 夥伴可以怎麼在本機看最新版本

如果你已經 push 到 GitHub，夥伴可以在自己的電腦執行：

```bash
git pull
npm install
npm run dev
```

然後打開：

```text
http://127.0.0.1:5173/
```

本機前端如果 Worker API 暫時讀不到，會退回透過 `/sheet.csv` 直接讀 Google Sheet 文字資料，所以夥伴在 `/作品介紹` 仍可以先確認作品文字是否能顯示。

R2 與 Worker 啟用後，本機前端預設會優先讀：

```text
https://nma112-exhibition-sync.tnuanmart112.workers.dev/api/exhibitions
```

因此本機也會顯示 R2 圖片。只有 Worker API 讀不到時，才會退回 `/sheet.csv` 臨時文字模式。

## 常見問題

### 改了 Sheet 但網站沒變

可能原因：

- Worker 或前端還沒跑到下一次 30 秒刷新。
- 如果是圖片更新，Google Drive 下載或圖片快取可能需要稍等一下。
- 急著確認時，應該到 `/admin` 按「手動同步 Google Sheet」。
- Google Sheet 欄位名稱被改掉。
- Cloudflare Pages 還在快取舊前端。
- 前端環境變數還沒設定到 Worker API。

### 圖片沒有出現

可能原因：

- Google Drive 圖片沒有開連結權限。
- Sheet 的圖片連結不是單一檔案連結。
- Worker 同步時無法從 Google Drive 下載圖片。
- R2 bucket 尚未建立或尚未啟用。

### 手動同步後要看哪裡

在 `/admin` 同步成功後會看到：

- 更新時間：這次同步完成的時間。
- 作品數量：目前 Worker 從 Sheet 整理出的作品筆數。
- 圖片錯誤：應該盡量是 0。

如果圖片錯誤不是 0，先看錯誤清單中的作品名稱與欄位，再回 Google Sheet 檢查該欄位的 Drive 連結。

### 可以自動壓縮圖片嗎

可以，但要分成兩種情況：

1. 網站顯示時壓縮：使用 Cloudflare Images / Image Transformations，在圖片送到瀏覽器前轉成比較小的版本，例如 WebP 或 AVIF。這可以讓作品頁載入更快。
2. R2 裡面也存壓縮版：同步圖片時另外產生壓縮檔並寫回 R2。這可以減少儲存容量，但流程比較多一步。

目前網站是先把 Google Drive 圖片同步進 R2，再由 Worker 回傳給前端。下一階段如果要改善速度，建議先做「網站顯示時壓縮」，不要急著覆蓋原圖。

Cloudflare Images Free plan 目前每月包含 5,000 次 unique transformations。因為同一張圖如果產生不同尺寸會算不同 transformation，所以建議先固定少數尺寸，例如：

- 作品卡片圖：寬 900。
- 作品內頁大圖：寬 1600。

這樣比較容易控制用量。

### 新增欄位後網站沒有顯示

新增欄位後，通常還需要修改：

- `src/utils/dataFormatter.js`
- `src/components/ExhibitionCard.jsx`
- `worker/src/index.js`

## 目前待完成事項

- 決定圖片長期要全部透過 Worker 代理，或改成 R2 自訂網域。
- 決定是否啟用 Cloudflare Images / Image Transformations 做圖片輸出最佳化。

## Worker API 失敗時的臨時開發模式

本機開發時，前端正常會優先讀 Worker API。

如果 Worker API 暫時讀不到，前端會透過 Vite proxy 退回讀取：

```text
/sheet.csv
```

這會代理到目前的 Google Sheet CSV，讓網頁組可以先確認作品文字資料是否會出現在 `/作品介紹`。

此模式只適合本機開發。正式部署到 Cloudflare Pages 後，仍建議使用 Worker API。

目前 Worker / R2 已啟用，所以正常情況下本機會先讀 Worker API。看到 `IMAGE PENDING` 通常代表目前資料來源退回了 `/sheet.csv` 文字模式，或 Worker API 回傳的作品沒有 `imageUrl`。
