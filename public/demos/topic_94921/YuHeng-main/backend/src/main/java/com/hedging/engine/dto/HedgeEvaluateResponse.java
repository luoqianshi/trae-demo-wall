package com.hedging.engine.dto;

import com.hedging.engine.ai.EstimatedMatrixImpact;

public class HedgeEvaluateResponse {

    private Long eventId;
    private Double amount;
    private String originalIntention;
    private String analysisMessage;
    private String hedgeSuggestion;
    private EstimatedMatrixImpact estimatedMatrixImpact;

    public HedgeEvaluateResponse() {
    }

    public HedgeEvaluateResponse(Long eventId, Double amount, String originalIntention,
                                 String analysisMessage, String hedgeSuggestion,
                                 EstimatedMatrixImpact estimatedMatrixImpact) {
        this.eventId = eventId;
        this.amount = amount;
        this.originalIntention = originalIntention;
        this.analysisMessage = analysisMessage;
        this.hedgeSuggestion = hedgeSuggestion;
        this.estimatedMatrixImpact = estimatedMatrixImpact;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
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

    public EstimatedMatrixImpact getEstimatedMatrixImpact() {
        return estimatedMatrixImpact;
    }

    public void setEstimatedMatrixImpact(EstimatedMatrixImpact estimatedMatrixImpact) {
        this.estimatedMatrixImpact = estimatedMatrixImpact;
    }
}
