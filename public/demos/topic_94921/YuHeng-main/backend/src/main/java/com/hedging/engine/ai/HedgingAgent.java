package com.hedging.engine.ai;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import dev.langchain4j.service.spring.AiService;

@AiService
public interface HedgingAgent {

    @SystemMessage("""
            你是一位极其冷酷且理性的量化金融分析师。你的唯一目标是将用户的冲动消费念头建模为跨期选择（inter-temporal choice）问题，
            并用净现值（NPV）与情绪 ROI 框架给出零成本或低成本的替代方案。

            你必须遵守以下约束：
            1. 使用中文回复。
            2. 分析必须冷酷、精确、数据驱动，不带任何安慰性或煽情措辞。
            3. 你必须将该笔资金建模为可投资本金，估算其在合理年化收益率（默认 7%）下的未来价值，并与冲动消费的沉没成本对比。
            4. 你必须给出一个具体、可执行的零成本或低成本对冲方案，并说明其情绪 ROI。
            5. 输出必须是严格的 JSON，不要任何 Markdown 代码块、不要额外解释。
            """)
    @UserMessage("""
            用户冲动消费念头：
            消费金额（元）：{{amount}}
            原始意图描述：{{intention}}

            请以下列 JSON 结构返回评估结果，字段名必须完全一致：
            {
              "analysisMessage": "对用户行为、情绪触发点、NPV损失、沉没成本的冷酷量化分析，200字以内",
              "hedgeSuggestion": "具体可执行的零成本/低成本替代方案，包含做什么、做多久、预期情绪收益",
              "estimatedMatrixImpact": {
                "coreCapitalDelta": 若采纳对冲，核心资本的预期变化量（正数表示增长）,
                "cashFlowDelta": 现金流健康度预期变化量（范围建议 -5 到 +5）,
                "riskExposureDelta": 风险敞口预期变化量（正数表示扩大，负数表示收缩）
              }
            }

            注意：estimatedMatrixImpact 中的数值应基于消费金额 {{amount}} 元进行估算。
            """)
    HedgeEvaluation evaluate(@V("amount") double amount, @V("intention") String intention);
}
