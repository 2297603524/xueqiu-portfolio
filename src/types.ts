// 数据模型 TypeScript 类型定义
// 每月一个快照，存放在 /public/data.json 的 history 数组中

export type OpType = "open" | "close" | "add" | "reduce" | "hold" | "closed";

export interface CategoryStock {
  code: string;
  name: string;
  /** 变动股数（正数加仓 / 负数减仓 / 清仓为负） */
  delta: number;
  /** 是否为本月最大变动（同分类内） */
  largest?: boolean;
}

export interface Category {
  type: "open" | "close" | "add" | "reduce";
  label: string;
  count: number;
  stocks: CategoryStock[];
}

export interface AShareHolding {
  code: string;
  name: string;
  shares: number;
  delta: number;
  op: OpType;
  costPrice: number;
  currentPrice: number;
  marketValue: number;
  weight: number; // 占比 (0-1)
  profitAmount: number;
  profitRatio: number | null; // 收益率 (允许负；成本为 0 时为 null)
}

export interface HShareHolding {
  code: string;
  name: string;
  shares: number;
  delta: number;
  op: OpType;
  costPriceHKD: number;
  marketValueCNY: number;
  weight: number;
  profitAmountCNY: number;
  profitRatio: number | null;
}

export interface MonthReport {
  month: string; // YYYY-MM
  label: string; // 显示文案
  summary: {
    totalAssets: number;
    availableCash: number;
    cashRatio: number;
  };
  categories: Category[];
  aShares: {
    marketValue: number;
    holdings: AShareHolding[];
  };
  hShares: {
    marketValueHKD: number | null;
    marketValueCNY: number;
    holdings: HShareHolding[];
  };
  audit?: {
    by: string;
    verified: boolean;
  };
}

export interface PortfolioData {
  title: string;
  subtitle: string;
  currency: string;
  history: MonthReport[];
}
