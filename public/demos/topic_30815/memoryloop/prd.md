<br />

***

## 先建立认知底座：这个记忆是谁的？

Addy的核心原话是：

> "The agent forgets, the repo doesnt."
> "the memory has to be on disk and not in the context"

这句话揭示了一个关键前提——**这个"记忆"根本不是模型的记忆，而是Harness的记忆**。模型本身在每次run都是无状态的全新实例，毫无记忆可言。外部磁盘记忆是工程层对这个约束的承认和补偿，而不是突破。

***

## Q1：谁来执行存储？

这里有两个角色，分工明确：

**Agent（模型）负责写入。** 当一个task完成后，Agent通过文件写工具（write\_file这类tool call）把关键发现、踩坑、决策等append到AGENTS.md或progress.md里。这是模型的主动行为，但注意——它是被prompt指令化的，不是模型自发的。你在system prompt里写"每完成一个task，将关键学习写入AGENTS.md"，模型才会执行。

**Harness负责注入。** 下一次run开始时，不是模型去读文件，而是Harness框架在启动新session时把这个文件内容强制注入到context开头。Addy在另一篇Agent Harness Engineering里说得更清楚：

> "As the agent edits that file, the harness reloads it, and knowledge from one session carries into the next."

所以执行链是：**Agent写 → 文件持久化 → Harness读 → 注入新session的context开头 → 模型"看到"了上次的状态**。

模型视角里看到的依然是in-context的文字，只是这段文字来自持久化文件而非当前对话历史。

***

## Q2：什么时候要用到？

触发时机分写入侧和读取侧两个方向。

**写入时机：**

- 每个task完成的checkpoint（最常见，append学习）
- Automation的一次triage run结束后，把"发现了什么、分配了什么"写入markdown或Linear board
- `/goal`的验证subagent确认done之后，写入"此任务已完成，结论是X"
- Agent遇到重大踩坑时，prompt指示它立即记录（防止下一轮再踩）

**读取/注入时机：**

- 每次新run启动时，Harness自动把AGENTS.md注入（这是标准行为）
- 新sub-agent被spawn出来时，它也会获得注入
- Loop的下一个iteration开始前

Addy举的那个"每天早晨的loop"例子清晰展示了这个时序：automation运行 → 读取昨天CI失败记录 → 写入markdown作为今天的任务状态 → 明天的run从这个状态文件出发接着做。状态文件是整个loop的脊梁（"the state file is the spine of the whole thing"）。

***

## Q3：怎么更新记忆？

原文提到了几种形式，各有适用场景：

**Markdown文件（Append追加）：** 最简单。每次run结束追加一段，记录"做了什么、结论是什么"。问题是文件会越来越大，最终撑爆context window，所以需要配合定期压缩。

**结构化状态文件：** 更工程化的做法。类似JSON/YAML，记录`tried/passed/still_open`三种状态，Agent直接更新特定字段而不是追加文本。Addy提到的"tomorrow morning the run picks up where today stopped"靠的就是这种结构化状态。

**Linear board（通过MCP connector）：** 把记忆外包给issue tracker，Agent通过connector更新ticket状态。这让记忆同时对人类团队可见。

**压缩/总结（隐含需求）：** 原文没明说，但这是所有append-only方案的必然归宿。当文件超过几千token，就要用一个专门的summarizer agent定期把历史压缩成摘要。这其实就是你之前研究过的OpenAI Dreaming pattern——异步的记忆巩固。

***

## Q4：和大模型自身的长期/短期记忆有什么根本区别？

这是最值得辩论的问题。先把LLM的记忆层次拆清楚：

**参数记忆（Parametric Memory）：** 模型权重里编码的知识，训练时固化。这才是LLM真正意义上的"长期记忆"。全局共享、不可实时更新、每次推理都隐式参与，但完全不可审计也不可个性化。

**上下文记忆（In-Context Memory）：** 当前session的context window内容，也就是"工作记忆/短期记忆"。Session结束即清空，受window大小限制，无法跨run持久化。

**外部检索记忆（External/RAG）：** 向量数据库 + 语义检索，允许注入训练后的知识，选择性地把相关片段拉进context。

