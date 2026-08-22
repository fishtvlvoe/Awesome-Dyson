# Design: Dev Project Dashboard

## 資料模型

### `state.json`（現況快照，會被覆蓋更新）

```json
{
  "project": "startkiter",
  "updated_at": "2026-08-22T08:10:00+08:00",
  "updated_by": "claude-code",
  "one_liner": "課 + 終身代碼包，類似 WordPress 的可擴充平台",
  "changes_in_progress": [
    { "name": "core-module-bundles-coupons", "done": 55, "total": 56, "status": "ok", "note": "剩 1 項故意延後" }
  ],
  "open_questions": [
    { "question": "主站部署完成後要不要順便升級 VPS 規格？", "asked_at": "2026-08-22" }
  ],
  "key_files": ["AGENTS.md", "docs/discuss/2026-08-22-platform-positioning-infra-alignment.md"],
  "connected_systems": ["Cloudflare (DNS)", "Coolify (VPS)", "LINE Messaging API", "Telegram Bot API"]
}
```

### `entries/manifest.json`（歷史紀錄索引）

```json
{
  "entries": [
    { "date": "2026-08-22", "topic": "平台定位補漏 + 基礎設施現況盤點", "file": "2026-08-22-platform-positioning-infra-alignment.json" }
  ]
}
```

### `entries/<file>.json`（單筆歷史紀錄，只新增不覆寫）

```json
{
  "date": "2026-08-22",
  "topic": "平台定位補漏 + 基礎設施現況盤點",
  "summary": "補上類似 WordPress 的平台定位、woomin 為主要抽取來源、Vercel 停用改 Coolify+VPS...",
  "decisions": ["抽取來源以 woomin 為主", "不買第二台 VPS", "..."],
  "links": [{ "label": "完整記錄", "href": "https://github.com/.../docs/discuss/2026-08-22-....md" }]
}
```

## Decisions

### 用 Cloudflare Pages，不用 orca artifacts / Vercel / GitHub Pages

**Alternatives considered：**
- **orca artifacts share（目前 StartKiter Demo 用的）**：否決。30 天到期要重新發網址、綁定單一 CLI 工具（mirasim/Claude Code 才有這個能力），Codex／Cursor 沒有對應機制，不符合「不管哪個 CLI 都能更新」的目標。
- **Vercel**：否決。StartKiter 本身已經決定不用 Vercel；且 Vercel 的免費方案網址也會變動，跟 Cloudflare Pages 比沒有額外優勢。
- **GitHub Pages**：可行但否決。功能上跟 Cloudflare Pages幾乎等價（免費靜態託管），但這個環境已經在用 Cloudflare（DNS、Workers、Coolify VPS 供應鏈相關），統一用 Cloudflare 減少要管理的帳號種類。

### 不用 Cloudflare D1 / Worker 後端

**Alternatives considered：**
- **D1 + Worker API**：否決（本輪）。D1 沒有對外直接的 SQL 連線，一定要透過 Worker 中介，等於要多寫、多部署、多維護一段後端程式碼，且 Worker 的寫入端點若無驗證機制，任何人都能寫入，要多做一層驗證。目前的寫入頻率（一次工作階段更新一次）用純檔案 + 鎖機制就足夠，不需要資料庫的併發控制能力。之後若真的出現「大量、高頻、即時」的寫入需求（例如多人即時協作編輯同一份文件），才重新評估。

### 單一寫入者鎖機制：檔案鎖 + 過期時間，不用分散式鎖服務

