# 待神設計系統 / Design Tokens

> 這份文件是「未來任何專案儀表板/UI 設計」的唯一風格參考來源。不要重新猜配色，改設計前先讀這份。
>
> 來源：vibeprompts.dev（Dashboards 分類，@domi_kissi 的實際 Tailwind 程式碼，非目測猜色）+ 自建的三個示範元件（`examples/`）。所有色碼、圓角、字級都是從真實原始碼摘出來的，不是憑印象寫的。

## 核心原則

1. **黑白灰為主，色彩只留給真正的狀態訊號**（Pending/Active/Error/Success），裝飾性分類不上色。
2. **`neutral-900`（近黑）是唯一的主要強調色**——用在 active 導覽項目、主要按鈕（Primary CTA）。不用彩色作為品牌強調色。
3. **卡片一律 `rounded-2xl border border-neutral-200 bg-white`**；按鈕/輸入框用 `rounded-lg`；徽章/pill 用 `rounded-full`。
4. **陰影極簡或不用**，靠 `border` 分隔層次，不是靠 `shadow`。
5. 深色模式用 Tailwind `dark:` variant class，不是另一套視覺語言——只是反轉亮度，配色邏輯不變。

## 色彩

| 用途 | Class | 說明 |
|---|---|---|
| 畫布背景 | `bg-neutral-50` | 頁面最底層背景 |
| 卡片背景 | `bg-white` | 所有卡片、面板 |
| 卡片邊框 | `border-neutral-200` | 卡片、輸入框、分隔線 |
| 主要文字 | `text-neutral-900` | 標題、正文重點 |
| 次要文字 | `text-neutral-600` / `text-neutral-500` | 說明文字、次要資訊 |
| 弱化文字 | `text-neutral-400` | 時間戳記、佔位文字 |
| 主要強調色（唯一） | `bg-neutral-900` / `text-white` | Active 導覽、主要按鈕 |
| 狀態：成功／已完成 | `bg-green-100 text-green-700`（列表用）／`text-green-600`（正文用） | |
| 狀態：警示／進行中 | `bg-amber-100 text-amber-700`（列表用）／`text-amber-600` | |
| 狀態：錯誤／卡住 | `bg-red-100 text-red-700`／`text-red-600` | |
| 狀態：中性／未定 | `bg-neutral-100 text-neutral-600` | 例：Churned、Draft |

深色模式：對應 class 一律加 `dark:` 前綴反轉（例：`dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-50`），配色邏輯不變，只是亮度反轉。

## 圓角

| 用途 | Class |
|---|---|
| 卡片、面板 | `rounded-2xl` |
| 按鈕、輸入框、次要容器 | `rounded-lg` |
| 徽章、pill、頭像 | `rounded-full` |

## 字級（Inter）

| 用途 | Class |
|---|---|
| 頁面主標題 | `text-xl font-semibold` |
| 卡片標題 | `font-semibold text-neutral-900` |
| KPI 大數字 | `text-2xl font-semibold` |
| 正文 | `text-sm` |
| 說明/次要文字 | `text-sm text-neutral-500` 或 `text-xs text-neutral-400` |

## 版面骨架（app shell）

固定側邊欄（`w-60`，`lg` 以下隱藏）+ 彈性主內容區，這是所有「中臺/儀表板」類設計的預設骨架，來源：`examples/vibeprompts-sidebar-stat-cards.html`。

```html
<div class="flex min-h-screen bg-neutral-50">
  <aside class="hidden w-60 flex-col border-r border-neutral-200 bg-white p-4 lg:flex">
    <div class="mb-6 flex items-center gap-2 px-2 font-semibold text-neutral-900">
      <span class="h-6 w-6 rounded-md bg-neutral-900"></span> Console
    </div>
    <nav class="space-y-1 text-sm">
      <a href="#" class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 font-medium text-white">Overview</a>
      <a href="#" class="flex items-center gap-2 rounded-lg px-3 py-2 text-neutral-600 hover:bg-neutral-100">Analytics</a>
    </nav>
    <div class="mt-auto flex items-center gap-2 rounded-lg p-2 text-sm">
      <span class="h-8 w-8 rounded-full bg-neutral-200"></span>
      <span><span class="block font-medium text-neutral-900">Sam Lee</span><span class="block text-xs text-neutral-500">Admin</span></span>
    </div>
  </aside>
  <main class="flex-1 p-6"><!-- page content --></main>
</div>
```

