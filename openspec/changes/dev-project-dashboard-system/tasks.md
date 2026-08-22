# Tasks: dev-project-dashboard-system

## 1. 鎖機制（阻塞，其他工作都要靠它避免互相覆蓋）

- [ ] 1.1 撰寫紅燈測試：鎖檔案存在且未過期時，第二個寫入嘗試必須被拒絕並回報持有者/時間，對應 Requirement「Single-writer lock for dashboard updates」Scenario「Second agent attempts to write while a lock is held」
- [ ] 1.2 撰寫紅燈測試：鎖檔案時間戳超過 10 分鐘視為過期，可被新的寫入者清除並重新取得鎖，對應同一 Requirement 的「Lock expires after agent crash or interruption」情境
- [ ] 1.3 落實設計決策「單一寫入者鎖機制：檔案鎖 + 過期時間，不用分散式鎖服務」：實作鎖檢查/取得/釋放的 shell 腳本（`~/.claude/scripts/dashboard-lock.sh acquire|release|check <project-slug>`），鎖檔案路徑 `~/.claude/locks/dev-dashboards/<project-slug>.lock`，內容含 `holder`/`acquired_at`；驗證方式：1.1、1.2 轉綠燈

## 2. 靜態範本（人類看的畫面 + 資料檔案結構）

- [ ] 2.1 撰寫紅燈測試：`state.json` 缺少必要欄位（project/one_liner/changes_in_progress/open_questions/key_files）時，範本渲染要能優雅處理（不整頁報錯），對應 Requirement「Machine-readable state alongside human-readable page」
- [ ] 2.2 落實設計決策「設計語言參考 vibeprompts.dev，不自己憑空設計」：實作範本 `index.html`——終端機圖示 logo、側邊欄、大標題、卡片網格＋時間軸元件，瀏覽器端 JS fetch `state.json` 與 `entries/manifest.json` 動態渲染，支援亮/暗兩種主題；驗證方式：2.1 轉綠燈，並用 ego-browser 截圖確認亮/暗模式都正確顯示
- [ ] 2.3 落實資料模型「`state.json`（現況快照，會被覆蓋更新）」「`entries/manifest.json`（歷史紀錄索引）」「`entries/<file>.json`（單筆歷史紀錄，只新增不覆寫）」：定義並寫死這三種檔案的 JSON Schema（放 `schema/` 資料夾），供之後驗證資料格式是否合規

## 3. 部署到 Cloudflare Pages

- [ ] 3.1 用 `wrangler pages project create` 建立第一個實驗性 Pages 專案（用 StartKiter 當第一個試點），確認網址可公開存取，對應 Requirement「Single fixed dashboard URL per project」
- [ ] 3.2 撰寫部署腳本 `~/.claude/scripts/dashboard-deploy.sh <project-slug> <local-dashboard-dir>`：先呼叫鎖機制（task 1.3）取得鎖 → `wrangler pages deploy` → 釋放鎖；缺鎖時中止並回報
- [ ] 3.3 端對端驗證：完整跑一次「改 state.json → 執行部署腳本 → curl 驗證新內容已上線 → 確認鎖檔案已釋放」

## 4. 歷史紀錄機制

- [ ] 4.1 撰寫紅燈測試：兩個各自新增的 entry 檔案不會互相覆蓋，對應 Requirement「Append-only history entries」
- [ ] 4.2 實作新增歷史紀錄的腳本（產生 entry 檔案 + 更新 manifest.json，全程走鎖機制），驗證 4.1 轉綠燈
- [ ] 4.3 在 `index.html` 加上歷史紀錄列表 UI（日期＋主題），點擊展開詳細內容，比照 vibeprompts.dev 的 Activity feed 時間軸樣式

## 5. 新專案啟動整合

- [ ] 5.1 更新 `~/.claude/rules/triggers.md` 的「開新專案自動化」段落：git init 完成後，自動跑本 change 產出的建立腳本，套用範本並發布第一版儀表板
- [ ] 5.2 撰寫此系統的使用文件（放 `~/.claude/reference/dev-dashboard-sop.md`），涵蓋：怎麼查現有專案的儀表板網址、怎麼更新、鎖機制怎麼用、到期或壞掉怎麼修

## 6. StartKiter 試點遷移

- [ ] 6.1 把 StartKiter 現有的 orca artifacts Demo 內容遷移進這套新系統，發布到 StartKiter 自己的 Cloudflare Pages 網址
- [ ] 6.2 更新 StartKiter 的 `docs/dashboard/README.md`，改成指向新系統的 SOP（`~/.claude/reference/dev-dashboard-sop.md`），移除 orca artifacts 相關的舊流程說明
- [ ] 6.3 主動告知 Fish 新的固定網址，取代原本 30 天到期的 orca artifacts 連結

## 7. 跨檔案審查與整體驗收

- [ ] 7.1 執行代碼自審與 DRY 檢查，確保鎖機制腳本無硬編碼路徑錯誤、無 dead code
- [ ] 7.2 執行全套測試（1.1、1.2、2.1、4.1 對應的測試）確保全綠
- [ ] 7.3 落實設計決策「不用 Cloudflare D1 / Worker 後端」（design.md）：檢查整套系統（`index.html`、`state.json`、`entries/`、部署腳本）確認全程只用靜態檔案上傳，沒有任何 Worker script 或 D1 binding，對應 Requirement「No backend code or database required」；驗證方式：`wrangler pages deploy` 的部署目錄裡 grep 不到任何 `.js`/`.ts` Worker 程式碼，只有靜態資源
- [ ] 7.4 落實設計決策「用 Cloudflare Pages，不用 orca artifacts / Vercel / GitHub Pages」（design.md）與「單一寫入者鎖機制：檔案鎖 + 過期時間」（design.md）：確認 task 3.1-3.3、1.1-1.3 的實作內容跟這兩項決策的理由一致（不綁自訂網域、鎖檔案在 repo 外），沒有落地時中間走偏
