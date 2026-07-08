package com.hedging.engine.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class PortfolioState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 核心资本 / 净值：代表长期积累的净资产
    private Double coreCapital;

    // 现金流健康度：代表流动性与可持续消费能力
    private Double cashFlowHealth;

    // 情绪收益率：代表心智健康度与替代方案带来的心理回报
    private Double emotionalROI;

    // 风险敞口 / 沉没成本：代表非理性消费导致的负债或机会损失
    private Double riskExposure;

    public PortfolioState() {
    }

    public PortfolioState(Double coreCapital, Double cashFlowHealth, Double emotionalROI, Double riskExposure) {
        this.coreCapital = coreCapital;
        this.cashFlowHealth = cashFlowHealth;
        this.emotionalROI = emotionalROI;
        this.riskExposure = riskExposure;
    }

    public static PortfolioState initialize() {
        return new PortfolioState(100000.0, 95.0, 8.5, 5000.0);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getCoreCapital() {
        return coreCapital;
    }

    public void setCoreCapital(Double coreCapital) {
        this.coreCapital = coreCapital;
    }

    public Double getCashFlowHealth() {
        return cashFlowHealth;
    }

    public void setCashFlowHealth(Double cashFlowHealth) {
        this.cashFlowHealth = cashFlowHealth;
    }

    public Double getEmotionalROI() {
        return emotionalROI;
    }

    public void setEmotionalROI(Double emotionalROI) {
        this.emotionalROI = emotionalROI;
    }

    public Double getRiskExposure() {
        return riskExposure;
    }

    public void setRiskExposure(Double riskExposure) {
        this.riskExposure = riskExposure;
    }

    @Override
    public String toString() {
        return "PortfolioState{" +
                "id=" + id +
                ", coreCapital=" + coreCapital +
                ", cashFlowHealth=" + cashFlowHealth +
                ", emotionalROI=" + emotionalROI +
                ", riskExposure=" + riskExposure +
                '}';
    }
}
