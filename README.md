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
2. **行情刷新**：`node scripts/refresh-quotes.mjs` 通过腾讯行情接口（qt.gtimg.cn）自动拉取所有 A/H 股现价，换算 HKD/CNY 汇率（新浪接口），重算市值/仓位/盈亏并写回 `public/data.json`。
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

> 重要：GitHub Actions 只能自动刷新**价格**（现价/市值/仓位/盈亏），无法自动读取雪球月报 PS 图片里的**持仓变动明细**（新开仓/加仓/减仓/清仓的股数）。这类变动需要每月根据帖子内容手动调整 `public/data.json` 的 holdings/categories，推送后会自动重新部署。如需帮忙，让 WorkBuddy 处理即可。

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
