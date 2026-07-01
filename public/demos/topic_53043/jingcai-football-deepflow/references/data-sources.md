# 数据源清单
## 一、核心数据网站
| 网站 | 用途 | 免费 | 备注 |
|---|---|---|---|
| FBref.com | xG / xGA / 进阶数据 | ✅ | Opta 授权，权威 |
| Understat.com | xG 实时 + 射门地图 | ✅ | 覆盖五大联赛 |
| Soccerway.com | 战绩/积分榜/赛程 | ✅ | 最全 |
| WhoScored.com | 球员评分/预测首发 | ✅ | 战术面 |
| Transfermarkt | 身价/伤停 | ✅ | 伤停页最实时 |
| SofaScore | 即时比分 + 热点图 | ✅ | 移动端友好 |
| PhysioRoom.com | 伤停详细时间表 | ✅ | 英超最全 |
## 二、盘口数据
| 网站 | 用途 |
|---|---|
| 500.com（500 彩票网） | 国内竞彩参考赔率 |
| Oddsportal.com | 全球盘口对比 |
| AsianBookie.com | 亚盘详情 |
## 三、数据采集流程（人工/半自动）
### 步骤 1：联赛基准
访问：`https://fbref.com/en/comps/9/Premier-League-Stats`（英超为例）
取数：
- 平均每场进球
- 主场胜率
- 平均 xG
### 步骤 2：球队主客场数据
访问：`https://fbref.com/en/squads/<team_id>/<season>/<team_name>-Stats`
取数：
- Home/Away 分开的进球、失球、xG、xGA
- 最近 10 场战绩
### 步骤 3：伤停
访问：`https://www.transfermarkt.com/<team>/sperrenundverletzungen/verein/<id>`
取数：
- 确定缺席球员
- 预计回归时间
- 伤病类型（影响复出状态）
### 步骤 4：直接交锋
访问：Soccerway 的 H2H 页面
取数：近 10 次交锋比分 + 场地（主/客/中立）
### 步骤 5：裁判数据
访问：`https://fbref.com/en/referees/`
取数：场均黄牌、红牌、点球数
## 四、自动采集脚本（可选）
如果懂 Python，可以用：
- `soccerdata` 库（PyPI）：一站式拉取 FBref / ESPN / Understat
- `requests + BeautifulSoup`：自己写爬虫
- API：football-data.org（免费额度每分钟 10 次）
**注意**：爬取前请阅读各网站 robots.txt，控制频率避免被封。