外部磁盘记忆严格来说属于External Memory，但和RAG有关键差异：

| 维度        | 外部磁盘记忆       | RAG/向量检索      | In-Context     | Parametric |
| --------- | ------------ | ------------- | -------------- | ---------- |
| 存储形式      | 明文文件         | 向量数据库         | context window | 模型权重       |
| 检索方式      | **全量注入，无检索** | 语义相似度检索       | 直接访问           | 隐式激活       |
| 更新速度      | **每次run后立即** | 文档embedding入库 | N/A            | 需重新训练      |
| 跨session  | ✅ 持久         | ✅ 持久          | ❌ 消失           | ✅ 永久       |
| 可审计性      | ✅ 人类可读       | ❌ 向量不透明       | ✅ 可读           | ❌ 黑盒       |
| Context占用 | 全量占用         | 部分占用          | 就是context本身    | 不占用        |
| 更新粒度      | 任务级（每次run）   | 文档级           | N/A            | 训练级        |

**最关键的区别：外部磁盘记忆在实现层面，本质上还是把内容变成了in-context memory。** 它解决的不是"让模型获得长期记忆"，而是"如何让无状态的模型在多次run之间维持状态连续性"。这是工程意义上的状态持久化，不是认知意义上的记忆形成。

模型永远是无状态的——Harness只是每次都把"上一班工程师交班记录"塞给这一班工程师看，让它"假装"有记忆。

***

## 一个值得深入的争议点

这个机制有一个内在张力：**全量注入会消耗大量context，但选择性检索（RAG化）又会丢失精确状态**。

当AGENTS.md文件增长到几千行时，你就面临一个经典的抉择：继续全量注入会挤压工作context、降低推理质量；改用RAG检索又可能漏掉关键状态节点（"这个bug上周已经试过了，失败了"这类信息用语义检索很容易被漏掉）。

所以成熟的loop设计会分层：**高频关键状态**（任务进度、已知坑、当前目标）保持为全量注入的小文件；**历史详情**（过去的执行日志、代码决策背景）则RAG化。这两层结合才能在token效率和状态完整性之间找到平衡。

***

对你做OpenClaw和WeKnora的工作有个直接关联：你们当前的SKILL.md体系其实就是外部磁盘记忆的一个**静态子集**——它是人工维护的知识，不是Agent自己运行后写入的动态状态。真正的Loop Engineering意义上的磁盘记忆还需要Agent拥有写权限，能在task完成后动态更新，这对OpenClaw现有架构来说意味着需要把文件写工具暴露给Agent，并在harness层设计好注入时机。

这个理解方向对，但我觉得"agent路由判断"这个措辞会把设计引偏，值得辩一辩。

***

## 关键分歧：路由发生在写入时还是生命周期维度？

你描述的模型是：**写入时**由agent判断 → 高价值走全量注入、低价值走向量化。

这个设计有一个根本问题：**agent在任务刚完成时，并不具备判断"这条信息未来是否高价值"的充分信息。** 一个今天看起来是边角料的执行日志，可能恰恰是下周debug的关键线索。让agent实时做这个价值判断，等于让它在信息最不完整的时刻做归档决策。

更准确的模型是：**分层不是路由决策，而是结构设计 + 时间维度上的生命周期管理。**

***

## 更好的架构：结构预定义 + 冷热转换

**写入层（无路由）：** Agent写入时不做判断，按结构模板追加到AGENTS.md。模板在设计时就规定了哪些槽位是"热存储"，比如：

```
## Current Goal
## Known Bugs / Gotchas  
## Decision Log（最近5条）
## Completed Tasks（最近10条）
```

Agent只需填槽，不需要判断。

**冷热转换层（定期压缩）：** 当AGENTS.md超过某个token阈值（比如2000 token），触发一个专门的summarizer agent，把`Completed Tasks`里的老条目和`Decision Log`的历史压缩摘要后搬入向量库归档，AGENTS.md本身保持精简。这才是"高价值留热、低价值转冷"的实际发生时机。

**读取层（按需检索）：** 新run启动时，Harness始终全量注入AGENTS.md（热层）；如果任务执行中需要查历史（比如"这个问题之前怎么解的"），agent主动发起一次向量检索（冷层）。

