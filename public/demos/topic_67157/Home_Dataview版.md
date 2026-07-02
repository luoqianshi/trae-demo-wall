---
类型: 仪表盘
状态: 使用中
插件依赖: Dataview
更新日期: 2026-07-02
---

# 🏠 全局仪表盘（Dataview 自动版）

> 安装 Dataview 插件后，以下数据自动更新。
> 切换到「阅读模式」查看效果。

---

## 🔄 所有进行中项目

```dataview
TABLE 优先级, 阶段, 截止日期, 负责人
FROM "10_项目Projects"
WHERE 状态 = "进行中"
SORT 截止日期 ASC
```

---

## ⏸️ 暂停的项目

```dataview
TABLE 优先级, 截止日期
FROM "10_项目Projects"
WHERE 状态 = "暂停"
SORT 截止日期 ASC
```

---

## ✅ 已完结项目

```dataview
TABLE 优先级, 创建日期
FROM "10_项目Projects"
WHERE 状态 = "已完结"
SORT 创建日期 DESC
LIMIT 10
```

---

## 🔥 本周未完成任务

```dataview
TABLE 所属项目, 优先级, 截止日期
FROM "10_项目Projects"
WHERE 类型 = "任务" AND 状态 != "完成" AND 截止日期 <= date(today) + dur(7 days)
SORT 截止日期 ASC
```

---

## ⚠️ 逾期任务

```dataview
TABLE 所属项目, 优先级, 截止日期
FROM "10_项目Projects"
WHERE 类型 = "任务" AND 状态 != "完成" AND 截止日期 < date(today)
SORT 截止日期 ASC
```

---

## 📊 项目完成率统计

```dataview
TABLE WITHOUT ID
  count(rows) as 项目数,
  length(filter(rows, (r) => r.状态 = "已完结")) as 已完成,
  length(filter(rows, (r) => r.状态 = "进行中")) as 进行中,
  length(filter(rows, (r) => r.状态 = "暂停")) as 暂停
FROM "10_项目Projects"
WHERE 类型 = "项目"
FLATTEN 状态
GROUP BY 状态
```

### 状态图标说明
- ✅ 已完结
- 🔄 进行中
- ⏸️ 暂停

---

## 📝 最近完成的任务

```dataview
TABLE 所属项目, 优先级
FROM "10_项目Projects"
WHERE 类型 = "任务" AND 状态 = "完成"
SORT 修改时间 DESC
LIMIT 10
```

---

## 🚀 快速入口

| 功能 | 链接 |
|------|------|
| 📥 收集箱 | [[收集箱说明]] |
| 📁 新建项目模板 | [[方案1-项目总览模板]] |
| 📝 每日日志模板 | [[每日日志模板]] |
| 📅 周报模板 | [[周报模板]] |
| 📊 月报模板 | [[月报模板]] |
| 🎯 习惯追踪模板 | [[习惯追踪模板]] |

---

## 💡 使用说明

1. **安装 Dataview 插件**：设置 → 社区插件 → 搜索 Dataview → 安装启用
2. **切换阅读模式**：点击右上角预览按钮，或按 `Ctrl+E`
3. **自动刷新**：数据会实时从所有笔记中自动汇总
4. **元数据规范**：所有项目和任务笔记都要有 YAML frontmatter
   - 项目必须有：`类型: 项目`、`状态`、`截止日期`、`优先级`
   - 任务必须有：`类型: 任务`、`所属项目`、`状态`、`截止日期`、`优先级`
