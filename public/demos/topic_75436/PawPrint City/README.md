# 爪印城市 - 宠物友好场所信息平台

基于LBS的城市宠物友好场所聚合服务平台，解决养宠人群带宠出行信息不对称、商家获客不精准的痛点，推动人宠和谐城市建设。

## 技术架构

- **前端**：HTML5 + CSS3 + 原生JavaScript（ES6+），SPA单页应用，移动端优先375px适配
- **后端**：Node.js + Express，RESTful API，内存数据存储（重启重置）
- **设计**：温暖治愈风，主色暖橘 #FF8C42，辅助色薄荷绿 #86D9C8

## 快速启动

### 1. 启动后端

```bash
cd backend
npm install
npm start
```

后端服务运行在 `http://localhost:3000`

### 2. 启动前端

```bash
cd frontend
npm start
```

前端服务运行在 `http://localhost:5173`

### 3. 访问

打开浏览器访问 http://localhost:5173 即可看到应用界面。

## 项目结构

```
PawPrint City/
├── backend/                  # 后端服务
│   ├── package.json
│   ├── server.js             # Express服务器 + 全部API接口（17个）
│   └── data/
│       └── places.js         # 28条模拟场所数据（北京+上海） + 全局存储
├── frontend/                 # 前端应用
│   ├── package.json
│   ├── server.js             # 前端静态服务器
│   ├── index.html            # 入口HTML
│   ├── css/
│   │   └── style.css         # 全局样式
│   └── js/
│       ├── app.js            # 应用入口
│       ├── api.js            # API请求层
│       ├── router.js         # SPA路由系统
│       ├── components/
│       │   ├── map.js        # 模拟地图组件（惯性拖拽+双指缩放）
│       │   ├── carousel.js   # 轮播组件
│       │   └── modal.js      # 弹窗组件
│       └── pages/
│           ├── home.js       # 地图首页（城市切换）
│           ├── detail.js     # 场所详情页（评论评分）
│           ├── discover.js   # 发现页
│           ├── publish.js    # 商家入驻页
│           ├── profile.js    # 个人中心页
│           ├── login.js      # 登录注册页
│           └── pet_profile.js # 宠物档案页
└── README.md
```

## API接口文档

所有接口返回统一格式：`{ code: 200, msg: 'success', data: ... }`

### 场所模块

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/places` | 获取场所列表 | type, keyword, petType, size, facilities, city |
| GET | `/api/places/:id` | 获取场所详情 | - |
| POST | `/api/places/:id/verify` | 提交实地验证 | { user, content } |
| POST | `/api/places/:id/report` | 提交信息纠错 | { user, content, field } |
| GET | `/api/places/:id/comments` | 获取评论列表 | - |
| POST | `/api/places/:id/comments` | 提交评论评分 | { userId, content, rating } |
| GET | `/api/cities` | 获取城市列表 | - |

### 商家模块

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | `/api/merchant/apply` | 提交商家入驻申请 | { name, type, address, ... } |
| GET | `/api/merchant/apply/:id` | 查询申请审核状态 | - |

### 用户模块

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | { username, phone, password } |
| POST | `/api/auth/login` | 用户登录 | { phone, password } |
| GET | `/api/auth/profile` | 获取用户信息 | userId |
| GET | `/api/user/favorites` | 获取收藏列表 | userId |
| POST | `/api/user/favorites` | 添加/取消收藏 | { placeId, action } |
| GET | `/api/user/verifies` | 获取验证记录 | userId |
| GET | `/api/user/applies` | 获取商家申请记录 | userId |

### 宠物模块

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/pets` | 获取宠物列表 | userId |
| POST | `/api/pets` | 添加宠物档案 | { userId, name, type, breed, age, size, description } |
| DELETE | `/api/pets/:id` | 删除宠物档案 | userId |

## 筛选参数说明

- `type`：场所类型（全部/餐饮/住宿/公园/商场）
- `keyword`：搜索关键词（匹配名称和地址）
- `city`：城市筛选（北京/上海）
- `petType`：宠物类型（犬类/猫类/全品类）
- `size`：体型限制（小型/中型/大型）
- `facilities`：配套设施，逗号分隔多选（宠物水碗/拾便袋/宠物专区/免费宠物零食）

## 功能演示流程

### 完整闭环演示路径

1. **浏览地图** → 首页查看模拟地图，拖拽/缩放浏览场所分布
2. **城市切换** → 点击顶部城市选择器，切换北京/上海
3. **筛选场所** → 点击快捷标签筛选类型，或点击「高级筛选」进行多维度组合筛选
4. **搜索** → 在搜索栏输入关键词，实时过滤地图标记
5. **查看详情** → 点击爪印标记弹出信息卡，再点击卡片进入详情页
6. **查看政策** → 详情页醒目展示宠物友好政策、准入类型、配套设施
7. **评论评分** → 详情页点击「写评价」，提交星级评分和评论内容
8. **验证打卡** → 点击「我要验证」提交实地体验记录
9. **收藏** → 点击底部收藏按钮收藏场所
10. **信息纠错** → 点击「信息报错」提交纠错申请
11. **商家入驻** → 切换到「发布」Tab，填写入驻表单并提交
12. **个人中心** → 切换到「我的」Tab，查看收藏、验证记录、商家申请进度
13. **宠物档案** → 个人中心点击「宠物档案」，添加/管理宠物信息
14. **登录注册** → 个人中心点击「登录」，使用手机号登录或注册
15. **发现页** → 切换到「发现」Tab，查看排行榜和最新动态

## 内置数据说明

系统内置28条高质量模拟场所数据，覆盖北京朝阳区和上海核心商圈：

### 北京（16家）

- **餐饮类（4家）**：爪咖啡、WOOF精酿餐吧、猫咪甜品屋、星巴克臻选店
- **住宿类（4家）**：Pawtel设计酒店、PetHome公寓、CatForest猫咪酒店、狗爸民宿
- **公共空间（4家）**：朝阳公园、奥森宠物乐园、通州大运河、花市广场
- **商业类（4家）**：PETS R US购物中心、Paws集合店、PawPlaza社区、宠物友好商场

### 上海（12家）

- **餐饮类（4家）**：Pawbucks星巴克旗舰店、WOOF WOOF外滩餐吧、CatWalk猫咪咖啡馆、Pawsitive brunch餐厅
- **住宿类（2家）**：Pawtel衡山路酒店、MiaoHome田子坊猫咪民宿
- **公共空间（3家）**：世纪公园宠物活动区、滨江宠物友好步道、西岸艺术公园
- **商业类（3家）**：PAWS新天地商场、DoggyTown高岛屋、PetParadise奥特莱斯

每条数据包含完整字段：名称、类型、地址、坐标、评分、营业时间、宠物政策、配套设施、验证记录、图片列表。