package com.hedging.engine.controller;

import com.hedging.engine.dto.AlternativeRankingItem;
import com.hedging.engine.dto.AlternativeSuggestion;
import com.hedging.engine.dto.HedgeDecideRequest;
import com.hedging.engine.dto.HedgeEvaluateRequest;
import com.hedging.engine.dto.HedgeEvaluateResponse;
import com.hedging.engine.dto.UseAlternativeResponse;
import com.hedging.engine.entity.HedgeEvent;
import com.hedging.engine.entity.PortfolioState;
import com.hedging.engine.service.AlternativeService;
import com.hedging.engine.service.HedgeService;
import com.hedging.engine.service.PortfolioService;
import com.hedging.engine.util.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HedgeController {

    private final HedgeService hedgeService;
    private final PortfolioService portfolioService;
    private final AlternativeService alternativeService;

    public HedgeController(HedgeService hedgeService, PortfolioService portfolioService,
            AlternativeService alternativeService) {
        this.hedgeService = hedgeService;
        this.portfolioService = portfolioService;
        this.alternativeService = alternativeService;
    }

    /**
     * 提交消费念头，获取 AI 对冲评估。
     */
    @PostMapping("/hedge/evaluate")
    public HedgeEvaluateResponse evaluate(@Valid @RequestBody HedgeEvaluateRequest request) {
        return hedgeService.evaluate(request.getAmount(), request.getOriginalIntention());
    }

    /**
     * 提交用户最终决定，触发状态模型更新。
     */
    @PostMapping("/hedge/decide")
    public PortfolioState decide(@Valid @RequestBody HedgeDecideRequest request) {
        return hedgeService.decide(request.getEventId(), request.getDecision());
    }

    /**
     * 获取当前投资组合量化指标。
     */
    @GetMapping("/portfolio/state")
    public PortfolioState getPortfolioState() {
        return portfolioService.getCurrentState();
    }

    /**
     * 获取对冲事件日志（按时间倒序）。
     */
    @GetMapping("/hedge/events")
    public List<HedgeEvent> getEvents() {
        return portfolioService.findAllEvents();
    }

    /**
     * 获取系统预设的零成本/低成本平替方案列表（含真实采用次数）。
     */
    @GetMapping("/hedge/alternatives")
    public List<AlternativeSuggestion> getAlternatives() {
        return alternativeService.listAlternatives();
    }

    /**
     * 记录用户采用某个平替方案。
     * 同一 IP 在 TTL 内只能投票一次，Redis 原子操作保证高并发下计数准确。
     */
    @PostMapping("/hedge/alternatives/use")
    public UseAlternativeResponse useAlternative(@RequestParam String title, HttpServletRequest request) {
        String ip = IpUtils.extractClientIp(request);
        AlternativeService.AlternativeUsageResult result = alternativeService.useAlternative(title, ip);
        return new UseAlternativeResponse(
                result.isAccepted(),
                result.getTitle(),
                result.getCurrentCount(),
                result.getMessage());
    }

    /**
     * 获取平替方案排行榜。
     */
    @GetMapping("/hedge/alternatives/ranking")
    public List<AlternativeRankingItem> getAlternativeRanking() {
        return alternativeService.getRanking();
    }
}
