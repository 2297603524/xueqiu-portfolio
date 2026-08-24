# 超级鹿鼎公 · 持仓月报

一个仿雪球持仓展示风格的个人网站，每月更新一次「超级鹿鼎公」的 A/H 股持仓变动。**数据自动更新，无需手动维护。**

## 技术栈

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- 完全静态站点，可部署到任何静态托管服务

## 自动更新机制（核心）

每月 1 日 09:00 由 WorkBuddy 自动化任务执行，全程无人值守：

1. **行情刷新**：`node scripts/refresh-quotes.mjs` 通过腾讯行情接口（qt.gtimg.cn）自动拉取所有 A/H 股现价，换算 HKD/CNY 汇率（新浪接口），重算市值/仓位/盈亏并写回 `public/data.json`。
2. **月报检测**：抓取雪球超级鹿鼎公主页（xueqiu.com/8790885129），比对是否有新月份「游戏仓X月PS图」月报。
3. **快照生成**：如发现新月报，按帖文数据生成新月份快照追加到 history（收益数据自动填充，持仓变动按帖子操作描述调整；信息不足时宁缺毋滥）。
4. **构建 + 部署**：`npm run build` 后自动部署到 CloudStudio，产出新分享链接。

### 手动执行一次

```bash
node scripts/refresh-quotes.mjs   # 仅刷新行情
npm run build                     # 重新构建
```

## 项目结构

```
xueqiu-portfolio/
├── public/
│   └── data.json          # 月度持仓数据（每月追加一份，行情自动刷新）
├── scripts/
│   └── refresh-quotes.mjs # 行情自动刷新脚本（腾讯行情 + 新浪汇率）
├── src/
│   ├── components/        # React 组件
│   ├── lib/format.ts      # 数字格式化
│   └── types.ts           # 数据模型
├── tailwind.config.js
├── vite.config.ts
└── index.html
```

## 每月更新数据

每次月初（1 日内）更新 `public/data.json`，在 `history` 数组头部追加一条新的月份快照即可：

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

> 重要：由于自动化任务生成快照时依据的是雪球帖子的文字描述（持仓明细在帖子的 PS 图片里，无法自动读取），部分明细可能存在误差。如发现偏差，可在 automation 任务的汇报里指出，或手动调整 `public/data.json` 后重跑 `npm run build`。

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
