# 月报

一个仿雪球持仓展示风格的个人网站，每月更新一次 A/H 股持仓变动（数据源：@挖地瓜的超级鹿鼎公 公开披露）。**数据自动更新，无需手动维护。**

## 访问地址

- **GitHub Pages（云端自动更新主入口）**：https://2297603524.github.io/xueqiu-portfolio/
- CloudStudio 备用入口：https://0f33efb1227c40b0b0985cb999648e3a.app.workbuddy.link

## 技术栈

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- 完全静态站点，可部署到任何静态托管服务

## 自动更新机制（核心）

云端流水线由 GitHub Actions 驱动（.github/workflows/monthly-update.yml），**不依赖任何本地电脑**：

1. **每月 1 日 09:00（北京时间）自动触发**，也支持在仓库 Actions 页面手动运行（Run workflow）。
2. **行情刷新**：`node scripts/refresh-quotes.mjs` 通过腾讯行情接口（qt.gtimg.cn）自动拉取所有 A/H 股现价，汇率取自腾讯外汇 `whHKDCNY`（失败再降级到新浪），重算市值/仓位/盈亏并写回 `public/data.json`。
3. **数据自动提交**：刷新结果自动 commit 并 push 回 main 分支。
4. **自动构建**：`npm ci && npm run build`（base=/xueqiu-portfolio/ 子路径）。
5. **自动部署**：peaceiris/actions-gh-pages 将 dist 部署到 gh-pages 分支，GitHub Pages 自动更新。
6. 数据变更（data.json 被推送）也会自动触发重新部署。

### 手动执行一次

```bash
node scripts/refresh-quotes.mjs   # 仅刷新行情
npm run build                     # 构建（GitHub Pages 子路径）
npm run build:root                # 构建（根路径，CloudStudio 用）
```

## 项目结构

```
xueqiu-portfolio/
├── public/
│   └── data.json          # 月度持仓数据（每月追加一份，行情自动刷新）
├── scripts/
│   └── refresh-quotes.mjs # 行情自动刷新脚本（腾讯行情 + 腾讯外汇）
├── src/
│   ├── components/        # React 组件（含 ErrorBoundary 兜底）
│   ├── hooks/
│   │   └── useRealtimeQuotes.ts  # 3s 轮询实时行情（后台标签页自动暂停）
│   ├── lib/
│   │   ├── format.ts      # 数字格式化
│   │   └── realtime.ts    # JSONP 行情 / 汇率协议解析
│   └── types.ts           # 数据模型
├── tailwind.config.js
├── vite.config.ts
└── index.html
```

## 数据口径与实时行情说明

- **总资产 / 可用现金**：取自官方月报，不随行情波动，是"官方口径"。
- **持仓市值 / 盈亏 / 仓位**：按最新行情（或 data.json 快照）计算，属"行情口径"。
  两者可能略有差异，页面上已用 tooltip 与页脚口径标签标注。
- **仓位**：分母统一为月报总资产，因此 A+H 各行的仓位可以纵向对比。
- **实时行情**：浏览器通过 JSONP 直连 `qt.gtimg.cn`，默认 3 秒一次；
  页面切到后台标签页时自动暂停轮询，切回来立即补一次。
- **汇率**：优先腾讯外汇 `whHKDCNY`；不可用时依次降级到
  `api.fxratesapi.com`、`open.er-api.com`，全部失败才用兜底常量（页脚会标注"兜底值"）。
  之所以不用新浪 `hq.sinajs.cn`：它对外域 Referer 一律返回 403，浏览器端 JSONP 必然失败。
- **H 股现价**：直接存储在 `currentPriceHKD` 字段，不再用"市值 ÷ 股数 ÷ 汇率"反推，避免抖动。
- 非交易时段行情不变化属正常现象（接口返回的是最近一次收盘价）。

## 常见坑（已修复，勿回退）

| 坑 | 说明 |
| --- | --- |
| 腾讯涨跌幅字段 | `parts[32]` 是**百分数**（`0.04` 表示 0.04%），必须 `/100` 才是小数比例，否则被放大 100 倍 |
| 涨跌幅显示 | 不能用 `Math.abs()`，否则下跌会显示成正数（只是颜色变绿） |
| 合计行仓位 | 分母要用月报总资产，不能写成 `totalMV / totalMV`（恒为 100%） |
| 汇率源 | 新浪 `hq.sinajs.cn` 对外域 Referer 返回 403，浏览器端不要用它 |
| React setState | 不要在 `setState` 的 updater 里调用另一个 `setState`（严格模式下会重复执行） |

