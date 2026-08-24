#!/usr/bin/env python3
"""
追加鹿鼎公历史月份快照到 public/data.json
数据来源：网友整理的 @挖地瓜的超级鹿鼎公 微博月报截图（2025-10 ~ 2026-03）
HKD/CNY 汇率采用近似值 0.92（市值绝对值与现实略有偏差，相对比例合理）
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "public" / "data.json"

# HKD/CNY 近似汇率（用于历史快照的港股市值换算）
HKD_CNY = 0.92

# 历史月份输入数据：每月只需给最少必要字段，其余由脚本派生
# op: open 新开仓 / close 清仓 / add 加仓 / reduce 减仓 / hold 不变 / closed 已清仓
MONTHS = [
    {
        "month": "2025-10",
        "label": "2025 年 10 月",
        "summary": {
            "totalAssets": 17482554.96,
            "availableCash": 1678066.87,
            "cashRatio": 1678066.87 / 17482554.96,
        },
        "audit": "数据来源：网友整理的微博月报截图（HKD/CNY ≈ 0.92 近似）",
        "monthlyPL": {"profit": 1548000, "ratio": 0.0914},
        # 与上月（9月）相比，可推断 delta 仅作参考；这里 lock 在 hold 状态
        "aShares": [
            ("000807.SZ", "云铝股份", 87000, 18.564, 22.990, "hold"),
            ("600863.SH", "内蒙华电", 400000, 3.228, 4.280, "hold"),
            ("511880.SH", "银华日利", 15000, 100.785, 101.025, "hold"),
            ("601225.SH", "陕西煤业", 48000, 20.484, 22.700, "hold"),
            ("601088.SH", "中国神华", 22000, 36.677, 42.510, "hold"),
            ("600900.SH", "长江电力", 32500, 27.794, 28.150, "hold"),
            ("001286.SZ", "陕西能源", 73500, 9.065, 9.830, "hold"),
            ("600886.SH", "国投电力", 9000, 6.685, 14.370, "hold"),
            ("600985.SH", "淮北矿业", 5000, -377.621, 13.300, "hold"),
            ("000933.SZ", "神火股份", 1900, -314.836, 24.730, "hold"),
            ("600989.SH", "宝丰能源", 2000, 17.775, 18.410, "hold"),
            ("000651.SZ", "格力电器", 0, 43.684, 39.750, "closed"),
        ],
        "hShares": [
            ("01898.HK", "中煤能源", 260000, 1.358, 1.484, "hold"),
            ("00902.HK", "华能国际电力股份", 210000, 3.221, 3.519, "hold"),
            ("01030.HK", "新城发展", 500000, 0.686, 0.750, "hold"),
            ("00883.HK", "中国海洋石油", 31000, 15.044, 16.436, "hold"),
            ("00700.HK", "腾讯控股", 300, 318.439, 347.907, "hold"),
            ("03933.HK", "联邦制药", 6000, 11.909, 13.011, "hold"),
        ],
    },
    {
        "month": "2025-11",
        "label": "2025 年 11 月",
        "summary": {
            "totalAssets": 17602810.84,
            "availableCash": 1085975.67,
            "cashRatio": 1085975.67 / 17602810.84,
        },
        "audit": "数据来源：网友整理的微博月报截图（HKD/CNY ≈ 0.92 近似）",
        "monthlyPL": {"profit": 121000, "ratio": 0.0065},
        "aShares": [
            ("511880.SH", "银华日利", 25000, 100.882, 101.114, "add"),
            ("600900.SH", "长江电力", 71000, 28.034, 27.980, "add"),
            ("000807.SZ", "云铝股份", 74000, 16.961, 24.700, "reduce"),
            ("600863.SH", "内蒙华电", 400000, 3.201, 4.540, "hold"),
            ("601225.SH", "陕西煤业", 42000, 20.010, 22.680, "reduce"),
            ("601088.SH", "中国神华", 22000, 35.697, 41.140, "hold"),
            ("001286.SZ", "陕西能源", 73500, 9.065, 9.800, "hold"),
            ("600886.SH", "国投电力", 9000, 6.685, 13.770, "hold"),
            ("600985.SH", "淮北矿业", 5000, -377.621, 12.300, "hold"),
        ],
        "hShares": [
            ("01898.HK", "中煤能源", 270000, 1.613, 1.773, "add"),
            ("00902.HK", "华能国际电力股份", 220000, 3.331, 3.660, "add"),
            ("01030.HK", "新城发展", 500000, 0.676, 0.743, "hold"),
            ("00883.HK", "中国海洋石油", 31000, 15.044, 16.530, "hold"),
            ("00700.HK", "腾讯控股", 300, 318.439, 349.895, "hold"),
        ],
    },
    {
        "month": "2025-12",
        "label": "2025 年 12 月",
        "summary": {
            "totalAssets": 17597072.80,
            "availableCash": 366144.25,
            "cashRatio": 366144.25 / 17597072.80,
        },
        "audit": "数据来源：网友整理的微博月报截图（HKD/CNY ≈ 0.92 近似）",
        "monthlyPL": {"profit": 22000, "ratio": 0.0010},
        "aShares": [
            ("511880.SH", "银华日利", 25000, 99.726, 100.075, "hold"),
            ("600863.SH", "内蒙华电", 400000, 3.184, 4.480, "hold"),
            ("600886.SH", "国投电力", 9000, 6.685, 13.120, "hold"),
            ("600900.SH", "长江电力", 81000, 27.995, 27.190, "add"),
            ("600985.SH", "淮北矿业", 5000, -377.621, 11.110, "hold"),
            ("601088.SH", "中国神华", 0, 38.304, 40.500, "closed"),
            ("601225.SH", "陕西煤业", 91000, 20.908, 21.320, "add"),
            ("000807.SZ", "云铝股份", 48000, 9.936, 32.840, "reduce"),
            ("000933.SZ", "神火股份", 25000, 25.285, 27.470, "add"),
            ("001286.SZ", "陕西能源", 73500, 9.065, 9.310, "hold"),
        ],
        "hShares": [
            ("01898.HK", "中煤能源", 285000, 2.020, 2.251, "add"),
            ("00902.HK", "华能国际电力股份", 320000, 3.996, 4.453, "add"),
            ("01030.HK", "新城发展", 500000, 0.676, 0.753, "hold"),
            ("00883.HK", "中国海洋石油", 31000, 15.044, 16.764, "hold"),
            ("00700.HK", "腾讯控股", 300, 318.439, 354.847, "hold"),
        ],
    },
    {
        "month": "2026-01",
        "label": "2026 年 1 月",
        "summary": {
            "totalAssets": 18622698.97,
            "availableCash": 15931.17,
            "cashRatio": 15931.17 / 18622698.97,
        },
        "audit": "数据来源：网友整理的微博月报截图（HKD/CNY ≈ 0.92 近似）",
        "monthlyPL": {"profit": 997000, "ratio": 0.0566},
        "aShares": [
            ("600900.SH", "长江电力", 195000, 26.857, 26.360, "add"),
            ("000807.SZ", "云铝股份", 68000, 16.651, 33.640, "add"),
            ("601225.SH", "陕西煤业", 91000, 20.908, 21.320, "hold"),
            ("600863.SH", "内蒙华电", 400000, 3.184, 4.480, "hold"),
            ("511880.SH", "银华日利", 25000, 99.726, 100.075, "hold"),
            ("600886.SH", "国投电力", 9000, 6.685, 13.120, "hold"),
            ("600985.SH", "淮北矿业", 5000, -377.621, 11.110, "hold"),
            ("000933.SZ", "神火股份", 25000, 25.285, 27.470, "hold"),
            ("001286.SZ", "陕西能源", 73500, 9.065, 9.310, "hold"),
        ],
        "hShares": [
            ("01898.HK", "中煤能源", 285000, 2.020, 2.251, "hold"),
            ("00902.HK", "华能国际电力股份", 320000, 3.996, 4.453, "hold"),
            ("01030.HK", "新城发展", 500000, 0.676, 0.753, "hold"),
            ("00883.HK", "中国海洋石油", 31000, 15.044, 16.764, "hold"),
            ("00700.HK", "腾讯控股", 300, 318.439, 354.847, "hold"),
        ],
    },
    {
        "month": "2026-02",
        "label": "2026 年 2 月",
        "summary": {
            "totalAssets": 18885000.00,
            "availableCash": 80000.00,
            "cashRatio": 80000.00 / 18885000.00,
        },
        "audit": "数据来源：网友整理的微博月报截图（持仓变动按帖子操作描述近似）",
        "monthlyPL": {"profit": 263000, "ratio": 0.0141},
        "aShares": [
            ("600900.SH", "长江电力", 195000, 26.857, 26.360, "hold"),
            ("000807.SZ", "云铝股份", 68000, 16.651, 33.640, "hold"),
            ("601225.SH", "陕西煤业", 91000, 20.908, 21.320, "hold"),
            ("600863.SH", "内蒙华电", 400000, 3.184, 4.480, "hold"),
            ("511880.SH", "银华日利", 25000, 99.726, 100.075, "hold"),
            ("600886.SH", "国投电力", 9000, 6.685, 13.120, "hold"),
            ("600985.SH", "淮北矿业", 5000, -377.621, 11.110, "hold"),
            ("000933.SZ", "神火股份", 25000, 25.285, 27.470, "hold"),
            ("001286.SZ", "陕西能源", 73500, 9.065, 9.310, "hold"),
        ],
        "hShares": [
            # 操作: 减持新城、中煤H, 清仓海油H
            ("01898.HK", "中煤能源", 250000, 2.020, 2.251, "reduce"),
            ("00902.HK", "华能国际电力股份", 320000, 3.996, 4.453, "hold"),
            ("01030.HK", "新城发展", 400000, 0.676, 0.753, "reduce"),
            # 中国海洋石油 已清仓
            ("00700.HK", "腾讯控股", 300, 318.439, 354.847, "hold"),
        ],
    },
    {
        "month": "2026-03",
        "label": "2026 年 3 月",
        "summary": {
            "totalAssets": 19339000.00,
            "availableCash": 700000.00,
            "cashRatio": 700000.00 / 19339000.00,
        },
        "audit": "数据来源：网友整理的微博月报截图（持仓变动按帖子操作描述近似）",
        "monthlyPL": {"profit": 454000, "ratio": 0.0240},
        "aShares": [
            # 减持中煤H、陕煤、长江电力; 加仓云铝、新城、移动A
            ("600900.SH", "长江电力", 137000, 26.857, 26.360, "reduce"),
            ("000807.SZ", "云铝股份", 85000, 16.651, 33.640, "add"),
            ("601225.SH", "陕西煤业", 80000, 20.908, 21.320, "reduce"),
            ("600863.SH", "内蒙华电", 400000, 3.184, 4.480, "hold"),
            ("511880.SH", "银华日利", 25000, 99.726, 100.075, "hold"),
            ("600886.SH", "国投电力", 9000, 6.685, 13.120, "hold"),
            ("600985.SH", "淮北矿业", 5000, -377.621, 11.110, "hold"),
            ("000933.SZ", "神火股份", 25000, 25.285, 27.470, "hold"),
            ("001286.SZ", "陕西能源", 73500, 9.065, 9.310, "hold"),
            ("600941.SH", "中国移动", 8000, 95.000, 105.000, "open"),  # 加仓移动A（操作描述）
        ],
        "hShares": [
            ("01898.HK", "中煤能源", 230000, 2.020, 2.251, "reduce"),
            ("00902.HK", "华能国际电力股份", 320000, 3.996, 4.453, "hold"),
            ("01030.HK", "新城发展", 500000, 0.676, 0.753, "add"),
            ("00700.HK", "腾讯控股", 300, 318.439, 354.847, "hold"),
        ],
    },
]


def build_a_share(code, name, shares, cost, price, op):
    market = round(shares * price)
    profit = round((price - cost) * shares)
    ratio = ((price - cost) / cost) if cost not in (0, None) else None
    return {
        "code": code,
        "name": name,
        "shares": shares,
        "delta": 0,  # 由 categories 直接给出更准；此项留 0 仅在 hold/月内变化未明确时
        "op": op,
        "costPrice": cost,
        "currentPrice": price,
        "marketValue": market,
        "weight": 0,  # 由后续总市值算出，下面统一设置
        "profitAmount": profit,
        "profitRatio": ratio,
    }


def build_h_share(code, name, shares, cost_hkd, price_hkd, op):
    market_cny = round(shares * price_hkd * HKD_CNY)
    profit_cny = round((price_hkd - cost_hkd) * HKD_CNY * shares)
    ratio = ((price_hkd - cost_hkd) / cost_hkd) if cost_hkd not in (0, None) and cost_hkd > 0 else None
    return {
        "code": code,
        "name": name,
        "shares": shares,
        "delta": 0,
        "op": op,
        "costPriceHKD": cost_hkd,
        "marketValueCNY": market_cny,
        "weight": 0,
        "profitAmountCNY": profit_cny,
        "profitRatio": ratio,
    }


def build_categories(curr_a, curr_h, prev_a, prev_h):
    """根据本月 op 与上月 shares 差生成开/清/加/减四个分类。curr_* 为字典列表。"""
    cats = {"open": [], "close": [], "add": [], "reduce": []}

    def diff(curr_list, prev_list):
        prev_by = {p["code"]: p for p in prev_list}
        for h in curr_list:
            prev_shares = prev_by.get(h["code"], {}).get("shares", 0)
            delta = h["shares"] - prev_shares
            item = {"code": h["code"], "name": h["name"], "delta": delta}
            if prev_shares == 0 and h["shares"] > 0:
                cats["open"].append(item)
            elif h["shares"] == 0 and prev_shares > 0:
                cats["close"].append(item)
            elif delta > 0:
                cats["add"].append(item)
            elif delta < 0:
                cats["reduce"].append(item)

    diff(curr_a, prev_a)
    diff(curr_h, prev_h)

    out = [
        {"type": "open",   "label": "新开仓", "count": len(cats["open"]),   "stocks": cats["open"]},
        {"type": "close",  "label": "清仓",   "count": len(cats["close"]),  "stocks": cats["close"]},
        {"type": "add",    "label": "加仓",   "count": len(cats["add"]),    "stocks": cats["add"]},
        {"type": "reduce", "label": "减仓",   "count": len(cats["reduce"]), "stocks": cats["reduce"]},
    ]
    return out


def build_month(month_def, prev_a, prev_h):
    a_holdings = [build_a_share(*t) for t in month_def["aShares"]]
    h_holdings = [build_h_share(*t) for t in month_def["hShares"]]
    a_value = sum(h["marketValue"] for h in a_holdings)
    h_value = sum(h["marketValueCNY"] for h in h_holdings)
    total = month_def["summary"]["totalAssets"]
    for h in a_holdings:
        h["weight"] = (h["marketValue"] / total) if total > 0 else 0
    for h in h_holdings:
        h["weight"] = (h["marketValueCNY"] / total) if total > 0 else 0
    return {
        "month": month_def["month"],
        "label": month_def["label"],
        "summary": month_def["summary"],
        "categories": build_categories(a_holdings, h_holdings, prev_a, prev_h),
        "aShares": {
            "marketValue": a_value,
            "holdings": a_holdings,
        },
        "hShares": {
            "marketValueHKD": None,
            "marketValueCNY": h_value,
            "holdings": h_holdings,
        },
        "audit": month_def["audit"],
    }


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    # 备份现有最新月份（之后作为 history 最末保留）
    newest = data["history"][0]

    # 按时间顺序构建历史月份
    prev_a, prev_h = [], []
    new_snapshots = []
    for md in MONTHS:
        snap = build_month(md, prev_a, prev_h)
        new_snapshots.append(snap)
        prev_a = [{"code": t[0], "shares": t[2]} for t in md["aShares"]]
        prev_h = [{"code": t[0], "shares": t[2]} for t in md["hShares"]]

    # 时间升序：6 个历史月份在最前，newest 在末尾
    data["history"] = new_snapshots + [newest]

    DATA_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"✅ 已添加 {len(new_snapshots)} 个月份快照。")
    print(f"   history 共 {len(data['history'])} 个月份：")
    for h in data["history"]:
        print(f"   - {h['month']} ({h['label']})  总资产 ¥{int(h['summary']['totalAssets']):,}")


if __name__ == "__main__":
    main()
