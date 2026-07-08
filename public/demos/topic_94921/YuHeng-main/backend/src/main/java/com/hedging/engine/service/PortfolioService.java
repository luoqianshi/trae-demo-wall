package com.hedging.engine.service;

import com.hedging.engine.entity.DecisionStatus;
import com.hedging.engine.entity.HedgeEvent;
import com.hedging.engine.entity.PortfolioState;
import com.hedging.engine.repository.HedgeEventRepository;
import com.hedging.engine.repository.PortfolioStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PortfolioService {

    private final PortfolioStateRepository portfolioStateRepository;
    private final HedgeEventRepository hedgeEventRepository;

    public PortfolioService(PortfolioStateRepository portfolioStateRepository,
                            HedgeEventRepository hedgeEventRepository) {
        this.portfolioStateRepository = portfolioStateRepository;
        this.hedgeEventRepository = hedgeEventRepository;
    }

    /**
     * 初始化用户投资组合状态。
     * 若数据库中已存在状态，则直接返回；否则创建默认初始状态。
     */
    public PortfolioState initializeState() {
        List<PortfolioState> states = portfolioStateRepository.findAll();
        if (!states.isEmpty()) {
            return states.get(0);
        }
        PortfolioState initial = PortfolioState.initialize();
        return portfolioStateRepository.save(initial);
    }

    /**
     * 获取当前投资组合状态。
     */
    @Transactional(readOnly = true)
    public PortfolioState getCurrentState() {
        return portfolioStateRepository.findAll()
                .stream()
                .findFirst()
                .orElseGet(this::initializeState);
    }

    /**
     * 根据对冲事件的最终决策，动态更新投资组合状态。
     */
    public PortfolioState applyDecision(Long eventId, DecisionStatus decisionStatus) {
        HedgeEvent event = hedgeEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("对冲事件不存在: " + eventId));

        if (event.getDecisionStatus() != DecisionStatus.PENDING) {
            throw new IllegalStateException("该事件已决策，不可重复提交");
        }

        PortfolioState state = getCurrentState();
        double amount = event.getAmount() != null ? event.getAmount() : 0.0;

        switch (decisionStatus) {
            case ACCEPTED_HEDGE -> applyAcceptedHedge(state, amount);
            case REJECTED_HEDGE -> applyRejectedHedge(state, amount);
            default -> throw new IllegalArgumentException("非法决策状态: " + decisionStatus);
        }

        event.setDecisionStatus(decisionStatus);
        event.setDecidedAt(LocalDateTime.now());
        hedgeEventRepository.save(event);
        portfolioStateRepository.save(state);

        return state;
    }

    /**
     * 接受对冲方案：核心资本与情绪收益率呈指数或线性上升，风险敞口收缩。
     */
    private void applyAcceptedHedge(PortfolioState state, double amount) {
        // 节约下来的资金按复利逻辑滚入核心资本
        double savedCapital = amount * 0.85;
        double newCoreCapital = state.getCoreCapital() + savedCapital;
        state.setCoreCapital(newCoreCapital);

        // 现金流健康度小幅修复（流动性改善）
        double cashFlowBoost = Math.min(amount * 0.05, 3.0);
        state.setCashFlowHealth(clamp(state.getCashFlowHealth() + cashFlowBoost, 0.0, 100.0));

        // 情绪收益率指数型增长（克制冲动带来的心智复利）
        double currentROI = state.getEmotionalROI();
        double roiBoost = amount * 0.002;
        state.setEmotionalROI(currentROI + roiBoost + currentROI * 0.02);

        // 风险敞口按对冲强度衰减
        double riskDecay = amount * 0.10;
        state.setRiskExposure(Math.max(0.0, state.getRiskExposure() - riskDecay));
    }

    /**
     * 拒绝对冲并执意消费：风险敞口扩大，现金流健康度下降，核心资本小幅侵蚀。
     */
    private void applyRejectedHedge(PortfolioState state, double amount) {
        // 消费直接减少核心资本
        state.setCoreCapital(Math.max(0.0, state.getCoreCapital() - amount));

        // 现金流健康度线性下降
        double cashFlowDamage = Math.min(amount * 0.08, 8.0);
        state.setCashFlowHealth(clamp(state.getCashFlowHealth() - cashFlowDamage, 0.0, 100.0));

        // 情绪收益率因后悔成本而下降
        state.setEmotionalROI(Math.max(0.0, state.getEmotionalROI() - amount * 0.003));

        // 风险敞口（沉没成本）加速累积，呈非线性扩大
        double riskExpansion = amount * 1.15;
        state.setRiskExposure(state.getRiskExposure() + riskExpansion);
    }

    /**
     * 保存一次由 AI 评估后的对冲事件（此时决策状态为 PENDING）。
     */
    public HedgeEvent saveEvaluatedEvent(HedgeEvent event) {
        if (event.getDecisionStatus() == null) {
            event.setDecisionStatus(DecisionStatus.PENDING);
        }
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(LocalDateTime.now());
        }
        return hedgeEventRepository.save(event);
    }

    /**
     * 查询所有对冲事件日志，按创建时间倒序。
     */
    @Transactional(readOnly = true)
    public List<HedgeEvent> findAllEvents() {
        return hedgeEventRepository.findAllByOrderByCreatedAtDesc();
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
