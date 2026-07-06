# 选项卡交互规则

## 核心原则

在所有需要用户做选择的交互节点，**必须使用 AskUserQuestion 工具**呈现选项卡式界面，而不是在对话框中输出文本问题等待用户输入编号。

用户已明确要求本技能使用选项卡方式收集偏好，因此所有选择类交互都应通过 AskUserQuestion 完成。

---

## 何时使用 AskUserQuestion

### 必须使用的场景

| 交互节点 | 场景说明 |
|----------|----------|
| 步骤1a | 选择话题领域（4大领域分类） |
| 步骤1b | 选择具体模板（根据领域展示对应模板） |
| 步骤3 | 选择角色分配方式（自动匹配/自己指定） |
| 步骤4 | 选择角色（多选，最多3位） |
| 确认阶段 | 确认启动/换人/改题/重来 |
| 讨论暂停 | 继续/总结/结束/补充信息 |
| 总结后 | 结束/继续讨论 |

### 不使用的场景（使用普通聊天消息）

- 步骤2：输入议题（需要用户填写模板，是文本输入）
- 讨论中的直接发言和 @互动（用户自由输入）
- 角色发言和系统消息输出
- 新手教程输出

---

## 使用规则

### 通用规则

1. **每次调用最多4个选项**：系统会自动添加"其他"选项，用户可选"其他"自行输入
2. **推荐选项放第一位**：标签后加"(推荐)"
3. **每个选项包含 label 和 description**：label 1-5个字，description 简要说明该选项的效果
4. **header 不超过12个字符**：用于选项卡标题
5. **用户选择后直接处理**：不要重复输出问题文本，直接进入下一步
6. **不要同时输出文本问题**：调用 AskUserQuestion 时不要在回复中重复问题内容
7. **"其他"选项的处理**：用户选"其他"时，将其文本输入作为自定义内容处理

### 选项设计原则

- 选项之间必须互斥（单选场景）
- 选项描述要让用户一眼看懂选了之后会发生什么
- 推荐选项的 description 要说明推荐理由
- 风险较高的选项要在 description 中提示风险

---

## 各节点选项卡设计

### 步骤1a：选择话题领域

由于模板有10个，超过单次4个选项的限制，采用两步选择：先选领域，再选具体模板。

```
AskUserQuestion:
  question: "主公，欢迎来到智囊团。请选择你想讨论的领域："
  header: "话题领域"
  multiSelect: false
  options:
    - label: "职业与商业(推荐)"
      description: "跳槽转行、创业评估、商业策略"
    - label: "财务与投资"
      description: "投资理财、购房决策、城市选择"
    - label: "人际与情感"
      description: "人际冲突、婚姻情感"
    - label: "学业与成长"
      description: "考研考公、留学选专业、个人提升"
```

### 步骤1b：选择具体模板

根据用户在步骤1a选择的领域，展示该领域下的具体模板。

**领域：职业与商业**

```
AskUserQuestion:
  question: "请选择具体话题模板："
  header: "话题模板"
  multiSelect: false
  options:
    - label: "职业转型(推荐)"
      description: "跳槽、转行、换赛道，不确定是否该动、何时动"
    - label: "创业评估"
      description: "要不要创业、创业方向选择、时机判断"
    - label: "商业策略"
      description: "产品方向、市场策略、竞争应对"
```

**领域：财务与投资**

```
AskUserQuestion:
  question: "请选择具体话题模板："
  header: "话题模板"
  multiSelect: false
  options:
    - label: "投资决策(推荐)"
      description: "买房、炒股、资产配置、风险承受"
    - label: "购房决策"
      description: "买不买房、在哪买、什么时候买"
    - label: "城市选择"
      description: "去哪个城市发展、要不要回老家"
```

**领域：人际与情感**

```
AskUserQuestion:
  question: "请选择具体话题模板："
  header: "话题模板"
  multiSelect: false
  options:
    - label: "人际冲突(推荐)"
      description: "同事矛盾、家庭纠纷、合伙人分歧"
    - label: "婚姻情感"
      description: "要不要结婚、分手、感情抉择"
```

**领域：学业与成长**

```
AskUserQuestion:
  question: "请选择具体话题模板："
  header: "话题模板"
  multiSelect: false
  options:
    - label: "学业规划(推荐)"
      description: "考研、考公、留学、选专业"
    - label: "个人成长"
      description: "学习路径、习惯养成、自我提升"
```

> 如果用户在步骤1a选"其他"，直接进入自定义模板流程（步骤2的模板0格式）。

### 步骤3：选择角色分配方式

```
AskUserQuestion:
  question: "议题已收到。请选择角色分配方式："
  header: "角色分配"
  multiSelect: false
  options:
    - label: "自动匹配(推荐)"
      description: "系统根据议题智能匹配3位最佳谋士"
    - label: "自己指定"
      description: "从8位谋士中自选3位参与讨论"
```

### 步骤4：选择角色

展示全部8位谋士，用户可多选（最多3位）。由于 AskUserQuestion 单次最多4个选项，8位谋士分 **2页** 展示。

