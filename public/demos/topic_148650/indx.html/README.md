# 近5年升学考试政策检索系统

基于 Python Flask + SQLite 数据库搭建的升学考试政策检索系统，支持教师考编、公务员、考研、留学、专升本、高中升学六大类政策数据的录入、检索、对比和导出。

## 技术栈

- **后端**: Python Flask 2.3.3
- **数据库**: SQLite
- **前端**: HTML + CSS + JavaScript
- **数据导入**: CSV 文件

## 项目结构

```
exam_policy_system/
├── app.py              # Flask 应用主文件
├── schema.sql          # 数据库建表语句
├── import_data.py      # 数据导入脚本
├── requirements.txt    # Python 依赖
├── database.db         # SQLite 数据库文件（自动生成）
├── static/             # 静态文件目录
├── templates/          # HTML 模板目录
│   └── index.html      # 主页面
└── data/               # 数据文件目录
```

## 快速开始

### 1. 安装依赖

```bash
cd exam_policy_system
pip install -r requirements.txt
```

### 2. 启动应用

```bash
python app.py
```

首次启动会自动初始化数据库。访问 http://localhost:5000 即可使用系统。

### 3. 导入示例数据

```bash
python import_data.py
```

选择选项 2 插入示例数据，或选择选项 1 从 CSV 文件导入数据。

## 功能说明

### 数据录入
- 支持手动单条录入六大类政策数据
- 必填字段：年份、省份、考试类型

### 高级检索
- 多条件组合筛选（年份、省份、城市、考试类型、院校名称、专业）
- 全文关键词搜索
- 分页展示，每页20条

### 政策对比
- 选择省份，展示该省份历年政策差异
- 按年份分组展示

### 数据导出
- 一键导出筛选结果为 CSV 文件
- 包含全部字段

## CSV 导入格式

CSV 文件需包含以下列（顺序不限）：

| 字段名 | 说明 | 必填 |
|--------|------|------|
| year | 年份 | 是 |
| province | 省份 | 是 |
| city | 城市 | 否 |
| exam_type | 考试类型 | 是 |
| school_name | 院校名称 | 否 |
| major | 招生专业 | 否 |
| recruit_count | 招录人数 | 否 |
| score_line | 分数线 | 否 |
| restrictions | 报考限制 | 否 |
| policy_url | 政策原文链接 | 否 |
| register_time | 报名时间 | 否 |
| remarks | 备注 | 否 |

## 数据库表结构

系统包含6张表，结构相同：

- teacher_exam（教师考编）
- civil_service（公务员）
- graduate_exam（考研）
- study_abroad（留学）
- junior_college_upgrade（专升本）
- high_school_admission（高中升学）

每张表包含字段：
- id (主键)
- year (年份)
- province (省份)
- city (城市)
- exam_type (考试类型)
- school_name (院校名称)
- major (招生专业)
- recruit_count (招录人数)
- score_line (分数线)
- restrictions (报考限制)
- policy_url (政策链接)
- register_time (报名时间)
- remarks (备注)

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| / | GET | 首页 |
| /search | POST | 数据检索 |
| /compare | POST | 政策对比 |
| /add | POST | 添加数据 |
| /export | POST | 导出数据 |
| /years | GET | 获取年份列表 |

## 注意事项

1. 首次启动会自动创建数据库文件
2. 数据量较大时建议使用分页检索
3. CSV 文件编码需为 UTF-8
4. 政策链接字段支持点击跳转（在详情页实现）