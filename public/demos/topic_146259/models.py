import json
import re
import base64
import hashlib
from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

import config

SAMPLE_MISTAKES = [
  {
    'id': 1,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '已知二次函数 y = ax² + bx + c 的图像开口向上，对称轴为 x = 1，且过点 (0, 3)。若 a = 2，求该函数的顶点坐标。',
    'answer': '顶点坐标为 (1, 1)',
    'knowledge': '二次函数',
    'reason': '概念不清',
    'difficulty': 3,
    'createdAt': '2026-07-01',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '已知二次函数 y = ax² + bx + c 的图像开口向上，对称轴为 x = 1，且过点 (0, 3)。若 a = 2，求该函数的顶点坐标。'
  },
  {
    'id': 2,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '二次函数 y = -(x-2)² + 3 的图像开口方向如何？最大值是多少？',
    'answer': '开口向下，最大值为 3',
    'knowledge': '二次函数',
    'reason': '计算失误',
    'difficulty': 2,
    'createdAt': '2026-07-02',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '二次函数 y = -(x-2)² + 3 的图像开口方向如何？最大值是多少？'
  },
  {
    'id': 3,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '若二次函数 y = x² - 4x + 5 的最小值为 m，求 m 的值。',
    'answer': 'm = 1',
    'knowledge': '二次函数',
    'reason': '审题偏差',
    'difficulty': 2,
    'createdAt': '2026-07-03',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '若二次函数 y = x² - 4x + 5 的最小值为 m，求 m 的值。'
  },
  {
    'id': 4,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '解方程 x² - 5x + 6 = 0。',
    'answer': 'x₁ = 2，x₂ = 3',
    'knowledge': '一元二次方程',
    'reason': '思路错误',
    'difficulty': 2,
    'createdAt': '2026-07-04',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '解方程 x² - 5x + 6 = 0。'
  },
  {
    'id': 5,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '若一元二次方程 x² - 3x + k = 0 有两个不相等的实数根，求 k 的取值范围。',
    'answer': 'k < 9/4',
    'knowledge': '一元二次方程',
    'reason': '公式遗忘',
    'difficulty': 3,
    'createdAt': '2026-07-05',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '若一元二次方程 x² - 3x + k = 0 有两个不相等的实数根，求 k 的取值范围。'
  },
  {
    'id': 6,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '解方程 2x² - 7x + 3 = 0。',
    'answer': 'x₁ = 3，x₂ = 1/2',
    'knowledge': '一元二次方程',
    'reason': '概念不清',
    'difficulty': 2,
    'createdAt': '2026-07-06',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '解方程 2x² - 7x + 3 = 0。'
  },
  {
    'id': 7,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '在 Rt△ABC 中，∠C = 90°，AC = 3，BC = 4，求 AB 的长度。',
    'answer': 'AB = 5',
    'knowledge': '勾股定理',
    'reason': '计算失误',
    'difficulty': 2,
    'createdAt': '2026-07-07',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '在 Rt△ABC 中，∠C = 90°，AC = 3，BC = 4，求 AB 的长度。'
  },
  {
    'id': 8,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '等腰直角三角形的直角边长为 6，求斜边长。',
    'answer': '斜边长为 6√2',
    'knowledge': '勾股定理',
    'reason': '审题偏差',
    'difficulty': 2,
    'createdAt': '2026-07-08',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '等腰直角三角形的直角边长为 6，求斜边长。'
  },
  {
    'id': 9,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '直角三角形两直角边分别为 5 和 12，求斜边上的高。',
    'answer': '高为 60/13',
    'knowledge': '勾股定理',
    'reason': '思路错误',
    'difficulty': 3,
    'createdAt': '2026-07-09',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '直角三角形两直角边分别为 5 和 12，求斜边上的高。'
  },
  {
    'id': 10,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '如图，DE ∥ BC，AD:DB = 2:3，AE = 4，求 EC。',
    'answer': 'EC = 6',
    'knowledge': '相似三角形',
    'reason': '公式遗忘',
    'difficulty': 3,
    'createdAt': '2026-07-10',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '如图，DE ∥ BC，AD:DB = 2:3，AE = 4，求 EC。'
  },
  {
    'id': 11,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '△ABC 中，DE ∥ BC，AD = 2，DB = 4，DE = 3，求 BC。',
    'answer': 'BC = 9',
    'knowledge': '相似三角形',
    'reason': '概念不清',
    'difficulty': 3,
    'createdAt': '2026-07-11',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '△ABC 中，DE ∥ BC，AD = 2，DB = 4，DE = 3，求 BC。'
  },
  {
    'id': 12,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '两个相似三角形的对应边比为 2:3，面积比为多少？',
    'answer': '面积比为 4:9',
    'knowledge': '相似三角形',
    'reason': '计算失误',
    'difficulty': 2,
    'createdAt': '2026-07-12',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '两个相似三角形的对应边比为 2:3，面积比为多少？'
  },
  {
    'id': 13,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '一次函数 y = kx + b 的图像经过点 (1, 3) 和 (2, 5)，求 k 和 b。',
    'answer': 'k = 2，b = 1',
    'knowledge': '一次函数',
    'reason': '审题偏差',
    'difficulty': 2,
    'createdAt': '2026-07-01',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '一次函数 y = kx + b 的图像经过点 (1, 3) 和 (2, 5)，求 k 和 b。'
  },
  {
    'id': 14,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '一次函数 y = -2x + 4 与 x 轴交点坐标是什么？',
    'answer': '(2, 0)',
    'knowledge': '一次函数',
    'reason': '思路错误',
    'difficulty': 1,
    'createdAt': '2026-07-02',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '一次函数 y = -2x + 4 与 x 轴交点坐标是什么？'
  },
  {
    'id': 15,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '若一次函数 y = (m-1)x + 2 中 y 随 x 增大而减小，求 m 的取值范围。',
    'answer': 'm < 1',
    'knowledge': '一次函数',
    'reason': '公式遗忘',
    'difficulty': 2,
    'createdAt': '2026-07-03',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '若一次函数 y = (m-1)x + 2 中 y 随 x 增大而减小，求 m 的取值范围。'
  },
  {
    'id': 16,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '反比例函数 y = k/x 的图像经过点 (2, 6)，求 k 的值。',
    'answer': 'k = 12',
    'knowledge': '反比例函数',
    'reason': '概念不清',
    'difficulty': 1,
    'createdAt': '2026-07-04',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '反比例函数 y = k/x 的图像经过点 (2, 6)，求 k 的值。'
  },
  {
    'id': 17,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '反比例函数 y = 6/x 经过点 (a, 2)，求 a。',
    'answer': 'a = 3',
    'knowledge': '反比例函数',
    'reason': '计算失误',
    'difficulty': 1,
    'createdAt': '2026-07-05',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '反比例函数 y = 6/x 经过点 (a, 2)，求 a。'
  },
  {
    'id': 18,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '若反比例函数 y = k/x 的图像在每个象限内 y 随 x 增大而增大，k 的符号如何？',
    'answer': 'k < 0',
    'knowledge': '反比例函数',
    'reason': '审题偏差',
    'difficulty': 2,
    'createdAt': '2026-07-06',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '若反比例函数 y = k/x 的图像在每个象限内 y 随 x 增大而增大，k 的符号如何？'
  },
  {
    'id': 19,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '圆 O 的半径为 5，弦 AB 长为 8，求圆心到 AB 的距离。',
    'answer': '距离为 3',
    'knowledge': '圆的性质',
    'reason': '思路错误',
    'difficulty': 3,
    'createdAt': '2026-07-07',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '圆 O 的半径为 5，弦 AB 长为 8，求圆心到 AB 的距离。'
  },
  {
    'id': 20,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '圆的半径为 13，弦心距为 5，求弦长。',
    'answer': '弦长为 24',
    'knowledge': '圆的性质',
    'reason': '公式遗忘',
    'difficulty': 2,
    'createdAt': '2026-07-08',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '圆的半径为 13，弦心距为 5，求弦长。'
  },
  {
    'id': 21,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '如图，AB 是圆 O 的直径，∠ACB 是多少度？',
    'answer': '∠ACB = 90°',
    'knowledge': '圆的性质',
    'reason': '概念不清',
    'difficulty': 2,
    'createdAt': '2026-07-09',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '如图，AB 是圆 O 的直径，∠ACB 是多少度？'
  },
  {
    'id': 22,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '掷一枚质地均匀的骰子，朝上一面的点数为偶数的概率是多少？',
    'answer': '1/2',
    'knowledge': '概率统计',
    'reason': '计算失误',
    'difficulty': 1,
    'createdAt': '2026-07-10',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '掷一枚质地均匀的骰子，朝上一面的点数为偶数的概率是多少？'
  },
  {
    'id': 23,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '袋中有 3 个红球和 2 个白球，随机摸出一个红球的概率是多少？',
    'answer': '3/5',
    'knowledge': '概率统计',
    'reason': '审题偏差',
    'difficulty': 1,
    'createdAt': '2026-07-11',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '袋中有 3 个红球和 2 个白球，随机摸出一个红球的概率是多少？'
  },
  {
    'id': 24,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '一组数据 2, 3, 5, 7, 8 的平均数是多少？',
    'answer': '平均数为 5',
    'knowledge': '概率统计',
    'reason': '思路错误',
    'difficulty': 1,
    'createdAt': '2026-07-12',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '一组数据 2, 3, 5, 7, 8 的平均数是多少？'
  },
  {
    'id': 25,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '计算 √16 + √9 的值。',
    'answer': '7',
    'knowledge': '实数运算',
    'reason': '公式遗忘',
    'difficulty': 1,
    'createdAt': '2026-07-01',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '计算 √16 + √9 的值。'
  },
  {
    'id': 26,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '化简 |√2 - 2| + √2。',
    'answer': '2',
    'knowledge': '实数运算',
    'reason': '概念不清',
    'difficulty': 2,
    'createdAt': '2026-07-02',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '化简 |√2 - 2| + √2。'
  },
  {
    'id': 27,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '计算 (-2)³ + (-3)²。',
    'answer': '1',
    'knowledge': '实数运算',
    'reason': '计算失误',
    'difficulty': 2,
    'createdAt': '2026-07-03',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '计算 (-2)³ + (-3)²。'
  },
  {
    'id': 28,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '计算 (a + b)(a - b)。',
    'answer': 'a² - b²',
    'knowledge': '整式乘法',
    'reason': '审题偏差',
    'difficulty': 1,
    'createdAt': '2026-07-04',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '计算 (a + b)(a - b)。'
  },
  {
    'id': 29,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '因式分解 x² - 9。',
    'answer': '(x + 3)(x - 3)',
    'knowledge': '整式乘法',
    'reason': '思路错误',
    'difficulty': 1,
    'createdAt': '2026-07-05',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '因式分解 x² - 9。'
  },
  {
    'id': 30,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '计算 (2x + 3)²。',
    'answer': '4x² + 12x + 9',
    'knowledge': '整式乘法',
    'reason': '公式遗忘',
    'difficulty': 2,
    'createdAt': '2026-07-06',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '计算 (2x + 3)²。'
  },
  {
    'id': 31,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '解方程 1/x = 2。',
    'answer': 'x = 1/2',
    'knowledge': '分式方程',
    'reason': '概念不清',
    'difficulty': 1,
    'createdAt': '2026-07-07',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '解方程 1/x = 2。'
  },
  {
    'id': 32,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '解方程 (x)/(x-1) = 2。',
    'answer': 'x = 2',
    'knowledge': '分式方程',
    'reason': '计算失误',
    'difficulty': 2,
    'createdAt': '2026-07-08',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 40,
    'status': 'due',
    'ocrText': '解方程 (x)/(x-1) = 2。'
  },
  {
    'id': 33,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '若关于 x 的方程 (x)/(x-3) = m/(x-3) 有增根，求 m 的值。',
    'answer': 'm = 3',
    'knowledge': '分式方程',
    'reason': '审题偏差',
    'difficulty': 3,
    'createdAt': '2026-07-09',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 45,
    'status': 'due',
    'ocrText': '若关于 x 的方程 (x)/(x-3) = m/(x-3) 有增根，求 m 的值。'
  },
  {
    'id': 34,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '解不等式 2x + 1 > 5。',
    'answer': 'x > 2',
    'knowledge': '不等式',
    'reason': '思路错误',
    'difficulty': 1,
    'createdAt': '2026-07-10',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 50,
    'status': 'due',
    'ocrText': '解不等式 2x + 1 > 5。'
  },
  {
    'id': 35,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '解不等式组 {x + 1 > 0, 2x - 4 ≤ 0}。',
    'answer': '-1 < x ≤ 2',
    'knowledge': '不等式',
    'reason': '公式遗忘',
    'difficulty': 2,
    'createdAt': '2026-07-11',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 30,
    'status': 'due',
    'ocrText': '解不等式组 {x + 1 > 0, 2x - 4 ≤ 0}。'
  },
  {
    'id': 36,
    'studentId': 's001',
    'studentName': '王小明',
    'classId': 'c301',
    'title': '若不等式 ax > 1 的解集为 x < 1/a，求 a 的符号。',
    'answer': 'a < 0',
    'knowledge': '不等式',
    'reason': '概念不清',
    'difficulty': 2,
    'createdAt': '2026-07-12',
    'nextReviewAt': '2026-07-11',
    'reviewCount': 0,
    'correctCount': 0,
    'wrongCount': 1,
    'mastery': 35,
    'status': 'due',
    'ocrText': '若不等式 ax > 1 的解集为 x < 1/a，求 a 的符号。'
  }
]




