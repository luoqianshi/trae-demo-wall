package com.hedging.engine.dto;

import com.hedging.engine.entity.DecisionStatus;
import jakarta.validation.constraints.NotNull;

public class HedgeDecideRequest {

    @NotNull(message = "事件 ID 不能为空")
    private Long eventId;

    @NotNull(message = "决策状态不能为空")
    private DecisionStatus decision;

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public DecisionStatus getDecision() {
        return decision;
    }

    public void setDecision(DecisionStatus decision) {
        this.decision = decision;
    }
}
