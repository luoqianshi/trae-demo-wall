# 迁跃 AI｜TRAE真实创作过程证据表

本文件只记录用户能够从TRAE界面真实核验的创作过程。Codex任务ID、Git Commit SHA或其他工具记录不能替代TRAE Session ID。

## 证据表

| 阶段 | TRAE任务 | 修改或产物 | Session ID | 截图 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | TRAE项目只读审查（TRAE Code） | 读取README、架构、Persona、测试与交付材料，输出《TRAE比赛最终提交审查报告》；未修改产品代码 | `3313256913175539:5463da632deee8eaedcfcc3a6083fbac_6a52fa6ae4cd93a49b507c9a.6a52fa6ae4cd93a49b507c9d.6a52fa6ae4cd93a49b507c9b:TRAE Work CN.0.1.32.no_sid.no_ppe.T(2026/7/12 10:22:34)` | `04-TRAE过程截图/03-trae-code-final-audit-session.jpeg` | 已完成；只证明发生过TRAE审查，不描述为TRAE开发了Demo |
| 2 | Demo Persona与比赛叙事落地（TRAE Code） | 读取任务文档，将林晨匿名Persona、唯一追问、弱到中连接和Transfer Asset落地为简单三步式创意HTML候选稿 | `3313256913175539:9e6965d68a889f20c1ea0e3ba2ff7b4c_6a54fce90e7438e04260b275.6a54fce90e7438e04260b278.6a54fce90e7438e04260b276:TRAE Work CN.0.1.32.no_sid.no_ppe.T(2026/7/13 22:57:45)` | `04-TRAE过程截图/01-trae-code-creative-html-session.jpeg` | 已完成并独立复验；来源为TRAE Code候选稿 |
| 3 | 报名创意提案HTML生成与展示优化（TRAE Work） | 根据完整Brief生成离线单文件HTML，并在TRAE Work内完成按钮流程、响应式与离线边界自检；正式附件已独立复验 | `3313256913175539:9c0c78028307a85e0cd17c3cb6fe7d53_6a54feb80e7438e04260b312.6a54feb80e7438e04260b315.6a54feb80e7438e04260b313:TRAE Work CN.0.1.32.no_sid.no_ppe.T(2026/7/13 23:05:28)` | `04-TRAE过程截图/02-trae-work-registration-html-session.jpeg` | 已完成；正式报名附件为TRAE Work产物 |
| 4 | 报名HTML单步换页与勾选式补证优化（TRAE Work） | 真实任务`Execute Task from File`读取验收任务和候选HTML，生成`qianyue-trae-step-view-output.html`；保留7阶段、3个Persona和勾选补证门禁 | `3313256913175539:67bf4403ccd64dbd3f0583e1f6185fe8_6a55bb5c0e7438e04260bccf.6a55bb5c0e7438e04260bcd2.6a55bb5c0e7438e04260bcd0:TRAE Work CN.0.1.32.no_sid.no_ppe.T(2026/7/14 12:30:20)` | `04-TRAE过程截图/04-trae-work-step-view-session.jpeg` | 已完成；Session ID由TRAE界面双击官方复制；截图仅遮挡账号与本地个人路径 |

## 填写规则

只有同时满足以下条件，才能把某一行状态改为“已完成”：

1. 该任务确实在TRAE IDE或TRAE Work中执行。
2. “修改或产物”与对应TRAE任务的真实输出一致。
3. Session ID由用户从TRAE界面真实复制，不是Codex任务ID、Git SHA或手工构造字符串。
4. 截图为TRAE界面的真实关键步骤截图，能够看清任务、过程或产物。
5. 截图文件已经真实放入初赛材料目录，且路径可以打开。

## 禁止填写

- 不得将Codex任务、对话或Agent名称写成TRAE任务。
- 不得将`FINAL_SOURCE_SHA`或其他Git提交号写入Session ID列。
- 不得复制其他参赛作品的Session ID。
- 不得为了凑满三条记录虚构修改内容、截图或完成状态。
- 不得在没有真实证据时写“作品由TRAE完成”。

## 后续源码变更规则

当前冻结源码为：

`ad4c4c80269007a51f2837019c9b4cf327c9a964`

如果用户后续使用TRAE对产品源码进行了实质性修改，必须重新执行源码冻结、测试、安全扫描和Demo ZIP导出，并用新的`FINAL_SOURCE_SHA`替换所有交付材料中的旧值。

如果TRAE任务只是只读审查，不得把它描述为TRAE完成了Demo开发。

## 当前真实状态

```text
REAL_TRAE_SESSION_COUNT=4
REAL_TRAE_PROCESS_SCREENSHOT_COUNT=4
TRAE_PROCESS_EVIDENCE_READY=true
```

以上数量表示本交付目录当前已经记录并验证的证据数量。初赛正文选用第2、3、4条作为三个核心开发任务，第1条只作补充审计。这些证据不证明交互Demo的全部源码由TRAE生成；第三方工具参与边界仍需用户向官方确认。

## 本次初赛体验附件对齐

为避免“TRAE证据对应创意HTML、实际提交却是另一套源码Demo”的证明链断裂，初赛主体验附件已调整为：

`competition-delivery/06-preliminary-post-ready/02-交互Demo/Qianyue-AI-TRAE-Interactive-Demo.zip`

该ZIP直接包含TRAE Work单文件HTML产物，解压后双击即可体验，与第2、3条TRAE产物链直接相关。原`Qianyue-AI-Interactive-Demo.zip`继续作为完整源码型MVP归档，不再作为本次社区初赛帖的首选体验附件。
