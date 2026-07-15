"""
通过直接导入数据库模块注入种子数据
人物：李明，28岁，自由产品设计师
日期：动态使用当前日期
当前时间：16:30
"""
import sys
import os
import json
import uuid
from pathlib import Path
from datetime import datetime, timedelta

PROJECT_DIR = str(Path(__file__).resolve().parent)
sys.path.insert(0, PROJECT_DIR)

# 先设置执行策略并导入
os.chdir(PROJECT_DIR)

from companion_db import Database, Task

# 动态使用今天的日期
TODAY = datetime.now().strftime("%Y-%m-%d")
# 基础日期用于计算时间戳
_base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
db = Database()

def main():
    print("=" * 60)
    print("开始注入真实人一天数据...")
    print("=" * 60)
    
    conn = db._conn()
    
    # ===== 清理今日旧数据 =====
    print("\n[1/5] 清理今日旧数据...")
    # 必须先删除子记录；daily_plans 删除后将无法再通过子查询找到承诺。
    conn.execute("DELETE FROM commitments WHERE plan_id IN (SELECT id FROM daily_plans WHERE date = ?)", (TODAY,))
    conn.execute("DELETE FROM daily_plans WHERE date = ?", (TODAY,))
    conn.execute("DELETE FROM tasks WHERE date = ?", (TODAY,))
    conn.commit()
    print("  已清理今日 tasks / daily_plans / commitments")
    
    # ===== 注入画布节点 =====
    print("\n[2/5] 注入画布节点...")
    try:
        from canvas_store import CanvasStore
        cs = CanvasStore()
        inject_canvas_nodes(cs)
        print("  画布节点注入完成")
    except Exception as e:
        print(f"  画布节点注入跳过: {e}")
    
    # ===== 注入今日任务 =====
    print("\n[3/5] 注入今日任务...")
    inject_today_tasks()
    
    # ===== 注入今日计划 + 承诺 =====
    print("\n[4/5] 注入今日计划与承诺...")
    inject_daily_plan()
    
    # ===== 注入过去7天数据 =====
    print("\n[5/5] 注入过去7天数据...")
    inject_weekly_data()
    
    # ===== 汇总 =====
    print("\n" + "=" * 60)
    print("数据注入完成！")
    print("=" * 60)
    
    week_ago = (_base_date - timedelta(days=7)).strftime("%Y-%m-%d")
    total_tasks = db.get_tasks_range(week_ago, TODAY)
    today_tasks = db.get_tasks_by_date(TODAY)
    done_today = [t for t in today_tasks if t.status == "done"]
    
    print(f"\n汇总统计：")
    print(f"  过去8天总任务数: {len(total_tasks)}")
    print(f"  今日任务数: {len(today_tasks)}")
    print(f"  今日已完成: {len(done_today)}")
    
    today_plan = db.get_daily_plan(TODAY)
    if today_plan:
        print(f"  今日计划ID: {today_plan.get('id')}")
        print(f"  今日主目标: {today_plan.get('mainGoal')}")