## KPI 統計磚

```html
<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <div class="rounded-2xl border border-neutral-200 bg-white p-5">
    <p class="text-sm text-neutral-500">Revenue</p>
    <p class="mt-2 text-2xl font-semibold text-neutral-900">$48.2k</p>
    <p class="mt-1 text-xs text-green-600">↑ 12% vs last month</p>
  </div>
</div>
```

規則：label 用 `text-sm text-neutral-500`；數字用 `text-2xl font-semibold`；delta 只在真的有意義時顯示（有比較基準），沒有比較基準就不要硬湊一個假 delta。

## 清單／表格行

```html
<div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
  <div class="flex items-center justify-between gap-3 border-b border-neutral-200 p-4">
    <h2 class="font-semibold text-neutral-900">Customers <span class="ml-1 text-sm font-normal text-neutral-400">3</span></h2>
  </div>
  <table class="w-full text-sm">
    <tbody class="divide-y divide-neutral-100 text-neutral-700">
      <tr class="hover:bg-neutral-50">
        <td class="p-4">Ada Lovelace</td>
        <td class="p-4"><span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

完整版（含搜尋/排序 JS）：`examples/vibeprompts-data-table.html`。

## 時間軸／活動紀錄

```html
<div class="rounded-2xl border border-neutral-200 bg-white">
  <div class="flex items-center justify-between border-b border-neutral-200 p-4">
    <h2 class="font-semibold text-neutral-900">Activity</h2>
  </div>
  <ol class="relative space-y-6 p-5 pl-11">
    <span class="absolute bottom-6 left-6 top-6 w-px -translate-x-1/2 bg-neutral-200"></span>
    <li class="relative">
      <span class="absolute -left-7 top-1 h-4 w-4 rounded-full bg-green-100 ring-4 ring-white"></span>
      <p class="text-sm text-neutral-600"><span class="font-medium text-neutral-900">Priya Shah</span> merged <a href="#" class="font-medium text-neutral-900 hover:underline">#2481</a></p>
      <p class="mt-0.5 text-xs text-neutral-400">12 minutes ago</p>
    </li>
  </ol>
</div>
```

完整版：`examples/vibeprompts-activity-feed.html`。

## 範例元件（`examples/`）

| 檔案 | 來源 | 用途 |
|---|---|---|
| `vibeprompts-sidebar-stat-cards.html` | vibeprompts.dev 官方程式碼 | app shell + KPI 磚 |
| `vibeprompts-data-table.html` | vibeprompts.dev 官方程式碼 | 可搜尋/排序清單 |
| `vibeprompts-activity-feed.html` | vibeprompts.dev 官方程式碼 | 時間軸 |
| `approvals-workspace.html` | 自建（沿用本系統配色語言） | 兩欄式審批工作台 |
| `incident-board.html` | 自建 | 依嚴重度分組的事件看板 |
| `kanban-board.html` | 自建 | 拖拉式看板 |

## 使用方式

任何新專案的儀表板/UI，開工前：

1. 讀這份 `tokens.md`，不要重新設計配色系統。
2. 需要新元件時，先看 `examples/` 有沒有現成可以改的圖案。
3. 用 Tailwind CDN（`<script src="https://cdn.tailwindcss.com"></script>`），不要手刻一套 CSS 變數模擬 Tailwind——這是之前反覆被 Fish 打回票的舊做法，直接用真的 Tailwind class。
4. 深色模式用 `tailwind.config = { darkMode: 'class' }` + `<html class="dark">` 切換，配色邏輯照本文件的 `dark:` 對照表。