def get_today():
    return datetime.now().strftime('%Y-%m-%d')


def load_mistakes():
    if not config.MISTAKES_JSON.exists():
        save_mistakes(SAMPLE_MISTAKES)
        return SAMPLE_MISTAKES.copy()
    with open(config.MISTAKES_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_mistakes(mistakes):
    tmp_path = config.MISTAKES_JSON.with_suffix('.json.tmp')
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(mistakes, f, ensure_ascii=False, indent=2)
    tmp_path.replace(config.MISTAKES_JSON)


def get_next_id(mistakes):
    if not mistakes:
        return 1
    return max(m['id'] for m in mistakes) + 1


def save_base64_image(image_base64):
    """将 base64 图片保存到 data/images/，返回相对路径 /data/images/xxx.jpg"""
    if not image_base64:
        return ''
    match = re.match(r'data:image/(\w+);base64,(.+)', image_base64)
    if not match:
        return ''
    ext, b64data = match.groups()
    data = base64.b64decode(b64data)
    filename = hashlib.md5(data).hexdigest() + '.' + ext
    filepath = config.IMAGES_DIR / filename
    if not filepath.exists():
        with open(filepath, 'wb') as f:
            f.write(data)
    return f'/data/images/{filename}'



def load_image_base64(relative_path):
    """将相对路径转换为 base64 data URL"""
    if not relative_path:
        return ''
    if relative_path.startswith('/data/images/'):
        filename = relative_path.replace('/data/images/', '')
        filepath = config.IMAGES_DIR / filename
        if filepath.exists():
            ext = filepath.suffix.lstrip('.')
            with open(filepath, 'rb') as f:
                b64 = base64.b64encode(f.read()).decode('utf-8')
            return f'data:image/{ext};base64,{b64}'
    return relative_path


def migrate_base64_images(mistakes):
    """若旧数据 image 字段为 base64，则转存为文件并更新路径"""
    changed = False
    for m in mistakes:
        img = m.get('image', '')
        if img and img.startswith('data:image'):
            m['image'] = save_base64_image(img)
            changed = True
        ans = m.get('answerImage', '')
        if ans and ans.startswith('data:image'):
            m['answerImage'] = save_base64_image(ans)
            changed = True
    if changed:
        save_mistakes(mistakes)
    return mistakes


def cleanup_orphan_images(mistakes):
    """保守策略：删除 data/images/ 下未被任何错题引用的图片文件"""
    if not config.IMAGES_DIR.exists():
        return []
    referenced = set()
    for m in mistakes:
        for key in ('image', 'answerImage'):
            path = m.get(key, '')
            if path and path.startswith('/data/images/'):
                referenced.add(path.replace('/data/images/', ''))

    deleted = []
    for f in config.IMAGES_DIR.iterdir():
        if f.is_file() and f.name not in referenced:
            try:
                f.unlink()
                deleted.append(f.name)
            except OSError:
                pass
    return deleted


# ================= 用户管理 =================

def _default_users():
    return [
        {
            'id': 's001',
            'name': '王小明',
            'classId': 'c301',
            'username': 'wangxiaoming',
            'passwordHash': generate_password_hash('123456'),
            'role': 'student'
        },
        {
            'id': 't001',
            'name': '管理员',
            'classId': 'c301',
            'username': 'lilaoshi',
            'passwordHash': generate_password_hash('123456'),
            'role': 'teacher'
        }
    ]


def load_users():
    if not config.USERS_JSON.exists():
        users = _default_users()
        save_users(users)
        return users
    with open(config.USERS_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_users(users):
    tmp_path = config.USERS_JSON.with_suffix('.json.tmp')
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    tmp_path.replace(config.USERS_JSON)


def get_user_by_username(username):
    users = load_users()
    for u in users:
        if u.get('username') == username:
            return u
    return None


def get_user_by_id(user_id):
    users = load_users()
    for u in users:
        if u.get('id') == user_id:
            return u
    return None


def verify_user(username, password):
    user = get_user_by_username(username)
    if not user:
        return None
    if check_password_hash(user.get('passwordHash', ''), password):
        return user
    return None


def _get_next_user_id(users, role):
    prefix = 's' if role == 'student' else 't'
    nums = []
    for u in users:
        uid = u.get('id', '')
        if uid.startswith(prefix) and uid[1:].isdigit():
            nums.append(int(uid[1:]))
    next_num = max(nums, default=0) + 1
    return f'{prefix}{next_num:03d}'


def create_user(name, class_id, username, password, role='student'):
    if not name or not class_id or not username or not password:
        return None, '姓名、班级、用户名、密码均不能为空'
    if role not in ('student', 'teacher'):
        return None, '角色只能是 student 或 teacher'
    if len(password) < 6:
        return None, '密码长度不能少于 6 位'
    users = load_users()
    if get_user_by_username(username):
        return None, '用户名已存在'
    new_user = {
        'id': _get_next_user_id(users, role),
        'name': name,
        'classId': class_id,
        'username': username,
        'passwordHash': generate_password_hash(password),
        'role': role
    }
    users.append(new_user)
    save_users(users)
    return new_user, None


def update_user(user_id, updates):
    """更新用户信息，返回 (user, error)"""
    users = load_users()
    user = next((u for u in users if u.get('id') == user_id), None)
    if not user:
        return None, '用户不存在'

    name = (updates.get('name') or '').strip()
    class_id = (updates.get('classId') or '').strip()
    username = (updates.get('username') or '').strip()
    password = (updates.get('password') or '').strip()
    role = (updates.get('role') or user.get('role', 'student')).strip()

    if not name and not class_id:
        return None, '姓名和班级不能同时为空'

    if name:
        user['name'] = name
    if class_id:
        user['classId'] = class_id
    if username and username != user.get('username'):
        if get_user_by_username(username):
            return None, '用户名已存在'
        user['username'] = username
    if password:
        if len(password) < 6:
            return None, '密码长度不能少于 6 位'
        user['passwordHash'] = generate_password_hash(password)
    if role in ('student', 'teacher'):
        user['role'] = role

    save_users(users)
    return user, None


def user_to_public(user):
    """返回给前端的用户信息，去掉密码哈希"""
    if not user:
        return None
    return {
        'id': user['id'],
        'name': user['name'],
        'classId': user['classId'],
        'username': user['username'],
        'role': user['role']
    }
