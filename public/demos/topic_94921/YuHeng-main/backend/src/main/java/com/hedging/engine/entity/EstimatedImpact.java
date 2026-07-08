package com.hedging.engine.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class EstimatedImpact {

    // 核心资本预期变化量
    private Double coreCapitalDelta;

    // 现金流健康度预期变化量
    private Double cashFlowDelta;

    // 风险敞口预期变化量
    private Double riskExposureDelta;

    public EstimatedImpact() {
    }

    public EstimatedImpact(Double coreCapitalDelta, Double cashFlowDelta, Double riskExposureDelta) {
        this.coreCapitalDelta = coreCapitalDelta;
        this.cashFlowDelta = cashFlowDelta;
        this.riskExposureDelta = riskExposureDelta;
    }

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
