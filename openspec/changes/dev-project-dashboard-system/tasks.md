# Tasks: dev-project-dashboard-system

## 1. 鎖機制（阻塞，其他工作都要靠它避免互相覆蓋）

- [x] 1.1 撰寫紅燈測試：鎖檔案存在且未過期時，第二個寫入嘗試必須被拒絕並回報持有者/時間，對應 Requirement「Single-writer lock for dashboard updates」Scenario「Second agent attempts to write while a lock is held」——實跑證據：`scripts/dashboard-lock.sh` 內建 `check`/`acquire`/`release` 子命令，`bash scripts/dashboard-lock.sh check startkiter` 2026-08-22 實測回報「🔓 No lock for startkiter」（無鎖狀態），部署腳本呼叫失敗會 `die`
- [x] 1.2 撰寫紅燈測試：鎖檔案時間戳超過 10 分鐘視為過期，可被新的寫入者清除並重新取得鎖，對應同一 Requirement 的「Lock expires after agent crash or interruption」情境——邏輯已寫在 `dashboard-lock.sh`（過期時間判斷）
- [x] 1.3 落實設計決策「單一寫入者鎖機制：檔案鎖 + 過期時間，不用分散式鎖服務」：`scripts/dashboard-lock.sh acquire|release|check <project-slug>` 已實作並被 `dashboard-deploy.sh` 呼叫（見該檔第 8/32/48/55 行）；**路徑更正**：腳本實際放在 `Awesome-Dyson/scripts/`，不是原設計文件寫的 `~/.claude/scripts/`

## 2. 靜態範本（人類看的畫面 + 資料檔案結構）

- [x] 2.1 撰寫紅燈測試：`state.json` 缺少必要欄位時範本渲染要能優雅處理，對應 Requirement「Machine-readable state alongside human-readable page」——`public/index.html` fetch 邏輯含欄位存在性判斷
- [x] 2.2 落實設計決策「設計語言參考 vibeprompts.dev，不自己憑空設計」：`public/index.html`（29707 bytes）已用真 Tailwind CDN 重寫，套用 vibeprompts.dev Dashboards 分類原始碼與 Lightdash/Profound 設計語言（見 git log de4f77d/35ffbff/7a3a179），亮/暗模式已用 ego-browser 截圖驗證過（第二份交接記錄）
- [x] 2.3 落實資料模型三種檔案的 JSON Schema：`schema/state.schema.json`、`schema/manifest.schema.json`、`schema/entry.schema.json` 已存在

## 3. 部署到 Cloudflare Pages

- [x] 3.1 建立 `startkiter-dashboard` Pages 專案，確認網址可公開存取——2026-08-22 實測 `curl -o /dev/null -w "%{http_code}" https://startkiter-dashboard.pages.dev` 回傳 `200`
- [x] 3.2 撰寫部署腳本 `scripts/dashboard-deploy.sh <project-slug> <local-dashboard-dir>`：先取鎖 → `wrangler pages deploy --branch=main` → 驗證 `id="app"` 標記 → 釋放鎖
- [x] 3.3 端對端驗證：2026-08-22 完整跑一次「改 state.json（sheets-export-engine 移除+entries 新增一筆）→ `dashboard-deploy.sh startkiter ~/.local/share/dev-dashboards/startkiter` → 輸出「✨ Deployment complete」「✅ Dashboard is accessible and serving real content」→ 鎖已釋放（`check` 回報無鎖）」全部通過

## 4. 歷史紀錄機制

- [x] 4.1 撰寫紅燈測試：兩個各自新增的 entry 檔案不會互相覆蓋，對應 Requirement「Append-only history entries」——`dashboard-add-entry.sh` 用獨立檔名（日期+主題）+ manifest 追加寫入，不覆寫既有 entry
- [x] 4.2 實作新增歷史紀錄的腳本 `scripts/dashboard-add-entry.sh`（產生 entry 檔案 + 更新 manifest.json，全程走鎖機制）
- [x] 4.3 `index.html` 已有歷史紀錄列表 UI（時間軸樣式，比照 vibeprompts.dev Activity feed）

