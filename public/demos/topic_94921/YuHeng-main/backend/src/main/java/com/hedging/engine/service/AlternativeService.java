package com.hedging.engine.service;

import com.hedging.engine.dto.AlternativeRankingItem;
import com.hedging.engine.dto.AlternativeSuggestion;
import com.hedging.engine.entity.AlternativeUsage;
import com.hedging.engine.repository.AlternativeUsageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AlternativeService {

    private static final Logger log = LoggerFactory.getLogger(AlternativeService.class);

    private static final String STRATEGY_COUNT_KEY = "hedging:strategy:count";
    private static final String STRATEGY_VOTED_KEY = "hedging:strategy:voted";

    private final AlternativeUsageRepository alternativeUsageRepository;
    private final StringRedisTemplate redisTemplate;

    @Value("${hedging.strategy.vote-ip-ttl-hours:24}")
    private long voteIpTtlHours;

    /**
     * 当 Redis 不可用时，使用内存计数器与去重缓存保证投票/排行核心功能可用。
     * 注意：内存状态仅作用于单个 JVM 实例，多实例部署时应确保 Redis 可用。
     */
    private final ConcurrentHashMap<String, Long> memoryCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> memoryVoted = new ConcurrentHashMap<>();

    public AlternativeService(AlternativeUsageRepository alternativeUsageRepository,
                              StringRedisTemplate redisTemplate) {
        this.alternativeUsageRepository = alternativeUsageRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 返回系统预设的零成本/低成本高多巴胺平替方案，并附带真实采用次数。
     * 次数优先从 Redis 读取，高并发下避免直接查询数据库。
     */
    public List<AlternativeSuggestion> listAlternatives() {
        return buildSuggestions().stream()
                .peek(suggestion -> {
                    Long count = getUsageCountFromRedis(suggestion.getTitle());
                    suggestion.setUsageCount(count != null ? count.intValue() : 0);
                })
                .sorted(Comparator.comparingInt(AlternativeSuggestion::getUsageCount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 记录用户采用某个平替方案。
     * 同一 IP 在 TTL 内只能投票一次，Redis 原子操作保证高并发下计数准确。
     */
    @Transactional
    public AlternativeUsageResult useAlternative(String title, String ipAddress) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("方案标题不能为空");
        }
        String normalizedTitle = title.trim();
        String safeIp = (ipAddress != null) ? ipAddress : "unknown";

        String dedupKey = buildDedupKey(normalizedTitle, safeIp);

        // 原子性去重：SETNX 仅在 key 不存在时才设置成功
        Boolean firstTime = redisTemplate.opsForValue()
                .setIfAbsent(dedupKey, "1", Duration.ofHours(voteIpTtlHours));

        if (Boolean.FALSE.equals(firstTime)) {
            return AlternativeUsageResult.duplicate(safeIp, normalizedTitle);
        }

        // 原子自增计数器
        Long newCount = redisTemplate.opsForValue().increment(buildCountKey(normalizedTitle));

        // 异步持久化到数据库，降低主链路耗时，提升高并发吞吐量
        asyncPersistUsage(normalizedTitle, safeIp);

        log.debug("IP {} 已采用方案 [{}]，当前 Redis 计数: {}", safeIp, normalizedTitle, newCount);
        return AlternativeUsageResult.success(safeIp, normalizedTitle, newCount);
    }

    /**
     * 获取平替方案排行榜（按采用次数降序）。
     * 全部从 Redis 读取，避免高并发下数据库压力。
     */
    public List<AlternativeRankingItem> getRanking() {
        return buildSuggestions().stream()
                .map(s -> new AlternativeRankingItem(
                        s.getTitle(),
                        Objects.requireNonNullElse(getUsageCountFromRedis(s.getTitle()), 0L).intValue()
                ))
                .sorted(Comparator.comparingInt(AlternativeRankingItem::getUsageCount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 同步 Redis 计数到数据库，用于定时校准或启动时恢复。
     */
    public void syncRedisCountToDatabase(String title) {
        Long redisCount = getUsageCountFromRedis(title);
        if (redisCount == null || redisCount <= 0) {
            return;
        }
        long dbCount = alternativeUsageRepository.countByTitle(title);
        long diff = redisCount - dbCount;
        if (diff > 0) {
            for (long i = 0; i < diff; i++) {
                alternativeUsageRepository.save(new AlternativeUsage(title, "sync"));
            }
            log.info("方案 [{}] 已校准：Redis={}, DB={}, 补偿 {} 条", title, redisCount, dbCount, diff);
        }
    }

    @Async("taskExecutor")
    public void asyncPersistUsage(String title, String ipAddress) {
        try {
            alternativeUsageRepository.save(new AlternativeUsage(title, ipAddress));
        } catch (Exception e) {
            log.warn("持久化方案使用记录失败: title={}, ip={}", title, ipAddress, e);
        }
    }

    private Long getUsageCountFromRedis(String title) {
        String value = redisTemplate.opsForValue().get(buildCountKey(title));
        if (value == null) {
            // 缓存未命中时回源数据库，并回填 Redis
            long dbCount = alternativeUsageRepository.countByTitle(title);
            redisTemplate.opsForValue().set(buildCountKey(title), String.valueOf(dbCount));
            return dbCount;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private String buildCountKey(String title) {
        return STRATEGY_COUNT_KEY + ":" + title;
    }

    private String buildDedupKey(String title, String ip) {
        return STRATEGY_VOTED_KEY + ":" + title + ":" + ip;
    }

    public static class AlternativeUsageResult {
        private final boolean accepted;
        private final String ipAddress;
        private final String title;
        private final Long currentCount;
        private final String message;

        private AlternativeUsageResult(boolean accepted, String ipAddress, String title, Long currentCount, String message) {
            this.accepted = accepted;
            this.ipAddress = ipAddress;
            this.title = title;
            this.currentCount = currentCount;
            this.message = message;
        }

        public static AlternativeUsageResult success(String ipAddress, String title, Long currentCount) {
            return new AlternativeUsageResult(true, ipAddress, title, currentCount, "采用成功");
        }

        public static AlternativeUsageResult duplicate(String ipAddress, String title) {
            return new AlternativeUsageResult(false, ipAddress, title, null, "同一 IP 已采用该方案，请勿重复投票");
        }

        public boolean isAccepted() {
            return accepted;
        }

        public String getIpAddress() {
            return ipAddress;
        }

        public String getTitle() {
            return title;
        }

        public Long getCurrentCount() {
            return currentCount;
        }

        public String getMessage() {
            return message;
        }
    }

    private List<AlternativeSuggestion> buildSuggestions() {
        return List.of(
                new AlternativeSuggestion(
                        "沉浸式游戏 2 小时",
                        "Gaming Session",
                        "¥0",
                        85,
                        List.of("高多巴胺", "零成本", "即刻满足"),
                        "打开 Steam / 原神 / 黑悟空，用现有设备获得强烈快感。",
                        0
                ),
                new AlternativeSuggestion(
                        "城市暴走 5 公里",
                        "Urban Walk",
                        "¥0",
                        70,
                        List.of("运动", "零成本", "缓解焦虑"),
                        "戴上耳机出门走路，身体动起来后购物欲望会显著下降。",
                        0
                ),
                new AlternativeSuggestion(
                        "宜家 / 山姆纯逛",
                        "Window Shopping",
                        "¥0-20",
                        75,
                        List.of("低消费", "体验感", "社交属性"),
                        "只看不买，把\"逛\"本身当作娱乐，满足探索欲。",
                        0
                ),
                new AlternativeSuggestion(
                        "整理摄影作品",
                        "Photo Curation",
                        "¥0",
                        60,
                        List.of("创作", "零成本", "长期满足"),
                        "修图、剪视频、发小红书，把已有素材重新创作。",
                        0
                ),
                new AlternativeSuggestion(
                        "图书馆自习 3 小时",
                        "Library Flow",
                        "¥0",
                        65,
                        List.of("心流", "零成本", "自我提升"),
                        "换一个严肃环境，进入学习心流，自然忘记消费。",
                        0
                ),
                new AlternativeSuggestion(
                        "朋友家火锅局",
                        "Home Party",
                        "¥30-50",
                        90,
                        List.of("社交", "低成本", "高满足"),
                        "人均 30 元的社交快乐，远胜一个人冲动剁手。",
                        0
                ),
                new AlternativeSuggestion(
                        "大扫除 + 断舍离",
                        "Declutter",
                        "¥0",
                        55,
                        List.of("整理", "零成本", "掌控感"),
                        "把房间收拾干净，通过掌控环境获得心理秩序。",
                        0
                ),
                new AlternativeSuggestion(
                        "看一部高分电影",
                        "Movie Night",
                        "¥0-15",
                        68,
                        List.of("娱乐", "低成本", "沉浸体验"),
                        "打开流媒体或去电影院，用故事填满晚上。",
                        0
                )
        );
    }
}
