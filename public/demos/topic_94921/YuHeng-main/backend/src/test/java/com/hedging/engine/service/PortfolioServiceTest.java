package com.hedging.engine.service;

import com.hedging.engine.entity.DecisionStatus;
import com.hedging.engine.entity.HedgeEvent;
import com.hedging.engine.entity.PortfolioState;
import com.hedging.engine.repository.HedgeEventRepository;
import com.hedging.engine.repository.PortfolioStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Import(PortfolioService.class)
class PortfolioServiceTest {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private PortfolioStateRepository portfolioStateRepository;

    @Autowired
    private HedgeEventRepository hedgeEventRepository;

    @BeforeEach
    void setUp() {
        portfolioStateRepository.deleteAll();
        hedgeEventRepository.deleteAll();
    }

    @Test
    void initializeState_shouldCreateDefaultStateWhenEmpty() {
        PortfolioState state = portfolioService.initializeState();

        assertThat(state.getCoreCapital()).isEqualTo(100000.0);
        assertThat(state.getCashFlowHealth()).isEqualTo(95.0);
        assertThat(state.getEmotionalROI()).isEqualTo(8.5);
        assertThat(state.getRiskExposure()).isEqualTo(5000.0);
        assertThat(portfolioStateRepository.count()).isEqualTo(1);
    }

    @Test
    void initializeState_shouldReturnExistingStateWhenAlreadyPresent() {
        PortfolioState first = portfolioService.initializeState();
        PortfolioState second = portfolioService.initializeState();

        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(portfolioStateRepository.count()).isEqualTo(1);
    }

    @Test
    void applyDecision_acceptedHedge_shouldIncreaseCoreCapitalAndEmotionalROI() {
        portfolioService.initializeState();
        HedgeEvent event = portfolioService.saveEvaluatedEvent(new HedgeEvent(1000.0, "想买耳机"));

        PortfolioState state = portfolioService.applyDecision(event.getId(), DecisionStatus.ACCEPTED_HEDGE);

        assertThat(state.getCoreCapital()).isGreaterThan(100000.0);
        assertThat(state.getEmotionalROI()).isGreaterThan(8.5);
        assertThat(state.getCashFlowHealth()).isGreaterThanOrEqualTo(95.0);
        assertThat(state.getRiskExposure()).isLessThan(5000.0);

        HedgeEvent updated = hedgeEventRepository.findById(event.getId()).orElseThrow();
        assertThat(updated.getDecisionStatus()).isEqualTo(DecisionStatus.ACCEPTED_HEDGE);
        assertThat(updated.getDecidedAt()).isNotNull();
    }

    @Test
    void applyDecision_rejectedHedge_shouldDecreaseCoreCapitalAndIncreaseRiskExposure() {
        portfolioService.initializeState();
        HedgeEvent event = portfolioService.saveEvaluatedEvent(new HedgeEvent(1000.0, "想买耳机"));

        PortfolioState state = portfolioService.applyDecision(event.getId(), DecisionStatus.REJECTED_HEDGE);

        assertThat(state.getCoreCapital()).isEqualTo(99000.0);
        assertThat(state.getCashFlowHealth()).isLessThan(95.0);
        assertThat(state.getEmotionalROI()).isLessThan(8.5);
        assertThat(state.getRiskExposure()).isGreaterThan(5000.0);

        HedgeEvent updated = hedgeEventRepository.findById(event.getId()).orElseThrow();
        assertThat(updated.getDecisionStatus()).isEqualTo(DecisionStatus.REJECTED_HEDGE);
    }

    @Test
    void applyDecision_duplicateDecision_shouldThrowIllegalStateException() {
        portfolioService.initializeState();
        HedgeEvent event = portfolioService.saveEvaluatedEvent(new HedgeEvent(1000.0, "想买耳机"));

        portfolioService.applyDecision(event.getId(), DecisionStatus.ACCEPTED_HEDGE);

        assertThatThrownBy(() -> portfolioService.applyDecision(event.getId(), DecisionStatus.ACCEPTED_HEDGE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("已决策");
    }

    @Test
    void saveEvaluatedEvent_shouldPersistPendingEvent() {
        HedgeEvent event = portfolioService.saveEvaluatedEvent(new HedgeEvent(2000.0, "想买显示器"));

        assertThat(event.getId()).isNotNull();
        assertThat(event.getDecisionStatus()).isEqualTo(DecisionStatus.PENDING);
        assertThat(event.getCreatedAt()).isNotNull();

        List<HedgeEvent> events = portfolioService.findAllEvents();
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getAmount()).isEqualTo(2000.0);
    }
}
