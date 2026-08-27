# 待神｜Awesome-Dyson

### 跨專案開發儀表板系統：接手任何專案前，先看這裡

---

## 這東西是做什麼的？

換一個 AI 對話、換一個 CLI（Claude Code 換 Codex、換 Cursor）接手同一個專案時，你有沒有遇過：

1. 每次都要重新講一遍「這個專案在做什麼、現在卡在哪、上次講到哪」
2. 明明上次已經對焦過的事，這次又要重新對焦一次
3. 螢幕上散落一堆各工具自己生的本機 HTML 檔案，想確認一件事就要開一個新檔案

**待神** 就是解決這件事的固定機制：每個開發專案有一個**固定網址、純靜態、免過期**的儀表板頁面。任何人類或 AI 打開同一個網址，就能立刻看到：

- 專案現況（一句話講完在做什麼）
- 進行中的工作跟進度
- 待確認事項
- 過去每次工作階段的歷史紀錄（時間軸，點進去看細節）
- 相關檔案、串接系統一覽

不管你之後用哪個 CLI/LLM/IDE 開發，看的都是同一個網址、同一份資料。

---

## 核心設計

- **零後端、零資料庫**：純靜態檔案（HTML + JSON），部署在 Cloudflare Pages。沒有 Worker、沒有 D1，換句話說「不需要部署程式碼」，丟檔案就是全部流程。
- **給人看的畫面跟給 AI 讀的資料分開**：`index.html` 是人類看的視覺化時間軸，`state.json`／`entries/*.json` 是 AI 直接 fetch 就能拿到的結構化事實，不用截圖、不用解析排版。
- **單一寫入者鎖**：多個 sub-agent 平行開發時，同一時間只有一個能更新儀表板，其他人遇到鎖就停下告知使用者，不搶著寫壞資料。
- **不綁自訂網域**：用 Cloudflare 自帶的 `<專案代號>.pages.dev`，換機器、換網路環境都連得到。
- **設計語言參考 [vibeprompts.dev](https://vibeprompts.dev/)**：終端機圖示、粗體大標題、時間軸卡片配狀態色點，避免暖色系＋serif 字體＋漸層 hero 那種「一看就是 AI 生成」的樣板風格。

完整規格 → [`openspec/changes/dev-project-dashboard-system/`](openspec/changes/dev-project-dashboard-system/)

---

<!-- GODS-FAMILY:START -->
## 👑 「神」系列家族：彼此怎麼接力合作？

「神」系列不是各自為政的工具，而是一條從**商務接案、工程開發到成果交付**的完整流水線：

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       👑 「神」系列家族完整協同接力鏈                         │
└─────────────────────────────────────────────────────────────────────────┘

【第一棒：接案與商務需求】
  📋 案神 (Awesome-Anson) ➔ 丟進客戶會議逐字稿與資料，自動拆解需求、產出報價單與簡報。
         │
         ▼ (客戶成交，需求確認，交棒給工程總管)
【第二棒：自動化工程開發】
  🏗️ 蓋神 (Awesome-Gason) ➔ 把需求轉成 Spectra 規格，指揮多 Agent 在隔離房間寫碼與驗收。
         │
         ├─► 🗣️ 譯神 (Awesome-Eason) ➔ 過程中遇到看不懂的技術名詞？對外文案太假？
         │                               隨時叫「譯神」出來翻譯成白話、去 AI 味。
         │
         ├─► ⌨️ Key神 (Awesome-Keyson) ➔ 專案需註冊第三方平台、申請 API Key、填寫繁瑣企業表單？
         │                               貼上網址交給「Key神」安全自動填表，不用手打。
         │
         ▼ (系統開發完成，功能已驗收上線)
【第三棒：產品交付與行銷宣傳】
  🎬 剪神 (Awesome-Janson) ➔ 錄好的系統操作教學、發表會影片，一鍵自動精修成長片與爆款短影音。
```

### 家族成員倉庫速查

* 📋 **[案神 Awesome-Anson](https://github.com/fishtvlvoe/Awesome-Anson)**：接案分析、商務報價、合約拆解與提案簡報架構
* 🏗️ **[蓋神 Awesome-Gason](https://github.com/fishtvlvoe/Awesome-Gason)**：Spectra SDD 全自動開發總管（規格→TDD→多代理派工→CR→驗收）
* 🎨 **[網頁設計師 Awesome-website-design](https://github.com/fishtvlvoe/Awesome-website-design)**：網頁企劃與部署執行者，整合 frontend-design、impeccable 等工具產出 HTML mockup 並自己部署上線
* 🗣️ **[譯神 Awesome-Eason](https://github.com/fishtvlvoe/Awesome-Eason)**：小白技術降維、台灣繁中去 AI 味與翻譯急救
* ⌨️ **[Key神 Awesome-Keyson](https://github.com/fishtvlvoe/Awesome-Keyson)**：自動 Key 單、智慧語意對齊與跨平台表單自動填寫
* 📊 **[待神 Awesome-Dyson](https://github.com/fishtvlvoe/Awesome-Dyson)**（本倉庫）：跨專案開發儀表板：固定網址看現況、進度、待確認事項與歷史紀錄，換 CLI/AI 接手不用重新對焦
* 🎬 **[剪神 Awesome-Janson](https://github.com/fishtvlvoe/Awesome-Janson)**：全能 AI 影片剪輯 Agent（長片精修、爆款短影音與動效）
<!-- GODS-FAMILY:END -->

---

## 資料夾裡有什麼

- [`openspec/`](openspec/)：這個系統本身的 Spectra SDD 規格（proposal / design / tasks）
- `templates/`（規劃中）：`index.html` 範本、鎖機制腳本、部署腳本
- `schema/`（規劃中）：`state.json` / `entries/*.json` 的 JSON Schema

## 授權

[MIT License](LICENSE)