## 每月更新数据

每次月初（1 日内）更新 `public/data.json`，在 `history` 数组**末尾追加**一条新的月份快照即可
（数组按时间**升序**排列，最后一项即"最新月份"，前端与刷新脚本都以此为准）：

```jsonc
{
  "month": "2026-09",          // 必填，月份标识，需唯一
  "label": "2026 年 9 月",      // 显示文案
  "summary": {
    "totalAssets": 19000000,
    "availableCash": 600000,
    "cashRatio": 0.0315
  },
  "categories": [
    { "type": "open",   "label": "新开仓", "count": 1, "stocks": [...] },
    { "type": "close",  "label": "清仓",   "count": 0, "stocks": [] },
    { "type": "add",    "label": "加仓",   "count": 3, "stocks": [...] },
    { "type": "reduce", "label": "减仓",   "count": 2, "stocks": [...] }
  ],
  "aShares": {
    "marketValue": 14000000,
    "holdings": [ /* 当前仍持有的 A 股 + 本月已清仓但有盈亏显示的 */ ]
  },
  "hShares": {
    "marketValueHKD": null,
    "marketValueCNY": 4500000,
    "holdings": [ /* 同上，H 股 */ ]
  },
  "audit": { "by": "三方验证通过", "verified": true }
}
```

类型定义见 `src/types.ts`。

> 提示：不需要再写新代码，改完 JSON 重新 build 部署即可。

> 重要：GitHub Actions 只能自动刷新**价格**（现价/市值/仓位/盈亏），无法自动读取雪球月报 PS 图片里的**持仓变动明细**（新开仓/加仓/减仓/清仓的股数）。这类变动需要每月根据帖子内容手动调整 `public/data.json` 的 holdings/categories，推送后会自动重新部署。如需帮忙，让 WorkBuddy 处理即可。

## 月末自动抓取当月持仓（可选）

`月报-月末自动抓取持仓` Workflow 会在**每月最后一个交易日 17:00（北京时间）**自动从雪球拉取当前持仓，与上月 diff 生成当月快照（新开仓/清仓/加仓/减仓、总资产、现金），写入 `public/data.json` 并提交；提交会自动触发现有部署流程（刷新行情 → 构建 → 上线），实现全自动月报。

触发机制：
- 定时：每月 28-31 日 17:00（09:00 UTC）触发，脚本内部判定当天是否为**当月最后一个交易日**（工作日 + 内置 2026-2027 法定节假日表，非最后交易日自动跳过、零提交）
- 手动：仓库 Actions 页面 → `月报-月末自动抓取持仓` → Run workflow（方便测试）

首次使用需配置 2 个 Secrets（仓库 Settings → Secrets and variables → Actions → New repository secret）：

| Secret | 说明 | 获取方法 |
|---|---|---|
| `XUEQIU_COOKIE` | 雪球登录 Cookie | 浏览器登录 xueqiu.com → F12 → Network → 任意接口请求头 Cookie（含 `xq_a_token=`、`u=` 等），完整复制。Cookie 会过期，过期后需更新 |
| `XUEQIU_PID` | 雪球组合 ID | 打开你的雪球持仓页面，地址栏 `pid=` 后的数字 |

工作原理：
1. `scripts/fetch-monthly-report.mjs` 调用雪球持仓接口（`/v5/stock/portfolio/stock/list.json` + `hold_info.json`）
2. 与 `data.json` 最新月份 diff，自动生成当月 `categories`（新开仓/清仓/加仓/减仓）与 `summary`（总资产/可用现金）
3. 当月已有快照则**覆盖**（同月多次运行幂等），否则追加
4. 提交 `data.json` → 现有 `月报-云端自动更新` 自动刷新行情并部署

本地手动测试：

```bash
XUEQIU_COOKIE="xq_a_token=...; u=..." XUEQIU_PID="123456789" \
  node scripts/fetch-monthly-report.mjs --force
```

> 注意：雪球接口返回的 `avg_cost` 可能为负（分红回收本金），月报展示已支持「成本已回收」徽章。
> 节假日表按年度更新于脚本 `HOLIDAYS` 常量，请每年核对国务院放假安排。

## 本地开发

```bash
npm install
npm run dev
```

默认端口 `http://127.0.0.1:5173/`。

## 构建

```bash
npm run build
```

产物在 `dist/`，可托管在任何静态服务（CloudStudio Pages、GitHub Pages、Vercel、Netlify、Nginx）。

## 部署到 CloudStudio

直接把 `dist/` 目录交给 cloudstudio-deploy 即可。
