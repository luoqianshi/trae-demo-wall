/* Global Office Demo
 * 纯前端离线可运行。尽量不要依赖外部 CDN。
 */

// 兜底数据：当 file:// 环境下 fetch JSON 失败时使用
// 注意：为保证离线可玩性，这里内置与 `assets/story.json` 同步的内容（版本 2.2）
const STORY_FALLBACK = JSON.parse(`{
  "version": "2.2",
  "world": {
    "company": "Northstar Labs",
    "setting_cn": "一家国际化互联网公司，节奏快、沟通密集、政治敏感但也讲规则。",
    "setting_en": "A fast-paced global internet company: high-context communication, sharp deadlines, and real stakes."
  },
  "roles": [
    {
      "id": "hr",
      "name_cn": "招聘经理线",
      "name_en": "Hiring Manager Line",
      "chapter": {
        "id": "hr_ch1",
        "title_cn": "第一章：Offer 迷雾",
        "title_en": "Chapter 1: The Offer Fog",
        "start_scene": "hr_s1",
        "scenes": [
          {
            "id": "hr_s1",
            "speaker_cn": "候选人（邮件）",
            "speaker_en": "Candidate (Email)",
            "text_en": "Hi Alex, thank you again. I’m excited, but I’d like to revisit the scope and title. I want to make sure we set the right expectations.",
            "text_cn": "嗨 Alex，再次感谢。我很兴奋，但我想再确认一下 scope 和 title。我希望我们把预期对齐，别一开始就走偏。",
            "choices": [
              {
                "id": "hr_s1_c1",
                "text_en": "Totally fair. Before we change anything, can you share what feels risky about the scope — workload, ownership, or success metrics?",
                "text_cn": "很合理。在讨论任何调整前，你能说下你觉得 scope 的风险点是什么：工作量、职责边界，还是成功标准？",
                "tags": [
                  "探索",
                  "先拿信息"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 2,
                  "risk": -1
                },
                "key_phrases": [
                  "set the right expectations",
                  "what feels risky",
                  "success metrics"
                ],
                "feedback_cn": "你先把对方真正的顾虑问出来，短剧感的核心就是先抛钩子，再揭底牌。",
                "feedback_en": "You surface the hidden concern before negotiating terms.",
                "next": "hr_s2_a"
              },
              {
                "id": "hr_s1_c2",
                "text_en": "We can revisit it. To keep momentum, can we do a 15-minute call today and align on a decision timeline after that?",
                "text_cn": "可以再对齐。为了不拖节奏，我们今天能不能先来个 15 分钟电话，聊清楚后一起定一个决策时间线？",
                "tags": [
                  "节奏控制",
                  "先约电话"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 3,
                  "risk": -2
                },
                "key_phrases": [
                  "keep momentum",
                  "decision timeline"
                ],
                "feedback_cn": "你把“催”翻译成“共同对齐节奏”，既推进也不显得心虚。",
                "feedback_en": "You keep pace without sounding pushy.",
                "next": "hr_s2_b"
              },
              {
                "id": "hr_s1_c3",
                "text_en": "Title is tied to leveling. If scope is the concern, I can send a 90-day success draft and what’s explicitly out of scope — would that help you decide?",
                "text_cn": "title 会跟定级绑定。若你主要担心 scope，我可以给你一份 90 天成功标准草案，以及明确 out of scope 的边界，这会帮助你决策吗？",
                "tags": [
                  "边界",
                  "给可验证材料"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 1,
                  "risk": -3
                },
                "key_phrases": [
                  "tied to leveling",
                  "90-day success draft",
                  "out of scope"
                ],
                "feedback_cn": "你用书面材料推进，不靠口头承诺，这会让后面每次反转更有抓手。",
                "feedback_en": "You anchor on concrete artifacts instead of opinions.",
                "next": "hr_s2_c"
              }
            ]
          },
          {
            "id": "hr_s2_a",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "They reply: “Honestly, it’s ownership. I’m worried this role becomes the fallback person for three teams.”",
            "text_cn": "对方回复：说实话是 ownership。我担心这个岗位最后会变成三个团队的“兜底人”。",
            "choices": [
              {
                "id": "hr_s2_a_c1",
                "text_en": "Take the call and map ownership (own / influence / consult).",
                "text_cn": "进入电话：把 ownership 拆成 own / influence / consult",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "你进入第一层反转：原来 title 不是核心，真正的问题是“谁在甩锅”。",
                "feedback_en": "You move into an ownership-map alignment call.",
                "next": "hr_s3_a"
              }
            ]
          },
          {
            "id": "hr_s2_b",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "They respond fast: “Thanks. Also, I’m on another offer deadline this week. I need clarity today.”",
            "text_cn": "对方回得很快：谢谢。另外我这周也有别的 offer 截止，我今天需要更明确的答案。",
            "choices": [
              {
                "id": "hr_s2_b_c1",
                "text_en": "Take the call and set a decision package: scope + success + leveling.",
                "text_cn": "进入电话：给一个决策包（scope + success + leveling）",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "你把剧情推进到“时限对赌”分支：对方不是没兴趣，而是在比较谁更稳。",
                "feedback_en": "You’re entering a time-boxed negotiation route.",
                "next": "hr_s3_b"
              }
            ]
          },
          {
            "id": "hr_s2_c",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "They reply: “Yes. Also, I’ve heard a hiring freeze rumor. I need to know what’s real.”",
            "text_cn": "对方回复：可以。另外我听说你们组织有 freeze 传闻，我需要知道什么是真的。",
            "choices": [
              {
                "id": "hr_s2_c_c1",
                "text_en": "Take the call and address the rumor without breaking confidentiality.",
                "text_cn": "进入电话：在不泄密的前提下处理 freeze 传闻",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "你进入“消息真假难辨”分支，这种半真半假的风险就是持续吸引人的钩子。",
                "feedback_en": "You’re entering an information-boundary route.",
                "next": "hr_s3_c"
              }
            ]
          },
          {
            "id": "hr_s3_a",
            "speaker_cn": "候选人（电话）",
            "speaker_en": "Candidate (Call)",
            "text_en": "If I join, what do I truly own? And what will still sit with Sales Ops and RevOps?",
            "text_cn": "如果我加入，我到底真正“负责什么”？哪些事情仍然在 Sales Ops / RevOps？",
            "choices": [
              {
                "id": "hr_s3_a_c1",
                "text_en": "Let’s create an ownership map and I’ll share it back in writing after I align with the hiring manager.",
                "text_cn": "我们做一张 ownership map，我和用人经理对齐后会书面发你确认。",
                "tags": [
                  "职责地图",
                  "书面确认"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "ownership map",
                  "in writing"
                ],
                "feedback_cn": "你把模糊风险变成可验证文档，但也给自己埋下了后面必须兑现的伏笔。",
                "feedback_en": "Concrete artifacts build trust — and create delivery obligations.",
                "next": "hr_s4"
              },
              {
                "id": "hr_s3_a_c2",
                "text_en": "We can phase the scope: first 60 days focus on core ownership, then expand after a review.",
                "text_cn": "我们可以分阶段：前 60 天只做核心职责，复盘后再扩 scope。",
                "tags": [
                  "分阶段",
                  "先保可控"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": -1,
                  "risk": -1
                },
                "key_phrases": [
                  "phase the scope",
                  "after a review"
                ],
                "feedback_cn": "你把大承诺拆成多段，短剧里这种“先缓一下”能制造下一波悬念。",
                "feedback_en": "Phasing reduces uncertainty — if the review mechanism is real.",
                "next": "hr_s4"
              }
            ]
          },
          {
            "id": "hr_s3_b",
            "speaker_cn": "候选人（电话）",
            "speaker_en": "Candidate (Call)",
            "text_en": "I can decide fast, but I need scope clarity and a leveling path. What can you commit to today?",
            "text_cn": "我可以很快决定，但我要两件事：scope 说清楚，以及定级路径。你今天能承诺到什么程度？",
            "choices": [
              {
                "id": "hr_s3_b_c1",
                "text_en": "I can commit to process: scope doc + success metrics today, and a leveling review checkpoint after probation if impact matches.",
                "text_cn": "我能承诺流程：今天给 scope 文档 + 成功标准；若影响力匹配，试用期后有一个定级复盘节点。",
                "tags": [
                  "承诺流程",
                  "复盘节点"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 2,
                  "risk": -2
                },
                "key_phrases": [
                  "commit to process",
                  "review checkpoint"
                ],
                "feedback_cn": "你承诺的是流程，不是结果，这种“真诚但不失守”是高留存表达。",
                "feedback_en": "You commit to process and checkpoints, not an outcome.",
                "next": "hr_s4"
              },
              {
                "id": "hr_s3_b_c2",
                "text_en": "Let’s bring HRBP into a quick call today. I’ll explain the scope, and they can explain policy and process so you don’t accept blindly.",
                "text_cn": "我们今天把 HRBP 拉进来快速对齐：我来说 scope，对方来说政策和流程。要是现场都对不齐，你也不该盲签。",
                "tags": [
                  "拉齐关键人",
                  "反向增强信任"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -1
                },
                "key_phrases": [
                  "bring ... into",
                  "accept blindly"
                ],
                "feedback_cn": "你用“反向劝退”增强可信度，也让后面的内部矛盾更容易爆出来。",
                "feedback_en": "Advising caution can paradoxically increase trust.",
                "next": "hr_s4"
              }
            ]
          },
          {
            "id": "hr_s3_c",
            "speaker_cn": "候选人（电话）",
            "speaker_en": "Candidate (Call)",
            "text_en": "About that hiring freeze rumor — if I join and the headcount gets pulled, I’m the one taking the risk.",
            "text_cn": "关于 freeze 传闻：如果我入职后 HC 被收回，承担风险的是我。",
            "choices": [
              {
                "id": "hr_s3_c_c1",
                "text_en": "I can’t share confidential plans, but I can add written offer guardrails: start date flexibility + scope doc + success metrics.",
                "text_cn": "我不能透露机密计划，但我可以加书面护栏：入职日期弹性 + scope 文档 + 成功标准。",
                "tags": [
                  "信息边界",
                  "用条款护栏"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "confidential",
                  "offer guardrails"
                ],
                "feedback_cn": "你不泄密，但把未知风险转成可写进文档的护栏。",
                "feedback_en": "You don’t leak — you reduce risk via written guardrails.",
                "next": "hr_s4"
              },
              {
                "id": "hr_s3_c_c2",
                "text_en": "Let’s involve HRBP to confirm the approval status and hiring process. I’ll explain the scope, and they can explain what’s already approved.",
                "text_cn": "把 HRBP 拉进来说明审批状态和招聘流程：我来解释 scope，对方来解释哪些已经批过。",
                "tags": [
                  "拉齐 owner",
                  "降低猜疑"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 2,
                  "risk": 0
                },
                "key_phrases": [
                  "approval status",
                  "already approved"
                ],
                "feedback_cn": "高信任路线，但也把组织内部的真相拉到了台面前。",
                "feedback_en": "High trust, but may surface internal contradictions.",
                "next": "hr_s4"
              }
            ]
          },
          {
            "id": "hr_s4",
            "speaker_cn": "HRBP（私信）",
            "speaker_en": "HRBP (DM)",
            "text_en": "We’re still hiring, but Finance is watching headcount. Keep it tight. Also, don’t mention the Q3 re-org rumor yet.",
            "text_cn": "我们还在招，但财务盯 HC 很紧，口径先收住。另外，Q3 组织调整的传闻先不要提。",
            "choices": [
              {
                "id": "hr_s4_c1",
                "text_en": "I’ll keep it tight. I’ll use artifacts (ownership map + 90-day success plan) to close without overpromising.",
                "text_cn": "收到。我会控制口径，用文档（ownership map + 90 天成功标准）推进签约，不乱承诺。",
                "tags": [
                  "稳住内部",
                  "用文档推进"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 2,
                  "risk": -2
                },
                "key_phrases": [
                  "keep it tight",
                  "close without overpromising"
                ],
                "feedback_cn": "你选择结构化推进，等于先把枪收起来，用文件代替嘴。",
                "feedback_en": "You compress ambiguity into controllable artifacts.",
                "next": "hr_s5"
              },
              {
                "id": "hr_s4_c2",
                "text_en": "If we hide too much, we’ll lose them. Let’s do a three-way call: I’ll explain the role scope, and you explain policy and approval status.",
                "text_cn": "如果藏太多会丢人。我们做个三方电话：我来解释岗位 scope，你来解释政策和审批状态。",
                "tags": [
                  "把 owner 拉上桌",
                  "高对齐成本"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 3,
                  "risk": 1
                },
                "key_phrases": [
                  "three-way call",
                  "approval status"
                ],
                "feedback_cn": "你把分歧拉到明面，这是短剧里最容易出反转的做法。",
                "feedback_en": "High leverage, high risk: quick win or quick blow-up.",
                "next": "hr_s5"
              }
            ]
          },
          {
            "id": "hr_s5",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "Cliffhanger: you receive an invite titled “Headcount Review — Urgent”. The candidate is waiting for your next email.",
            "text_cn": "悬念：你收到会议邀请《HC 复核 — 紧急》。候选人还在等你的下一封邮件。",
            "choices": [
              {
                "id": "hr_s5_c1",
                "text_en": "Continue: enter “Headcount Review”.",
                "text_cn": "继续：进入《HC 复核》",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 1,
                  "risk": 1
                },
                "key_phrases": [
                  "headcount review"
                ],
                "feedback_cn": "第一幕结束得够突然，下一幕直接从对外博弈切到对内政治。",
                "feedback_en": "You move from external negotiation to internal politics.",
                "next": "hr_s6"
              },
              {
                "id": "hr_s5_c2",
                "text_en": "Replay from the beginning.",
                "text_cn": "从头重玩（换一条表达路线）",
                "tags": [
                  "重玩"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "不同入口会让你在后面拿到不同的线索和爆点。",
                "feedback_en": "Try a different route to reveal different tensions.",
                "next": "hr_s1"
              }
            ]
          },
          {
            "id": "hr_s6",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "Headcount Review is in 30 minutes. Finance asks for a one-page justification: impact, scope, and why now. Meanwhile the candidate asks: “Are we still on track?”",
            "text_cn": "HC 复核 30 分钟后开始。财务要你一页纸说明：影响力、职责范围、为什么必须现在招。同时候选人追问：我们还按原计划走吗？",
            "choices": [
              {
                "id": "hr_s6_c1",
                "text_en": "Write the one-page headcount justification yourself, then align the wording with HRBP before the review.",
                "text_cn": "先把一页纸 HC justification 自己写出来，再和 HRBP 对齐口径后进会议。",
                "tags": [
                  "先拿证据",
                  "把话写下来"
                ],
                "effects": {
                  "trust": 1,
                  "pressure": 2,
                  "risk": -1
                },
                "key_phrases": [
                  "headcount justification",
                  "impact statement"
                ],
                "feedback_cn": "你选择把直觉写成纸面，这会逼出更硬的质询，也让成败更清晰。",
                "feedback_en": "You force yourself to turn intuition into auditable language.",
                "next": "hr_s7_a"
              },
              {
                "id": "hr_s6_c2",
                "text_en": "Call the candidate now. Be transparent about the review and propose a contingency plan.",
                "text_cn": "先打给候选人：坦诚说明复核，并给出 contingency plan（时间线 / 护栏）。",
                "tags": [
                  "先稳关系",
                  "用透明换信任"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 3,
                  "risk": 0
                },
                "key_phrases": [
                  "I want to be transparent",
                  "contingency plan"
                ],
                "feedback_cn": "你把未知摆上台面，这种即时情绪波动正是短剧最抓人的地方。",
                "feedback_en": "Transparency can buy trust — or trigger panic.",
                "next": "hr_s7_b"
              },
              {
                "id": "hr_s6_c3",
                "text_en": "Wait until the review ends. Don’t alarm anyone yet.",
                "text_cn": "先观望：等会议结果出来再说，不提前惊动任何人。",
                "tags": [
                  "不扩散",
                  "赌结果"
                ],
                "effects": {
                  "trust": -1,
                  "pressure": -1,
                  "risk": 3
                },
                "key_phrases": [
                  "wait until it’s final"
                ],
                "feedback_cn": "你选择沉默，但沉默本身也会制造剧情后果。",
                "feedback_en": "You contain information — but the candidate won’t wait for your minutes.",
                "next": "hr_s7_c"
              }
            ]
          },
          {
            "id": "hr_s7_a",
            "speaker_cn": "财务负责人（会议）",
            "speaker_en": "Finance Lead (Meeting)",
            "text_en": "Explain why this headcount is urgent. What measurable impact will it deliver in the next two quarters?",
            "text_cn": "说清楚为什么这个 HC 现在必须批。未来两个季度能交付什么可衡量的影响？",
            "choices": [
              {
                "id": "hr_s7_a_c1",
                "text_en": "Anchor on measurable outcomes + guardrails: phase scope, define ownership, and set a probation review checkpoint tied to impact.",
                "text_cn": "锚定可衡量影响和护栏：分阶段 scope、定义 ownership，并把试用期复盘节点绑定到影响力。",
                "tags": [
                  "可衡量",
                  "可复盘",
                  "不夸口"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 1,
                  "risk": -1
                },
                "key_phrases": [
                  "measurable outcomes",
                  "probation review checkpoint"
                ],
                "feedback_cn": "你卖的是机制，不是故事，财务更容易接住。",
                "feedback_en": "You sell mechanisms, not guarantees.",
                "next": "hr_s8"
              },
              {
                "id": "hr_s7_a_c2",
                "text_en": "Guarantee a win: “This hire will definitely close revenue — trust me.”",
                "text_cn": "拍胸脯：这个人一定能带来收入增量，你们相信我。",
                "tags": [
                  "赌徒式承诺",
                  "短期爽但高风险"
                ],
                "effects": {
                  "trust": -2,
                  "pressure": 2,
                  "risk": 4
                },
                "key_phrases": [
                  "I can guarantee"
                ],
                "feedback_cn": "你把叙事当事实，下一秒组织就会向你追责。",
                "feedback_en": "You turn narrative into fact. Finance will demand accountability.",
                "next": "hr_fail_finance_backfire"
              }
            ]
          },
          {
            "id": "hr_s7_b",
            "speaker_cn": "候选人（电话）",
            "speaker_en": "Candidate (Call)",
            "text_en": "I appreciate the transparency. But I need to manage my risk. Is the offer safe, yes or no?",
            "text_cn": "谢谢你坦诚。但我需要控制风险：这个 offer 安全吗？你只需要回答：是，或者不是。",
            "choices": [
              {
                "id": "hr_s7_b_c1",
                "text_en": "I can’t guarantee yet. I’ll confirm by 5pm today. If the timeline doesn’t work for you, we can discuss start date flexibility or a decision checkpoint.",
                "text_cn": "我现在不能保证。但我会在今天 5 点前给你明确结论；如果时间线不适配，我们可以讨论入职日期弹性或一个决策 checkpoint。",
                "tags": [
                  "不撒谎",
                  "给时间点",
                  "给替代方案"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 2,
                  "risk": -1
                },
                "key_phrases": [
                  "I can’t guarantee yet",
                  "start date flexibility",
                  "decision checkpoint"
                ],
                "feedback_cn": "你把不可控说清楚，同时给对方一个还能留在局里的理由。",
                "feedback_en": "You state uncertainty and still give the candidate a plan.",
                "next": "hr_s8"
              },
              {
                "id": "hr_s7_b_c2",
                "text_en": "Yes. It’s safe. Don’t worry.",
                "text_cn": "是的，很安全，你别担心。",
                "tags": [
                  "快速安抚",
                  "风险转移到未来"
                ],
                "effects": {
                  "trust": 1,
                  "pressure": 0,
                  "risk": 3
                },
                "key_phrases": [
                  "don’t worry"
                ],
                "feedback_cn": "这句别担心会在后面变成最贵的台词。",
                "feedback_en": "“Don’t worry” becomes expensive if reality changes.",
                "next": "hr_fail_trust_break"
              }
            ]
          },
          {
            "id": "hr_s7_c",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The review gets delayed twice. The candidate accepts another offer and withdraws. Your inbox shows: “I can’t wait any longer.”",
            "text_cn": "BAD END：HC 复核一拖再拖。候选人接受了另一个 offer 并撤回。你的邮箱只剩一句话：我等不了了。",
            "choices": [
              {
                "id": "hr_s7_c_c1",
                "text_en": "Rewind to before the Headcount Review.",
                "text_cn": "回溯到 HC 复核前。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：候选人不怕不确定，怕你不给时间点。",
                "feedback_en": "Clue: candidates fear silence more than uncertainty.",
                "next": "hr_s6"
              }
            ]
          },
          {
            "id": "hr_fail_finance_backfire",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: Finance asks for a written revenue guarantee. HRBP refuses to back that wording, and the headcount is paused pending “proof”.",
            "text_cn": "BAD END：财务让你写收入保证书。HRBP 不肯为这个口径背书，HC 被暂停，等待“证明”。",
            "choices": [
              {
                "id": "hr_fail_finance_backfire_c1",
                "text_en": "Rewind: rebuild the justification with measurable outcomes and guardrails.",
                "text_cn": "回溯：用可衡量结果和护栏重做 justification。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：财务不吃故事，只吃可审计的机制。",
                "feedback_en": "Clue: Finance buys auditable mechanisms, not stories.",
                "next": "hr_s6"
              }
            ]
          },
          {
            "id": "hr_fail_trust_break",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The review outcome is negative. When you update the candidate, they reply: “So ‘safe’ was a lie.” Trust collapses.",
            "text_cn": "BAD END：会议结果不理想。当你再更新候选人时，对方只回一句：所以你说的“安全”是谎话。信任崩塌。",
            "choices": [
              {
                "id": "hr_fail_trust_break_c1",
                "text_en": "Rewind: be transparent, give a deadline, and offer options.",
                "text_cn": "回溯：用透明、时间点和备选方案修复路线。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：我现在不能保证，比别担心更像真话。",
                "feedback_en": "Clue: “I can’t guarantee yet” beats “don’t worry.”",
                "next": "hr_s6"
              }
            ]
          },
          {
            "id": "hr_s8",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "You survive the review with guardrails. Now you must send one email to the candidate: clear, honest, and forwardable. Before you hit send, a teammate Slacks you: “Their ex-colleague knows about our Q3 re-org rumor.”",
            "text_cn": "你用护栏扛住了复核。现在你要给候选人发一封邮件：清晰、坦诚、可转发。就在点发送前，同事又来一句：对方前同事好像知道我们 Q3 重组传闻。",
            "choices": [
              {
                "id": "hr_s8_c1",
                "text_en": "Send an honest summary yourself: approval status, today’s timeline, and written role boundaries.",
                "text_cn": "你亲自发一封诚实总结：审批状态、今天时间线、以及书面岗位边界。",
                "tags": [
                  "自己控节奏",
                  "先立可信度"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 1,
                  "risk": -1
                },
                "key_phrases": [
                  "approval status",
                  "written role boundaries"
                ],
                "feedback_cn": "你亲自控住叙事，但新的外部消息会很快压上来。",
                "feedback_en": "You control the narrative yourself — for now.",
                "next": "hr_s9_a"
              },
              {
                "id": "hr_s8_c2",
                "text_en": "Ask the hiring manager to send a warm note with team vision, then you’ll follow with process details.",
                "text_cn": "让用人经理先发一封带团队愿景的暖场邮件，你再补流程细节。",
                "tags": [
                  "借人情推进",
                  "容易走偏"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 0,
                  "risk": 1
                },
                "key_phrases": [
                  "team vision",
                  "follow with details"
                ],
                "feedback_cn": "你想用情绪价值推进，但越多人下场，越容易口径漂。",
                "feedback_en": "You use warmth to advance the close, but risk message drift.",
                "next": "hr_s9_b"
              }
            ]
          },
          {
            "id": "hr_s9_a",
            "speaker_cn": "候选人（转发截图）",
            "speaker_en": "Candidate (Forwarded Screenshot)",
            "text_en": "They forward a message from a former colleague: “Heard Northstar may merge this team into Platform Ops next quarter.” Then they ask: “Should I read this as noise?”",
            "text_cn": "对方转来一张截图：听说 Northstar 下季度会把这个团队并进 Platform Ops。然后问你：我应该把这当成噪音吗？",
            "choices": [
              {
                "id": "hr_s9_a_c1",
                "text_en": "Don’t deny what you can’t verify. Confirm today’s reporting line, 90-day goals, and the review checkpoint in writing.",
                "text_cn": "不去否认你无法验证的事，只确认今天的汇报线、90 天目标和复盘节点，并且书面写清楚。",
                "tags": [
                  "不赌谣言",
                  "把今天写实"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "what I can confirm today",
                  "review checkpoint"
                ],
                "feedback_cn": "你不抢答未来，而是把今天写实，这能让剧情继续往深处走。",
                "feedback_en": "You avoid over-answering the future and make today concrete.",
                "next": "hr_s10"
              },
              {
                "id": "hr_s9_a_c2",
                "text_en": "It’s just noise. Ignore it and let’s close today before this gets overthought.",
                "text_cn": "这就是噪音，别管了。我们今天先签，别把事情想复杂。",
                "tags": [
                  "压住情绪",
                  "高反噬"
                ],
                "effects": {
                  "trust": -2,
                  "pressure": 2,
                  "risk": 4
                },
                "key_phrases": [
                  "it’s just noise",
                  "let’s close today"
                ],
                "feedback_cn": "这句会立刻把对方推向“你是不是也在怕”的怀疑。",
                "feedback_en": "You sound like you’re hiding risk rather than managing it.",
                "next": "hr_fail_backchannel"
              }
            ]
          },
          {
            "id": "hr_s9_b",
            "speaker_cn": "用人经理（草稿邮件）",
            "speaker_en": "Hiring Manager (Draft Email)",
            "text_en": "The hiring manager drafts: “You’ll basically own GTM strategy across all three teams, and title growth should be fast once you join.” It’s warm — and dangerously loose.",
            "text_cn": "用人经理起草了一封邮件：你基本会拥有三个团队的 GTM strategy，入职后 title 成长也会很快。这封邮件很热情，但口径危险地松。",
            "choices": [
              {
                "id": "hr_s9_b_c1",
                "text_en": "Edit the note before it goes out: tighten ownership wording, remove implied title promises, add approved boundaries.",
                "text_cn": "先把邮件改掉：收紧 ownership 表述，删掉 title 暗示，补上批准过的边界。",
                "tags": [
                  "修正口径",
                  "先救现场"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "tighten the wording",
                  "approved boundaries"
                ],
                "feedback_cn": "你把情绪价值保留住，同时切掉最容易爆雷的句子。",
                "feedback_en": "You preserve warmth while removing liability.",
                "next": "hr_s10"
              },
              {
                "id": "hr_s9_b_c2",
                "text_en": "Send it as-is. Warmth matters more than precision right now.",
                "text_cn": "原样发出。现在情绪价值比精确更重要。",
                "tags": [
                  "先暖场",
                  "后面再补"
                ],
                "effects": {
                  "trust": 1,
                  "pressure": 0,
                  "risk": 4
                },
                "key_phrases": [
                  "as-is",
                  "warmth matters"
                ],
                "feedback_cn": "你把一个模糊承诺送到了对方收件箱，之后每一次追问都会回来找你。",
                "feedback_en": "You send ambiguity directly into the candidate’s inbox.",
                "next": "hr_fail_internal_contradiction"
              }
            ]
          },
          {
            "id": "hr_fail_backchannel",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The candidate replies, “If it’s ‘just noise,’ why did you avoid answering?” They stop engaging and take the counteroffer call.",
            "text_cn": "BAD END：候选人回你一句：如果只是噪音，你为什么不正面回答？随后对方不再接你的节奏，转去接 counteroffer 电话。",
            "choices": [
              {
                "id": "hr_fail_backchannel_c1",
                "text_en": "Rewind: confirm only what is true today and put it in writing.",
                "text_cn": "回溯：只确认今天为真的内容，并书面写清。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：面对谣言时，最有力的不是否认，而是把今天的事实写实。",
                "feedback_en": "Clue: when rumors appear, concrete present-tense facts beat denial.",
                "next": "hr_s8"
              }
            ]
          },
          {
            "id": "hr_fail_internal_contradiction",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The candidate compares your note with the hiring manager’s draft and asks, “So which version is real?” Internal contradiction breaks the close.",
            "text_cn": "BAD END：候选人把你的邮件和用人经理那封对照后问：那到底哪一个版本才是真的？内部口径不一致，直接打断了签约节奏。",
            "choices": [
              {
                "id": "hr_fail_internal_contradiction_c1",
                "text_en": "Rewind: align one approved narrative before anyone sends anything.",
                "text_cn": "回溯：在任何人发邮件前，先对齐唯一口径。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：短剧最抓人的不是坏人，是内部说法不一致。",
                "feedback_en": "Clue: internal contradiction is often more damaging than external doubt.",
                "next": "hr_s8"
              }
            ]
          },
          {
            "id": "hr_s10",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "New turn: Finance says the role can proceed, but only if the start date shifts by two weeks. At the same time, the candidate mentions a counteroffer with an earlier start and more title upside.",
            "text_cn": "新一轮反转：财务说这个岗位还能继续，但前提是入职日期往后顺延两周。与此同时，候选人提到另一边给了更早入职和更高 title 的 counteroffer。",
            "choices": [
              {
                "id": "hr_s10_c1",
                "text_en": "Be direct: explain the two-week delay, offer written guardrails, and frame the decision around role clarity instead of title heat.",
                "text_cn": "直接说清两周延迟，给出书面护栏，并把决策重点拉回岗位清晰度，而不是 title 热度。",
                "tags": [
                  "说实话",
                  "回到核心价值"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "written guardrails",
                  "role clarity"
                ],
                "feedback_cn": "你把剧情从情绪拉回结构，这是长故事线能继续成立的关键。",
                "feedback_en": "You pull the decision back from hype to structure.",
                "next": "hr_s11_a"
              },
              {
                "id": "hr_s10_c2",
                "text_en": "Push for a fast signature first. Details like start date can be smoothed out once they commit.",
                "text_cn": "先冲签字。像入职日期这种细节，等对方答应后再慢慢磨。",
                "tags": [
                  "先锁人",
                  "高压推进"
                ],
                "effects": {
                  "trust": -1,
                  "pressure": 3,
                  "risk": 3
                },
                "key_phrases": [
                  "once they commit",
                  "smooth it out later"
                ],
                "feedback_cn": "这能暂时提速，但会把后面所有风险集中爆出来。",
                "feedback_en": "You buy speed now by stacking risk later.",
                "next": "hr_s11_b"
              },
              {
                "id": "hr_s10_c3",
                "text_en": "Hide the date shift until they verbally accept. No need to spook them early.",
                "text_cn": "先不提日期顺延，等对方口头接受后再说，免得先把人吓跑。",
                "tags": [
                  "遮掩",
                  "最危险"
                ],
                "effects": {
                  "trust": -2,
                  "pressure": 1,
                  "risk": 5
                },
                "key_phrases": [
                  "no need to spook them"
                ],
                "feedback_cn": "你把隐藏信息变成了即将爆炸的雷。",
                "feedback_en": "You turn withheld information into a future detonation.",
                "next": "hr_fail_delay_coverup"
              }
            ]
          },
          {
            "id": "hr_fail_delay_coverup",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The candidate learns about the delayed start from HR Ops paperwork instead of you. They reply: “If this was hidden, what else is?”",
            "text_cn": "BAD END：候选人不是从你这里，而是从 HR Ops 流程邮件里看到入职顺延。对方只回一句：如果这个都要藏，那还有什么是真的？",
            "choices": [
              {
                "id": "hr_fail_delay_coverup_c1",
                "text_en": "Rewind: bring the bad news yourself and add guardrails.",
                "text_cn": "回溯：坏消息必须由你亲自说，并且同时给护栏。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：真正毁掉交易的常常不是坏消息，而是坏消息不是你说的。",
                "feedback_en": "Clue: bad news hurts less than second-hand bad news.",
                "next": "hr_s10"
              }
            ]
          },
          {
            "id": "hr_s11_a",
            "speaker_cn": "候选人（电话）",
            "speaker_en": "Candidate (Call)",
            "text_en": "I can live with a delay if I trust the role. One last question: if the Q3 re-org happens, what changes for me on day one?",
            "text_cn": "如果我信这个岗位，两周延迟我可以接受。但我还有最后一个问题：如果 Q3 重组真的发生，我入职第一天会有什么变化？",
            "choices": [
              {
                "id": "hr_s11_a_c1",
                "text_en": "I can’t predict structure, but I can put day-one reporting line, 90-day goals, and a re-org review checkpoint in writing.",
                "text_cn": "我不能预测组织结构，但我可以把你 day one 的汇报线、90 天目标和重组复盘节点写下来。",
                "tags": [
                  "不装全知",
                  "把边界写清"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "day-one reporting line",
                  "re-org review checkpoint"
                ],
                "feedback_cn": "你没有装作全知，而是给出“即使变化也能对齐”的机制。",
                "feedback_en": "You offer a mechanism for change instead of pretending certainty.",
                "next": "hr_s12"
              },
              {
                "id": "hr_s11_a_c2",
                "text_en": "Nothing will change. You have my word.",
                "text_cn": "不会有任何变化，你放心，我给你保证。",
                "tags": [
                  "硬保",
                  "谎言成本"
                ],
                "effects": {
                  "trust": 1,
                  "pressure": 0,
                  "risk": 4
                },
                "key_phrases": [
                  "you have my word"
                ],
                "feedback_cn": "这种句子听起来最有安全感，也最容易变成翻车证据。",
                "feedback_en": "This sounds comforting — and creates future liability.",
                "next": "hr_fail_reorg_lie"
              }
            ]
          },
          {
            "id": "hr_fail_reorg_lie",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: A week later, the re-org rumor becomes a draft org chart. Your guarantee comes back as a screenshot. The candidate walks.",
            "text_cn": "BAD END：一周后，重组传闻变成了组织架构草图。你那句“不会有变化”被截图翻出来，候选人直接走人。",
            "choices": [
              {
                "id": "hr_fail_reorg_lie_c1",
                "text_en": "Rewind: don’t promise a frozen future — promise a review mechanism.",
                "text_cn": "回溯：不要承诺未来静止不变，而要承诺变化后的复盘机制。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：真正让人安心的，不是你说不会变，而是变了以后怎么办。",
                "feedback_en": "Clue: people trust plans for change more than denial of change.",
                "next": "hr_s11_a"
              }
            ]
          },
          {
            "id": "hr_s11_b",
            "speaker_cn": "候选人（邮件）",
            "speaker_en": "Candidate (Email)",
            "text_en": "I feel like every answer is trying to speed me up. If I sign tonight, what exactly is locked and what is still pending?",
            "text_cn": "我感觉你每个回答都在催我快点决定。如果我今晚签，到底什么是锁定的，什么还在 pending？",
            "choices": [
              {
                "id": "hr_s11_b_c1",
                "text_en": "Reset the pace. Send a side-by-side breakdown: locked terms, pending items, and what you’ll confirm by when.",
                "text_cn": "把节奏重新放稳。发一份对照表：哪些已锁定、哪些还 pending、每一项你会在什么时候确认。",
                "tags": [
                  "刹车",
                  "恢复秩序"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": -1,
                  "risk": -2
                },
                "key_phrases": [
                  "side-by-side breakdown",
                  "what’s locked",
                  "what’s pending"
                ],
                "feedback_cn": "你愿意踩刹车，反而会重新赢回控制权。",
                "feedback_en": "Slowing down can restore control and trust.",
                "next": "hr_s12"
              },
              {
                "id": "hr_s11_b_c2",
                "text_en": "Push through: “If you need total certainty, we may lose the slot.”",
                "text_cn": "继续施压：如果你要完全确定，我们可能就会错过这个 slot。",
                "tags": [
                  "施压",
                  "赌对方怕失去"
                ],
                "effects": {
                  "trust": -3,
                  "pressure": 3,
                  "risk": 3
                },
                "key_phrases": [
                  "lose the slot"
                ],
                "feedback_cn": "你把最后的信任筹码也压到了威胁上。",
                "feedback_en": "You trade the last remaining trust for urgency.",
                "next": "hr_fail_counteroffer"
              }
            ]
          },
          {
            "id": "hr_fail_counteroffer",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The candidate accepts the counteroffer. Their final note says, “I wasn’t choosing the biggest title. I was choosing the cleaner truth.”",
            "text_cn": "BAD END：候选人接受了 counteroffer。对方最后一句话是：我不是选了更大的 title，我是选了更干净的真话。",
            "choices": [
              {
                "id": "hr_fail_counteroffer_c1",
                "text_en": "Rewind: slow down, separate locked terms from pending items, and remove pressure theatrics.",
                "text_cn": "回溯：放慢一点，把已锁定和待确认拆开，不要再演强压节奏。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：对方未必想要更大的饼，往往只是想要更干净的边界。",
                "feedback_en": "Clue: candidates often choose cleaner truth over bigger promises.",
                "next": "hr_s10"
              }
            ]
          },
          {
            "id": "hr_s12",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "Final turn: you send a clean close package — reporting line, role boundaries, start-date guardrails, and review checkpoints. The candidate replies: “This is the first answer today that feels stable.”",
            "text_cn": "最终回合：你发出一份干净的 closing package：汇报线、岗位边界、入职日期护栏和复盘节点。候选人回复：这是我今天第一次觉得稳定的一封信。",
            "choices": [
              {
                "id": "hr_s12_c1",
                "text_en": "End chapter and review key phrases.",
                "text_cn": "结束本章并复盘关键表达。",
                "tags": [
                  "复盘"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [
                  "ownership map",
                  "headcount justification",
                  "I can’t guarantee yet",
                  "written guardrails",
                  "approval status",
                  "day-one reporting line",
                  "what’s locked",
                  "what’s pending"
                ],
                "feedback_cn": "这一整章的核心不是说服，而是把不确定性翻译成边界、文件和时间点。越到后面，越像短剧：不是你知道得更多，而是你能不能稳住叙事。",
                "feedback_en": "HR Chapter complete: you translated uncertainty into boundaries, documents, and timelines.",
                "next": "END"
              },
              {
                "id": "hr_s12_c2",
                "text_en": "Replay from the re-org rumor branch.",
                "text_cn": "从重组传闻分支回溯重玩。",
                "tags": [
                  "重玩"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "这一章里每个坏结局都在教你一句更稳的真话。",
                "feedback_en": "Every bad ending in this chapter teaches a sturdier line.",
                "next": "hr_s8"
              }
            ]
          }
        ]
      }
    },
    {
      "id": "pm",
      "name_cn": "产品经理线",
      "name_en": "Product Manager Line",
      "chapter": {
        "id": "pm_ch1",
        "title_cn": "第一章：上线前夜 · 战情室",
        "title_en": "Chapter 1: War Room at Midnight",
        "start_scene": "pm_s1",
        "scenes": [
          {
            "id": "pm_s1",
            "speaker_cn": "销售负责人（群聊）",
            "speaker_en": "Sales Lead (Chat)",
            "text_en": "We promised Client A a “data retention toggle” in tomorrow’s demo. They’re asking for it tonight. Can we ship it?",
            "text_cn": "我们已经对客户 A 承诺了明天 Demo 要有“数据保留开关”。他们今晚追问，能不能上？",
            "choices": [
              {
                "id": "pm_s1_c1",
                "text_en": "Before we ship, tell me the demo flow and what the client will consider a “pass”. I’ll propose an MVP in 30 minutes.",
                "text_cn": "在上之前先把 Demo 流程和什么算过关说清楚。我 30 分钟内给一个 MVP 方案。",
                "tags": [
                  "先定义过关",
                  "给时限承诺"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 3,
                  "risk": -1
                },
                "key_phrases": [
                  "what counts as a pass",
                  "propose an MVP"
                ],
                "feedback_cn": "你先拿住验收标准，这能让后面的每次加码都更有逻辑。",
                "feedback_en": "You control the definition of success before committing to scope.",
                "next": "pm_s2_a"
              },
              {
                "id": "pm_s1_c2",
                "text_en": "We’ll make it happen — but only behind a flag and only for the demo tenant. I’ll align with Eng now.",
                "text_cn": "可以做，但只放在 feature flag 后面，而且只对 demo tenant 生效。我现在去和技术对齐。",
                "tags": [
                  "先答应",
                  "立刻收边界"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 2,
                  "risk": -1
                },
                "key_phrases": [
                  "behind a flag",
                  "demo tenant"
                ],
                "feedback_cn": "你先给 yes，再往回收，这种节奏最容易让人继续点下去。",
                "feedback_en": "You lead with yes, then narrow the scope.",
                "next": "pm_s2_b"
              },
              {
                "id": "pm_s1_c3",
                "text_en": "If the client only needs the story, we can simulate the flow and position real enforcement as post-demo rollout.",
                "text_cn": "如果客户只需要看故事，我们可以先模拟流程，把真实执行定位成 demo 之后的 rollout。",
                "tags": [
                  "叙事先行",
                  "工作流替代"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "simulate the flow",
                  "post-demo rollout"
                ],
                "feedback_cn": "你走的是剧情包装路线，后面会不断考验你口径能不能自洽。",
                "feedback_en": "You’re choosing a narrative-first route.",
                "next": "pm_s2_c"
              }
            ]
          },
          {
            "id": "pm_s2_a",
            "speaker_cn": "销售负责人（回复）",
            "speaker_en": "Sales Lead (Reply)",
            "text_en": "Pass means the client sees the toggle, changes a setting, and believes Legal won’t block rollout later.",
            "text_cn": "所谓过关，就是客户要看到开关、改一个设置，并且相信法务以后不会卡 rollout。",
            "choices": [
              {
                "id": "pm_s2_a_c1",
                "text_en": "Enter the war room and split demo behavior from production behavior.",
                "text_cn": "进入战情室，把 demo 行为和生产行为切开。",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "你已经看出问题核心不在功能本身，而在“相信”。",
                "feedback_en": "You move into the war room with the real problem defined.",
                "next": "pm_s3"
              }
            ]
          },
          {
            "id": "pm_s2_b",
            "speaker_cn": "技术负责人（回复）",
            "speaker_en": "Eng Lead (Reply)",
            "text_en": "Flag is possible, but if Sales says “it works in prod,” Security will ask what exactly is enforced.",
            "text_cn": "feature flag 能做，但如果销售敢说“生产可用”，Security 一定会追问到底执行了什么。",
            "choices": [
              {
                "id": "pm_s2_b_c1",
                "text_en": "Enter the war room and define what is real, what is visual, and what is pending.",
                "text_cn": "进入战情室，先定义什么是真的、什么只是展示、什么还在 pending。",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "你把剧情拉进了最典型的产品战场：现实、叙事和销售话术三线拉扯。",
                "feedback_en": "You’re entering the classic PM triangle: reality, narrative, and sales pressure.",
                "next": "pm_s3"
              }
            ]
          },
          {
            "id": "pm_s2_c",
            "speaker_cn": "客户成功（私聊）",
            "speaker_en": "Customer Success (DM)",
            "text_en": "If this is mostly a story, I need exact words for tomorrow. The client’s compliance lead will be in the room.",
            "text_cn": "如果这更多是个故事，我明天就必须拿到准确话术。客户的合规负责人会在现场。",
            "choices": [
              {
                "id": "pm_s2_c_c1",
                "text_en": "Enter the war room and build a script that won’t collapse under questions.",
                "text_cn": "进入战情室，做一套经得住追问的话术。",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "你看到的已经不是 demo，而是一场需要剧本的表演。",
                "feedback_en": "You realize tomorrow is a performance that needs a script.",
                "next": "pm_s3"
              }
            ]
          },
          {
            "id": "pm_s3",
            "speaker_cn": "战情室（你）",
            "speaker_en": "War Room (You)",
            "text_en": "Eng, QA, Security, and Sales join. You have 45 minutes. What can we demo tomorrow without creating audit or compliance debt?",
            "text_cn": "技术、QA、安全、销售都进了战情室。你只有 45 分钟：明天 Demo 能演示什么，且不留下审计或合规的债？",
            "choices": [
              {
                "id": "pm_s3_c1",
                "text_en": "Demo-safe MVP: the toggle changes UI and writes an audit event; real retention change is deferred behind an approval workflow.",
                "text_cn": "Demo 安全 MVP：开关只改 UI 并写入审计事件；真实 retention 变更放到审批流之后。",
                "tags": [
                  "演示成立",
                  "合规可控"
                ],
                "effects": {
                  "trust": 5,
                  "pressure": 2,
                  "risk": -2
                },
                "key_phrases": [
                  "audit event",
                  "approval workflow"
                ],
                "feedback_cn": "这是最稳的产品解，但接下来你要把它翻译成一句销售能发的话。",
                "feedback_en": "Audit events plus approvals keep compliance happy while keeping the demo believable.",
                "next": "pm_s4_a"
              },
              {
                "id": "pm_s3_c2",
                "text_en": "Ship nothing new: use mocked data and say the feature is in pilot, with rollout after compliance review.",
                "text_cn": "不发新功能：用 mock 数据做 Demo，并明确功能还在 pilot，需合规复核后 rollout。",
                "tags": [
                  "叙事过关",
                  "不欠技术债"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -4
                },
                "key_phrases": [
                  "in pilot",
                  "rollout after review"
                ],
                "feedback_cn": "你用剧本替代功能，后面的悬念就会转移到“人会不会加戏”。",
                "feedback_en": "You avoid debt but rely on a strong demo narrative.",
                "next": "pm_s4_b"
              }
            ]
          },
          {
            "id": "pm_s4_a",
            "speaker_cn": "销售负责人（私信）",
            "speaker_en": "Sales Lead (DM)",
            "text_en": "If we say “approval workflow,” will the client feel blocked? I need a one-liner I can send now.",
            "text_cn": "如果我们说审批流，客户会不会觉得被卡？我需要一句现在就能发的话。",
            "choices": [
              {
                "id": "pm_s4_a_c1",
                "text_en": "Tell them: “Available in demo tenant; production rollout follows compliance sign-off.”",
                "text_cn": "发给客户：开关在 demo tenant 可用；生产 rollout 会在合规签字后进行。",
                "tags": [
                  "一句话可转发",
                  "不失体面"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "demo tenant",
                  "compliance sign-off"
                ],
                "feedback_cn": "可转发、可解释、留后路，这种一句话是剧情推进器。",
                "feedback_en": "Forwardable, explainable, and leaves room for reality.",
                "next": "pm_s5"
              },
              {
                "id": "pm_s4_a_c2",
                "text_en": "Tell them: “You’ll see the end-to-end flow tomorrow; enforcement details are being finalized with Security.”",
                "text_cn": "发给客户：明天你能看到端到端流程；策略执行细节正在和安全最终确认。",
                "tags": [
                  "更偏销售话术",
                  "留技术空间"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 0,
                  "risk": -1
                },
                "key_phrases": [
                  "end-to-end flow",
                  "being finalized"
                ],
                "feedback_cn": "更会卖，但也更依赖现场表演不能失手。",
                "feedback_en": "More sales-friendly, but depends on demo execution.",
                "next": "pm_s5"
              }
            ]
          },
          {
            "id": "pm_s4_b",
            "speaker_cn": "技术负责人（私信）",
            "speaker_en": "Eng Lead (DM)",
            "text_en": "If we go mock-only, Sales might oversell. Are you ready to own the wording and follow-up plan?",
            "text_cn": "如果只做 mock，销售可能会过度承诺。你能不能扛住话术并把 follow-up 计划写清楚？",
            "choices": [
              {
                "id": "pm_s4_b_c1",
                "text_en": "Yes. I’ll write the client message and internal follow-up tasks tonight.",
                "text_cn": "可以。我今晚把对客消息和内部 follow-up 任务写出来。",
                "tags": [
                  "扛责任",
                  "写清后续"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 2,
                  "risk": -1
                },
                "key_phrases": [
                  "follow-up tasks"
                ],
                "feedback_cn": "你把风险从代码转成沟通清晰度，这就是 PM 的另一种兜底。",
                "feedback_en": "You shift risk from engineering to communication clarity.",
                "next": "pm_s5"
              },
              {
                "id": "pm_s4_b_c2",
                "text_en": "No. Switch to the demo-safe MVP with audit events — it’s shippable and less ambiguous.",
                "text_cn": "不行。改成 Demo 安全 MVP 加审计事件吧，可交付而且更不含糊。",
                "tags": [
                  "改道",
                  "降低歧义"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "less ambiguous"
                ],
                "feedback_cn": "你在最后一分钟换轨，这会让后面再多一个新的火点。",
                "feedback_en": "You reduce ambiguity, but must realign Sales quickly.",
                "next": "pm_s5"
              }
            ]
          },
          {
            "id": "pm_s5",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "Cliffhanger: the demo is tomorrow at 9AM. Slack explodes: “Legal needs a statement on retention claims tonight.”",
            "text_cn": "悬念：明早 9 点 Demo。Slack 又炸了：法务今晚就要 retention 对外表述声明。",
            "choices": [
              {
                "id": "pm_s5_c1",
                "text_en": "Continue: draft the Legal statement.",
                "text_cn": "继续：进入《法务声明》。",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 2,
                  "risk": 1
                },
                "key_phrases": [
                  "legal statement"
                ],
                "feedback_cn": "第一幕从产品方案切到对外口径，戏剧张力一下抬上来了。",
                "feedback_en": "You move from demo scope to external claims.",
                "next": "pm_s6"
              },
              {
                "id": "pm_s5_c2",
                "text_en": "Replay from the beginning.",
                "text_cn": "从头重玩（换一条路线）。",
                "tags": [
                  "重玩"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "不同路线会决定你后面是在写声明，还是在连夜灭火。",
                "feedback_en": "Different routes decide whether you’ll draft or firefight later.",
                "next": "pm_s1"
              }
            ]
          },
          {
            "id": "pm_s6",
            "speaker_cn": "法务（Slack）",
            "speaker_en": "Legal (Slack)",
            "text_en": "We need a statement tonight. You cannot claim “data is deleted in 7 days” unless it’s actually enforced. What exactly will the demo do?",
            "text_cn": "今晚要出声明。你们不能对外说 7 天删除，除非真的执行。明天 Demo 到底会做什么？",
            "choices": [
              {
                "id": "pm_s6_c1",
                "text_en": "Draft a conservative statement: “The demo shows the configuration flow; enforcement follows compliance sign-off.”",
                "text_cn": "先写保守声明：Demo 展示配置流程；策略执行将在合规签字后落地。",
                "tags": [
                  "先保合规",
                  "可转发"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 2,
                  "risk": -2
                },
                "key_phrases": [
                  "configuration flow",
                  "compliance sign-off"
                ],
                "feedback_cn": "你把能演示和能宣称切开了，不够爽，但很保命。",
                "feedback_en": "You separate demo behavior from real-world enforcement.",
                "next": "pm_s7_a"
              },
              {
                "id": "pm_s6_c2",
                "text_en": "Ask Legal for approved language and redlines, then align Sales on what they can forward.",
                "text_cn": "让法务给 approved language 和 redlines，再去对齐销售可转述的话术。",
                "tags": [
                  "借权威",
                  "减少歧义"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 3,
                  "risk": -1
                },
                "key_phrases": [
                  "approved language",
                  "redlines"
                ],
                "feedback_cn": "你借法务权威换统一口径，但会马上招来销售的不耐烦。",
                "feedback_en": "You borrow Legal’s authority for consistency.",
                "next": "pm_s7_b"
              },
              {
                "id": "pm_s6_c3",
                "text_en": "Push Eng for a minimal backend guardrail tonight so the claim becomes partially true.",
                "text_cn": "反向推进：逼技术今晚做一个最小后端护栏，让表述至少部分为真。",
                "tags": [
                  "硬刚现实",
                  "高压力"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 5,
                  "risk": 1
                },
                "key_phrases": [
                  "minimal backend change",
                  "stop-ship"
                ],
                "feedback_cn": "这条线最像影游硬核分支：要么你今晚救产品，要么把团队拖进 stop-ship。",
                "feedback_en": "High-stakes branch: save the product or burn the team.",
                "next": "pm_s7_c"
              }
            ]
          },
          {
            "id": "pm_s7_a",
            "speaker_cn": "销售负责人（私信）",
            "speaker_en": "Sales Lead (DM)",
            "text_en": "Can I tell the client: “You can switch retention to 7 days tomorrow”?",
            "text_cn": "我能不能直接跟客户说：你明天就能把保留期切到 7 天？",
            "choices": [
              {
                "id": "pm_s7_a_c1",
                "text_en": "No. Say: “You’ll see the configuration flow; enforcement follows review.”",
                "text_cn": "不行。你发：你会看到配置流程；策略执行在复核后落地。",
                "tags": [
                  "守边界",
                  "不许加戏"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "you’ll see the flow",
                  "follows review"
                ],
                "feedback_cn": "你把一句很爽的话，改成了一句能兑现的话。",
                "feedback_en": "You turn a hype line into a deliverable line.",
                "next": "pm_s8"
              },
              {
                "id": "pm_s7_a_c2",
                "text_en": "Yes, send it. We’ll figure it out later.",
                "text_cn": "可以，先发出去，后面再想办法。",
                "tags": [
                  "先爽后付账",
                  "高风险"
                ],
                "effects": {
                  "trust": -2,
                  "pressure": 0,
                  "risk": 4
                },
                "key_phrases": [
                  "figure it out later"
                ],
                "feedback_cn": "你把债写进了明天早上的现场。",
                "feedback_en": "You write debt into tomorrow’s demo.",
                "next": "pm_fail_legal_blowup"
              }
            ]
          },
          {
            "id": "pm_s7_b",
            "speaker_cn": "法务（回复）",
            "speaker_en": "Legal (Reply)",
            "text_en": "Here are the redlines. Remove any implication of deletion. Use “configuration” and “subject to review.”",
            "text_cn": "红线如下：删掉任何删除暗示。统一用“配置”和“需复核后执行”。",
            "choices": [
              {
                "id": "pm_s7_b_c1",
                "text_en": "Use Legal’s text. Add a short appendix for Sales: what to say and what not to say.",
                "text_cn": "按法务文本发，同时给销售补一个附录：可说和不可说。",
                "tags": [
                  "统一口径",
                  "可转述"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 2,
                  "risk": -1
                },
                "key_phrases": [
                  "what to say",
                  "what not to say"
                ],
                "feedback_cn": "你把合规变成了一份能执行的剧本。",
                "feedback_en": "You turn compliance into a script.",
                "next": "pm_s8"
              },
              {
                "id": "pm_s7_b_c2",
                "text_en": "Ignore the redlines and rewrite it aggressively to help Sales close.",
                "text_cn": "无视红线，改得更激进一点给销售好卖。",
                "tags": [
                  "对赌",
                  "会被反噬"
                ],
                "effects": {
                  "trust": -3,
                  "pressure": 1,
                  "risk": 5
                },
                "key_phrases": [
                  "help Sales close"
                ],
                "feedback_cn": "这不是写文案，是在签责任。",
                "feedback_en": "This isn’t copywriting — it’s liability.",
                "next": "pm_fail_stopship"
              }
            ]
          },
          {
            "id": "pm_s7_c",
            "speaker_cn": "技术负责人（回复）",
            "speaker_en": "Eng Lead (Reply)",
            "text_en": "We can store the retention config and write audit events tonight. No deletion. But if Legal wants enforcement, that’s a stop-ship topic.",
            "text_cn": "今晚能做：存配置并写审计事件，不做删除。但如果法务要真实执行，那就是 stop-ship 级别。",
            "choices": [
              {
                "id": "pm_s7_c_c1",
                "text_en": "Ship config plus audit events and update the statement to match reality.",
                "text_cn": "上线配置加审计事件，并把声明写到完全符合现实。",
                "tags": [
                  "对齐现实",
                  "可审计"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 4,
                  "risk": -1
                },
                "key_phrases": [
                  "audit events",
                  "match reality"
                ],
                "feedback_cn": "你用最小真实能力，换来最大的口径安全。",
                "feedback_en": "You minimize claim risk by shipping the smallest real capability.",
                "next": "pm_s8"
              },
              {
                "id": "pm_s7_c_c2",
                "text_en": "Too risky. Revert to mock narrative and tighten Sales scripting.",
                "text_cn": "太冒险。回到 mock 叙事，把销售话术锁死。",
                "tags": [
                  "稳妥",
                  "靠剧本"
                ],
                "effects": {
                  "trust": 2,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "tighten the script"
                ],
                "feedback_cn": "你用剧本替代功能，后面就会开始考验表演能否撑住追问。",
                "feedback_en": "You trade features for script discipline.",
                "next": "pm_s8"
              }
            ]
          },
          {
            "id": "pm_fail_legal_blowup",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: The client forwards your claim to their compliance team. Legal replies in all caps: “STOP. DO NOT CLAIM DELETION.” Demo is at risk.",
            "text_cn": "BAD END：客户把你的表述转给他们合规团队。法务全大写回复：停止。不得宣称删除。Demo 直接面临翻车。",
            "choices": [
              {
                "id": "pm_fail_legal_blowup_c1",
                "text_en": "Rewind: separate configuration from enforcement and script Sales.",
                "text_cn": "回溯：把配置和执行切开，并锁死销售话术。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：能演示，不等于能宣称。",
                "feedback_en": "Clue: demo behavior does not equal claimable behavior.",
                "next": "pm_s6"
              }
            ]
          },
          {
            "id": "pm_fail_stopship",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: Legal escalates to leadership. Security says “stop-ship.” The demo is paused until claims are corrected.",
            "text_cn": "BAD END：法务向上升级。安全给出 stop-ship。Demo 被暂停，直到口径纠正。",
            "choices": [
              {
                "id": "pm_fail_stopship_c1",
                "text_en": "Rewind: use approved language and keep Sales forwardable but safe.",
                "text_cn": "回溯：用 approved language，把可转述和安全同时做到。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：一条好卖的句子，如果不可审计，就等于不可用。",
                "feedback_en": "Clue: if it’s not auditable, it’s not usable.",
                "next": "pm_s6"
              }
            ]
          },
          {
            "id": "pm_s8",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "You align Legal, Sales, and Eng on a single truthful statement. The demo survives — for now. Then Client A asks for a written guarantee of rollout timing.",
            "text_cn": "你把法务、销售、技术的口径对齐到一句真实的话。Demo 暂时活下来了。紧接着客户又来一句：我们要一个 rollout 时间的书面保证。",
            "choices": [
              {
                "id": "pm_s8_c1",
                "text_en": "Continue: draft the guarantee response.",
                "text_cn": "继续：进入《书面保证》。",
                "tags": [
                  "继续"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 2,
                  "risk": 1
                },
                "key_phrases": [
                  "written guarantee"
                ],
                "feedback_cn": "第二幕还没喘口气，第三幕就把你拖进更硬的承诺问题里。",
                "feedback_en": "You move from truthful claims to pressure for guarantees.",
                "next": "pm_s9"
              },
              {
                "id": "pm_s8_c2",
                "text_en": "Replay from the Legal statement.",
                "text_cn": "从《法务声明》回溯重玩。",
                "tags": [
                  "重玩"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "前两幕的每一种处理方式，都会决定你在第三幕有没有余地。",
                "feedback_en": "Your room to maneuver in Act 3 depends on how you handled Act 2.",
                "next": "pm_s6"
              }
            ]
          },
          {
            "id": "pm_s9",
            "speaker_cn": "客户成功（私信）",
            "speaker_en": "Customer Success (DM)",
            "text_en": "Client A wants a written note they can forward internally: rollout timing, dependencies, and whether Security is aligned. Sales wants something bold. Legal wants something survivable.",
            "text_cn": "客户成功私信你：客户要一封可以内部转发的书面说明，包含 rollout 时间、依赖项，以及 Security 是否已经对齐。销售想要一句更猛的话，法务想要一句活得下来的话。",
            "choices": [
              {
                "id": "pm_s9_c1",
                "text_en": "Write a non-guarantee note with milestones, owners, dependencies, and explicit review gates.",
                "text_cn": "写一封非保证式说明：里程碑、owner、依赖项，以及明确的 review gate。",
                "tags": [
                  "给结构",
                  "不给虚假承诺"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 2,
                  "risk": -2
                },
                "key_phrases": [
                  "milestones",
                  "dependencies",
                  "review gates"
                ],
                "feedback_cn": "你把保证书改成路线图，这能继续推进剧情而不立刻炸。",
                "feedback_en": "You turn a guarantee request into a roadmap response.",
                "next": "pm_s10_a"
              },
              {
                "id": "pm_s9_c2",
                "text_en": "Let Sales send an optimistic note first. You can correct the technical details tomorrow.",
                "text_cn": "先让销售发一版乐观说明，技术细节明天现场再补。",
                "tags": [
                  "先成交",
                  "明天再补"
                ],
                "effects": {
                  "trust": -1,
                  "pressure": 1,
                  "risk": 4
                },
                "key_phrases": [
                  "optimistic note",
                  "correct it tomorrow"
                ],
                "feedback_cn": "你把今天的风险外包给了明天的现场。",
                "feedback_en": "You outsource today’s risk to tomorrow’s live demo.",
                "next": "pm_fail_guarantee"
              },
              {
                "id": "pm_s9_c3",
                "text_en": "Get a readiness matrix from Eng and Security first, then write the note from that source of truth.",
                "text_cn": "先找技术和安全拉一张 readiness matrix，再根据这份事实底稿写说明。",
                "tags": [
                  "先拿底稿",
                  "压住口径漂移"
                ],
                "effects": {
                  "trust": 3,
                  "pressure": 3,
                  "risk": -1
                },
                "key_phrases": [
                  "readiness matrix",
                  "source of truth"
                ],
                "feedback_cn": "你先求真，再求会卖，这条线更稳，但节奏更紧。",
                "feedback_en": "You choose truth-first under heavy time pressure.",
                "next": "pm_s10_b"
              }
            ]
          },
          {
            "id": "pm_fail_guarantee",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: Sales’ note gets forwarded to the client’s security reviewer, who highlights three unsupported claims. The guarantee request turns into an escalation call.",
            "text_cn": "BAD END：销售那封乐观说明被直接转发给客户安全评审，里面三句没依据的话都被标红。原本的保证请求，直接升级成质询电话。",
            "choices": [
              {
                "id": "pm_fail_guarantee_c1",
                "text_en": "Rewind: answer the guarantee request with milestones and gates, not hope.",
                "text_cn": "回溯：面对保证请求，给里程碑和 gate，不要给希望感。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：客户要的未必是豪言壮语，很多时候只是能转发的结构。",
                "feedback_en": "Clue: forwardable structure beats optimistic phrasing.",
                "next": "pm_s9"
              }
            ]
          },
          {
            "id": "pm_s10_a",
            "speaker_cn": "安全负责人（评论）",
            "speaker_en": "Security Lead (Comment)",
            "text_en": "Your note is better, but the timeline still implies enforcement certainty. Replace dates with readiness criteria or I won’t sign off.",
            "text_cn": "安全负责人评论：这封说明比之前好了，但时间表仍然暗示了确定执行。要么换成 readiness criteria，要么我不会签字。",
            "choices": [
              {
                "id": "pm_s10_a_c1",
                "text_en": "Replace the date promise with readiness criteria, pilot scope, and explicit sign-off steps.",
                "text_cn": "把日期保证改成 readiness criteria、pilot 范围和明确签字步骤。",
                "tags": [
                  "移除假确定性",
                  "让条件说话"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "readiness criteria",
                  "pilot scope",
                  "sign-off steps"
                ],
                "feedback_cn": "你把时间神话拆掉，换成条件逻辑，剧情继续往现场追问推进。",
                "feedback_en": "You replace false certainty with conditional truth.",
                "next": "pm_s11"
              },
              {
                "id": "pm_s10_a_c2",
                "text_en": "Keep the aggressive date. Sales needs momentum more than perfect wording.",
                "text_cn": "保留激进日期。销售现在需要 momentum，没空追求完美措辞。",
                "tags": [
                  "给销售冲劲",
                  "高风险"
                ],
                "effects": {
                  "trust": -2,
                  "pressure": 2,
                  "risk": 4
                },
                "key_phrases": [
                  "needs momentum"
                ],
                "feedback_cn": "你把组织分歧硬压过去，接下来很可能迎来更大的升级。",
                "feedback_en": "You suppress disagreement instead of resolving it.",
                "next": "pm_fail_security_escalation"
              }
            ]
          },
          {
            "id": "pm_fail_security_escalation",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: Security forwards your note to leadership: “PM is committing to enforcement without technical basis.” The demo remains on the calendar, but trust inside the company breaks.",
            "text_cn": "BAD END：安全团队把你的说明转给管理层：PM 在没有技术依据的情况下承诺执行能力。Demo 虽然还在日程上，但公司内部信任先炸了。",
            "choices": [
              {
                "id": "pm_fail_security_escalation_c1",
                "text_en": "Rewind: swap fixed dates for readiness criteria and sign-off gates.",
                "text_cn": "回溯：把固定日期换成 readiness criteria 和 sign-off gate。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：对外的豪言，常常先伤到内部协作。",
                "feedback_en": "Clue: external overpromises usually damage internal trust first.",
                "next": "pm_s9"
              }
            ]
          },
          {
            "id": "pm_s10_b",
            "speaker_cn": "战情室（深夜排练）",
            "speaker_en": "War Room (Late Rehearsal)",
            "text_en": "Eng and Security give you a readiness matrix. Then Customer Success says, “Tomorrow’s script still sounds like deletion, not configuration.”",
            "text_cn": "技术和安全给了你 readiness matrix。可紧接着客户成功又说：明天的演示词听起来还是像删除，不像配置。",
            "choices": [
              {
                "id": "pm_s10_b_c1",
                "text_en": "Run a full late-night rehearsal and lock the script, FAQ, and escalation answers before anyone sleeps.",
                "text_cn": "连夜做完整排练，把 script、FAQ 和升级问题答案全锁死后再睡。",
                "tags": [
                  "彻底排练",
                  "压住表演风险"
                ],
                "effects": {
                  "trust": 4,
                  "pressure": 4,
                  "risk": -1
                },
                "key_phrases": [
                  "lock the script",
                  "FAQ",
                  "escalation answers"
                ],
                "feedback_cn": "你愿意把今晚的痛吃掉，换明天现场的稳。",
                "feedback_en": "You absorb tonight’s pain to stabilize tomorrow.",
                "next": "pm_s11"
              },
              {
                "id": "pm_s10_b_c2",
                "text_en": "Leave Customer Success some flexibility. They know the client and can improvise if needed.",
                "text_cn": "给客户成功留一点自由发挥空间。他们更懂客户，到时候临场补就好。",
                "tags": [
                  "相信临场",
                  "风险外包"
                ],
                "effects": {
                  "trust": 1,
                  "pressure": 0,
                  "risk": 4
                },
                "key_phrases": [
                  "improvise if needed"
                ],
                "feedback_cn": "你把剧情押在现场发挥上，而这正是最容易翻车的地方。",
                "feedback_en": "You bet the outcome on improvisation under pressure.",
                "next": "pm_fail_rehearsal"
              }
            ]
          },
          {
            "id": "pm_fail_rehearsal",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: In rehearsal, Customer Success says “delete” twice, Sales says “rollout next month,” and Legal leaves the call silent. Everyone thinks someone else will fix it tomorrow.",
            "text_cn": "BAD END：彩排里，客户成功说了两次删除，销售又说了下个月 rollout，法务全程沉默。所有人都以为明天现场总有人会兜底。",
            "choices": [
              {
                "id": "pm_fail_rehearsal_c1",
                "text_en": "Rewind: rehearse the script, FAQ, and escalation answers until everyone says the same thing.",
                "text_cn": "回溯：把 script、FAQ 和升级问题答案排到所有人说同一种话为止。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：现场翻车，通常不是因为没有方案，而是因为没有统一台词。",
                "feedback_en": "Clue: demos fail less from missing features than from mismatched scripts.",
                "next": "pm_s9"
              }
            ]
          },
          {
            "id": "pm_s11",
            "speaker_cn": "客户合规负责人（现场提问）",
            "speaker_en": "Client Compliance Lead (Live Demo)",
            "text_en": "Live question: “If I flip retention to 7 days right now, what exactly happens in production?” The room goes quiet.",
            "text_cn": "客户合规负责人现场追问：如果我现在把 retention 改成 7 天，生产环境里到底会发生什么？会议室瞬间安静。",
            "choices": [
              {
                "id": "pm_s11_c1",
                "text_en": "Answer exactly: the config is saved, an audit event is written, and enforcement follows review and sign-off.",
                "text_cn": "准确回答：配置会被保存，会写入审计事件，真实执行要等复核和签字后落地。",
                "tags": [
                  "说真话",
                  "不补戏"
                ],
                "effects": {
                  "trust": 5,
                  "pressure": 1,
                  "risk": -2
                },
                "key_phrases": [
                  "audit event is written",
                  "follows review and sign-off"
                ],
                "feedback_cn": "你没有追求最爽的回答，而是给了最稳的回答。",
                "feedback_en": "You choose the steadiest truth over the flashiest answer.",
                "next": "pm_s12"
              },
              {
                "id": "pm_s11_c2",
                "text_en": "Let Sales answer with business framing while you fill in the details later.",
                "text_cn": "先让销售用业务话术顶一下，你后面再补技术细节。",
                "tags": [
                  "先稳场",
                  "高风险甩锅"
                ],
                "effects": {
                  "trust": -2,
                  "pressure": 1,
                  "risk": 4
                },
                "key_phrases": [
                  "business framing",
                  "fill in later"
                ],
                "feedback_cn": "你把最关键的一球让给了最容易加戏的人。",
                "feedback_en": "You hand the most dangerous answer to the most dangerous improviser.",
                "next": "pm_fail_live_claim"
              }
            ]
          },
          {
            "id": "pm_fail_live_claim",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "BAD END: Sales answers, “Yes, the policy basically takes effect,” and the client asks for that sentence in writing. The room freezes.",
            "text_cn": "BAD END：销售张口就是：对，策略基本会生效。客户马上接一句：那请把这句话写下来。整个会议室瞬间冻住。",
            "choices": [
              {
                "id": "pm_fail_live_claim_c1",
                "text_en": "Rewind: in live risk moments, answer with exact system truth yourself.",
                "text_cn": "回溯：现场高风险问题必须由你亲自回答系统真相。",
                "tags": [
                  "回溯"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "线索卡：最危险的问题，不该外包给最会卖的人。",
                "feedback_en": "Clue: never outsource the highest-risk truth to the best seller in the room.",
                "next": "pm_s11"
              }
            ]
          },
          {
            "id": "pm_s12",
            "speaker_cn": "系统提示",
            "speaker_en": "System",
            "text_en": "The demo ends without a blowup. Client A says, “This is not the boldest answer we heard — but it’s the first one we can actually take to compliance.”",
            "text_cn": "Demo 最终没有翻车。客户说：这不是我们今天听到最猛的答案，但这是第一句我们真的可以拿去给合规看的话。",
            "choices": [
              {
                "id": "pm_s12_c1",
                "text_en": "End chapter and review key phrases.",
                "text_cn": "结束本章并复盘关键表达。",
                "tags": [
                  "复盘"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [
                  "demo tenant",
                  "configuration flow",
                  "approved language",
                  "redlines",
                  "review gates",
                  "readiness matrix",
                  "lock the script",
                  "audit event is written"
                ],
                "feedback_cn": "这一章的核心不是把功能说得更强，而是把真实能力、对外口径和现场表演三件事锁到同一条线上。越往后越像盛世天下式节奏：每次刚稳住，就会有更高一级的追问砸下来。",
                "feedback_en": "PM Chapter complete: you aligned product reality, external claims, and live-demo discipline.",
                "next": "END"
              },
              {
                "id": "pm_s12_c2",
                "text_en": "Replay from the written guarantee branch.",
                "text_cn": "从书面保证分支回溯重玩。",
                "tags": [
                  "重玩"
                ],
                "effects": {
                  "trust": 0,
                  "pressure": 0,
                  "risk": 0
                },
                "key_phrases": [],
                "feedback_cn": "这一章里每次翻车，都是在提醒你：好卖和能落地，必须是同一句话。",
                "feedback_en": "Every failure here teaches the same rule: sellability and truth must be the same sentence.",
                "next": "pm_s9"
              }
            ]
          }
        ]
      }
    }
  ]
}`);

