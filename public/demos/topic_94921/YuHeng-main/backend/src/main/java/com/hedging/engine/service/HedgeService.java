package com.hedging.engine.service;

import com.hedging.engine.ai.EstimatedMatrixImpact;
import com.hedging.engine.ai.HedgeEvaluation;
import com.hedging.engine.ai.HedgingAgent;
import com.hedging.engine.dto.HedgeEvaluateResponse;
import com.hedging.engine.entity.DecisionStatus;
import com.hedging.engine.entity.EstimatedImpact;
import com.hedging.engine.entity.HedgeEvent;
import com.hedging.engine.entity.PortfolioState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HedgeService {

    private static final Logger log = LoggerFactory.getLogger(HedgeService.class);

    /**
     * 默认年化收益率，用于本地兜底 NPV 估算。
     */
    private static final double DEFAULT_ANNUAL_RETURN = 0.07;

    private final HedgingAgent hedgingAgent;
    private final PortfolioService portfolioService;

    public HedgeService(HedgingAgent hedgingAgent, PortfolioService portfolioService) {
        this.hedgingAgent = hedgingAgent;
        this.portfolioService = portfolioService;
    }

    /**
     * 调用 AI 对冲代理评估用户冲动消费念头，并持久化为 PENDING 状态的对冲事件。
     * <p>
     * 当 AI 服务（OpenAI/SiliconFlow 等）因余额不足、网络抖动或配置错误不可用时，
     * 自动降级为本地量化兜底模型，保证前端评估流程不中断。
     */
    public HedgeEvaluateResponse evaluate(double amount, String originalIntention) {
        log.debug("开始评估对冲事件: amount={}, intention={}", amount, originalIntention);

        HedgeEvaluation evaluation;
        try {
            evaluation = hedgingAgent.evaluate(amount, originalIntention);
        } catch (Exception e) {
            log.warn("AI 评估调用失败，使用本地兜底模型. amount={}, intention={}, error={}",
                    amount, originalIntention, e.getMessage());
            evaluation = buildFallbackEvaluation(amount, originalIntention, e);
        }

        HedgeEvent event = new HedgeEvent(amount, originalIntention);
        event.setAnalysisMessage(evaluation.getAnalysisMessage());
        event.setHedgeSuggestion(evaluation.getHedgeSuggestion());

        EstimatedMatrixImpact matrix = evaluation.getEstimatedMatrixImpact();
        if (matrix != null) {
            event.setEstimatedImpact(new EstimatedImpact(
                    matrix.getCoreCapitalDelta(),
                    matrix.getCashFlowDelta(),
                    matrix.getRiskExposureDelta()
            ));
        }

        HedgeEvent saved = portfolioService.saveEvaluatedEvent(event);
        log.debug("对冲事件已保存: eventId={}", saved.getId());

        return new HedgeEvaluateResponse(
                saved.getId(),
                saved.getAmount(),
                saved.getOriginalIntention(),
                evaluation.getAnalysisMessage(),
                evaluation.getHedgeSuggestion(),
                evaluation.getEstimatedMatrixImpact()
        );
    }

    /**
     * 本地兜底评估：当外部 AI 服务不可用时，基于资金时间价值给出保守估算。
     */
    private HedgeEvaluation buildFallbackEvaluation(double amount, String originalIntention, Exception cause) {
        // 保守假设：冲动消费金额全部为核心资本流失；若执行 7% 年化投资，5 年后价值约为 1.4 倍
        double futureValue = amount * Math.pow(1 + DEFAULT_ANNUAL_RETURN, 5);
        double opportunityCost = futureValue - amount;

        EstimatedMatrixImpact matrix = new EstimatedMatrixImpact();
        matrix.setCoreCapitalDelta(amount); // 采纳对冲即可保留这笔本金
        matrix.setCashFlowDelta(Math.min(amount / 1000.0, 5.0)); // 每千元约 +1 现金流健康度，封顶 5
        matrix.setRiskExposureDelta(-amount * 0.3); // 减少 30% 冲动消费带来的预算风险敞口

        HedgeEvaluation evaluation = new HedgeEvaluation();
        String reason = (cause != null && cause.getMessage() != null)
                ? "AI 服务暂时不可用（" + cause.getMessage() + "），已切换本地量化模型。"
                : "AI 服务暂时不可用，已切换本地量化模型。";
        evaluation.setAnalysisMessage(String.format(
                "%s该笔 ¥%.2f 若投入年化 %.0f%% 的组合，5 年后机会成本约 ¥%.2f。冲动消费本质是用未来现金流换取即时多巴胺，建议延迟 48 小时再决策。",
                reason, amount, DEFAULT_ANNUAL_RETURN * 100, opportunityCost));
        evaluation.setHedgeSuggestion(
                "【零成本对冲】将这笔消费金额转入余额宝/货币基金并设置 48 小时冷静期；同时选择一项零成本替代方案（如城市暴走 5 公里、沉浸式游戏 2 小时）释放多巴胺。");
        evaluation.setEstimatedMatrixImpact(matrix);
        return evaluation;
    }

    /**
     * 提交用户最终决策，触发投资组合状态更新。
     */
    public PortfolioState decide(Long eventId, DecisionStatus decision) {
        log.debug("提交对冲决策: eventId={}, decision={}", eventId, decision);
        return portfolioService.applyDecision(eventId, decision);
    }
}
