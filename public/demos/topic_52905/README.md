# 电商商品价格自动化采集与对比工具

一个支持多平台电商商品价格批量采集、清洗去重、横向对比、性价比推荐的数据工具，同时提供命令行界面和 Web 演示页面。

## 功能特性

- 🔍 **多平台采集**：支持京东、淘宝、拼多多三大主流电商平台，可按关键词搜索
- 🧹 **数据清洗去重**：自动清洗无效数据、去重相似商品、标准化价格格式
- 📊 **横向对比分析**：各平台均价/最低价/最高价/中位数/评分/销量全方位对比
- 🏆 **性价比推荐**：基于价格、销量、店铺评分多维度综合推荐
- 📈 **可视化图表**：价格分布柱状图、平台均价对比图、数量分布饼图、箱线图
- 💻 **双端使用**：命令行工具 + Web 演示页面，支持现场运行

## 项目架构

```
price-compare/
├── price_compare/              # 核心包
│   ├── models.py               # 数据模型 (Product, SearchResult)
│   ├── spiders/                # 爬虫适配器层
│   │   ├── base.py             # 抽象基类 + 工厂模式
│   │   ├── jd.py               # 京东适配器
│   │   ├── taobao.py           # 淘宝适配器
│   │   ├── pdd.py              # 拼多多适配器
│   │   └── mock.py             # 模拟数据聚合
│   ├── analyzer/               # 数据分析层
│   │   ├── cleaner.py          # 数据清洗去重
│   │   ├── comparator.py       # 横向对比 + 统计指标
│   │   └── recommender.py      # 性价比推荐算法
│   ├── visualizer/             # 可视化层
│   │   └── charts.py           # Chart.js 配置生成
│   └── cli.py                  # 命令行入口
├── web/                        # Web 演示
│   ├── app.py                  # Flask 后端
│   ├── templates/index.html    # 前端页面
│   └── static/                 # CSS + JS
├── run.py                      # 快速启动脚本
└── requirements.txt
```

### 核心设计模式

- **适配器模式**：各平台爬虫统一 `BaseSpider` 接口，新增平台只需注册新类
- **工厂模式**：`SpiderFactory` 按平台名称分发具体实现
- **管道-过滤器**：数据采集 → 清洗去重 → 排序对比 → 推荐 → 可视化

## 安装

```bash
pip install -r requirements.txt
```

## 使用方式

### 方式一：命令行工具

```bash
# 查看帮助
python -m price_compare.cli --help

# 搜索商品（默认三个平台，模拟数据）
python -m price_compare.cli search "无线耳机"

# 指定平台和页数
python -m price_compare.cli search "手机" -p jd taobao --pages 3

# 输出结果到 JSON 文件
python -m price_compare.cli search "键盘" -o result.json

# 列出支持的平台
python -m price_compare.cli platforms
```

### 方式二：Web 演示页面

```bash
python run.py web
```

然后访问 `http://127.0.0.1:5000`，在搜索框输入关键词即可现场运行。

页面初始状态展示数据示例和结果示例，点击"开始对比"后实时显示：
- 4 个核心指标卡片（商品总数、价格区间、中位数、覆盖平台）
- 4 个推荐榜单（性价比首选、最低价、销量冠军、高端之选）
- 4 个数据可视化图表
- 各平台详细对比表格
- TOP 24 商品列表（按价格排序）
- 智能分析总结

### 方式三：快速启动脚本

```bash
python run.py search "无线耳机"   # 命令行搜索
python run.py web                # 启动 Web
python run.py platforms          # 列出平台
```

## 数据获取核心逻辑

### 1. 爬虫适配器

每个平台爬虫继承 `BaseSpider`，实现 `search(keyword, page, page_size)` 方法：

```python
class JDSpider(BaseSpider):
    def search(self, keyword, page=1, page_size=20):
        # 1. 构造请求 URL + Headers
        # 2. 发送 HTTP 请求
        # 3. BeautifulSoup 解析 HTML
        # 4. 提取字段：标题、价格、销量、店铺、评分、链接
        # 5. 返回 List[Product]
```

### 2. 数据清洗去重

- **无效数据过滤**：价格 ≤ 0、标题为空直接丢弃
- **标题归一化**：去除【】包裹的营销词、特殊符号、多余空格
- **相似去重**：同平台下标题相似度 > 0.85 且价格差 < 5% 的保留销量/评分最高的

### 3. 性价比推荐算法

综合得分 = 价格得分 × 0.4 + 销量得分 × 0.3 + 评分得分 × 0.3

- 价格得分：`1 - (当前价 - 最低价) / (最高价 - 最低价)`
- 销量得分：`当前销量 / 最高销量`
- 评分得分：`当前评分 / 最高评分`

## 数据可视化方案

前端使用 **Chart.js**，后端返回完整的图表配置对象：

| 图表类型 | 用途 | 数据来源 |
|---------|------|---------|
| 横向柱状图 | 商品价格 TOP30 对比 | 清洗后按价格排序的商品 |
| 柱状图 | 各平台平均价格对比 | `platform_stats.avg_price` |
| 环形图 | 各平台商品数量分布 | `platform_stats.count` |
| 箱线图示意 | 各平台价格分布 | 五分位数 (min/Q1/median/Q3/max) |

## 关于真实爬虫

由于主流电商平台有严格的反爬机制（滑块验证、IP 封禁、登录校验等），默认使用**模拟数据**进行演示。

模拟数据特点：
- 基于关键词哈希种子生成，同一关键词结果稳定
- 价格分布符合各平台真实定位（拼多多 < 淘宝 < 京东）
- 包含店铺名、评分、销量、标签等完整字段

如需启用真实爬虫：
```bash
python -m price_compare.cli search "无线耳机" --real
```

> ⚠️ 注意：真实爬虫可能因页面结构变化或反爬策略失效，请遵守平台 robots.txt 协议，合理控制请求频率。

## License

MIT
