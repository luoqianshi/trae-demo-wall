package com.ice.template.controller;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.annotation.AuthCheck;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.entity.KnowledgeEvent;
import com.ice.template.rag.Vectorizer;
import com.ice.template.service.KnowledgeChunkService;
import com.ice.template.service.KnowledgeEventService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 事件追踪 API
 * 支持：事件列表查询、时间轴数据、统计、清空
 */
@Slf4j
@RestController
@RequestMapping("/event")
public class EventController {

    @Resource
    private KnowledgeEventService knowledgeEventService;

    @Resource
    private Vectorizer vectorizer;

    @Resource
    private KnowledgeChunkService knowledgeChunkService;

    @Resource
    private DataSource dataSource;

    /**
     * 获取事件列表（分页 + 筛选）
     * 参数：kbId(必填), page, pageSize, sourceType, minConfidence, dateFrom, dateTo
     */
    @GetMapping("/list")
    public BaseResponse<Page<KnowledgeEvent>> listEvents(
            @RequestParam String kbId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) Integer minConfidence,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {

        LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEvent::getKbId, kbId);
        if (StringUtils.isNotBlank(sourceType)) {
            wrapper.eq(KnowledgeEvent::getSourceType, sourceType);
        }
        if (minConfidence != null) {
            wrapper.ge(KnowledgeEvent::getConfidenceScore, minConfidence);
        }
        if (StringUtils.isNotBlank(dateFrom)) {
            wrapper.ge(KnowledgeEvent::getEventDate, java.sql.Date.valueOf(dateFrom));
        }
        if (StringUtils.isNotBlank(dateTo)) {
            wrapper.le(KnowledgeEvent::getEventDate, java.sql.Date.valueOf(dateTo));
        }
        wrapper.orderByDesc(KnowledgeEvent::getEventDate);