/* legacy fallback (v1.0)
const STORY_FALLBACK = {
  version: "1.0",
  world: {
    company: "Northstar Labs",
    setting_cn: "一家国际化互联网公司，节奏快、沟通密集、政治敏感但也讲规则。",
    setting_en:
      "A fast-paced global internet company: high-context communication, sharp deadlines, and real stakes."
  },
  roles: [
    {
      id: "hr",
      name_cn: "HR 线",
      name_en: "HRBP Line",
      chapter: {
        id: "hr_ch1",
        title_cn: "第一章：候选人犹豫签约",
        title_en: "Chapter 1: The Offer Hesitation",
        start_scene: "hr_s1",
        scenes: [
          {
            id: "hr_s1",
            speaker_cn: "候选人（邮件）",
            speaker_en: "Candidate (Email)",
            text_en:
              "Hi Alex, thanks again. I’m excited, but I’m still thinking about the offer. Could we revisit the scope and title?",
            text_cn:
              "嗨 Alex，再次感谢。我很兴奋，但我还在考虑这个 offer。我们能再聊下职责范围和 title 吗？",
            choices: [
              {
                id: "hr_s1_c1",
                text_en:
                  "Absolutely. Happy to align on scope and title. What part feels unclear to you right now?",
                text_cn:
                  "当然可以，我很愿意对齐职责与 title。你目前最不清晰的是哪一部分？",
                tags: ["关系优先", "探索"],
                effects: { trust: 5, pressure: 1, risk: -1 },
                key_phrases: ["Happy to align on ...", "What part feels unclear ..."],
                feedback_cn:
                  "这是一种“先澄清再决策”的路线：你先把对方真正卡点问出来，后续更容易用事实与结构推进，而不是直接进入讨价还价。",
                feedback_en:
                  "This keeps the conversation in discovery mode (clarifying) rather than bargaining. It's polite and controlled.",
                next: "hr_s2_clarify"
              },
              {
                id: "hr_s1_c2",
                text_en:
                  "We’ve already aligned on the scope in the interview loop. Could you confirm your decision by EOD?",
                text_cn:
                  "面试流程里我们已经对齐过职责范围了。你能在今天下班前确认决定吗？",
                tags: ["效率优先", "时间锚点"],
                effects: { trust: -2, pressure: 7, risk: -1 },
                key_phrases: ["Could you confirm ... by EOD?"],
                feedback_cn:
                  "这是一种“先把时间锚点放出来”的路线：能加速决策，但也可能让对方感到压力。后续需要用更结构化的方式承接，避免对抗感升级。",
                feedback_en:
                  "Direct but risky. If you don't truly have a hard deadline, this can damage trust early.",
                next: "hr_s2_deadline"
              },
              {
                id: "hr_s1_c3",
                text_en: "We can’t change the title. Please decide.",
                text_cn: "title 不能改，请尽快决定。",
                tags: ["边界优先", "快速收敛"],
                effects: { trust: -4, pressure: 3, risk: -4 },
                key_phrases: ["We can’t change ..."],
                feedback_cn:
                  "这是一种“直接设边界”的路线：效率高，但会压缩后续的回旋空间。更适合你确实没有授权、且希望快速收敛谈判范围的场景。",
                feedback_en:
                  "The content may be true, but the tone reads as dismissive and can shut down the relationship.",
                next: "hr_s2_boundary"
              }
            ]
          },
          {
            id: "hr_s2_clarify",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "The candidate replies quickly: “Mainly the scope. I’ve seen roles like this become three jobs in one.” They’re open to a 15-minute call.",
            text_cn:
              "候选人很快回复：我主要担心 scope，我见过这种岗位最后变成“三份工作”。对方愿意先来个 15 分钟电话。",
            choices: [
              {
                id: "hr_s2_clarify_c1",
                text_en: "Jump on the 15-minute call and align on the first 90 days.",
                text_cn: "进入 15 分钟电话：先对齐前 90 天",
                tags: ["继续"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [],
                feedback_cn:
                  "这条路线会把“担心”转成“可执行的边界”，推进会更稳，但需要你做足准备。",
                feedback_en:
                  "Moving into a call often surfaces the real concern behind the hesitation.",
                next: "hr_s3_clarify"
              }
            ]
          },
          {
            id: "hr_s2_deadline",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "The candidate replies: “Got it. I can confirm by EOD. Also, I have another offer and need clarity on scope.” The tone turns more negotiation-like.",
            text_cn:
              "候选人回复：明白，我可以下班前确认。另外我手上还有别的 offer，需要更清楚 scope。气氛明显进入“谈判模式”。",
            choices: [
              {
                id: "hr_s2_deadline_c1",
                text_en:
                  "Take a call and anchor on scope clarity (not compensation).",
                text_cn:
                  "进入电话：把锚点放在 scope 澄清而不是薪酬对抗",
                tags: ["继续"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [],
                feedback_cn:
                  "这条路线更快，但你需要更会“控锚点”：让对方感到被尊重，同时不被带节奏。",
                feedback_en:
                  "With a deadline set, structure and tone become even more important in the next step.",
                next: "hr_s3_deadline"
              }
            ]
          },
          {
            id: "hr_s2_boundary",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "The candidate pauses, then replies: “If title is fixed, I want clarity on scope and success metrics. Otherwise I can’t assess the risk.”",
            text_cn:
              "候选人沉默片刻后回复：如果 title 固定，那我需要明确 scope 和成功标准，否则我无法评估风险。",
            choices: [
              {
                id: "hr_s2_boundary_c1",
                text_en:
                  "Take a call and offer a clear process (scope doc + 90-day success).",
                text_cn:
                  "进入电话：用流程化方式承接（scope 文档 + 90 天成功标准）",
                tags: ["继续"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [],
                feedback_cn:
                  "这条路线强调边界，但也要求你给出“可验证的承诺”（标准、节奏、交付物），否则容易僵住。",
                feedback_en:
                  "Starting with a hard boundary means the next step should focus on a clear process and next actions.",
                next: "hr_s3_boundary"
              }
            ]
          },
          {
            id: "hr_s3_clarify",
            speaker_cn: "候选人（电话）",
            speaker_en: "Candidate (Call)",
            text_en:
              "To be honest, I’m worried the scope is too broad. I don’t want to be set up to fail.",
            text_cn:
              "说实话，我担心职责范围太大。我不想一进去就被“设置成失败”。",
            choices: [
              {
                id: "hr_s3_c1",
                text_en:
                  "That’s a fair concern. Let’s define what success looks like in the first 90 days, and what’s out of scope.",
                text_cn:
                  "这是很合理的担心。我们一起把前 90 天的成功标准和“非职责范围”定义清楚。",
                tags: ["结构化", "边界清晰"],
                effects: { trust: 6, pressure: 2, risk: -4 },
                key_phrases: [
                  "That’s a fair concern.",
                  "what success looks like",
                  "out of scope"
                ],
                feedback_cn:
                  "你把焦虑转成“可操作的定义”，对方会更踏实；代价是你需要准备一份可信的 90 天草案。",
                feedback_en:
                  "‘Fair concern’ validates without overpromising. Defining 90-day success + out-of-scope reduces anxiety.",
                next: "hr_s4"
              },
              {
                id: "hr_s3_c2",
                text_en:
                  "Let’s phase the scope. We’ll start with the core responsibilities, then expand after we review the first 60 days.",
                text_cn:
                  "我们可以把职责分阶段：先做核心职责，60 天复盘一次，再逐步扩展。",
                tags: ["分阶段", "降低不确定性"],
                effects: { trust: 3, pressure: -1, risk: -2 },
                key_phrases: ["phase the scope", "review the first 60 days"],
                feedback_cn:
                  "你用“阶段性”降低不确定性，推进更务实；代价是需要和用人经理对齐阶段目标与评估点。",
                feedback_en:
                  "Phasing reduces uncertainty. The trade-off is you must align the milestones with the hiring manager.",
                next: "hr_s4"
              }
            ]
          },
          {
            id: "hr_s3_deadline",
            speaker_cn: "候选人（电话）",
            speaker_en: "Candidate (Call)",
            text_en:
              "Since we have a deadline, I need to be confident about scope and growth. What does success look like in the first 90 days?",
            text_cn:
              "既然有截止时间，我需要更确认 scope 和成长空间。前 90 天的成功标准到底是什么？",
            choices: [
              {
                id: "hr_s3_deadline_c1",
                text_en:
                  "Let’s align on a 90-day success outline now, then I’ll send it in writing after the call.",
                text_cn:
                  "我们现在先把 90 天成功标准对齐，我会在通话后把要点书面发给你确认。",
                tags: ["先口头对齐", "再书面确认"],
                effects: { trust: 4, pressure: 4, risk: -2 },
                key_phrases: ["send it in writing", "success outline"],
                feedback_cn:
                  "你给了确定感（书面确认），也照顾了时间压力；代价是你必须确保“写得出来且站得住”。",
                feedback_en:
                  "Writing it down builds confidence under time pressure, but you must deliver a solid outline.",
                next: "hr_s4"
              },
              {
                id: "hr_s3_deadline_c2",
                text_en:
                  "Would you be open to a 30-minute alignment call with the hiring manager? Scope clarity is best answered directly.",
                text_cn:
                  "你愿意和用人经理来一次 30 分钟对齐会吗？scope 的问题最适合直接由对方回答。",
                tags: ["拉齐关键人", "减少误差"],
                effects: { trust: 2, pressure: 1, risk: -4 },
                key_phrases: ["best answered directly", "alignment call"],
                feedback_cn:
                  "你把“责任人”请上桌，能减少信息误差；代价是会占用更多协调成本。",
                feedback_en:
                  "Bringing the decision-maker reduces ambiguity, at the cost of coordination overhead.",
                next: "hr_s4"
              }
            ]
          },
          {
            id: "hr_s3_boundary",
            speaker_cn: "候选人（电话）",
            speaker_en: "Candidate (Call)",
            text_en:
              "If title is fixed, I need guardrails. What is explicitly out of scope? And how do we handle scope creep?",
            text_cn:
              "如果 title 固定，那我需要护栏：哪些事情明确不算我的职责？scope 膨胀怎么处理？",
            choices: [
              {
                id: "hr_s3_boundary_c1",
                text_en:
                  "We can document what’s out of scope and set a monthly calibration with the hiring manager.",
                text_cn:
                  "我们可以把 out of scope 写进文档，并约定每月和用人经理做一次职责校准。",
                tags: ["机制护栏", "定期校准"],
                effects: { trust: 3, pressure: 0, risk: -4 },
                key_phrases: ["monthly calibration", "out of scope"],
                feedback_cn:
                  "你提供了“机制”而不是口头承诺；代价是需要双方都愿意按机制执行。",
                feedback_en:
                  "You offer a mechanism, not just reassurance. It requires both sides to follow through.",
                next: "hr_s4"
              },
              {
                id: "hr_s3_boundary_c2",
                text_en:
                  "Let’s agree on a clear ownership map: what you own, what you influence, and what stays with other teams.",
                text_cn:
                  "我们可以先对齐一张 ownership map：你负责什么、影响什么、哪些仍由其他团队负责。",
                tags: ["职责地图", "减少冲突"],
                effects: { trust: 2, pressure: 2, risk: -3 },
                key_phrases: ["ownership map", "influence"],
                feedback_cn:
                  "用“ownership map”把边界说清楚，后续冲突更少；代价是前期沟通会更细。",
                feedback_en:
                  "An ownership map clarifies boundaries, but requires more detailed alignment upfront.",
                next: "hr_s4"
              }
            ]
          },
          {
            id: "hr_s4",
            speaker_cn: "候选人",
            speaker_en: "Candidate",
            text_en:
              "If we can tighten the scope, can we adjust the title to reflect seniority?",
            text_cn: "如果能收敛职责范围，title 能不能更体现资深度？",
            choices: [
              {
                id: "hr_s4_c1",
                text_en:
                  "Let me check the leveling policy. If the scope and impact match, we can explore the right level and title alignment.",
                text_cn:
                  "我需要先核对公司的定级政策。如果职责与影响力匹配，我们可以一起探索最合适的 level 与 title 对齐。",
                tags: ["不承诺", "给路径"],
                effects: { trust: 6, pressure: 0, risk: -2 },
                key_phrases: ["leveling policy", "title alignment"],
                feedback_cn:
                  "核心技巧：不直接说“行/不行”，而是给出评估路径（policy → scope/impact → alignment）。",
                feedback_en:
                  "Key skill: avoid instant yes/no. Offer a process (policy → scope/impact → alignment).",
                next: "hr_s5"
              },
              {
                id: "hr_s4_c2",
                text_en:
                  "Title is tied to leveling, but we can align a growth path: scope first, then a leveling review after probation if impact matches.",
                text_cn:
                  "title 会跟定级绑定，但我们可以对齐成长路径：先把 scope 跑出来，如果影响力匹配，试用期后做一次定级复盘。",
                tags: ["成长路径", "复盘节点"],
                effects: { trust: 3, pressure: 1, risk: -2 },
                key_phrases: ["growth path", "leveling review"],
                feedback_cn:
                  "你没有直接承诺 title，但给了“可验证的升级路径”。这会把谈判从“立刻要”转成“用影响力换”。",
                feedback_en:
                  "You avoid an immediate promise but offer a measurable path. It shifts negotiation from ‘ask now’ to ‘earn via impact.’",
                next: "hr_s5"
              }
            ]
          },
          {
            id: "hr_s5",
            speaker_cn: "你（邮件草稿）",
            speaker_en: "You (Draft Email)",
            text_en: "You want to propose a 30-minute alignment call with the hiring manager.",
            text_cn: "你准备发邮件，提出和用人经理做一次 30 分钟对齐会。",
            choices: [
              {
                id: "hr_s5_c1",
                text_en:
                  "Would you be open to a 30-minute alignment call with the hiring manager? We can clarify scope, success metrics, and leveling.",
                text_cn:
                  "你愿意和用人经理来一次 30 分钟对齐会吗？我们可以把职责、成功标准、以及定级政策聊清楚。",
                tags: ["协商式邀请", "结构化议程"],
                effects: { trust: 8, pressure: -2, risk: -4 },
                key_phrases: ["Would you be open to ...", "success metrics"],
                feedback_cn:
                  "“Would you be open to”比“Can you”更柔和；同时给 agenda，让对方觉得这次会是有产出的。",
                feedback_en:
                  "‘Would you be open to’ is softer. Adding an agenda signals the call will be productive.",
                next: "hr_s6"
              },
              {
                id: "hr_s5_c2",
                text_en: "Let’s jump on a call tomorrow. I’ll send an invite.",
                text_cn: "我们明天电话聊，我发会议邀请。",
                tags: ["效率优先", "忽略意愿"],
                effects: { trust: -4, pressure: 4, risk: 2 },
                key_phrases: ["Let’s jump on a call"],
                feedback_cn:
                  "表达有效率，但略过“对方是否方便”。跨时区/在职候选人场景下，建议先问意愿再定时间。",
                feedback_en:
                  "Efficient but assumes availability. For employed candidates or time zones, ask preference first.",
                next: "hr_s6"
              }
            ]
          },
          {
            id: "hr_s6",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "Outcome: The candidate agrees to the alignment call. Your next step is to prep a clean scope doc and a 90-day success outline.",
            text_cn:
              "结果：候选人同意对齐会。下一步：准备清晰的职责边界文档 + 90 天成功标准草案。",
            choices: [
              {
                id: "hr_s6_c1",
                text_en: "End chapter and review key phrases.",
                text_cn: "结束本章并复盘关键表达",
                tags: ["复盘"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [
                  "That’s a fair concern.",
                  "What success looks like in the first 90 days",
                  "Out of scope",
                  "Title alignment"
                ],
                feedback_cn:
                  "你完成了 HR 线第一章。核心能力不是“压对方”，而是把谈判从情绪拉回到结构：问题 → 评估路径 → 会议议程 → 可交付物。",
                feedback_en:
                  "You finished HR Chapter 1. The win is structural clarity: concern → process → agenda → deliverables.",
                next: "END"
              }
            ]
          }
        ]
      }
    },
    {
      id: "pm",
      name_cn: "PM 线",
      name_en: "PM Line",
      chapter: {
        id: "pm_ch1",
        title_cn: "第一章：上线前夜需求突变",
        title_en: "Chapter 1: The Last-Minute Change",
        start_scene: "pm_s1",
        scenes: [
          {
            id: "pm_s1",
            speaker_cn: "销售负责人（群聊）",
            speaker_en: "Sales Lead (Chat)",
            text_en:
              "We need a new enterprise-only toggle before launch. A big client is asking for it. Can you add it tonight?",
            text_cn:
              "上线前要加一个“企业客户专属开关”。大客户刚提的，能今晚加吗？",
            choices: [
              {
                id: "pm_s1_c1",
                text_en:
                  "I hear the urgency. Before we commit, can you clarify the exact user flow and the business impact if we don’t ship it tomorrow?",
                text_cn:
                  "我理解紧急性。但在承诺前，能否先明确具体用户流程，以及如果明天不发会造成什么业务影响？",
                tags: ["范围优先", "先澄清"],
                effects: { trust: 3, pressure: 2, risk: -2 },
                key_phrases: [
                  "Before we commit",
                  "clarify the exact user flow",
                  "business impact"
                ],
                feedback_cn:
                  "“Before we commit”是关键：你先表示理解，再把话题拉回到范围与影响评估，避免被情绪裹挟。",
                feedback_en:
                  "‘Before we commit’ validates urgency while pulling the discussion back to scope and impact.",
                next: "pm_s1_clarify"
              },
              {
                id: "pm_s1_c2",
                text_en: "Sure, we’ll do it. We can’t lose this client.",
                text_cn: "可以，我们做。不能丢这个客户。",
                tags: ["业务优先", "先承诺"],
                effects: { trust: 2, pressure: 6, risk: 3 },
                key_phrases: ["We can’t lose this client."],
                feedback_cn:
                  "这是典型的“先答应再补救”。后续一旦技术说做不了，你会成为夹心饼干。",
                feedback_en:
                  "A classic premature commitment. If engineering pushes back later, you’re stuck in the middle.",
                next: "pm_s1_commit"
              }
            ]
          },
          {
            id: "pm_s1_clarify",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "Sales replies with a rough flow and impact. Engineering asks you to define the minimum viable version.",
            text_cn:
              "销售补充了大致用户流程与影响。技术负责人私聊你：先把最小可交付定义清楚。",
            choices: [
              {
                id: "pm_s1_clarify_c1",
                text_en: "Continue to engineering alignment.",
                text_cn: "继续进入技术对齐",
                tags: ["继续"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [],
                feedback_cn: "你将把讨论从“要不要做”转成“做多少、怎么控风险”。",
                feedback_en:
                  "You’re about to shift the discussion into scope and risk control.",
                next: "pm_s2"
              }
            ]
          },
          {
            id: "pm_s1_commit",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "Sales is relieved, but engineering immediately pushes back: “Doing it tonight is risky. What’s the minimum we can ship?”",
            text_cn:
              "销售松了口气，但技术负责人立刻追问：今晚做风险很高，最小可交付到底是什么？",
            choices: [
              {
                id: "pm_s1_commit_c1",
                text_en: "Continue to define the MVP.",
                text_cn: "继续进入最小交付定义",
                tags: ["继续"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [],
                feedback_cn: "你需要用“最小交付 + 灰度 + 回滚”把承诺变得可落地。",
                feedback_en:
                  "You’ll need MVP + gating + rollback to make the commitment shippable.",
                next: "pm_s2"
              }
            ]
          },
          {
            id: "pm_s2",
            speaker_cn: "技术负责人（私聊）",
            speaker_en: "Eng Lead (DM)",
            text_en:
              "Adding a toggle touches permissions and backend flags. Doing it tonight is risky. What’s the minimum we can ship?",
            text_cn:
              "这个开关会涉及权限和后端 flag。今晚加风险很高。最小可交付是什么？",
            choices: [
              {
                id: "pm_s2_c1",
                text_en:
                  "Let’s define an MVP: UI toggle + backend flag read-only, no new permission model. We can gate it for this one client first.",
                text_cn:
                  "我们先定义最小版本：前端开关 + 后端读取 flag（只读），不引入新的权限模型。先只对这个客户灰度。",
                tags: ["最小交付", "灰度上线"],
                effects: { trust: 10, pressure: -1, risk: -6 },
                key_phrases: ["define an MVP", "gate it", "read-only"],
                feedback_cn:
                  "用 MVP + gate 的语言，把“做不做”变成“做多少、怎么控风险”。这会让技术更愿意配合。",
                feedback_en:
                  "MVP + gating reframes the debate into risk management. Engineering usually responds well to this.",
                next: "pm_s3"
              },
              {
                id: "pm_s2_c2",
                text_en:
                  "If MVP still feels risky, can we ship a workaround tomorrow and commit to a proper solution next week?",
                text_cn:
                  "如果 MVP 仍然不安全，我们能不能明天先给一个 workaround，并承诺下周补齐正式方案？",
                tags: ["替代方案", "分阶段交付"],
                effects: { trust: 6, pressure: 2, risk: -3 },
                key_phrases: ["ship a workaround", "commit to a proper solution"],
                feedback_cn:
                  "你选择“先保上线、后补能力”：能显著降低技术风险，但需要你把对销售的预期管理讲清楚。",
                feedback_en:
                  "Workaround-first reduces risk. The trade-off is stronger expectation management with Sales.",
                next: "pm_s3"
              }
            ]
          },
          {
            id: "pm_s3",
            speaker_cn: "销售负责人（群聊）",
            speaker_en: "Sales Lead (Chat)",
            text_en: "So are we shipping it tomorrow or not? I need a yes.",
            text_cn: "那明天到底能不能上？我需要一个 yes。",
            choices: [
              {
                id: "pm_s3_c1",
                text_en:
                  "We can ship a gated MVP tomorrow: a toggle visible only to Client A. Full permissioned rollout will follow after we validate.",
                text_cn:
                  "明天可以发一个“灰度最小版”：只对客户 A 可见的开关。带完整权限的版本会在验证后再扩展。",
                tags: ["给 yes 但可控", "设边界"],
                effects: { trust: 8, pressure: -2, risk: -4 },
                key_phrases: ["gated MVP", "visible only to", "rollout will follow"],
                feedback_cn:
                  "你给了对方想要的“yes”，同时用 gated/MVP/rollout 设了边界，减少后续被追加。",
                feedback_en:
                  "You give the ‘yes’ Sales wants, but constrain it with gated MVP + follow-up rollout.",
                next: "pm_s4"
              },
              {
                id: "pm_s3_c2",
                text_en:
                  "We can’t safely ship the toggle tomorrow, but we can ship a workaround and confirm the full solution timeline today.",
                text_cn:
                  "明天不上正式开关会更安全，但我们可以先上 workaround，并在今天把正式方案的时间线确认下来。",
                tags: ["安全优先", "给替代方案"],
                effects: { trust: 6, pressure: 1, risk: -2 },
                key_phrases: ["can’t safely ship", "confirm the timeline"],
                feedback_cn:
                  "你没有直接说“不”，而是把它变成“替代交付 + 时间线承诺”。关键在于：替代方案要能被销售解释给客户听。",
                feedback_en:
                  "You don’t just say no — you offer an alternative and a clear timeline. The workaround must be customer-explainable.",
                next: "pm_s4"
              }
            ]
          },
          {
            id: "pm_s4",
            speaker_cn: "你（会议主持）",
            speaker_en: "You (Facilitator)",
            text_en:
              "In the war room, you need to align on risk. QA asks: “What’s our rollback plan if this breaks production?”",
            text_cn:
              "战情室里你需要对齐风险。QA 问：如果线上出问题，我们的回滚方案是什么？",
            choices: [
              {
                id: "pm_s4_c1",
                text_en:
                  "We’ll ship behind a server-side flag, default off. Rollback is flipping the flag. We’ll also add a kill-switch note in the release checklist.",
                text_cn:
                  "我们会在服务端 flag 后发布，默认关闭。回滚就是关掉 flag。同时把 kill-switch 写进发布检查清单。",
                tags: ["专业", "可回滚"],
                effects: { trust: 12, pressure: -2, risk: -10 },
                key_phrases: ["behind a server-side flag", "default off", "kill-switch"],
                feedback_cn:
                  "这是“工程化的 PM 语言”：flag、默认关闭、kill-switch、checklist。会显著提升团队安全感。",
                feedback_en:
                  "This is strong PM/engineering language: flag, default-off, kill-switch, checklist. It builds confidence.",
                next: "pm_s5"
              },
              {
                id: "pm_s4_c2",
                text_en:
                  "We’ll ship it as a separate release. Rollback is reverting the deployment and monitoring key metrics for 30 minutes post-release.",
                text_cn:
                  "我们把它作为独立发布。回滚就是回退这次部署，并在发布后 30 分钟盯关键指标做监控。",
                tags: ["独立发布", "回退部署"],
                effects: { trust: 9, pressure: 2, risk: -6 },
                key_phrases: ["separate release", "revert the deployment", "monitor key metrics"],
                feedback_cn:
                  "这条路线更偏“发布流程”层面的回滚：适合没有 flag 的情况下快速止血；代价是对发布节奏与监控要求更高。",
                feedback_en:
                  "This rollback is release-based (not flag-based). It can stop bleeding fast, but requires disciplined release/monitoring.",
                next: "pm_s5"
              }
            ]
          },
          {
            id: "pm_s5",
            speaker_cn: "系统提示",
            speaker_en: "System",
            text_en:
              "Outcome: You shipped a gated MVP with a safe rollback plan. Sales is satisfied and Engineering stays confident.",
            text_cn:
              "结果：你用“灰度最小版 + 可回滚方案”完成了上线。销售满意，技术也愿意继续配合。",
            choices: [
              {
                id: "pm_s5_c1",
                text_en: "End chapter and review key phrases.",
                text_cn: "结束本章并复盘关键表达",
                tags: ["复盘"],
                effects: { trust: 0, pressure: 0, risk: 0 },
                key_phrases: [
                  "Before we commit",
                  "define an MVP",
                  "gated MVP",
                  "behind a server-side flag",
                  "kill-switch"
                ],
                feedback_cn:
                  "你完成了 PM 线第一章。你不是“否定需求”，而是用 MVP、灰度和回滚把需求变得可发布、可控风险。",
                feedback_en:
                  "You finished PM Chapter 1. You didn’t reject the ask; you made it shippable with MVP, gating, and rollback.",
                next: "END"
              }
            ]
          }
        ]
      }
    }
  ]
};
*/