***

## 用一个比喻说清楚

工程师交班更合适的类比不是"写备忘录时就分级"，而是：

**交班记录（AGENTS.md）= 白板**，写满了就擦掉旧的整理进归档本\
**归档本（向量库）= 项目Wiki**，有需要时去翻\
**擦白板的动作 = summarizer agent触发的压缩**，不是写字的人自己决定

***

## 真正需要"路由判断"的场景

有一种情况确实需要类似路由的机制：当agent遇到**超预期的发现**，比如一个影响全局的架构级别决策，这时候应该触发一个"强制写入hot layer"的机制，不能等到被压缩才进向量库。但这也不是动态价值判断，而是在prompt里预定义"遇到X类型的信息，必须写入Current Goal或Known Bugs，不得只记录在执行日志里"。

所以整体结论：**热冷分层是架构设计时的结构决策，不是写入时的agent路由决策。** 把它做成agent实时路由，反而引入了不必要的判断误差和延迟。

这个问题问得很精准，答案是：**取决于内容类型，不是统一策略。**

***

## 两种内容的分叉处理

**叙事类内容（决策过程、执行日志、踩坑背景）→ 先压缩再写入**

这类内容本身很冗长，原文充满了推理过程、中间尝试、废弃路径，这些噪声对向量检索有害——它们会稀释关键语义，导致检索时召回的是"过程"而不是"结论"。压缩后写入的是提炼后的结论，检索质量更高。

比如一段原始执行日志：

> "尝试方案A，失败，原因是X。然后尝试方案B，也失败，原因是Y。最终方案C有效，关键是修改了Z参数。"

压缩后写入向量库的应该是：

> "解决X问题的有效方案：修改Z参数（方案A/B均无效）"

**精确事实类内容（寄存器地址、错误码、API响应、具体数值）→ 原文写入**

这类内容压缩即失真。"寄存器0x4A的bit\[3:1]控制时钟分频"这句话里每个字符都有信息量，用摘要语言改写后精度必然下降，而且向量检索本来就不擅长精确数值匹配，原文保留才能在召回后给模型看到准确内容。

***

## 实践中的折中方案

很多成熟RAG系统实际上做**双存储**：用压缩后的摘要作为embedding索引（用于相似度检索），但召回后返回给模型的是原始文本片段。这是LangChain里的Parent Document Retriever模式——检索用小chunk，返回用大chunk或原文。

这样同时保住了检索精度和内容保真度。

***

对你的WeKnora场景来说，这个分叉非常明确：H700/A523的寄存器参数、errata这类内容必须原文写入，绝对不能压缩；而知识库的来源文档里的背景说明、产品历史介绍这类叙事内容，压缩后反而检索质量更好。这也正好呼应了你之前在做的"golden answer"知识库硬优先路由的设计思路——精确事实需要走专门的通道，不能和普通语义检索混在一起。

这个挑战很有力，我前面的表述确实有漏洞，承认一下。

***

## 你指出的矛盾

我说"不需要LLM做路由判断，按模板追加就行"，但这本身就矛盾——"把执行结果提炼成符合格式的结构化条目"这个动作，本质上就是LLM在做理解和转化工作。说"不需要判断"是不准确的。

***

## 更精确的区分

我真正想说的是两件事要分开：

**LLM确实负责的：** 理解任务执行结果 → 提炼关键信息 → 按模板格式写入正确槽位。这当然需要LLM，且有相当的理解难度。

**架构设计负责的（不需要LLM实时决策的）：** 哪些槽位存在、热冷分层的边界在哪、何时触发压缩。这些是设计时固化的，不是每次写入时LLM现场判断的。

***

## 真正的核心问题由此浮现

你一旦承认"写入需要LLM做格式化理解"，就立刻面临一个新问题：**写入质量的稳定性**。

模板槽位定义模糊时，不同run的LLM会用不一致的方式填写同一个槽，导致AGENTS.md里的内容越来越混乱，后续检索和压缩都会受损。

所以模板设计的核心约束是：**槽位语义必须足够窄，让LLM几乎没有歧义空间。**