        Page<KnowledgeEvent> result = knowledgeEventService.page(new Page<>(page, pageSize), wrapper);
        return ResultUtils.success(result);
    }

    /**
     * 获取时间轴数据（按年-月分组）
     * 返回格式：[{ year: "2024", months: [{ month: "01", events: [...] }] }]
     */
    @GetMapping("/timeline")
    public BaseResponse<List<JSONObject>> getTimeline(@RequestParam String kbId) {
        LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEvent::getKbId, kbId);
        wrapper.orderByDesc(KnowledgeEvent::getEventDate);

        List<KnowledgeEvent> events = knowledgeEventService.list(wrapper);

        // 按年-月分组
        Map<String, Map<String, List<JSONObject>>> yearMonthMap = new TreeMap<>(Collections.reverseOrder());
        for (KnowledgeEvent ke : events) {
            String year = String.valueOf(ke.getEventDate().getYear() + 1900);
            String month = String.format("%02d", ke.getEventDate().getMonth() + 1);

            JSONObject evtJson = new JSONObject();
            evtJson.set("id", ke.getId());
            evtJson.set("date", ke.getEventDate().toString());
            evtJson.set("granularity", ke.getTimeGranularity());
            evtJson.set("action", ke.getAction());
            evtJson.set("entities", ke.getEntities());
            evtJson.set("sourceType", ke.getSourceType());
            evtJson.set("confidenceScore", ke.getConfidenceScore());
            evtJson.set("verificationStatus", ke.getVerificationStatus());
            evtJson.set("impactInference", ke.getImpactInference());
            evtJson.set("searchIndex", ke.getSearchIndex());

            yearMonthMap.computeIfAbsent(year, k -> new TreeMap<>(Collections.reverseOrder()))
                    .computeIfAbsent(month, k -> new ArrayList<>())
                    .add(evtJson);
        }

        List<JSONObject> timeline = new ArrayList<>();
        for (Map.Entry<String, Map<String, List<JSONObject>>> yearEntry : yearMonthMap.entrySet()) {
            JSONObject yearObj = new JSONObject();
            yearObj.set("year", yearEntry.getKey());
            List<JSONObject> months = new ArrayList<>();
            for (Map.Entry<String, List<JSONObject>> monthEntry : yearEntry.getValue().entrySet()) {
                JSONObject monthObj = new JSONObject();
                monthObj.set("month", monthEntry.getKey());
                monthObj.set("events", monthEntry.getValue());
                months.add(monthObj);
            }
            yearObj.set("months", months);
            timeline.add(yearObj);
        }

        return ResultUtils.success(timeline);
    }

    /**
     * 获取图谱数据（事件+实体节点 + 实体-事件关系边 + 事件间关联边）
     * 用于前端 force-graph 渲染
     */
    @GetMapping("/graph-data")
    public BaseResponse<JSONObject> getGraphData(@RequestParam String kbId) {
        LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEvent::getKbId, kbId);
        wrapper.orderByDesc(KnowledgeEvent::getEventDate);

        List<KnowledgeEvent> events = knowledgeEventService.list(wrapper);

        List<JSONObject> nodes = new ArrayList<>();
        List<JSONObject> edges = new ArrayList<>();
        Map<String, String> entityNodeIds = new HashMap<>(); // entityName -> nodeId
        Map<String, KnowledgeEvent> eventIdMap = new LinkedHashMap<>(); // eventId -> event
        Map<String, List<String>> entityToEvents = new HashMap<>(); // entityName -> List<eventId>

        for (KnowledgeEvent ke : events) {
            // 事件节点
            String evtNodeId = ke.getId();
            eventIdMap.put(evtNodeId, ke);
            JSONObject evtNode = new JSONObject();
            evtNode.set("id", evtNodeId);
            evtNode.set("type", "event");
            evtNode.set("label", ke.getAction());
            evtNode.set("date", ke.getEventDate().toString());
            evtNode.set("granularity", ke.getTimeGranularity());
            evtNode.set("sourceType", ke.getSourceType());
            evtNode.set("confidenceScore", ke.getConfidenceScore());
            evtNode.set("verificationStatus", ke.getVerificationStatus());
            evtNode.set("impactInference", ke.getImpactInference());
            nodes.add(evtNode);

            // 实体节点 + 实体-事件边
            try {
                JSONArray entitiesArr = JSONUtil.parseArray(ke.getEntities());
                for (int i = 0; i < entitiesArr.size(); i++) {
                    String entityName = entitiesArr.getStr(i);
                    if (StringUtils.isBlank(entityName)) continue;

                    // 构建 entityToEvents 映射
                    entityToEvents.computeIfAbsent(entityName, k -> new ArrayList<>()).add(evtNodeId);

                    String entNodeId;
                    if (entityNodeIds.containsKey(entityName)) {
                        entNodeId = entityNodeIds.get(entityName);
                    } else {
                        entNodeId = "entity_" + entityName.hashCode() + "_" + entityName.length();
                        entityNodeIds.put(entityName, entNodeId);
                        JSONObject entNode = new JSONObject();
                        entNode.set("id", entNodeId);
                        entNode.set("type", "entity");
                        entNode.set("label", entityName);
                        nodes.add(entNode);
                    }

                    // 实体→事件边
                    JSONObject edge = new JSONObject();
                    edge.set("source", entNodeId);
                    edge.set("target", evtNodeId);
                    edge.set("label", "参与");
                    edge.set("_color", "#94a3b8");
                    edges.add(edge);
                }
            } catch (Exception e) {
                log.warn("[getGraphData] 解析实体失败: eventId={}", ke.getId());
            }
        }

        // 事件间关联：共享同一实体的事件之间建立边
        for (Map.Entry<String, List<String>> entry : entityToEvents.entrySet()) {
            List<String> evtIds = entry.getValue();
            if (evtIds.size() > 1) {
                // 按时间排序
                evtIds.sort((a, b) -> {
                    KnowledgeEvent ea = eventIdMap.get(a);
                    KnowledgeEvent eb = eventIdMap.get(b);
                    if (ea == null || eb == null) return 0;
                    return ea.getEventDate().compareTo(eb.getEventDate());
                });
                for (int i = 0; i < evtIds.size() - 1; i++) {
                    JSONObject edge = new JSONObject();
                    edge.set("source", evtIds.get(i));
                    edge.set("target", evtIds.get(i + 1));
                    edge.set("label", "关联");
                    edge.set("_color", "rgba(239, 68, 68, 0.4)");
                    edges.add(edge);
                }
            }
        }

        JSONObject result = new JSONObject();
        result.set("nodes", nodes);
        result.set("edges", edges);

        // 统计
        JSONObject stats = new JSONObject();
        stats.set("events", events.size());
        stats.set("entities", entityNodeIds.size());
        stats.set("edges", edges.size());
        result.set("stats", stats);

        return ResultUtils.success(result);
    }

    /**
     * 获取统计数据
     */
    @GetMapping("/stats")
    public BaseResponse<JSONObject> getStats(@RequestParam String kbId) {
        LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEvent::getKbId, kbId);
        List<KnowledgeEvent> events = knowledgeEventService.list(wrapper);

        JSONObject stats = new JSONObject();
        stats.set("total", events.size());

        // 按sourceType分组统计
        Map<String, Long> bySourceType = events.stream()
                .collect(Collectors.groupingBy(KnowledgeEvent::getSourceType, Collectors.counting()));
        stats.set("bySourceType", bySourceType);

        // 按年份统计
        Map<String, Long> byYear = events.stream()
                .collect(Collectors.groupingBy(
                        ke -> String.valueOf(ke.getEventDate().getYear() + 1900),
                        Collectors.counting()));
        stats.set("byYear", byYear);

        // 平均置信度
        double avgConfidence = events.stream()
                .mapToInt(KnowledgeEvent::getConfidenceScore)
                .average().orElse(0);
        stats.set("avgConfidence", Math.round(avgConfidence * 10) / 10.0);

        return ResultUtils.success(stats);
    }

    /**
     * 语义检索事件（基于 search_index 向量）
     */
    @GetMapping("/search")
    public BaseResponse<List<KnowledgeEvent>> searchEvents(
            @RequestParam String kbId,
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            String queryEmbedding = vectorizer.vectorize(query, null);
            if (StringUtils.isBlank(queryEmbedding)) {
                // 向量化失败，降级为关键词搜索
                LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(KnowledgeEvent::getKbId, kbId);
                wrapper.and(w -> w.like(KnowledgeEvent::getSearchIndex, query)
                        .or().like(KnowledgeEvent::getAction, query));
                wrapper.orderByDesc(KnowledgeEvent::getConfidenceScore);
                wrapper.last("LIMIT " + limit);
                return ResultUtils.success(knowledgeEventService.list(wrapper));
            }

            // pgvector 余弦距离搜索
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(
                    "SELECT parent_id, embedding <=> ? AS distance " +
                    "FROM knowledge_chunk " +
                    "WHERE kb_id = ? AND chunk_level = 'event' AND embedding IS NOT NULL AND is_delete = 0 " +
                    "ORDER BY embedding <=> ? " +
                    "LIMIT ?")) {
                ps.setString(1, queryEmbedding);
                ps.setString(2, kbId);
                ps.setString(3, queryEmbedding);
                ps.setInt(4, limit);

                List<String> eventIds = new ArrayList<>();
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        eventIds.add(rs.getString("parent_id"));
                    }
                }

                if (eventIds.isEmpty()) {
                    return ResultUtils.success(Collections.emptyList());
                }

                // 按 IDs 顺序获取事件
                List<KnowledgeEvent> events = knowledgeEventService.listByIds(eventIds);
                // 保持搜索结果排序
                Map<String, KnowledgeEvent> eventMap = events.stream()
                        .collect(Collectors.toMap(KnowledgeEvent::getId, e -> e));
                List<KnowledgeEvent> sorted = eventIds.stream()
                        .map(eventMap::get)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                return ResultUtils.success(sorted);
            }
        } catch (Exception e) {
            log.error("[searchEvents] 语义检索失败: {}", e.getMessage());
            // 降级为关键词搜索
            LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(KnowledgeEvent::getKbId, kbId);
            wrapper.and(w -> w.like(KnowledgeEvent::getSearchIndex, query)
                    .or().like(KnowledgeEvent::getAction, query));
            wrapper.orderByDesc(KnowledgeEvent::getConfidenceScore);
            wrapper.last("LIMIT " + limit);
            return ResultUtils.success(knowledgeEventService.list(wrapper));
        }
    }

    /**
     * 清空知识库的事件数据
     */
    @PostMapping("/clear-data")
    public BaseResponse<Boolean> clearData(@RequestParam String kbId) {
        LambdaQueryWrapper<KnowledgeEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEvent::getKbId, kbId);
        long count = knowledgeEventService.count(wrapper);
        knowledgeEventService.remove(wrapper);
        log.info("[clearData] 清空知识库事件数据: kbId={}, count={}", kbId, count);
        return ResultUtils.success(true);
    }
}