**第一页（4位）**：

根据议题推荐度排序，前4位放在第一页，最相关的标记"(推荐)"。

```
AskUserQuestion:
  question: "请选择3位谋士参与讨论（最多3位）："
  header: "选择谋士"
  multiSelect: true
  options:
    - label: "诸葛亮(推荐)"
      description: "大局判断 — 科技趋势、产业规划、职业发展路径、教育规划"
    - label: "曹操"
      description: "实用主义 — 企业管理、人才选拔、执行决策、竞争分析"
    - label: "司马懿"
      description: "隐忍蚕食 — 投资理财、风险管理、长期博弈、竞争对手分析"
    - label: "刘备"
      description: "感同身受 — 用户洞察、人际关系、团队凝聚、情感决策"
```

**第二页（4位）**：

```
AskUserQuestion:
  question: "请选择3位谋士参与讨论（最多3位）："
  header: "选择谋士"
  multiSelect: true
  options:
    - label: "周瑜"
      description: "以小博大 — 创业投资、资源整合、融资策略、市场进入"
    - label: "贾诩"
      description: "人性洞察 — 谈判博弈、危机管理、利益分析、风险评估"
    - label: "郭嘉"
      description: "短期战术 — 营销策划、竞争战术、创意策略、快速执行"
    - label: "鲁肃"
      description: "系统结构 — 组织设计、流程优化、制度建设、系统规划"
```

> 分页逻辑：两页均使用相同的 question 和 header，multiSelect 均为 true。用户可以在两页中任意选择，最终合并所有选择。

**角色选择处理规则**：
- multiSelect 为 true
- 两页的选择合并计算，最多3位
- 用户选超过3位时，取前3位
- 用户选不足3位时，提示补选并重新展示两页
- 每位谋士的 description 格式统一为：`思维模式 — 擅长领域1、擅长领域2、擅长领域3、擅长领域4`

### 确认阶段

```
AskUserQuestion:
  question: "圆桌会议已准备就绪，确认启动？"
  header: "确认启动"
  multiSelect: false
  options:
    - label: "开始讨论(推荐)"
      description: "启动圆桌讨论，谋士们开始发言"
    - label: "换人"
      description: "重新选择参与讨论的谋士"
    - label: "改题"
      description: "修改议题内容"
    - label: "重来"
      description: "从头开始，重新选择模板"
```

### 讨论暂停

每轮讨论结束后，使用 AskUserQuestion 询问下一步操作。

```
AskUserQuestion:
  question: "本轮讨论结束，接下来你希望？"
  header: "下一步"
  multiSelect: false
  options:
    - label: "继续(推荐)"
      description: "进入下一轮讨论"
    - label: "总结"
      description: "跳过剩余轮次，生成最终分析"
    - label: "结束"
      description: "终止会议，赠送锦囊并退出"
    - label: "补充信息"
      description: "向谋士们补充新信息或提问"
```

> 用户选"补充信息"后，等待用户输入补充内容，然后谋士们根据新信息调整观点。
> 用户选"其他"时，将输入内容视为主公的直接发言或@互动。

**轮次提示调整**：
- 第一轮后：question 中可加入"（第1轮/共4轮）"
- 第三轮后：将"总结"标记为推荐选项
- 第五轮后：只提供"总结"和"结束"两个选项

### 总结后

```
AskUserQuestion:
  question: "最终分析已生成，接下来？"
  header: "结束会议"
  multiSelect: false
  options:
    - label: "结束(推荐)"
      description: "赠送锦囊并退出圆桌会议"
    - label: "继续讨论"
      description: "追加一轮讨论"
```

---

## 流程衔接规则

1. **AskUserQuestion 与聊天消息的交替**：AskUserQuestion 用于收集选择，聊天消息用于输出内容（角色发言、系统通知、模板格式等）。两者交替使用，形成"输出内容 → 收集选择 → 输出内容"的循环。

2. **不要在 AskUserQuestion 前输出冗长文本**：如果需要展示信息（如议题确认汇总），先用聊天消息输出，然后调用 AskUserQuestion 收集选择。

3. **用户选择后的处理**：
   - 收到用户选择后，直接执行对应操作
   - 不要重复确认（除非是高风险操作）
   - 不要输出"你选择了xxx"之类的确认语
   - 直接进入下一步流程

4. **错误处理**：
   - 如果用户选了"其他"但输入无法识别，用聊天消息提示并重新调用 AskUserQuestion
   - 如果用户在角色选择中选了不足3位，用聊天消息提示补选，然后重新调用 AskUserQuestion

---

## 与文本命令的兼容

在讨论阶段（阶段三），用户仍然可以通过文本输入直接发言或使用 @互动。AskUserQuestion 的"其他"选项为用户提供了文本输入的入口。

**兼容规则**：
- 讨论暂停时弹出 AskUserQuestion，但用户也可以不选选项，直接在对话框输入
- 如果用户在 AskUserQuestion 弹出后直接输入文本（不选选项），将文本视为主公发言
- 如果用户选择了选项卡中的选项，按选项执行对应操作