def inject_canvas_nodes(cs):
    """注入画布节点（使用 CanvasStore 官方 API）"""
    from canvas_store import CanvasNode
    
    now_str = datetime.now().isoformat()
    conn2 = cs.db._conn()
    
    # 清空现有节点
    conn2.execute("DELETE FROM canvas_nodes")
    conn2.execute("DELETE FROM canvas_relations")
    conn2.execute("DELETE FROM canvas_groups")
    conn2.commit()
    
    # 节点定义
    node_defs = [
        # ===== 领域 =====
        {"id": "domain-work", "title": "工作", "kind": "domain",
         "commitment": "committed", "execution_status": "active",
         "x": 100, "y": 200},
        {"id": "domain-study", "title": "学习", "kind": "domain",
         "commitment": "committed", "execution_status": "active",
         "x": 100, "y": 400},
        {"id": "domain-health", "title": "健康", "kind": "domain",
         "commitment": "committed", "execution_status": "active",
         "x": 700, "y": 200},
        {"id": "domain-life", "title": "生活", "kind": "domain",
         "commitment": "committed", "execution_status": "active",
         "x": 700, "y": 400},
        {"id": "domain-interest", "title": "兴趣", "kind": "domain",
         "commitment": "interested", "execution_status": "active",
         "x": 400, "y": 550},
        
        # ===== 工作：项目 =====
        {"id": "proj-client-design", "title": "客户产品设计方案",
         "kind": "project", "commitment": "committed",
         "execution_status": "in_progress",
         "estimated_minutes": 2400, "goal_priority": 0.9,
         "x": 250, "y": 150,
         "description": "某科技公司SaaS产品首页+功能页重新设计"},
        
        # ===== 工作：成果 =====
        {"id": "outcome-design-v1", "title": "完成设计方案第一版",
         "kind": "outcome", "commitment": "committed",
         "execution_status": "in_progress",
         "target_result": "交付可交互原型 + 设计规范文档",
         "estimated_minutes": 480, "goal_priority": 0.95,
         "x": 250, "y": 280},
        
        # ===== 工作：行动 =====
        {"id": "act-client-meeting", "title": "客户需求沟通会议",
         "kind": "action", "commitment": "scheduled",
         "execution_status": "done",
         "estimated_minutes": 90, "energy_cost": "high",
         "cognitive_load": "medium", "action_priority": 0.9,
         "x": 200, "y": 380},
        {"id": "act-design-research", "title": "竞品分析与用户研究",
         "kind": "action", "commitment": "done",
         "execution_status": "done",
         "estimated_minutes": 120, "energy_cost": "medium",
         "cognitive_load": "deep", "action_priority": 0.8,
         "x": 320, "y": 380},
        {"id": "act-wireframe", "title": "低保真线框图设计",
         "kind": "action", "commitment": "done",
         "execution_status": "done",
         "estimated_minutes": 150, "energy_cost": "high",
         "cognitive_load": "deep", "action_priority": 0.85,
         "x": 200, "y": 460},
        {"id": "act-visual-design", "title": "视觉设计稿迭代",
         "kind": "action", "commitment": "scheduled",
         "execution_status": "in_progress",
         "estimated_minutes": 180, "energy_cost": "high",
         "cognitive_load": "deep", "action_priority": 0.9,
         "x": 320, "y": 460},
        {"id": "act-prototype", "title": "制作可交互原型",
         "kind": "action", "commitment": "intended",
         "execution_status": "unplanned",
         "estimated_minutes": 120, "energy_cost": "medium",
         "cognitive_load": "medium", "action_priority": 0.75,
         "x": 200, "y": 540},
        {"id": "act-design-spec", "title": "输出设计规范文档",
         "kind": "action", "commitment": "intended",
         "execution_status": "unplanned",
         "estimated_minutes": 90, "energy_cost": "medium",
         "cognitive_load": "light", "action_priority": 0.7,
         "x": 320, "y": 540},
        
        # ===== 学习：项目 =====
        {"id": "proj-blender", "title": "Blender 3D建模入门",
         "kind": "project", "commitment": "committed",
         "execution_status": "in_progress",
         "estimated_minutes": 3000, "goal_priority": 0.7,
         "x": 250, "y": 620,
         "description": "3个月内完成基础课程并做出3个练习模型"},
        
        # ===== 学习：行动 =====
        {"id": "act-blender-ch3", "title": "Blender第3章：建模基础练习",
         "kind": "action", "commitment": "scheduled",
         "execution_status": "unplanned",
         "estimated_minutes": 60, "energy_cost": "high",
         "cognitive_load": "deep", "action_priority": 0.65,
         "x": 200, "y": 700},
        {"id": "act-english-words", "title": "背50个英语单词",
         "kind": "action", "commitment": "scheduled",
         "execution_status": "done",
         "estimated_minutes": 30, "energy_cost": "low",
         "cognitive_load": "light", "action_priority": 0.7,
         "x": 320, "y": 700},
        {"id": "act-english-listen", "title": "英语听力练习",
         "kind": "action", "commitment": "intended",
         "execution_status": "unplanned",
         "estimated_minutes": 20, "energy_cost": "low",
         "cognitive_load": "light", "action_priority": 0.5,
         "x": 200, "y": 770},
        
        # ===== 健康：习惯 =====
        {"id": "hab-morning-stretch", "title": "晨间拉伸",
         "kind": "habit", "commitment": "scheduled",
         "execution_status": "done",
         "frequency": "daily", "estimated_minutes": 10,
         "energy_cost": "low", "cognitive_load": "light",
         "x": 800, "y": 150},
        {"id": "hab-gym", "title": "健身房训练",
         "kind": "habit", "commitment": "scheduled",
         "execution_status": "unplanned",
         "frequency": "every_other_day", "estimated_minutes": 60,
         "energy_cost": "high", "cognitive_load": "light",
         "x": 800, "y": 230},
        {"id": "hab-early-sleep", "title": "22:30前睡觉",
         "kind": "habit", "commitment": "committed",
         "execution_status": "unplanned",
         "frequency": "daily", "estimated_minutes": 0,
         "energy_cost": "low",
         "x": 800, "y": 310},
        {"id": "hab-drink-water", "title": "喝8杯水",
         "kind": "habit", "commitment": "scheduled",
         "execution_status": "in_progress",
         "frequency": "daily", "estimated_minutes": 0,
         "energy_cost": "low",
         "x": 800, "y": 390},
        
        # ===== 生活：行动 =====
        {"id": "act-grocery", "title": "购买生活用品",
         "kind": "action", "commitment": "interested",
         "execution_status": "unplanned",
         "estimated_minutes": 45, "energy_cost": "low",
         "cognitive_load": "light", "action_priority": 0.4,
         "x": 800, "y": 480},
        {"id": "act-clean-room", "title": "整理房间和书桌",
         "kind": "action", "commitment": "intended",
         "execution_status": "done",
         "estimated_minutes": 30, "energy_cost": "low",
         "cognitive_load": "light", "action_priority": 0.5,
         "x": 800, "y": 560},
        {"id": "act-evening-review", "title": "晚间复盘与明日计划",
         "kind": "action", "commitment": "scheduled",
         "execution_status": "unplanned",
         "estimated_minutes": 30, "energy_cost": "medium",
         "cognitive_load": "medium", "action_priority": 0.7,
         "x": 800, "y": 640},
        
        # ===== 兴趣 =====
        {"id": "act-photography", "title": "练习摄影构图",
         "kind": "action", "commitment": "interested",
         "execution_status": "unplanned",
         "estimated_minutes": 40, "energy_cost": "low",
         "cognitive_load": "light", "action_priority": 0.3,
         "x": 400, "y": 620},
        {"id": "act-reading", "title": "阅读《设计心理学》",
         "kind": "action", "commitment": "interested",
         "execution_status": "in_progress",
         "estimated_minutes": 30, "energy_cost": "low",
         "cognitive_load": "medium", "action_priority": 0.45,
         "x": 500, "y": 620},
    ]
    
    count = 0
    for nd in node_defs:
        node = CanvasNode(
            id=nd["id"],
            title=nd["title"],
            kind=nd["kind"],
            commitment=nd.get("commitment", "observed"),
            execution_status=nd.get("execution_status", "unplanned"),
            source=nd.get("source", "manual"),
            description=nd.get("description"),
            estimated_minutes=nd.get("estimated_minutes"),
            energy_cost=nd.get("energy_cost"),
            cognitive_load=nd.get("cognitive_load"),
            frequency=nd.get("frequency"),
            goal_priority=nd.get("goal_priority"),
            action_priority=nd.get("action_priority"),
            target_result=nd.get("target_result"),
            x=nd.get("x", 0),
            y=nd.get("y", 0),
            created_at=now_str,
            updated_at=now_str,
        )
        cs.create_node(node)
        count += 1
    
    print(f"  已注入 {count} 个画布节点")
    
    # 节点关系
    relations = [
        ("outcome-design-v1", "proj-client-design", "decomposes"),
        ("act-client-meeting", "outcome-design-v1", "supports"),
        ("act-design-research", "outcome-design-v1", "supports"),
        ("act-wireframe", "outcome-design-v1", "supports"),
        ("act-visual-design", "outcome-design-v1", "supports"),
        ("act-prototype", "outcome-design-v1", "supports"),
        ("act-design-spec", "outcome-design-v1", "supports"),
        ("act-blender-ch3", "proj-blender", "supports"),
    ]
    
    for i, (fid, tid, rtype) in enumerate(relations):
        conn2.execute(
            """INSERT INTO canvas_relations (id, source_node_id, target_node_id, relation, created_at)
               VALUES (?,?,?,?,?)""",
            (f"rel-{i}", fid, tid, rtype, now_str),
        )
    conn2.commit()
    print(f"  已注入 {len(relations)} 条节点关系")


