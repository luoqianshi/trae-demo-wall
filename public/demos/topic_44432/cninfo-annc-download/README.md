# cninfo-annc-download - 巨潮资讯公告下载器

**版本**: 1.0.5

从巨潮资讯获取上市公司公告，支持按公司、行业、日期范围筛选并生成结构化报告。

> **详细文档请参阅 [SKILL.md](./SKILL.md)**

## 快速开始

### 环境要求

- Python 3.8+
- requests 库

### 安装依赖

```bash
pip install -r requirements.txt
```

### 基本使用

```bash
# 查询今日公告（默认今日+明日）
python scripts/query_cni_annc.py

# 查询指定日期
python scripts/query_cni_annc.py --date 2026-06-15

# 查询日期范围
python scripts/query_cni_annc.py --date 2026-06-01~2026-06-15

# 指定公司清单筛选
python scripts/query_cni_annc.py --companies companies.json

# 跳过关键词过滤
python scripts/query_cni_annc.py --no-keyword-filter
```

## 项目结构

```
cninfo-annc-download/
├── scripts/
│   └── query_cni_annc.py    # 主查询脚本
├── output/                  # 输出目录
├── categories.json          # 公告分类配置
├── companies.json           # 监控公司清单（可选）
├── run_query.bat            # Windows 运行脚本
├── requirements.txt         # Python 依赖
├── SKILL.md                 # 技能定义文档（完整文档）
└── README.md                # 项目说明（本文档）
```

## 配置说明

### categories.json

定义要查询的公告分类，设置 `query: "Y"` 启用对应分类：

```json
{
  "version": "1.0",
  "update_time": "2026-06-15",
  "categories": [
    {"category_name": "年报", "category_code": "category_ndbg_szsh", "query": "Y"},
    {"category_name": "增发", "category_code": "category_zf_szsh", "query": "Y"}
  ]
}
```

### companies.json（可选）

定义监控的公司清单：

```json
{
  "companies": [
    {"code": "600030", "name": "中信证券"},
    {"code": "601377", "name": "兴业证券"}
  ]
}
```

## 更多信息

- **完整文档**：[SKILL.md](./SKILL.md) 包含详细的功能说明、输入参数、筛选规则、异常处理等
- **公告分类列表**：见 [SKILL.md](./SKILL.md) "公告分类列表" 章节
- **可用行业列表**：见 [SKILL.md](./SKILL.md) "可用行业列表" 章节

## 许可证

MIT License