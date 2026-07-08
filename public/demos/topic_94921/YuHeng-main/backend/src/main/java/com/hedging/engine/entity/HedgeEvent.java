package com.hedging.engine.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class HedgeEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 冲动消费金额
    private Double amount;

    // 原始意图 / 消费念头
    @Column(length = 2000)
    private String originalIntention;

    // AI 分析话术
    @Column(length = 3000)
    private String analysisMessage;

    // AI 建议的对冲方案
    @Column(length = 2000)
    private String hedgeSuggestion;

    // AI 预估的参数变化矩阵
    @Embedded
    private EstimatedImpact estimatedImpact;

    // 用户最终决策状态
    @Enumerated(EnumType.STRING)
    private DecisionStatus decisionStatus;

    // 事件创建时间
    private LocalDateTime createdAt;

    // 决策时间
    private LocalDateTime decidedAt;

    public HedgeEvent() {
        this.decisionStatus = DecisionStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public HedgeEvent(Double amount, String originalIntention) {
        this();
        this.amount = amount;
        this.originalIntention = originalIntention;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getOriginalIntention() {
        return originalIntention;
    }

    public void setOriginalIntention(String originalIntention) {
        this.originalIntention = originalIntention;
    }

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

    public EstimatedImpact getEstimatedImpact() {
        return estimatedImpact;
    }

    public void setEstimatedImpact(EstimatedImpact estimatedImpact) {
        this.estimatedImpact = estimatedImpact;
    }

    public DecisionStatus getDecisionStatus() {
        return decisionStatus;
    }

    public void setDecisionStatus(DecisionStatus decisionStatus) {
        this.decisionStatus = decisionStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }
}