def inject_today_tasks():
    """注入今日任务"""
    now_iso = datetime.now().isoformat()
    
    tasks = [
        # 已完成 - 早晨
        {"title": "晨间拉伸", "type": "exercise", "priority": "low", "min": 10,
         "start": "07:00", "end": "07:10", "status": "done"},
        {"title": "早餐 + 阅读", "type": "routine", "priority": "low", "min": 50,
         "start": "07:10", "end": "08:00", "status": "done"},
        {"title": "背50个英语单词", "type": "study", "priority": "medium", "min": 30,
         "start": "08:00", "end": "08:30", "status": "done"},
        {"title": "竞品分析整理", "type": "work", "priority": "high", "min": 90,
         "start": "09:00", "end": "10:30", "status": "done"},
        {"title": "休息", "type": "rest", "priority": "low", "min": 15,
         "start": "10:30", "end": "10:45", "status": "done"},
        {"title": "低保真线框迭代", "type": "work", "priority": "high", "min": 75,
         "start": "10:45", "end": "12:00", "status": "done"},
        {"title": "午餐 + 散步", "type": "meal", "priority": "low", "min": 90,
         "start": "12:00", "end": "13:30", "status": "done"},
        {"title": "整理房间和书桌", "type": "routine", "priority": "low", "min": 20,
         "start": "13:30", "end": "13:50", "status": "done"},
        
        # 已完成 - 下午固定事件
        {"title": "客户需求沟通会议", "type": "work", "priority": "high", "min": 90,
         "start": "14:00", "end": "15:30", "status": "done"},
        {"title": "下午茶休息", "type": "rest", "priority": "low", "min": 30,
         "start": "15:30", "end": "16:00", "status": "done"},
        
        # 进行中
        {"title": "视觉设计稿迭代", "type": "work", "priority": "high", "min": 150,
         "start": "16:00", "end": "18:30", "status": "planned"},
        
        # 待开始 - 晚上
        {"title": "健身房训练", "type": "exercise", "priority": "medium", "min": 60,
         "start": "18:30", "end": "19:30", "status": "planned"},
        {"title": "晚餐 + 散步", "type": "meal", "priority": "low", "min": 60,
         "start": "19:30", "end": "20:30", "status": "planned"},
        {"title": "Blender第3章练习", "type": "study", "priority": "medium", "min": 60,
         "start": "20:30", "end": "21:30", "status": "planned"},
        {"title": "晚间复盘 + 明日计划", "type": "routine", "priority": "medium", "min": 30,
         "start": "21:30", "end": "22:00", "status": "planned"},
        {"title": "自由阅读 / 放松", "type": "rest", "priority": "low", "min": 30,
         "start": "22:00", "end": "22:30", "status": "planned"},
    ]
    
    for t in tasks:
        task = Task(
            created_at=now_iso,
            title=t["title"],
            type=t["type"],
            priority=t["priority"],
            channel="daily_plan",
            planned_minutes=t["min"],
            actual_minutes=t["min"] if t["status"] == "done" else 0,
            start_time=t["start"],
            end_time=t["end"],
            status=t["status"],
            date=TODAY,
            note="",
            completed_at=now_iso if t["status"] == "done" else None,
        )
        db.add_task(task)
    
    print(f"  已注入 {len(tasks)} 个今日任务")
    done = sum(1 for t in tasks if t["status"] == "done")
    planned = sum(1 for t in tasks if t["status"] == "planned")
    print(f"  - 已完成: {done} 个")
    print(f"  - 计划中: {planned} 个")


