package com.hedging.engine.ai;

import dev.langchain4j.model.output.structured.Description;

public class HedgeEvaluation {

    @Description("对用户冲动消费行为的冷酷量化分析话术，包含情绪触发点、NPV损失、沉没成本评估，200字以内")
    private String analysisMessage;

    @Description("具体可执行的零成本或低成本对冲方案，包含做什么、做多久、预期情绪收益")
    private String hedgeSuggestion;

    @Description("采纳该对冲方案后预估的核心资本、现金流健康度、风险敞口变化矩阵")
    private EstimatedMatrixImpact estimatedMatrixImpact;

    public String getAnalysisMessage() {
        return analysisMessage;
    }

    public void setAnalysisMessage(String analysisMessage) {
        this.analysisMessage = analysisMessage;
    }

    public String getHedgeSuggestion() {
        return hedgeSuggestion;
    }

    public void setHedgeSuggestion(String hedgeSuggestion) {
        this.hedgeSuggestion = hedgeSuggestion;
    }

    public EstimatedMatrixImpact getEstimatedMatrixImpact() {
        return estimatedMatrixImpact;
    }

    public void setEstimatedMatrixImpact(EstimatedMatrixImpact estimatedMatrixImpact) {
        this.estimatedMatrixImpact = estimatedMatrixImpact;
    }
}