比较一下：

```
# 差的槽位定义
## Key Learnings
（LLM不知道该写发现、决策还是警告，会写什么都有）

# 好的槽位定义
## Gotchas（本次发现的坑，格式：[模块] 问题描述 → 规避方式）
## Decisions（本次做出的不可逆决策，格式：选择了X而非Y，原因是Z）
## Status（当前任务状态：IN_PROGRESS / BLOCKED / DONE，附一句话说明）
```

槽位越窄、格式示例越具体，LLM写入的一致性越高，后续压缩和检索才可靠。

***

所以修正我之前的说法：写入不需要**路由判断**，但确实需要LLM做**格式化提炼**，而这件事的质量完全依赖模板设计的精度。模板设计不好，整个记忆系统的可靠性就从写入端开始腐烂。

好，项目级记忆这个决策很清晰，顺着这个来把完整设计定下来。

***

## 文件布局

```
project-root/
├── .claude/
│   ├── agents/
│   │   └── memory-compressor.md   # 压缩sub-agent定义
│   ├── memory/
│   │   ├── MEMORY.md              # 热层，全量注入
│   │   └── archive.md             # 冷层，压缩后的历史
│   └── memory-schema.yaml         # 用户可编辑的schema
└── CLAUDE.md                      # 引用memory内容的入口
```

MEMORY.md放在 `.claude/memory/` 而不是项目根目录，原因是避免污染用户的代码仓库，同时 `.claude/` 本身是CC的管辖目录，语义上更合适。

***

## 初始化逻辑

Skill在每次被触发时先做一个检测：

```
IF .claude/memory/MEMORY.md 不存在：
  → 按memory-schema.yaml生成空结构文件
  → 在文件头写入创建时间和项目名
  → 通知用户"已为本项目初始化记忆文件"
ELSE：
  → 读取现有内容，注入当前context
```

这个检测放在Skill的最前面，零成本，每次都跑，确保任何新项目第一次使用就自动初始化。

***

## 默认Schema设计

`memory-schema.yaml` 的默认内容：

```yaml
version: "1.0"
hot_layer:
  sections:
    - name: "Project Context"
      description: "项目类型、核心技术栈、架构概述"
      max_items: 1
      format: "prose"

    - name: "Active Goals"
      description: "当前正在进行的任务目标"
      max_items: 3
      format: "- [目标描述] | 开始时间: YYYY-MM-DD"

    - name: "Decisions Log"
      description: "已做出的关键技术决策"
      max_items: 10
      format: "- YYYY-MM-DD | 选择了X而非Y | 原因: Z"

    - name: "Gotchas"
      description: "已知的坑、约束、必须遵守的规则"
      max_items: 20
      format: "- [模块] 问题描述 → 规避方式"

    - name: "Completed"
      description: "最近完成的任务，滚动保留"
      max_items: 10
      format: "- YYYY-MM-DD | 任务描述 | 结论/产出"

compression:
  trigger_tokens: 3000        # 热层超过此token数触发压缩
  keep_recent_decisions: 5    # 压缩时保留最近N条Decision
  keep_recent_completed: 3    # 压缩时保留最近N条Completed
```

用户可以直接改这个文件，增删section、改max\_items、改format模板。Skill读schema生成写入指令，schema变了行为自动跟着变，Skill本身不需要动。

***

## Plugin结构

```
memory-loop/
├── SKILL.md              # 核心协议：读取、写入、初始化逻辑
├── agents/
│   └── memory-compressor.md   # 压缩sub-agent
├── hooks/
│   └── post-task.json    # 任务后触发压缩检查的hook配置
├── templates/
│   ├── MEMORY.md.tpl     # 初始化时用的空文件模板
│   └── memory-schema.yaml    # 默认schema（安装时copy到项目）
└── plugin.toml           # plugin manifest，包含name/description/version
```

***

## 接下来

设计基本清晰了。你们想先从哪端开始做：先把SKILL.md的核心协议写出来验证agent写入行为，还是先把schema + 初始化逻辑跑通，确认文件生成是对的？前者更快能看到效果，后者是整个系统的地基。