def inject_daily_plan():
    """注入今日计划与承诺"""
    now_iso = datetime.now().isoformat()
    plan_id = "plan-" + TODAY.replace("-", "")
    base_date = _base_date
    
    today_tasks = db.get_tasks_by_date(TODAY)
    plan_tasks = []
    commitments = []
    
    cat_map = {
        "work": "work",
        "study": "study",
        "exercise": "health",
        "rest": "life",
        "meal": "life",
        "routine": "life",
    }
    
    for i, t in enumerate(today_tasks):
        if not t.start_time:
            continue
        h, m = map(int, t.start_time.split(":"))
        start_ts = base_date.replace(hour=h, minute=m).timestamp() * 1000
        
        cog_load = "deep" if t.type == "work" and t.priority == "high" else \
                   "light" if t.type in ("rest", "meal", "routine") else "medium"
        
        task_item = {
            "id": f"task-{i:03d}",
            "title": t.title,
            "originNodeId": "",
            "startTime": start_ts,
            "duration": t.planned_minutes,
            "type": t.type,
            "cognitiveLoad": cog_load,
            "priority": t.priority,
            "status": t.status,
            "reason": "AI规划生成",
            "category": cat_map.get(t.type, "other"),
        }
        plan_tasks.append(task_item)
        
        comm_id = f"comm-{i:03d}"
        commitments.append({
            "id": comm_id,
            "plan_id": plan_id,
            "origin_node_id": "",
            "title": t.title,
            "scheduled_start": start_ts,
            "scheduled_duration": t.planned_minutes,
            "type": t.type,
            "cognitive_load": cog_load,
            "priority": t.priority,
            "status": "done" if t.status == "done" else "scheduled",
            "reason": "AI规划生成",
            "actual_start_time": start_ts if t.status == "done" else None,
            "actual_end_time": start_ts + t.planned_minutes * 60 * 1000 if t.status == "done" else None,
            "actual_duration": t.planned_minutes if t.status == "done" else None,
            "created_at": now_iso,
            "updated_at": now_iso,
        })
    
    # 固定事件
    fixed_items = [
        {
            "id": "fixed-meeting-1",
            "title": "客户需求沟通会议",
            "startTime": base_date.replace(hour=14, minute=0).timestamp() * 1000,
            "endTime": base_date.replace(hour=15, minute=30).timestamp() * 1000,
            "type": "meeting",
            "source": "calendar",
        },
    ]
    
    plan_data = {
        "id": plan_id,
        "date": TODAY,
        "status": "confirmed",
        "version": 2,
        "mainGoal": "完成客户设计方案视觉稿迭代",
        "tasks": plan_tasks,
        "fixedItems": fixed_items,
        "energyLevel": "normal",
        "workEnd": 22.5,
        "bufferRatio": 0.15,
        "confirmedAt": now_iso,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    
    db.save_daily_plan(plan_data)
    
    for comm in commitments:
        db.save_commitment(comm)
    
    print(f"  计划ID: {plan_id}")
    print(f"  承诺数: {len(commitments)}")
    print(f"  固定事件: {len(fixed_items)} 个")


def inject_weekly_data():
    """注入过去7天数据（相对于今天）"""
    # 生成过去7天的日期（从7天前到昨天）
    weekly_templates = [
        {"offset": 7, "tasks": 6, "focus_min": 280, "rate": 0.75,
         "cats": {"work": 180, "study": 60, "exercise": 40}},
        {"offset": 6, "tasks": 8, "focus_min": 340, "rate": 0.89,
         "cats": {"work": 220, "study": 80, "exercise": 40}},
        {"offset": 5, "tasks": 5, "focus_min": 210, "rate": 0.62,
         "cats": {"work": 120, "study": 50, "exercise": 40}},
        {"offset": 4, "tasks": 4, "focus_min": 150, "rate": 0.57,
         "cats": {"work": 60, "study": 50, "exercise": 40}},
        {"offset": 3, "tasks": 3, "focus_min": 120, "rate": 0.75,
         "cats": {"work": 30, "study": 50, "exercise": 40}},
        {"offset": 2, "tasks": 7, "focus_min": 300, "rate": 0.88,
         "cats": {"work": 200, "study": 60, "exercise": 40}},
        {"offset": 1, "tasks": 9, "focus_min": 380, "rate": 0.82,
         "cats": {"work": 260, "study": 80, "exercise": 40}},
    ]
    
    # 构建 weekly 列表，日期动态计算
    weekly = []
    for t in weekly_templates:
        d = _base_date - timedelta(days=t["offset"])
        weekly.append({
            "date": d.strftime("%Y-%m-%d"),
            "tasks": t["tasks"],
            "focus_min": t["focus_min"],
            "rate": t["rate"],
            "cats": t["cats"],
        })
    
    cat_tasks_map = {
        "work": ["客户项目工作", "邮件处理", "设计稿修改", "需求分析", "会议讨论"],
        "study": ["英语学习", "Blender课程", "阅读技术文章"],
        "exercise": ["晨跑", "健身房", "瑜伽"],
    }
    
    for day in weekly:
        day_str = day["date"]
        base_d = datetime.strptime(day_str, "%Y-%m-%d")
        created_at = base_d.isoformat()
        
        # 清理该日旧数据
        conn = db._conn()
        conn.execute("DELETE FROM tasks WHERE date = ?", (day_str,))
        conn.commit()
        
        task_idx = 0
        hour = 9
        
        for cat, mins in day["cats"].items():
            n = max(1, mins // 50)
            per_task = mins // n
            names = cat_tasks_map.get(cat, ["其他事项"])
            
            for j in range(n):
                if task_idx >= day["tasks"]:
                    break
                    
                status = "done" if task_idx < int(day["tasks"] * day["rate"]) else "planned"
                
                ttype = {"work": "work", "study": "study", "exercise": "exercise"}.get(cat, "work")
                
                end_h = hour + per_task // 60
                end_m = per_task % 60
                
                task = Task(
                    created_at=created_at,
                    title=names[j % len(names)],
                    type=ttype,
                    priority="medium" if cat == "work" else "low",
                    channel="daily_plan",
                    planned_minutes=per_task,
                    actual_minutes=per_task if status == "done" else 0,
                    start_time=f"{hour:02d}:00",
                    end_time=f"{end_h:02d}:{end_m:02d}",
                    status=status,
                    date=day_str,
                    note="",
                    completed_at=base_d.replace(hour=end_h, minute=end_m).isoformat() if status == "done" else None,
                )
                db.add_task(task)
                
                hour = end_h if end_m == 0 else end_h + 1
                task_idx += 1
        
        print(f"  {day_str}: {day['tasks']}任务 / {day['focus_min']}分钟 / {day['rate']*100:.0f}%完成率")


if __name__ == "__main__":
    main()
