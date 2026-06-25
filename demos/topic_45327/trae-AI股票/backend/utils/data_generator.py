"""
模拟股票数据生成器
生成包含 date/open/high/low/close/volume 字段的合成股票数据
"""
import numpy as np
import pandas as pd


def generate_mock_stock(days=365, start_price=100.0, volatility=0.02, seed=42):
    """生成模拟股票日K数据"""
    rng = np.random.default_rng(seed)
    dates = pd.bdate_range(end=pd.Timestamp.today(), periods=days)

    # 几何布朗运动模拟价格
    returns = rng.normal(loc=0.0005, scale=volatility, size=days)
    prices = start_price * np.exp(np.cumsum(returns))

    # 生成 OHLV
    open_ = prices * (1 + rng.normal(0, volatility / 2, days))
    high = np.maximum(prices, open_) * (1 + np.abs(rng.normal(0, volatility / 2, days)))
    low = np.minimum(prices, open_) * (1 - np.abs(rng.normal(0, volatility / 2, days)))
    volume = rng.integers(1_000_000, 10_000_000, size=days)

    df = pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "open": np.round(open_, 2),
        "high": np.round(high, 2),
        "low": np.round(low, 2),
        "close": np.round(prices, 2),
        "volume": volume,
    })
    return df
