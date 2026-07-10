# AI 协作全栈开发工作流流程图

```mermaid
flowchart TD
    %% ========== 样式定义 ==========
    classDef phase fill:#FFB6C1,color:#fff,stroke:none,rounded:xl
    classDef skill fill:#87CEEB,color:#fff,stroke:none,rounded:xl
    classDef action fill:#fff,stroke:#FFB6C1,stroke-width:2,rounded:lg
    classDef decision fill:#fff,stroke:#87CEEB,stroke-width:2,stroke-dasharray:5 5,rounded:lg
    classDef loop fill:#E8F5E9,stroke:#66BB6A,stroke-width:2,rounded:lg

    %% ========== 阶段 1：创意 ==========
    subgraph Phase1[💡 创意阶段]
        A1[("💡 点子/需求")] --> A2[brainstorming<br/>需求探索与发散]
        A2 --> A3[grill-me<br/>需求收敛与确认]
    end

    %% ========== 阶段 2：调研 ==========
    subgraph Phase2[🔍 调研阶段]
        B1[hv-analysis<br/>横纵深度研究<br/>竞品/行业/发展趋势] :::skill
        B2[GitHub Search<br/>搜同类项目架构<br/>搜具体功能轮子] :::skill
    end

    A3 --> Phase2
    A3 -.-> B1
    A3 -.-> B2

    %% ========== 阶段 3：PRD ==========
    subgraph Phase3[📋 PRD 阶段]
        C1[梳理核心模块<br/>与用户讨论确认] :::action
        C2[api-design-principles<br/>API 设计原则] :::skill
        C3[to-prd<br/>生成正式 PRD 文档] :::skill
        
        C1 --> C2 --> C3
    end

    B1 --> C1
    B2 --> C1

    %% ========== 阶段 4：技术选型 ==========
    subgraph Phase4[🔧 技术选型]
        D1[tech-stack-selector<br/>技术栈评估与选择] :::skill
    end

    C3 --> D1

    %% ========== 阶段 5：项目初始化 ==========
    subgraph Phase5[🚀 项目初始化]
        E1[trae-project-setup<br/>项目结构 & 规则初始化] :::skill
    end

    D1 --> E1

    %% ========== 阶段 6：编码阶段（核心循环） ==========
    subgraph Phase6[📝 编码阶段]
        direction TB
        
        %% 子阶段 6a：Spec 规划
        subgraph SpecPlan[Spec 规划]
            F1[撰写 spec.md<br/>功能规格 + API 设计 + 数据路径图] :::action
            F2[撰写 checklist.md<br/>验收清单] :::action
            F3[撰写 tasks.md<br/>垂直切片任务分解] :::action
            F1 --> F2 --> F3
        end

        %% 子阶段 6b：Issue 拆分
        subgraph IssueSplit[Issue 拆分]
            G1[to-issues<br/>拆分为独立垂直切片 Issues] :::skill
            G2{与用户确认<br/>Issue 清单?} :::decision
            G1 --> G2
            G2 -->|调整| G1
            G2 -->|确认通过| H
        end

        F3 --> G1

        %% 子阶段 6c：编码循环
        subgraph CodingLoop[编码循环 - 每 Issue]
            H[取一个 Issue] :::action
            I[细拆编码步骤<br/>切片的范围决定步骤] :::action
            J[按步骤实施] :::action
            K[写测试 → 实现 → 验证] :::action
            L{步骤完成?} :::decision
            M{还有步骤?} :::decision
            N{还有 Issue?} :::decision

            H --> I --> J --> K --> L
            L -->|否| K
            L -->|是| M
            M -->|有| J
            M -->|无| N
            N -->|有| H
            N -->|无| Phase7
        end

        %% 编码中按需技能
        J -.-> S1[karpathy-guidelines<br/>编码准则] :::skill
        J -.-> S2[frontend-design<br/>UI 实现] :::skill
        J -.-> S3[vercel-react-best-practices<br/>React/Next 优化] :::skill
        K -.-> S4[webapp-testing<br/>Playwright 验证] :::skill

        SpecPlan --> IssueSplit
    end

    Phase5 --> Phase6

    %% ========== 阶段 7：质量保障 ==========
    subgraph Phase7[🔬 质量保障]
        H1[improve-codebase-architecture<br/>架构审查与重构机会挖掘] :::skill
    end

    %% ========== 阶段 8：文档与发布 ==========
    subgraph Phase8[📤 文档与发布]
        I1[docx / pdf / xlsx<br/>文档生成] :::skill
        I2[git-workflow<br/>版本控制与提交] :::skill
        I3[neat-freak<br/>知识整理与记忆同步] :::skill
    end

    H1 --> I1 --> I2 --> I3

    %% ========== 图例 ==========
    subgraph Legend[图例]
        L1[阶段标题] :::phase
        L2[可调用技能] :::skill
        L3[人工操作] :::action
        L4[决策/判断] :::decision
    end
```

---

## 流程总览（文字版）

| 阶段 | 核心产出 | 涉及技能 |
|------|----------|----------|
| **💡 创意** | 收敛的需求方向 | brainstorming → grill-me |
| **🔍 调研** | 竞品/行业/技术调研 | hv-analysis + GitHub Search |
| **📋 PRD** | 正式产品需求文档 | api-design-principles → to-prd |
| **🔧 技术选型** | 技术栈方案 | tech-stack-selector |
| **🚀 项目初始化** | 项目结构与规则文件 | trae-project-setup |
| **📝 编码** | spec → checklist → tasks → issues → 编码 → 验证 | 多个技能按需调用 |
| **🔬 质量保障** | 架构审查报告 | improve-codebase-architecture |
| **📤 文档发布** | 文档 + 版本控制 + 知识同步 | docx/pdf/xlsx → git-workflow → neat-freak |

---

## 编码阶段放大（每个 Issue 的内部循环）

```
取 Issue
  ↓
细拆编码步骤（根据切片范围决定）
  ├── 数据模型层（如果需要）
  ├── API 路由层（如果需要）
  ├── Hook/逻辑层（如果需要）
  └── UI 组件层（如果需要）
  ↓
对每一步：写测试 → 实现 → 验证
  ├── karpathy-guidelines（编码前查看准则）
  ├── frontend-design（UI 部分）
  ├── vercel-react-best-practices（性能优化）
  └── webapp-testing（集成验证）
  ↓
步骤完成？→ 否 → 继续实现
         → 是 → 还有步骤？→ 有 → 下一步
                              → 无 → 还有 Issue？→ 有 → 取下一个 Issue
                                                   → 无 → 进入质量保障
```