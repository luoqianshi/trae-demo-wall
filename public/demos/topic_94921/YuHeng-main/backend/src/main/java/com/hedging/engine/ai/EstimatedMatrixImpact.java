package com.hedging.engine.ai;

import dev.langchain4j.model.output.structured.Description;

public class EstimatedMatrixImpact {

    @Description("核心资本预期变化量（元），正数表示增长，负数表示减少")
    private Double coreCapitalDelta;

    @Description("现金流健康度预期变化量，范围建议 -5 到 +5")
    private Double cashFlowDelta;

    @Description("风险敞口预期变化量（元），正数表示扩大，负数表示收缩")
    private Double riskExposureDelta;

    public Double getCoreCapitalDelta() {
        return coreCapitalDelta;
    }

    public void setCoreCapitalDelta(Double coreCapitalDelta) {
        this.coreCapitalDelta = coreCapitalDelta;
    }

    public Double getCashFlowDelta() {
        return cashFlowDelta;
    }

    public void setCashFlowDelta(Double cashFlowDelta) {
        this.cashFlowDelta = cashFlowDelta;
    }

    public Double getRiskExposureDelta() {
        return riskExposureDelta;
    }

    public void setRiskExposureDelta(Double riskExposureDelta) {
        this.riskExposureDelta = riskExposureDelta;
    }
}
