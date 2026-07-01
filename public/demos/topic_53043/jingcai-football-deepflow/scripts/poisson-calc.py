#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
泊松分布比分概率计算器
用法：python poisson-calc.py <mu1> <mu2>
例：python poisson-calc.py 1.81 1.05
"""
import sys
import math

def poisson_pmf(k: int, mu: float) -> float:
    """泊松分布概率质量函数 P(X=k)"""
    return (mu ** k * math.exp(-mu)) / math.factorial(k)

def score_matrix(mu1: float, mu2: float, max_goals: int = 5):
    """生成比分概率矩阵"""
    matrix = {}
    for i in range(max_goals + 1):
        for j in range(max_goals + 1):
            p = poisson_pmf(i, mu1) * poisson_pmf(j, mu2)
            matrix[(i, j)] = p
    return matrix

def analyze(mu1: float, mu2: float):
    """输出完整分析"""
    print("=" * 60)
    print(f"📊 泊松分布比分预测")
    print(f"   主队期望进球 μ₁ = {mu1}")
    print(f"   客队期望进球 μ₂ = {mu2}")
    print("=" * 60)
    
    matrix = score_matrix(mu1, mu2, max_goals=5)
    
    # Top 比分
    sorted_scores = sorted(matrix.items(), key=lambda x: -x[1])
    print("\n🎯 Top 8 最可能比分：")
    for (i, j), p in sorted_scores[:8]:
        bar = "█" * int(p * 100)
        print(f"   {i}:{j}  {p*100:5.2f}%  {bar}")
    
    # 胜平负
    home_win = sum(p for (i, j), p in matrix.items() if i > j)
    draw = sum(p for (i, j), p in matrix.items() if i == j)
    away_win = sum(p for (i, j), p in matrix.items() if i < j)
    print(f"\n⚖️  胜平负：")
    print(f"   主胜：{home_win*100:5.2f}%")
    print(f"   平局：{draw*100:5.2f}%")
    print(f"   客胜：{away_win*100:5.2f}%")
    
    # 大小球
    thresholds = [1.5, 2.5, 3.5]
    print(f"\n⚽ 大小球：")
    for t in thresholds:
        over = sum(p for (i, j), p in matrix.items() if i + j > t)
        under = 1 - over
        print(f"   大 {t}：{over*100:5.2f}%   小 {t}：{under*100:5.2f}%")
    
    # 双方进球
    both = sum(p for (i, j), p in matrix.items() if i > 0 and j > 0)
    print(f"\n🎯 双方进球：是 {both*100:5.2f}%   否 {(1-both)*100:5.2f}%")
    
    # 让球盘模拟
    print(f"\n📉 让球盘模拟：")
    handicaps = [-1.5, -1.0, -0.5, 0.0, 0.5, 1.0]
    for h in handicaps:
        if h.is_integer():
            # 整数盘：可能走盘
            home_win_handicap = sum(p for (i, j), p in matrix.items() if i - j + h > 0)
            draw_handicap = sum(p for (i, j), p in matrix.items() if i - j + h == 0)
            away_win_handicap = sum(p for (i, j), p in matrix.items() if i - j + h < 0)
            print(f"   让球 {h:+.1f}：主胜 {home_win_handicap*100:.1f}%  走盘 {draw_handicap*100:.1f}%  客胜 {away_win_handicap*100:.1f}%")
        else:
            # 半球盘：无走盘
            home = sum(p for (i, j), p in matrix.items() if i - j + h > 0)
            print(f"   让球 {h:+.1f}：主胜 {home*100:.1f}%  客胜 {(1-home)*100:.1f}%")
    
    print("\n" + "=" * 60)
    print("⚠️  风险提示：")
    print("   本分析仅为数据娱乐，不构成投注建议")
    print("   竞彩有风险，理性参与，未成年人严禁参与")
    print("=" * 60)

def main():
    if len(sys.argv) < 3:
        print("用法：python poisson-calc.py <主队期望进球> <客队期望进球>")
        print("例： python poisson-calc.py 1.81 1.05")
        sys.exit(1)
    mu1 = float(sys.argv[1])
    mu2 = float(sys.argv[2])
    if mu1 <= 0 or mu2 <= 0:
        print("错误：期望进球必须 > 0")
        sys.exit(1)
    analyze(mu1, mu2)

if __name__ == "__main__":
    main()
