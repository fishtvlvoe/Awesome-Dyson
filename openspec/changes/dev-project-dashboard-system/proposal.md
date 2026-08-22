# 提案：跨專案開發儀表板系統（Dev Project Dashboard）

## 目標

解決「每次換一個 AI 對話／換一個 CLI 工具接手專案，都要重新對焦現況」的問題。做一個所有開發專案都能套用的固定機制：每個專案有一個固定網址的靜態儀表板，記錄現況、進度、待確認事項、歷史對接紀錄；任何人類或 AI（Claude Code、Codex、Cursor、未來任何新工具）打開同一個網址都能立刻知道專案在哪、卡什麼、下一步是什麼。

這不是給單一專案（如 StartKiter）用的功能，是給 `/Users/fishtv/Development`（`~/Dev`）底下**所有**開發專案共用的基礎設施，包含未來要交付給客戶的專案。

## 背景

在 StartKiter 專案裡先做過一版 Demo（用 orca artifacts share 發布），過程中發現：

- 30 天到期、綁定單一發布工具，不是長久方案
- 純靜態 HTML 只服務人類視覺閱讀，AI 讀取時要重新解析排版才能拿到事實，效率差
- 多個 sub-agent（例如 worktree 平行派工）可能同時想更新同一個專案的儀表板，需要防止互相覆蓋

## 變更

- 每個專案的儀表板部署在 **Cloudflare Pages**（`<專案代號>.pages.dev`），不綁定自訂網域——換機器、換網路環境時 Cloudflare 自己的網域一定連得到，自訂網域不一定。
- 儀表板由**純靜態檔案**組成，不部署任何後端程式碼、不用資料庫（Cloudflare D1 評估過，判定目前用不到——多寫入的併發問題用底下的檔案鎖機制解決，不需要資料庫層級的併發控制）：
  - `index.html`：人類看的畫面，瀏覽器端 JS 讀取 `state.json` 與 `entries/manifest.json` 動態渲染，畫面本身寫一次之後很少再改
  - `state.json`：專案現況快照（進度、卡什麼、待確認事項），會被覆蓋更新
  - `entries/<日期>-<主題>.json`：每次對接/工作階段的歷史紀錄，**只新增不覆寫**，天生不會跟其他新增衝突
  - `entries/manifest.json`：歷史紀錄的索引清單（日期、主題、檔名），每次新增一筆歷史紀錄要一併更新
- **單一寫入者鎖機制**：任何 Agent（不分是哪個 CLI／哪個 sub-agent）要更新任一專案的儀表板前，必須先在固定路徑（`~/.claude/locks/dev-dashboards/<專案代號>.lock`）確認鎖是否存在且未過期（預設 10 分鐘視為過期，避免 Agent 中斷導致死鎖）；沒有鎖才能建立鎖、動手改、改完刪鎖。同一時間只允許一個寫入者，其他 Agent 遇到鎖存在就停下告知使用者，不強行寫入。
- **設計語言**參考 `vibeprompts.dev`：終端機圖示、粗體大標題、卡片用真實介面縮圖而非裝飾 icon，時間軸用狀態色點＋相對時間＋巢狀留言框，整體黑白灰為主、色彩只用在狀態語意上，避免「AI 生成感」的樣板設計（暖米色配 serif 字體＋赭紅色調、漸層 hero 等）。
- **新專案啟動流程**要並入既有的「開新專案自動化」（`~/.claude/rules/triggers.md` 的「開新專案自動化」段落）：git init 完成後，順手用 `wrangler pages project create <專案代號>-dashboard` 建立對應的 Cloudflare Pages 專案，套用本 change 產出的儀表板範本，發布第一版。
- Development 層級新增 `~/Dev` 符號連結（`/Users/fishtv/Development` 的別名，2026-08-22 已建立），方便打字與口語溝通，實體路徑不變，不影響任何既有硬編碼引用。

## Non-Goals

- 不做即時多人協作編輯（不是 Google Docs 那種同時編輯同一段文字）
- 不做認證/權限系統——儀表板網址視為半公開（給客戶看的版本另外評估是否要加密碼保護，本輪不做）
- 不取代 Spectra 的 `openspec/changes/` 本身——儀表板是「摘要 + 入口」，細節仍以 repo 內的 spec/tasks/discuss 檔案為準