**Alternatives considered：**
- **不做鎖，靠 git push 衝突自然擋**：否決。git 的衝突偵測發生在 push 那一刻，但兩個 Agent 若同時讀了舊版 `state.json`、各自在本地改完再各自 push，其中一個 push 會被拒絕，需要重新 pull-rebase-push；使用者明確要求「只能有 1 個人在寫，其他人不能同時寫」，比「靠 git 事後擋+重試」更直接的作法是在動手前就先擋下第二個寫入者，避免真的發生要重新 rebase 的情況。
- **用真的分散式鎖服務（例如 Redis、Cloudflare KV 的 CAS）**：否決。所有 Agent 目前都跑在同一台機器（Fish 的 Mac），本機檔案系統的鎖檔案已經足夠，不需要跨機器的分散式鎖基礎設施。
- 鎖檔案路徑選在 `~/.claude/locks/dev-dashboards/<專案代號>.lock`（跨專案共用的固定位置），不是放在各專案 repo 裡——因為鎖是「本機執行環境」的狀態，不是專案內容，放進 repo 會被 git 追蹤、可能被不同 worktree 各自認為自己有一份鎖檔案（worktree 之間不共用工作目錄，會讓鎖機制失效）。
- 過期時間定 10 分鐘：太短容易誤判正常工作中的 Agent 為逾時；太長則 Agent 意外中斷後其他人要等太久。10 分鐘是初始猜測值，之後依實際使用調整，不是精算出來的數字。

### 設計語言參考 vibeprompts.dev，不自己憑空設計

**Alternatives considered：**
- **延用 StartKiter Demo 那版排版（Fraunces/IBM Plex 字體、卡片網格）**：否決。使用者明確反饋「AI 味太重」，缺少真人設計過的細節（圖示、留白節奏）。
- **完全重新設計**：否決（本輪）。時間成本高，且 vibeprompts.dev 已經示範了「技術工具類儀表板」該有的樣子（終端機圖示、時間軸卡片、狀態色點），直接借用其設計語言的結構（不是照抄視覺內容）比重新摸索更快、品質更穩定。

## 決策異動（2026-08-22）

### 留言/討論功能：推翻「不用 Cloudflare D1 / Worker 後端」，改用 Worker + KV

原決策（見上方「不用 Cloudflare D1 / Worker 後端」）理由是「寫入頻率低（一次工作階段更新一次），純檔案+鎖機制就夠」。但留言功能的寫入者是**任何看儀表板的人**（不是只有 Agent 自己），且寫入時機不可預測，用「先改本機檔案再跑部署腳本」這套流程完全不適用——留言必須是「使用者在網頁上打字送出」就即時生效，不能等 Agent 手動部署。

**新方案**：Cloudflare Worker（`GET /comments`、`POST /comments`）+ KV namespace，以 `project` slug 分 key 儲存留言陣列。

**Alternatives considered：**
- **繼續用靜態檔案 + 手動部署**：否決。留言的本質是「即時、任何人可寫」，跟 state.json/entries（Agent 單向、低頻更新）性質不同，硬套會變成「使用者填表單→存去哪裡都沒有」的假功能。
- **D1 資料庫**：否決（本輪）。留言資料結構簡單（陣列，依專案分組），不需要 SQL 查詢能力，KV 的 key-value 讀寫已經足夠，不需要多引入一個資料庫服務。
- **第三方留言服務（Disqus 等）**：否決。額外帳號依賴、外部腳本注入頁面，且免費方案通常有品牌置入，不符合這套系統「自主可控」的原始精神。

Fish 已於 2026-08-22 明確核准這個例外（「留言功能好，用 Worker+KV」），僅適用於留言這一項功能，儀表板核心功能（狀態/歷史）仍維持純靜態檔案，不因此開放其他功能任意引入後端。

## Risks

- **鎖檔案機制依賴 Agent 自律遵守**：沒有作業系統層級強制鎖（不是 `flock`），如果某個 Agent 沒有照 SOP 檢查鎖就直接寫，鎖機制形同虛設。緩解：把「檢查鎖」寫成 SOP 文件裡**第一步**，且未來若要更強制，可以改用 `flock` 系統呼叫包一層 shell script，本輪先用最簡單的檔案存在判斷。
- **多專案共用同一套範本 HTML/CSS**：範本本身若要改動（例如統一升級設計），需要同步更新所有已部署專案的 `index.html`，本輪先不做「範本統一升級」的自動化，之後若專案數量變多再評估。