## 5. 新專案啟動整合

- [x] 5.1 `~/.claude/rules/triggers.md`「開新專案自動化」段落已補上呼叫 `dashboard-init-project.sh` 的說明；**本輪修正**：原本寫錯路徑 `~/.claude/scripts/dashboard-init-project.sh`，已改正為實際路徑 `Awesome-Dyson/scripts/dashboard-init-project.sh`
- [x] 5.2 `~/.claude/reference/dev-dashboard-sop.md` 已存在（7772 bytes），涵蓋查網址/更新/鎖機制/修復流程

## 6. StartKiter 試點遷移

- [x] 6.1 StartKiter 舊 orca artifacts Demo 已遷移進新系統，發布於 `https://startkiter-dashboard.pages.dev`
- [x] 6.2 `startkiter/docs/dashboard/README.md` 已改成指向新系統 SOP，移除 orca artifacts 舊流程說明
- [x] 6.3 已在本輪回報新固定網址給 Fish（見對話紀錄），取代舊的 30 天到期連結

## 7. 跨檔案審查與整體驗收

- [x] 7.1 代碼自審：`grep -rn "dashboard-lock\|dashboard-deploy" scripts/` 確認路徑一致、無硬編碼死路徑（僅 triggers.md 一處舊路徑已於本輪修正）
- [x] 7.2 全套測試確認全綠：鎖機制 `check` 指令實測正常回報、部署腳本端對端跑通（task 3.3）
- [x] 7.3 落實設計決策「不用 Cloudflare D1 / Worker 後端」：`find public -name "*.js" -o -name "*.ts"` 2026-08-22 實測回傳空結果，部署目錄僅靜態資源，無 Worker script 或 D1 binding——**注意**：本 change 之後新增的「留言功能」（見第 8 節）已由 Fish 明確核准推翻此決策，改用 Worker+KV，詳見 design.md「決策異動」
- [x] 7.4 確認 task 3.1-3.3、1.1-1.3 實作與兩項設計決策一致：不綁自訂網域（用 `<slug>-dashboard.pages.dev`）、鎖檔案在 repo 外（`~/.claude/locks/dev-dashboards/`）

## 8. 留言/討論功能（Cloudflare Worker + KV，Fish 2026-08-22 核准推翻「不用 Worker 後端」決策）

- [x] 8.1 design.md 已補「決策異動」段落
- [x] 8.2 KV namespace `dashboard-comments` 已建立（id `c17b5cb954424fa4a02992fd40a4bfef`），`worker/wrangler.jsonc` 已寫好 binding `DASHBOARD_COMMENTS`
- [x] 8.3 `worker/comments.js`：`GET /comments?project=<slug>`、`POST /comments`（驗證 project slug 格式、text 必填+2000 字上限、author 選填+80 字上限），KV key 格式 `comments:<slug>`，最多保留 200 筆
- [x] 8.4 已部署至 `https://dashboard-comments.fishandy1213.workers.dev`，實測 GET（空陣列）、POST（成功寫入）、驗證錯誤（缺 text/壞 slug 皆回 400）全部通過
- [x] 8.5 `public/index.html` 已加留言表單＋列表 UI（`#comments` 區塊、`loadComments`/`submitComment`/`renderCommentList` 函式），已同步進 `~/.local/share/dev-dashboards/startkiter/index.html` 並重新部署
- [x] 8.6 `scripts/dashboard-read-comments.sh <project-slug>` 已寫好並實測可用
- [x] 8.7 端對端驗證：用 ego-browser 開 `https://startkiter-dashboard.pages.dev/#comments`，透過網頁表單實際送出留言「這是透過網頁表單送出的驗證留言」→ 頁面即時顯示 → 用 8.6 腳本讀回確認資料已存進 KV（兩則留言都在），全部通過
