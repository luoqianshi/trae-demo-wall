# -*- coding: utf-8 -*-
"""
TimeForge X - 种子数据生成器
"""
import os
import sys
import json
import random
from datetime import datetime, timedelta, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def seed_database():
    from database import get_db, init_db
    from auth import hash_password

    init_db()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM exports")
    cursor.execute("DELETE FROM post_likes")
    cursor.execute("DELETE FROM community_comments")
    cursor.execute("DELETE FROM community_posts")
    cursor.execute("DELETE FROM conversations")
    cursor.execute("DELETE FROM password_reset_tokens")
    cursor.execute("DELETE FROM verification_codes")
    cursor.execute("DELETE FROM activities")
    cursor.execute("DELETE FROM tasks")
    cursor.execute("DELETE FROM career_plans")
    cursor.execute("DELETE FROM exam_plans")
    cursor.execute("DELETE FROM study_groups")
    cursor.execute("DELETE FROM users")

    # 创建演示用户
    cursor.execute('''
        INSERT INTO users (username, email, phone, password_hash, bio, level, experience, streak, max_streak, focus_hours, tasks_completed, ai_collaborations, checkin_dates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('demo_user', 'demo@timeforge.ai', '13800138000', hash_password('123456'),
          '热爱学习，追求成长。TimeForge X 让我更高效！', 5, 2340, 12, 15, 87.5, 38, 25,
          json.dumps([(date.today() - timedelta(days=i)).isoformat() for i in range(12)], ensure_ascii=False)))

    # 创建第二个用户
    cursor.execute('''
        INSERT INTO users (username, email, password_hash, bio, level, experience, streak, focus_hours, tasks_completed, ai_collaborations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('学习达人', 'student@timeforge.ai', hash_password('123456'),
          '考研人，奋斗在路上！', 3, 1200, 5, 45.0, 20, 15))

    today = date.today()
    random.seed(42)

    # 任务数据
    tasks_data = [
        ("数据结构实验报告", "实验报告", (today + timedelta(days=3)).isoformat(), "进行中", 3, 20.0, 8.0,
         [{"title": "需求分析", "completed": True, "estimated_hours": 2},
          {"title": "用例图设计", "completed": True, "estimated_hours": 2},
          {"title": "E-R图设计", "completed": True, "estimated_hours": 2},
          {"title": "数据库设计", "completed": False, "estimated_hours": 3},
          {"title": "代码实现", "completed": False, "estimated_hours": 5},
          {"title": "测试用例编写", "completed": False, "estimated_hours": 3},
          {"title": "实验报告撰写", "completed": False, "estimated_hours": 3}]),
        ("数据库课程设计", "课程设计", (today + timedelta(days=14)).isoformat(), "进行中", 4, 40.0, 12.0,
         [{"title": "需求分析", "completed": True, "estimated_hours": 4},
          {"title": "系统设计", "completed": True, "estimated_hours": 5},
          {"title": "数据库设计", "completed": False, "estimated_hours": 6},
          {"title": "前端开发", "completed": False, "estimated_hours": 10},
          {"title": "后端开发", "completed": False, "estimated_hours": 8},
          {"title": "测试", "completed": False, "estimated_hours": 4},
          {"title": "文档撰写", "completed": False, "estimated_hours": 3}]),
        ("期末操作系统复习", "考试复习", (today + timedelta(days=1)).isoformat(), "进行中", 4, 30.0, 5.0,
         [{"title": "知识点梳理", "completed": True, "estimated_hours": 5},
          {"title": "重点章节复习", "completed": False, "estimated_hours": 6},
          {"title": "习题训练", "completed": False, "estimated_hours": 6}]),
        ("英语四级备考", "英语四级", (today - timedelta(days=7)).isoformat(), "已完成", 3, 50.0, 50.0,
         [{"title": "词汇积累", "completed": True, "estimated_hours": 10},
          {"title": "听力训练", "completed": True, "estimated_hours": 10}]),
        ("2026考研复习", "考研复习", (today + timedelta(days=180)).isoformat(), "进行中", 5, 200.0, 45.0,
         [{"title": "数学基础", "completed": True, "estimated_hours": 30},
          {"title": "英语专项", "completed": True, "estimated_hours": 15},
          {"title": "专业课一", "completed": False, "estimated_hours": 40}]),
        ("蓝桥杯程序设计竞赛", "竞赛项目", (today - timedelta(days=3)).isoformat(), "已延期", 5, 80.0, 35.0,
         [{"title": "赛题分析", "completed": True, "estimated_hours": 8},
          {"title": "方案设计", "completed": True, "estimated_hours": 10}]),
        ("Python爬虫项目", "其他", (today - timedelta(days=14)).isoformat(), "已完成", 2, 15.0, 15.0,
         [{"title": "需求分析", "completed": True, "estimated_hours": 2}]),
    ]

    for task in tasks_data:
        cursor.execute('''
            INSERT INTO tasks (user_id, title, type, deadline, status, difficulty, estimated_hours, completed_hours, subtasks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (1, task[0], task[1], task[2], task[3], task[4], task[5], task[6], json.dumps(task[7], ensure_ascii=False)))

    # 活动记录
    for i in range(30, -1, -1):
        activity_date = (today - timedelta(days=i)).isoformat()
        focus_minutes = random.randint(30, 240)
        tasks_done = random.randint(1, 8)
        procrastination = random.randint(30, 70)
        efficiency = random.randint(50, 90)

        cursor.execute('''
            INSERT INTO activities (user_id, date, focus_minutes, tasks_done, procrastination_index, efficiency_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (1, activity_date, focus_minutes, tasks_done, procrastination, efficiency))

    # 社区帖子
    community_posts = [
        (1, "我的考研复习时间规划分享", "备考期间最重要的是保持每天8-10小时的有效学习时间。我采用番茄工作法，每25分钟休息5分钟...", "经验分享", json.dumps(["考研", "时间管理"], ensure_ascii=False), 15, 120, 1),
        (2, "数据结构大作业心得", "刚完成数据结构课程设计，分享一下我的经验：先用ECharts可视化数据，再设计算法...", "经验分享", json.dumps(["课程设计", "数据结构"], ensure_ascii=False), 8, 85, 0),
        (1, "今日打卡！坚持就是胜利", "连续打卡第12天，感觉学习效率明显提高了。TimeForge X的帮助很大！", "学习打卡", json.dumps(["打卡", "自律"], ensure_ascii=False), 22, 200, 1),
        (2, "蓝桥杯竞赛组队", "寻找一起参加蓝桥杯的小伙伴，组队一起备赛！感兴趣的留言或私信。", "学习小组", json.dumps(["竞赛", "组队", "蓝桥杯"], ensure_ascii=False), 5, 60, 0),
    ]

    for post in community_posts:
        cursor.execute('''
            INSERT INTO community_posts (user_id, title, content, category, tags, likes, views, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', post)

    # 评论
    cursor.execute('''
        INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)
    ''', (1, 2, "太有用了！我也在准备考研，可以加好友一起学习吗？"))
    cursor.execute('''
        INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)
    ''', (1, 1, "当然可以！一起加油！"))
    cursor.execute('''
        INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)
    ''', (3, 2, "坚持12天太厉害了！向你学习！"))

    # 考研规划
    cursor.execute('''
        INSERT INTO exam_plans (user_id, target_school, target_major, exam_date, subjects, daily_hours, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (1, "浙江大学", "计算机科学与技术", "2026-12-26", json.dumps(["数学一", "英语一", "政治", "408计算机"], ensure_ascii=False), 8.0, 25.0))

    # 职业规划
    cursor.execute('''
        INSERT INTO career_plans (user_id, target_position, target_industry, skills, skill_gaps, roadmap)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (1, "后端开发工程师", "互联网/科技",
          json.dumps(["Python", "Django", "MySQL", "Redis"], ensure_ascii=False),
          json.dumps([{"skill": "Docker", "gap": 60}, {"skill": "微服务", "gap": 70}], ensure_ascii=False),
          json.dumps([{"phase": "短期", "goal": "掌握Docker和K8s"}, {"phase": "长期", "goal": "成为高级工程师"}], ensure_ascii=False)))

    conn.commit()
    conn.close()

    print("TimeForge X 演示数据填充完成！")
    print("  - 用户: demo_user (密码:123456) / 学习达人 (密码:123456)")
    print("  - 任务: 7个")
    print("  - 活动记录: 31天")
    print("  - 社区帖子: 4篇")
    print("  - 智能体: 10个")


if __name__ == "__main__":
    seed_database()