const STORAGE_KEYS = {
  settings: "go_demo_settings_v1",
  progress: "go_demo_progress_v1",
  phrases: "go_demo_phrases_v1"
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function qs(sel) {
  return document.querySelector(sel);
}

function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function setScreen(screenId) {
  qsa(".screen").forEach((el) => el.classList.remove("screen-active"));
  const el = qs(`#screen-${screenId}`);
  if (el) el.classList.add("screen-active");

  qsa(".nav-btn").forEach((btn) => btn.classList.toggle("nav-active", btn.dataset.nav === screenId));
}

function deltaLabel(delta) {
  if (!delta) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function loadStoryData() {
  // 尝试 fetch（当通过 http(s) / 本地 server 访问时正常）
  try {
    const resp = await fetch("./assets/story.json", { cache: "no-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    if (!json || !Array.isArray(json.roles)) throw new Error("Invalid story format");
    return json;
  } catch {
    // file:// 打开时可能失败，回退到内置最小结构；
    // 然后再尝试从 <script> 读取（如果未来有内嵌版本）
    const embedded = qs("#story-data");
    if (embedded && embedded.textContent) {
      const parsed = safeJsonParse(embedded.textContent, STORY_FALLBACK);
      return parsed;
    }
    return STORY_FALLBACK;
  }
}

function buildSceneIndex(story) {
  const idx = {};
  for (const role of story.roles || []) {
    const scenes = role?.chapter?.scenes || [];
    for (const s of scenes) idx[`${role.id}:${s.id}`] = s;
  }
  return idx;
}

function loadStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return safeJsonParse(raw, fallback);
}

function saveStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function defaultMeters() {
  return { trust: 50, pressure: 35, risk: 25 };
}

function renderMeters(meters) {
  const meterTrust = qs("#meter-trust");
  const meterPressure = qs("#meter-pressure");
  const meterRisk = qs("#meter-risk");
  if (meterTrust) meterTrust.style.width = `${clamp(meters.trust, 0, 100)}%`;
  if (meterPressure) meterPressure.style.width = `${clamp(meters.pressure, 0, 100)}%`;
  if (meterRisk) meterRisk.style.width = `${clamp(meters.risk, 0, 100)}%`;

  // 让风险条更“红”、压力更“黄”一点
  const risk = clamp(meters.risk, 0, 100);
  const pressure = clamp(meters.pressure, 0, 100);
  if (meterRisk) {
    meterRisk.style.background = `linear-gradient(90deg, var(--good), color-mix(in oklab, var(--bad), var(--warn) ${
      100 - risk
    }%))`;
  }
  if (meterPressure) {
    meterPressure.style.background = `linear-gradient(90deg, var(--good), color-mix(in oklab, var(--warn), var(--primary2) ${
      100 - pressure
    }%))`;
  }
  const meterSummary = qs("#meter-summary");
  if (meterSummary) {
    meterSummary.textContent = `关系信任 ${clamp(meters.trust, 0, 100)} / 时间压力 ${clamp(
      meters.pressure,
      0,
      100
    )} / 风险暴露 ${clamp(meters.risk, 0, 100)}`;
  }
}

function normalizePhrases(arr) {
  const out = [];
  const seen = new Set();
  for (const p of arr || []) {
    const key = `${p.text}|${p.meaning || ""}|${p.role}|${p.chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function renderPhrasebook(phrases) {
  const list = qs("#phrase-list");
  list.innerHTML = "";
  if (!phrases.length) {
    list.innerHTML = `<div class="muted">还没有收集到短语。去试玩里选几句表达试试。</div>`;
    return;
  }
  for (const p of phrases) {
    const item = document.createElement("div");
    item.className = "phrase";
    item.innerHTML = `
      <div class="phrase-top">
        <div class="phrase-en">${escapeHtml(p.text)}</div>
        <button class="ghost copy-btn" data-copy="${encodeAttr(p.text)}">复制</button>
      </div>
      ${p.meaning ? `<div class="muted" style="margin-top:6px">${escapeHtml(p.meaning)}</div>` : ""}
      <div class="phrase-meta">
        <div>来源：${escapeHtml(p.role_cn || p.role || "")} / ${escapeHtml(p.chapter_cn || p.chapter || "")}</div>
        <div>时间：${escapeHtml((p.at || "").slice(0, 19).replace("T", " "))}</div>
      </div>
    `;
    list.appendChild(item);
  }

  qsa("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const txt = btn.getAttribute("data-copy") || "";
      await copyText(txt);
      btn.textContent = "已复制";
      setTimeout(() => (btn.textContent = "复制"), 900);
    });
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function encodeAttr(str) {
  return escapeHtml(str).replaceAll("\n", " ");
}

const PHRASE_GLOSSARY = [
  ["success metrics", "成功标准 / 衡量指标"],
  ["decision timeline", "决策时间线"],
  ["out of scope", "不在职责范围内"],
  ["review checkpoint", "复盘检查点"],
  ["headcount review", "HC 复核 / 名额审批复盘"],
  ["impact statement", "影响说明"],
  ["contingency plan", "备选预案"],
  ["start date flexibility", "入职日期弹性"],
  ["ownership map", "职责地图"],
  ["demo tenant", "演示租户"],
  ["audit event", "审计事件"],
  ["approval workflow", "审批流程"],
  ["configuration flow", "配置流程"],
  ["kill-switch", "紧急停用开关"]
].map(([term, meaning]) => ({ term, meaning, lower: term.toLowerCase() }))
  .sort((a, b) => b.term.length - a.term.length);

const WORD_GLOSSARY = {
  hi: "嗨，你好",
  thank: "感谢",
  again: "再次",
  excited: "很期待 / 很兴奋",
  like: "想要 / 希望",
  revisit: "重新讨论 / 再看一遍",
  make: "让 / 做到",
  sure: "确定 / 确保",
  set: "设定 / 对齐",
  right: "合适的 / 正确的",
  expectations: "预期",
  totally: "完全地",
  fair: "合理的",
  before: "在……之前",
  change: "改变",
  anything: "任何事情",
  can: "可以",
  you: "你",
  share: "说明 / 分享",
  what: "什么",
  feels: "感觉起来",
  risky: "有风险的",
  about: "关于",
  scope: "职责范围",
  workload: "工作量",
  ownership: "职责归属",
  metrics: "指标",
  keep: "保持",
  momentum: "推进势能 / 节奏",
  call: "电话 / 通话",
  today: "今天",
  align: "对齐",
  after: "之后",
  title: "岗位头衔",
  tied: "绑定于 / 与……相关",
  leveling: "岗位定级",
  concern: "担忧点",
  send: "发送",
  day: "天",
  draft: "草案",
  explicitly: "明确地",
  help: "帮助",
  decide: "决定",
  honestly: "坦白说",
  worried: "担心的",
  this: "这个",
  role: "角色 / 岗位",
  becomes: "变成",
  fallback: "兜底的 / 备用的",
  person: "人",
  three: "三个",
  teams: "团队",
  another: "另一个",
  offer: "录用 offer",
  deadline: "截止时间",
  need: "需要",
  clarity: "明确性",
  heard: "听说",
  rumor: "传闻",
  know: "知道",
  real: "真实的",
  if: "如果",
  join: "加入",
  truly: "真正地",
  own: "负责 / 拥有",
  still: "仍然",
  with: "和 / 带着",
  create: "创建",
  writing: "书面形式",
  phase: "分阶段推进",
  first: "首先 / 第一阶段",
  focus: "聚焦",
  core: "核心的",
  then: "然后",
  expand: "扩展",
  commit: "承诺",
  process: "流程",
  checkpoint: "检查点",
  probation: "试用期",
  impact: "影响 / 业务影响",
  matches: "匹配",
  bring: "带入 / 拉进来",
  into: "进入 / 纳入",
  quick: "快速的",
  should: "应该",
  accept: "接受",
  blindly: "盲目地",
  confidential: "保密的",
  plans: "计划",
  add: "增加",
  written: "书面的",
  flexibility: "弹性",
  deserve: "值得",
  hear: "听到",
  from: "来自",
  owner: "负责人",
  hiring: "招聘中",
  finance: "财务",
  watching: "盯着 / 关注",
  tight: "收紧的 / 保守的",
  mention: "提及",
  cliffhanger: "悬念收尾",
  receive: "收到",
  invite: "邀请 / 会议邀请",
  urgent: "紧急的",
  candidate: "候选人 / 面试者",
  waiting: "正在等待",
  next: "下一步 / 下一封",
  email: "电子邮件",
  headcount: "招聘名额 / HC",
  justification: "说明材料 / 论证",
  explain: "解释",
  measurable: "可衡量的",
  outcomes: "结果 / 产出",
  deliver: "交付 / 带来",
  two: "两个",
  quarters: "季度",
  guarantee: "保证",
  win: "赢 / 成功",
  close: "促成 / 成交",
  revenue: "收入",
  trust: "信任",
  appreciate: "感谢 / 认可",
  transparency: "透明度",
  manage: "管理 / 控制",
  risk: "风险",
  safe: "安全的 / 稳的",
  yes: "是",
  no: "不是",
  discuss: "讨论",
  review: "复核 / 评审",
  proof: "证明",
  silent: "沉默 / 不表态",
  retention: "保留策略 / 保留期",
  toggle: "开关",
  compliance: "合规",
  sign: "签字 / 签署",
  rollout: "上线推广",
  pilot: "试点",
  redlines: "红线限制",
  stop: "停止",
  ship: "上线 / 发版",
  flag: "特性开关",
  workaround: "替代方案",
  transparent: "透明的",
  forwardable: "可直接转发的",
  approval: "审批 / 批准",
  policy: "规则 / 政策",
  stability: "稳定性",
  workflow: "工作流 / 流程",
  audit: "审计",
  tenant: "租户"
};

function isWordChar(ch) {
  return /[A-Za-z0-9]/.test(ch || "");
}

function findGlossaryMatch(text, start) {
  const lower = text.toLowerCase();
  for (const item of PHRASE_GLOSSARY) {
    const len = item.term.length;
    if (lower.slice(start, start + len) !== item.lower) continue;
    if (isWordChar(text[start - 1]) || isWordChar(text[start + len])) continue;
    return item;
  }
  return null;
}

function lookupWordMeaning(word) {
  const key = String(word || "").toLowerCase();
  return WORD_GLOSSARY[key] || "";
}

function annotateEnglish(text) {
  const source = String(text || "");
  let out = "";
  for (let i = 0; i < source.length; ) {
    const matched = findGlossaryMatch(source, i);
    if (matched) {
      const raw = source.slice(i, i + matched.term.length);
      out += `<span class="word-hint" data-phrase-text="${encodeAttr(raw)}" data-phrase-meaning="${encodeAttr(
        matched.meaning
      )}">${escapeHtml(raw)}</span>`;
      i += matched.term.length;
      continue;
    }

    const ch = source[i];
    if (/[A-Za-z]/.test(ch)) {
      let j = i + 1;
      while (j < source.length && /[A-Za-z'-]/.test(source[j])) j += 1;
      const rawWord = source.slice(i, j);
      const meaning = lookupWordMeaning(rawWord);
      if (meaning) {
        out += `<span class="word-hint" data-phrase-text="${encodeAttr(rawWord)}" data-phrase-meaning="${encodeAttr(
          meaning
        )}">${escapeHtml(rawWord)}</span>`;
      } else {
        out += escapeHtml(rawWord);
      }
      i = j;
      continue;
    }

    out += escapeHtml(ch);
    i += 1;
  }
  return out;
}

function getDifficultyLabel(v) {
  if (v === "beginner") return "入门";
  if (v === "advanced") return "挑战";
  return "进阶";
}

function shouldHideCn(settings) {
  if (!settings.showCn) return true;
  return settings.difficulty === "advanced";
}

function computeSceneTitle(role, chapter) {
  return `${role.name_cn || ""} · ${chapter.title_cn || ""}`;
}

function buildFeedbackHtml({ choice, settings, metersBefore, metersAfter, role, chapter }) {
  const hideCn = shouldHideCn(settings);
  const deltas = {
    trust: (choice.effects?.trust || 0) * 1,
    pressure: (choice.effects?.pressure || 0) * 1,
    risk: (choice.effects?.risk || 0) * 1
  };

  const phrases = (choice.key_phrases || []).map((p) => `• ${p}`).join("\n");
  const phraseBlock = choice.key_phrases?.length
    ? `<div class="kv">
        <div class="kv-row"><div class="kv-key">关键表达</div><div class="kv-val">${escapeHtml(
          choice.key_phrases.join(" | ")
        )}</div></div>
      </div>`
    : "";

  return `
    <div class="muted small">当前：${escapeHtml(role.name_cn)} / ${escapeHtml(chapter.title_cn)} · 难度：${escapeHtml(
      getDifficultyLabel(settings.difficulty)
    )}</div>
    <h4>你选择的表达</h4>
    <div class="kv">
      <div class="kv-row"><div class="kv-key">英文</div><div class="kv-val">${escapeHtml(choice.text_en)}</div></div>
      ${hideCn ? "" : `<div class="kv-row"><div class="kv-key">中文</div><div class="kv-val">${escapeHtml(choice.text_cn || "")}</div></div>`}
    </div>

    <h4>局势变化</h4>
    <div class="kv">
      <div class="kv-row"><div class="kv-key">关系信任</div><div class="kv-val">${escapeHtml(
        deltaLabel(deltas.trust)
      )} → ${escapeHtml(String(clamp(metersAfter.trust, 0, 100)))}</div></div>
      <div class="kv-row"><div class="kv-key">时间压力</div><div class="kv-val">${escapeHtml(
        deltaLabel(deltas.pressure)
      )} → ${escapeHtml(String(clamp(metersAfter.pressure, 0, 100)))}</div></div>
      <div class="kv-row"><div class="kv-key">风险暴露</div><div class="kv-val">${escapeHtml(
        deltaLabel(deltas.risk)
      )} → ${escapeHtml(String(clamp(metersAfter.risk, 0, 100)))}</div></div>
    </div>

    <h4>讲解</h4>
    <div>${escapeHtml(choice.feedback_en || "")}</div>
    ${hideCn ? "" : `<div class="muted" style="margin-top:8px">${escapeHtml(choice.feedback_cn || "")}</div>`}

    ${phraseBlock}

    <div class="row gap" style="margin-top:12px; flex-wrap:wrap">
      <button class="primary" id="btn-next">继续</button>
      <button class="ghost" id="btn-add-phrases">加入短语本</button>
    </div>
  `;
}

function buildDebriefHtml({ role, chapter, log, settings, meters }) {
  const hideCn = shouldHideCn(settings);
  const title = `${role?.name_cn || role?.id || ""} · ${chapter?.title_cn || chapter?.id || ""}`;
  const items = (log || [])
    .map((x, i) => {
      const cn = hideCn ? "" : `<div class="muted" style="margin-top:6px">${escapeHtml(x.choice_text_cn || "")}</div>`;
      const fbCn = hideCn ? "" : `<div class="muted" style="margin-top:6px">${escapeHtml(x.feedback_cn || "")}</div>`;
      const deltaLine = `<div class="muted small" style="margin-top:6px">信任 ${escapeHtml(
        deltaLabel(x.deltas?.trust || 0)
      )} / 压力 ${escapeHtml(deltaLabel(x.deltas?.pressure || 0))} / 风险 ${escapeHtml(
        deltaLabel(x.deltas?.risk || 0)
      )}</div>`;
      return `
        <div class="card" style="margin-top:10px">
          <div class="muted small">第 ${i + 1} 次选择</div>
          <div style="margin-top:6px">${escapeHtml(x.choice_text_en || "")}</div>
          ${cn}
          ${deltaLine}
          <div style="margin-top:10px">${escapeHtml(x.feedback_en || "")}</div>
          ${fbCn}
        </div>
      `;
    })
    .join("");

  const allPhrases = Array.from(
    new Set((log || []).flatMap((x) => x.key_phrases || []).filter(Boolean))
  );
  const phraseBlock = allPhrases.length
    ? `<div class="kv" style="margin-top:10px">
        <div class="kv-row"><div class="kv-key">本章收集到的关键表达</div><div class="kv-val">${escapeHtml(
          allPhrases.join(" | ")
        )}</div></div>
      </div>`
    : `<div class="muted small" style="margin-top:10px">本章没有收集到新的关键表达。</div>`;

  return `
    <div class="muted small">${escapeHtml(title)} · 难度：${escapeHtml(getDifficultyLabel(settings.difficulty))}</div>
    <h4 style="margin-top:10px">本章总结</h4>
    <div class="kv">
      <div class="kv-row"><div class="kv-key">最终局势</div><div class="kv-val">信任 ${escapeHtml(
        String(meters?.trust ?? 0)
      )} / 压力 ${escapeHtml(String(meters?.pressure ?? 0))} / 风险 ${escapeHtml(String(meters?.risk ?? 0))}</div></div>
      <div class="kv-row"><div class="kv-key">讲解方式</div><div class="kv-val">已改为“整章复盘”：每次选择会自动进入下一幕，本章结束后再统一总结与讲解。</div></div>
    </div>
    ${phraseBlock}

    <h4 style="margin-top:12px">你的选择路径</h4>
    ${items || `<div class="muted small">暂无选择记录。</div>`}

    <div class="row gap" style="margin-top:12px; flex-wrap:wrap">
      <button class="primary" id="btn-debrief-home">回到首页</button>
      <button class="ghost" id="btn-debrief-replay">重玩本章</button>
    </div>
  `;
}

const SCENE_VISUALS = {
  hr: {
    pool: [
      {
        src: "./assets/scene_hr_manager.jpg",
        caption: "你正以用人经理的身份处理候选人沟通、招聘判断与组织预期。"
      },
      {
        src: "./assets/scene_hr_review.jpg",
        caption: "局面进入更正式的内部协同：HC、财务口径与招聘理由都开始被放到台面上。"
      }
    ]
  },
  pm: {
    pool: [
      {
        src: "./assets/scene_pm_warroom.jpg",
        caption: "你正置身上线前夜的战情室，每个承诺都要和法务、技术、销售一起兜底。"
      },
      {
        src: "./assets/scene_pm_legal.jpg",
        caption: "局面从“把功能做出来”升级为“这件事能不能真实地对外表述”。"
      }
    ]
  }
};

const SCENE_VISUAL_BY_ID = {
  hr_s1: {
    src: "./assets/scene_hr_s1.jpg",
    caption: "Offer 谈判刚开始，候选人重新提 scope 和 title，空气里还是礼貌克制的试探。"
  },
  hr_s2_a: {
    src: "./assets/scene_hr_s2_a.jpg",
    caption: "话题被拉进 ownership 深水区，真正的问题变成这个岗位会不会成为三个团队的兜底位。"
  },
  hr_s2_b: {
    src: "./assets/scene_hr_s2_b.jpg",
    caption: "另一个 offer 截止时间压上来，局势明显进入倒计时模式。"
  },
  hr_s2_c: {
    src: "./assets/scene_hr_s2_c.jpg",
    caption: "freeze 传闻突然入局，谈岗位边界的局一下变成谈组织稳定性。"
  },
  hr_s3_a: {
    src: "./assets/scene_hr_s3_a.jpg",
    caption: "电话里开始逐条拆 ownership，谁真正负责、谁只是被动被甩锅，正在一点点浮出来。"
  },
  hr_s3_b: {
    src: "./assets/scene_hr_s3_b.jpg",
    caption: "候选人要今天就听到可承诺的内容，时间压力让每一句话都更重。"
  },
  hr_s3_c: {
    src: "./assets/scene_hr_s3_c.jpg",
    caption: "你必须在不泄密的前提下回应传闻，这种模糊边界最考验真实感。"
  },
  hr_s4: {
    src: "./assets/scene_hr_s4.jpg",
    caption: "HRBP 私信把财务压力和重组传闻一起抛出来，内部线正式接管剧情。"
  },
  hr_s5: {
    src: "./assets/scene_hr_s5.jpg",
    caption: "HC 复核会议邀请弹出来时，外部沟通和内部政治第一次正面相撞。"
  },
  hr_s6: {
    src: "./assets/scene_hr_s6.jpg",
    caption: "一页纸 justification、候选人追问和会议倒计时，同时压到你一个人身上。"
  },
  hr_s7_a: {
    src: "./assets/scene_hr_s7_a.jpg",
    caption: "财务正面质问：为什么一定要招，现在就要你把模糊判断说成可衡量的业务逻辑。"
  },
  hr_s7_b: {
    src: "./assets/scene_hr_s7_b.jpg",
    caption: "候选人把一切压缩成一句话：这个 offer 到底安不安全。"
  },
  hr_s7_c: {
    src: "./assets/scene_hr_s7_c.jpg",
    caption: "坏结局里最安静的一种：你什么都没说，但对方已经等不起了。"
  },
  hr_fail_finance_backfire: {
    src: "./assets/scene_hr_fail_finance_backfire.jpg",
    caption: "你给了财务一个过头的保证，结果下一秒就变成书面追责。"
  },
  hr_fail_trust_break: {
    src: "./assets/scene_hr_fail_trust_break.jpg",
    caption: "那句“别担心”在现实落地时反咬回来，信任感一下塌掉。"
  },
  hr_s8: {
    src: "./assets/scene_hr_s8.jpg",
    caption: "复核暂时过了，但重组传闻又追上来，邮件还没发出去，下一轮风险已经站在门口。"
  },
  hr_s9_a: {
    src: "./assets/scene_hr_s9_a.jpg",
    caption: "候选人把截图甩回来，你再也不能假装那只是背景噪音。"
  },
  hr_s9_b: {
    src: "./assets/scene_hr_s9_b.jpg",
    caption: "用人经理那封过热的邮件草稿，让原本可控的局再次变得危险。"
  },
  hr_fail_backchannel: {
    src: "./assets/scene_hr_fail_backchannel.jpg",
    caption: "你压住谣言的那一刻，对方也决定不再把你当作可信来源。"
  },
  hr_fail_internal_contradiction: {
    src: "./assets/scene_hr_fail_internal_contradiction.jpg",
    caption: "当两封邮件说出两个版本的未来，整个签约节奏会瞬间碎掉。"
  },
  hr_s10: {
    src: "./assets/scene_hr_s10.jpg",
    caption: "新的反转更现实：岗位还能招，但入职要顺延；另一边却给了更快更亮眼的 counteroffer。"
  },
  hr_fail_delay_coverup: {
    src: "./assets/scene_hr_fail_delay_coverup.jpg",
    caption: "坏消息不是你亲自说的那一刻，很多东西就已经回不去了。"
  },
  hr_s11_a: {
    src: "./assets/scene_hr_s11_a.jpg",
    caption: "最后的问题落在重组上：你不是在回答未来，而是在回答变化来时你怎么兜底。"
  },
  hr_fail_reorg_lie: {
    src: "./assets/scene_hr_fail_reorg_lie.jpg",
    caption: "一句“不会变”被未来的组织图打脸时，所有信任都会被截图保存。"
  },
  hr_s11_b: {
    src: "./assets/scene_hr_s11_b.jpg",
    caption: "对方已经明显感到被催，你要么刹车重整秩序，要么把最后的信任压爆。"
  },
  hr_fail_counteroffer: {
    src: "./assets/scene_hr_fail_counteroffer.jpg",
    caption: "最终输掉的不是 title，而是更干净的真话。"
  },
  hr_s12: {
    src: "./assets/scene_hr_s12.jpg",
    caption: "你终于把混乱整理成一份能让人感觉稳定的 closing package。"
  },
  pm_s1: {
    src: "./assets/scene_pm_s1.jpg",
    caption: "客户突然追要 retention toggle，战情室还没开，压力先到了。"
  },
  pm_s2_a: {
    src: "./assets/scene_pm_s2_a.jpg",
    caption: "你先追问什么才算过关，开始从需求表面挖出真正的验收标准。"
  },
  pm_s2_b: {
    src: "./assets/scene_pm_s2_b.jpg",
    caption: "你先给 yes 再收边界，下一步马上要面对技术和安全的拦截。"
  },
  pm_s2_c: {
    src: "./assets/scene_pm_s2_c.jpg",
    caption: "当客户成功提醒你合规负责人会到场时，这已经不是普通 demo 了。"
  },
  pm_s3: {
    src: "./assets/scene_pm_s3.jpg",
    caption: "技术、QA、安全、销售同桌，真正的战情室现在才开始。"
  },
  pm_s4_a: {
    src: "./assets/scene_pm_s4_a.jpg",
    caption: "方案不够，销售还需要一句能立刻转发出去的话。"
  },
  pm_s4_b: {
    src: "./assets/scene_pm_s4_b.jpg",
    caption: "你在更稳的方案和更会卖的话术之间来回拉扯。"
  },
  pm_s5: {
    src: "./assets/scene_pm_s5.jpg",
    caption: "战情室刚稳住，法务又把火点从功能实现拉到对外口径。"
  },
  pm_s6: {
    src: "./assets/scene_pm_s6.jpg",
    caption: "法务问的不是功能能不能演，而是你敢不敢对外这么说。"
  },
  pm_s7_a: {
    src: "./assets/scene_pm_s7_a.jpg",
    caption: "你正在把销售想说的爽句，改成真正能落地的话。"
  },
  pm_s7_b: {
    src: "./assets/scene_pm_s7_b.jpg",
    caption: "红线已经摆在桌上，接下来的每个词都带责任。"
  },
  pm_s7_c: {
    src: "./assets/scene_pm_s7_c.jpg",
    caption: "你试图用最小真实能力去支撑最大的话术安全。"
  },
  pm_fail_legal_blowup: {
    src: "./assets/scene_pm_fail_legal_blowup.jpg",
    caption: "客户一转发，法务立刻全线拉响警报。"
  },
  pm_fail_stopship: {
    src: "./assets/scene_pm_fail_stopship.jpg",
    caption: "一句过头的话，把 Demo 从上线前夜直接打进 stop-ship。"
  },
  pm_s8: {
    src: "./assets/scene_pm_s8.jpg",
    caption: "刚把多方口径对齐，客户又逼你给出书面保证，节奏继续往上抬。"
  },
  pm_s9: {
    src: "./assets/scene_pm_s9.jpg",
    caption: "销售想要更猛的话，法务想要活得下来的话，你要写一封两边都能接受的说明。"
  },
  pm_fail_guarantee: {
    src: "./assets/scene_pm_fail_guarantee.jpg",
    caption: "那封乐观说明被转进安全评审后，所有没依据的句子都开始反噬。"
  },
  pm_s10_a: {
    src: "./assets/scene_pm_s10_a.jpg",
    caption: "安全团队明确告诉你：别再给日期神话，换成 readiness criteria。"
  },
  pm_fail_security_escalation: {
    src: "./assets/scene_pm_fail_security_escalation.jpg",
    caption: "你想给销售 momentum，结果先在公司内部失去信任。"
  },
  pm_s10_b: {
    src: "./assets/scene_pm_s10_b.jpg",
    caption: "readiness matrix 有了，但临场话术还没锁住，真正危险的是明天谁会加戏。"
  },
  pm_fail_rehearsal: {
    src: "./assets/scene_pm_fail_rehearsal.jpg",
    caption: "彩排里每个人都说了不一样的话，翻车其实已经提前发生。"
  },
  pm_s11: {
    src: "./assets/scene_pm_s11.jpg",
    caption: "真正的考题出现在现场追问那一刻：如果现在切到 7 天，生产里到底会发生什么。"
  },
  pm_fail_live_claim: {
    src: "./assets/scene_pm_fail_live_claim.jpg",
    caption: "最危险的问题被交给最会卖的人回答，会议室瞬间冷掉。"
  },
  pm_s12: {
    src: "./assets/scene_pm_s12.jpg",
    caption: "这次客户留下来的，不是最热血的印象，而是一句真的能拿去过合规的话。"
  }
};

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function getVisualMood(choice) {
  if (!choice?.effects) return "neutral";
  const trust = Math.abs(choice.effects.trust || 0);
  const pressure = Math.abs(choice.effects.pressure || 0);
  const risk = Math.abs(choice.effects.risk || 0);
  const max = Math.max(trust, pressure, risk);
  if (max === 0) return "neutral";
  if (risk === max) return "risk";
  if (pressure === max) return "pressure";
  return "trust";
}

function resolveSceneVisual(roleId, sceneId, visualState) {
  const exact = SCENE_VISUAL_BY_ID[sceneId || ""];
  if (exact) {
    const mood = visualState?.mood || "neutral";
    const moodText =
      mood === "trust"
        ? "这一轮选择更偏向建立信任与关系。"
        : mood === "pressure"
        ? "这一轮选择明显强化了节奏和推进压力。"
        : mood === "risk"
        ? "这一轮选择把风险与后果拉到了台前。"
        : "";
    return {
      src: exact.src,
      caption: [exact.caption, moodText].filter(Boolean).join(" "),
      mood
    };
  }
  const roleVisual = SCENE_VISUALS[roleId] || SCENE_VISUALS.hr;
  const pool = roleVisual.pool || [];
  const lateStage = roleId === "hr" ? /^hr_s[678]/.test(sceneId || "") : /^pm_s[678]/.test(sceneId || "");
  const seedBase = visualState?.seed ?? hashString(`${roleId}|${sceneId || "start"}`);
  const index = pool.length ? (seedBase + (lateStage ? 1 : 0)) % pool.length : 0;
  const picked = pool[index] || pool[0];
  const mood = visualState?.mood || "neutral";
  const moodText =
    mood === "trust"
      ? "这一轮选择更偏向建立信任与关系。"
      : mood === "pressure"
      ? "这一轮选择明显强化了节奏和推进压力。"
      : mood === "risk"
      ? "这一轮选择把风险与后果拉到了台前。"
      : "";

  return {
    src: picked?.src || "./assets/scene_hr_manager.jpg",
    caption: [picked?.caption || "", moodText].filter(Boolean).join(" "),
    mood
  };
}

function mergeFallbackScenes(fallback, storyJson) {
  // 如果 fetch 成功，直接使用 storyJson
  if (storyJson?.roles?.some((r) => (r?.chapter?.scenes || []).length > 0)) return storyJson;

  // 若 fetch 失败：尝试从全局 fallback 文件（同目录 story.json）通过 <script> 内嵌；
  // 但当前版本未内嵌，这里至少让 demo 可以启动（只是没有剧情）。
  return fallback;
}

async function main() {
  // DOM
  const appRoot = qs("#app");
  const btnStart = qs("#btn-start");
  const btnContinue = qs("#btn-continue");
  const inputName = qs("#input-name");
  const selectDifficulty = qs("#select-difficulty");
  const toggleCn = qs("#toggle-cn");
  const btnRoleHr = qs("#btn-role-hr");
  const btnRolePm = qs("#btn-role-pm");
  const btnReset = qs("#btn-reset-progress");
  const btnRestart = qs("#btn-restart-chapter");
  const btnStoryHome = qs("#btn-story-home");
  const btnStoryPhrasebook = qs("#btn-story-phrasebook");
  const btnChangeTrack = qs("#btn-change-track");
  const choiceArea = qs("#choice-area");
  const feedback = qs("#feedback");
  const feedbackBody = qs("#feedback-body");
  const btnCloseFeedback = qs("#btn-close-feedback");

  const btnExportPhrases = qs("#btn-export-phrases");
  const btnClearPhrases = qs("#btn-clear-phrases");

  const wordTooltip = document.createElement("div");
  wordTooltip.className = "word-tooltip hidden";
  wordTooltip.innerHTML = `
    <div class="word-tooltip-term" id="word-tooltip-term"></div>
    <div class="word-tooltip-meaning" id="word-tooltip-meaning"></div>
    <div class="word-tooltip-actions">
      <button class="word-tooltip-btn" id="word-tooltip-add">加入生词本</button>
    </div>
  `;
  document.body.appendChild(wordTooltip);
  const wordTooltipTerm = qs("#word-tooltip-term");
  const wordTooltipMeaning = qs("#word-tooltip-meaning");
  const wordTooltipAdd = qs("#word-tooltip-add");

  // Load story
  const fetched = await loadStoryData();
  const story = mergeFallbackScenes(STORY_FALLBACK, fetched);

  // 如果 story.json 加载成功但 fallback 里 scenes 为空，这里同步填充 fallback 结构：
  // 目的：让 file:// 场景加载成功后，也能在 JS 里找到 scenes。
  //（fetch 场景本来就有 scenes）
  if (story?.roles?.length) {
    // no-op
  }

  const sceneIndex = buildSceneIndex(story);

  // Load settings/progress/phrases
  const settings = loadStorage(STORAGE_KEYS.settings, {
    name: "",
    difficulty: "intermediate",
    showCn: false
  });
  const savedProgress = loadStorage(STORAGE_KEYS.progress, null);
  let phrases = normalizePhrases(loadStorage(STORAGE_KEYS.phrases, []));

  // State
  const state = {
    story,
    sceneIndex,
    screenId: "home",
    roleId: savedProgress?.roleId || null,
    sceneId: savedProgress?.sceneId || null,
    meters: savedProgress?.meters || defaultMeters(),
    playLog: Array.isArray(savedProgress?.playLog) ? savedProgress.playLog : [],
    settings,
    activeWordContext: null,
    wordTooltipHideTimer: null,
    visualState: { seed: 0, mood: "neutral", lastChoiceId: null }
  };

  // Init UI from settings
  inputName.value = state.settings.name || "";
  selectDifficulty.value = state.settings.difficulty || "intermediate";
  toggleCn.checked = state.settings.showCn !== false;

  btnContinue.disabled = !savedProgress?.roleId || !savedProgress?.sceneId;

  // Nav
  qsa(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const to = btn.dataset.nav;
      if (!to) return;
      setScreen(to);
      state.screenId = to;
      syncStoryShell();
      if (to === "phrasebook") renderPhrasebook(phrases);
    });
  });

  // Settings change
  const persistSettings = () => {
    state.settings.name = inputName.value.trim();
    state.settings.difficulty = selectDifficulty.value;
    state.settings.showCn = !!toggleCn.checked;
    saveStorage(STORAGE_KEYS.settings, state.settings);
    if (state.roleId && state.sceneId) persistProgress();
    renderCurrentScene(); // 切换提示后即时更新
  };
  inputName.addEventListener("input", persistSettings);
  selectDifficulty.addEventListener("change", persistSettings);
  toggleCn.addEventListener("change", persistSettings);

  function persistProgress() {
    saveStorage(STORAGE_KEYS.progress, {
      roleId: state.roleId,
      sceneId: state.sceneId,
      meters: state.meters,
      playLog: state.playLog
    });
    btnContinue.disabled = !(state.roleId && state.sceneId);
  }

  function syncStoryShell() {
    const storyScreen = qs("#screen-story");
    const inStory = state.screenId === "story";
    const hasStartedStory = !!state.roleId;
    if (storyScreen) storyScreen.classList.toggle("setup-mode", inStory && !hasStartedStory);
    if (appRoot) appRoot.classList.toggle("story-stage", inStory);
    if (appRoot) appRoot.classList.toggle("immersive-mode", inStory && hasStartedStory);
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEYS.progress);
    state.roleId = null;
    state.sceneId = null;
    state.meters = defaultMeters();
    state.playLog = [];
    renderMeters(state.meters);
    btnContinue.disabled = true;
  }

  function clearPhrases() {
    phrases = [];
    saveStorage(STORAGE_KEYS.phrases, phrases);
    renderPhrasebook(phrases);
  }

  function addPhrasesFromChoice(choice, role, chapter) {
    const list = choice.key_phrases || [];
    if (!list.length) return;
    const role_cn = role.name_cn || role.id;
    const chapter_cn = chapter.title_cn || chapter.id;
    for (const text of list) {
      phrases.push({
        text,
        role: role.id,
        role_cn,
        chapter: chapter.id,
        chapter_cn,
        at: nowIso()
      });
    }
    phrases = normalizePhrases(phrases);
    saveStorage(STORAGE_KEYS.phrases, phrases);
  }

  function addGlossaryPhrase(text, meaning, role, chapter) {
    if (!text) return;
    phrases.push({
      text,
      meaning: meaning || "",
      role: role.id,
      role_cn: role.name_cn || role.id,
      chapter: chapter.id,
      chapter_cn: chapter.title_cn || chapter.id,
      at: nowIso()
    });
    phrases = normalizePhrases(phrases);
    saveStorage(STORAGE_KEYS.phrases, phrases);
    renderPhrasebook(phrases);
  }

  function scheduleHideWordTooltip() {
    clearTimeout(state.wordTooltipHideTimer);
    state.wordTooltipHideTimer = setTimeout(() => {
      wordTooltip.classList.add("hidden");
      qsa(".word-hint.is-active").forEach((el) => el.classList.remove("is-active"));
      state.activeWordContext = null;
    }, 120);
  }

  function showWordTooltip(anchor, role, chapter) {
    if (!anchor) return;
    clearTimeout(state.wordTooltipHideTimer);
    qsa(".word-hint.is-active").forEach((el) => {
      if (el !== anchor) el.classList.remove("is-active");
    });
    anchor.classList.add("is-active");

    const text = anchor.getAttribute("data-phrase-text") || "";
    const meaning = anchor.getAttribute("data-phrase-meaning") || "";
    if (!meaning) return;
    state.activeWordContext = { text, meaning, role, chapter, anchor };
    wordTooltipTerm.textContent = text;
    wordTooltipMeaning.textContent = meaning;
    wordTooltip.classList.remove("hidden");

    const rect = anchor.getBoundingClientRect();
    const tooltipRect = wordTooltip.getBoundingClientRect();
    const top = Math.max(12, rect.bottom + 10);
    const left = Math.min(
      window.innerWidth - tooltipRect.width - 12,
      Math.max(12, rect.left + rect.width / 2 - tooltipRect.width / 2)
    );
    wordTooltip.style.top = `${top}px`;
    wordTooltip.style.left = `${left}px`;
  }

  function getRole(roleId) {
    return state.story.roles.find((r) => r.id === roleId) || null;
  }

  function getChapter(role) {
    return role?.chapter || null;
  }

  function getScene(roleId, sceneId) {
    return state.sceneIndex[`${roleId}:${sceneId}`] || null;
  }

  function startRole(roleId) {
    const role = getRole(roleId);
    const chapter = getChapter(role);
    if (!role || !chapter) return;
    state.roleId = roleId;
    state.screenId = "story";
    state.sceneId = chapter.start_scene;
    state.meters = defaultMeters();
    state.playLog = [];
    state.visualState = { seed: hashString(`${roleId}|${chapter.start_scene}`), mood: "neutral", lastChoiceId: null };
    renderMeters(state.meters);
    persistProgress();
    setScreen("story");
    syncStoryShell();
    renderCurrentScene();
  }

  function restartChapter() {
    if (!state.roleId) return;
    startRole(state.roleId);
  }

  function closeFeedback() {
    feedback.classList.add("hidden");
    feedbackBody.innerHTML = "";
  }

  function openDebrief({ role, chapter }) {
    feedbackBody.innerHTML = buildDebriefHtml({
      role,
      chapter,
      log: state.playLog,
      settings: state.settings,
      meters: state.meters
    });
    feedback.classList.remove("hidden");

    const btnHome = qs("#btn-debrief-home");
    const btnReplay = qs("#btn-debrief-replay");
    if (btnHome) {
      btnHome.addEventListener("click", () => {
        closeFeedback();
        state.roleId = null;
        state.sceneId = null;
        state.playLog = [];
        persistProgress();
        setScreen("home");
        state.screenId = "home";
        syncStoryShell();
        renderCurrentScene();
      });
    }
    if (btnReplay) {
      btnReplay.addEventListener("click", () => {
        closeFeedback();
        startRole(role.id);
      });
    }
  }

  function renderCurrentScene() {
    const role = getRole(state.roleId);
    const chapter = getChapter(role);
    const scene = getScene(state.roleId, state.sceneId);
    const guide = qs("#choice-guide");
    const visualWrap = qs(".scene-visual");
    const visual = qs("#scene-visual-image");
    const visualCaption = qs("#scene-visual-caption");

    syncStoryShell();

    qs("#scene-chapter").textContent = role && chapter ? computeSceneTitle(role, chapter) : "";
    qs("#scene-title").textContent = scene ? (scene.id === "END" ? "章节结束" : "当前情境") : "选择故事线并开始";

    if (!scene) {
      if (guide) guide.style.display = "none";
      qs("#dialog-speaker").textContent = "";
      qs("#dialog-en").textContent = "Finish your setup, choose a story line, and the interface will switch into immersive mode.";
      qs("#dialog-cn").textContent = "先完成设置并选择故事线。进入剧情后，顶部、页脚和设置面板都会自动收起。";
      if (visual) visual.src = "./assets/scene_hr_manager.jpg";
      if (visualCaption) visualCaption.textContent = "开局设置完成后，将直接进入剧情，不再保留侧边设置面板。";
      if (visualWrap) visualWrap.dataset.mood = "neutral";
      choiceArea.innerHTML = "";
      closeFeedback();
      return;
    }

    if (guide) guide.style.display = "";
    const hideCn = shouldHideCn(state.settings);
    const showChoiceMeta = state.settings.difficulty === "beginner";
    const name = (state.settings.name || "Alex").trim();

    qs("#dialog-speaker").textContent = scene.speaker_cn ? `${scene.speaker_cn}` : "";
    qs("#dialog-en").innerHTML = annotateEnglish((scene.text_en || "").replaceAll("Alex", name));
    qs("#dialog-cn").textContent = hideCn ? "" : (scene.text_cn || "").replaceAll("Alex", name);
    const currentVisual = resolveSceneVisual(role?.id, scene.id, state.visualState);
    if (visualWrap) {
      visualWrap.dataset.mood = currentVisual.mood || "neutral";
      visualWrap.classList.add("is-refreshing");
      setTimeout(() => visualWrap.classList.remove("is-refreshing"), 260);
    }
    if (visual) visual.src = currentVisual.src;
    if (visualCaption) {
      visualCaption.textContent = currentVisual.caption || "";
    }

    choiceArea.innerHTML = "";
    const choices = scene.choices || [];
    choices.forEach((c, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      const cnLine = hideCn ? "" : `<div class="choice-cn">${escapeHtml(c.text_cn || "")}</div>`;
      const tags = showChoiceMeta
        ? (c.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        : [];
      btn.innerHTML = `
        <div class="choice-label">选项 ${idx + 1}</div>
        <div class="choice-en">${annotateEnglish(c.text_en)}</div>
        ${cnLine}
        ${tags.length ? `<div class="choice-tags">${tags.join("")}</div>` : ""}
      `;
      btn.addEventListener("click", () => onChoose(c, role, chapter));
      choiceArea.appendChild(btn);
    });

    qsa(".word-hint").forEach((el) => {
      el.addEventListener("mouseenter", () => showWordTooltip(el, role, chapter));
      el.addEventListener("mouseleave", scheduleHideWordTooltip);
    });
  }

  function onChoose(choice, role, chapter) {
    const metersBefore = { ...state.meters };
    state.meters.trust = clamp(state.meters.trust + (choice.effects?.trust || 0), 0, 100);
    state.meters.pressure = clamp(state.meters.pressure + (choice.effects?.pressure || 0), 0, 100);
    state.meters.risk = clamp(state.meters.risk + (choice.effects?.risk || 0), 0, 100);
    renderMeters(state.meters);
    const metersAfter = { ...state.meters };

    // 记录“本章复盘日志”：本次选择结束后自动进入下一幕，整章结束再统一讲解
    state.playLog.push({
      at: nowIso(),
      roleId: role.id,
      chapterId: chapter.id,
      sceneId: state.sceneId,
      choiceId: choice.id,
      choice_text_en: choice.text_en || "",
      choice_text_cn: choice.text_cn || "",
      feedback_en: choice.feedback_en || "",
      feedback_cn: choice.feedback_cn || "",
      deltas: {
        trust: (choice.effects?.trust || 0) * 1,
        pressure: (choice.effects?.pressure || 0) * 1,
        risk: (choice.effects?.risk || 0) * 1
      },
      key_phrases: choice.key_phrases || [],
      metersBefore,
      metersAfter,
      next: choice.next || null
    });
    // 避免日志无限增长（极端情况下）
    if (state.playLog.length > 80) state.playLog = state.playLog.slice(-80);

    // 自动收集关键表达（不再每次弹出“加入短语本”面板）
    addPhrasesFromChoice(choice, role, chapter);

    // 防止连点
    qsa(".choice-btn").forEach((b) => (b.disabled = true));

    const next = choice.next;
    state.visualState = {
      seed: hashString(`${role.id}|${next || "END"}|${choice.id}`),
      mood: getVisualMood(choice),
      lastChoiceId: choice.id
    };
    if (next === "END") {
      // 章节结束：保留本章日志用于复盘，清空进度以便评审更容易重玩
      state.sceneId = null;
      persistProgress();
      openDebrief({ role, chapter });
      return;
    }

    if (next) {
      // 轻微延迟让点击反馈更自然
      setTimeout(() => {
        state.sceneId = next;
        persistProgress();
        renderCurrentScene();
      }, 120);
    }
  }

  // Buttons
  btnStart.addEventListener("click", () => {
    state.roleId = null;
    state.sceneId = null;
    state.meters = defaultMeters();
    state.playLog = [];
    renderMeters(state.meters);
    persistProgress();
    setScreen("story");
    state.screenId = "story";
    syncStoryShell();
    closeFeedback();
    renderCurrentScene();
  });

  btnContinue.addEventListener("click", () => {
    if (!savedProgress?.roleId || !savedProgress?.sceneId) return;
    state.roleId = savedProgress.roleId;
    state.sceneId = savedProgress.sceneId;
    state.meters = savedProgress.meters || defaultMeters();
    renderMeters(state.meters);
    setScreen("story");
    state.screenId = "story";
    syncStoryShell();
    renderCurrentScene();
  });

  btnRoleHr.addEventListener("click", () => startRole("hr"));
  btnRolePm.addEventListener("click", () => startRole("pm"));
  btnReset.addEventListener("click", () => {
    if (!confirm("确定清空试玩进度吗？（短语本不会清空）")) return;
    resetProgress();
    closeFeedback();
    renderCurrentScene();
  });

  btnRestart.addEventListener("click", () => {
    if (!state.roleId) return;
    if (!confirm("确定重开本章吗？当前进度会丢失。")) return;
    restartChapter();
    closeFeedback();
  });

  btnStoryHome.addEventListener("click", () => {
    closeFeedback();
    setScreen("home");
    state.screenId = "home";
    syncStoryShell();
  });

  btnStoryPhrasebook.addEventListener("click", () => {
    closeFeedback();
    setScreen("phrasebook");
    state.screenId = "phrasebook";
    syncStoryShell();
    renderPhrasebook(phrases);
  });

  btnChangeTrack.addEventListener("click", () => {
    if (!confirm("返回故事线选择？当前章节进度会重置。")) return;
    closeFeedback();
    state.roleId = null;
    state.sceneId = null;
    state.meters = defaultMeters();
    state.playLog = [];
    renderMeters(state.meters);
    persistProgress();
    setScreen("story");
    state.screenId = "story";
    syncStoryShell();
    renderCurrentScene();
  });

  btnCloseFeedback.addEventListener("click", closeFeedback);

  wordTooltip.addEventListener("mouseenter", () => clearTimeout(state.wordTooltipHideTimer));
  wordTooltip.addEventListener("mouseleave", scheduleHideWordTooltip);
  wordTooltipAdd.addEventListener("click", () => {
    const ctx = state.activeWordContext;
    if (!ctx) return;
    addGlossaryPhrase(ctx.text, ctx.meaning, ctx.role, ctx.chapter);
    if (ctx.anchor) {
      ctx.anchor.classList.add("word-added");
      setTimeout(() => ctx.anchor.classList.remove("word-added"), 900);
    }
    wordTooltipAdd.textContent = "已加入";
    setTimeout(() => {
      wordTooltipAdd.textContent = "加入生词本";
    }, 900);
  });

  document.addEventListener("scroll", () => scheduleHideWordTooltip(), true);
  window.addEventListener("resize", () => scheduleHideWordTooltip());

  // Phrasebook
  btnExportPhrases.addEventListener("click", () => {
    const lines = phrases.map(
      (p) =>
        `- ${p.text}${p.meaning ? `：${p.meaning}` : ""}\n  来源：${p.role_cn || p.role} / ${p.chapter_cn || p.chapter}\n  时间：${(
          p.at || ""
        ).slice(0, 19).replace("T", " ")}`
    );
    const content = `Global Office · 短语本导出\n\n${lines.join("\n\n")}\n`;
    downloadText("global-office-phrases.txt", content);
  });

  btnClearPhrases.addEventListener("click", () => {
    if (!confirm("确定清空短语本吗？")) return;
    clearPhrases();
  });

  // 初次渲染
  renderMeters(state.meters);
  renderPhrasebook(phrases);
  setScreen("home");
  state.screenId = "home";
  syncStoryShell();
  renderCurrentScene();

  // 如果 story.json 读取失败且没有剧情，提示用户
  const hasScenes = state.story.roles?.some((r) => (r?.chapter?.scenes || []).length > 0);
  if (!hasScenes) {
    console.warn(
      "剧情数据未加载：如果你是直接双击打开 index.html（file://），请尝试用本地服务器打开或确认 assets/story.json 存在。"
    );
  }
}

document.addEventListener("DOMContentLoaded", main);
