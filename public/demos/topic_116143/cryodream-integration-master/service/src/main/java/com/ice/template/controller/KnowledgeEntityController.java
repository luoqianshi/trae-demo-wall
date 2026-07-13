package com.ice.template.controller;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.KnowledgeCase;
import com.ice.template.model.entity.KnowledgeEntity;
import com.ice.template.model.entity.KnowledgeEvent;
import com.ice.template.model.entity.KnowledgeOpinion;
import com.ice.template.service.KnowledgeCaseService;
import com.ice.template.service.KnowledgeEntityService;
import com.ice.template.service.KnowledgeEventService;
import com.ice.template.service.KnowledgeOpinionService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 全局实体 API
 * 支持：实体 CRUD、类型筛选、实体穿透查询（聚合相关事件+案例）
 */
@Slf4j
@RestController
@RequestMapping("/entity")
@Api(tags = "知识库实体管理")
public class KnowledgeEntityController {

    @Resource
    private KnowledgeEntityService knowledgeEntityService;

    @Resource
    private KnowledgeEventService knowledgeEventService;

    @Resource
    private KnowledgeCaseService knowledgeCaseService;

    @Resource
    private KnowledgeOpinionService knowledgeOpinionService;

    /**
     * 实体列表（分页 + 类型筛选 + 关键词搜索）
     */
    @GetMapping("/list")
    @ApiOperation("实体列表")
    public BaseResponse<Page<KnowledgeEntity>> list(
            @RequestParam String kbId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {

        LambdaQueryWrapper<KnowledgeEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEntity::getKbId, kbId);
        if (StringUtils.isNotBlank(type)) {
            wrapper.eq(KnowledgeEntity::getType, type);
        }
        if (StringUtils.isNotBlank(keyword)) {
            wrapper.and(w -> w.like(KnowledgeEntity::getName, keyword)
                    .or().like(KnowledgeEntity::getDescription, keyword));
        }
        wrapper.orderByDesc(KnowledgeEntity::getUpdateTime);
        Page<KnowledgeEntity> result = knowledgeEntityService.page(new Page<>(page, pageSize), wrapper);
        return ResultUtils.success(result);
    }

    /**
     * 实体统计数据（按类型分组计数）
     */
    @GetMapping("/stats")
    @ApiOperation("实体统计")
    public BaseResponse<List<JSONObject>> stats(@RequestParam String kbId) {
        List<KnowledgeEntity> all = knowledgeEntityService.lambdaQuery()
                .eq(KnowledgeEntity::getKbId, kbId)
                .list();
        Map<String, Long> typeCount = all.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getType() == null ? "Unknown" : e.getType(),
                        Collectors.counting()));
        List<JSONObject> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : typeCount.entrySet()) {
            JSONObject obj = new JSONObject();
            obj.set("type", entry.getKey());
            obj.set("count", entry.getValue());
            result.add(obj);
        }
        result.sort((a, b) -> b.getInt("count").compareTo(a.getInt("count")));
        return ResultUtils.success(result);
    }

    /**
     * 实体穿透查询：聚合实体详情 + 相关事件 + 相关案例
     */
    @GetMapping("/detail")
    @ApiOperation("实体穿透查询")
    public BaseResponse<JSONObject> detail(@RequestParam String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        KnowledgeEntity entity = knowledgeEntityService.getById(id);
        if (entity == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "实体不存在");
        }

        JSONObject result = new JSONObject();
        // 实体名片
        result.set("entity", buildEntityJson(entity));

        // 收集所有搜索名称（name + aliases）
        Set<String> searchNames = new HashSet<>();
        searchNames.add(entity.getName());
        try {
            if (StringUtils.isNotBlank(entity.getAliases())) {
                JSONArray arr = JSONUtil.parseArray(entity.getAliases());
                for (int i = 0; i < arr.size(); i++) {
                    String alias = arr.getStr(i);
                    if (StringUtils.isNotBlank(alias)) searchNames.add(alias);
                }
            }
        } catch (Exception ignored) {
        }

        // 相关事件：从 knowledge_events 表的 entities JSONB 字段匹配
        List<KnowledgeEvent> relatedEvents = findRelatedEvents(entity.getKbId(), searchNames);
        JSONArray eventsArr = new JSONArray();
        for (KnowledgeEvent evt : relatedEvents) {
            JSONObject evtJson = new JSONObject();
            evtJson.set("id", evt.getId());
            evtJson.set("date", evt.getEventDate());
            evtJson.set("granularity", evt.getTimeGranularity());
            evtJson.set("action", evt.getAction());
            evtJson.set("entities", evt.getEntities());
            evtJson.set("sourceType", evt.getSourceType());
            evtJson.set("confidenceScore", evt.getConfidenceScore());
            evtJson.set("impactInference", evt.getImpactInference());
            eventsArr.add(evtJson);
        }
        result.set("relatedEvents", eventsArr);
        result.set("eventCount", relatedEvents.size());

        // 相关案例：从 knowledge_cases 表的 case_data JSONB 字段匹配
        List<KnowledgeCase> relatedCases = findRelatedCases(entity.getKbId(), searchNames);
        JSONArray casesArr = new JSONArray();
        for (KnowledgeCase c : relatedCases) {
            JSONObject caseJson = new JSONObject();
            caseJson.set("id", c.getId());
            caseJson.set("caseData", c.getCaseData());
            caseJson.set("searchIndex", c.getSearchIndex());
            casesArr.add(caseJson);
        }
        result.set("relatedCases", casesArr);
        result.set("caseCount", relatedCases.size());

        // 相关观点：从 knowledge_opinions 表的 relations JSONB 字段匹配
        List<KnowledgeOpinion> relatedOpinions = findRelatedOpinions(entity.getKbId(), searchNames);
        JSONArray opinionsArr = new JSONArray();
        for (KnowledgeOpinion opn : relatedOpinions) {
            JSONObject opnJson = new JSONObject();
            opnJson.set("id", opn.getId());
            opnJson.set("relations", opn.getRelations());
            opnJson.set("context", opn.getContext());
            opnJson.set("coreThesis", opn.getCoreThesis());
            opnJson.set("credibility", opn.getCredibility());
            opnJson.set("searchIndex", opn.getSearchIndex());
            opnJson.set("createTime", opn.getCreateTime());
            opinionsArr.add(opnJson);
        }
        result.set("relatedOpinions", opinionsArr);
        result.set("opinionCount", relatedOpinions.size());

        return ResultUtils.success(result);
    }

    /**
     * 手动创建实体
     */
    @PostMapping("/create")
    @ApiOperation("创建实体")
    public BaseResponse<KnowledgeEntity> create(@RequestBody Map<String, Object> request) {
        String kbId = asString(request.get("kbId"));
        if (StringUtils.isBlank(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "kbId 不能为空");
        }
        String name = asString(request.get("name"));
        if (StringUtils.isBlank(name)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "name 不能为空");
        }
        KnowledgeEntity entity = new KnowledgeEntity();
        entity.setKbId(kbId);
        entity.setName(name);
        entity.setType(asString(request.getOrDefault("type", "Concept")));
        Object aliases = request.get("aliases");
        entity.setAliases(aliases != null ? JSONUtil.toJsonStr(aliases) : "[]");
        entity.setDescription(asString(request.get("description")));
        Object metadata = request.get("metadata");
        entity.setMetadata(metadata != null ? JSONUtil.toJsonStr(metadata) : "{}");
        knowledgeEntityService.save(entity);
        return ResultUtils.success(entity);
    }

    /**
     * 更新实体
     */
    @PostMapping("/update")
    @ApiOperation("更新实体")
    public BaseResponse<Boolean> update(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        KnowledgeEntity entity = knowledgeEntityService.getById(id);
        if (entity == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "实体不存在");
        }
        if (request.containsKey("name")) {
            String name = asString(request.get("name"));
            if (StringUtils.isNotBlank(name)) entity.setName(name);
        }
        if (request.containsKey("type")) {
            entity.setType(asString(request.get("type")));
        }
        if (request.containsKey("description")) {
            entity.setDescription(asString(request.get("description")));
        }
        if (request.containsKey("aliases")) {
            Object aliases = request.get("aliases");
            entity.setAliases(aliases != null ? JSONUtil.toJsonStr(aliases) : "[]");
        }
        if (request.containsKey("metadata")) {
            Object metadata = request.get("metadata");
            entity.setMetadata(metadata != null ? JSONUtil.toJsonStr(metadata) : "{}");
        }
        return ResultUtils.success(knowledgeEntityService.updateById(entity));
    }

    /**
     * 删除实体
     */
    @PostMapping("/delete")
    @ApiOperation("删除实体")
    public BaseResponse<Boolean> delete(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        return ResultUtils.success(knowledgeEntityService.removeById(id));
    }

    // ==================== 内部方法 ====================

    private JSONObject buildEntityJson(KnowledgeEntity e) {
        JSONObject obj = new JSONObject();
        obj.set("id", e.getId());
        obj.set("kbId", e.getKbId());
        obj.set("name", e.getName());
        obj.set("type", e.getType());
        obj.set("aliases", e.getAliases());
        obj.set("description", e.getDescription());
        obj.set("metadata", e.getMetadata());
        obj.set("createTime", e.getCreateTime());
        obj.set("updateTime", e.getUpdateTime());
        return obj;
    }

    /**
     * 查找相关事件：entities JSONB 字段中包含任一搜索名称
     */
    private List<KnowledgeEvent> findRelatedEvents(String kbId, Set<String> searchNames) {
        if (searchNames.isEmpty()) return Collections.emptyList();
        try {
            List<KnowledgeEvent> all = knowledgeEventService.lambdaQuery()
                    .eq(KnowledgeEvent::getKbId, kbId)
                    .orderByDesc(KnowledgeEvent::getEventDate)
                    .list();
            List<KnowledgeEvent> matched = new ArrayList<>();
            for (KnowledgeEvent evt : all) {
                Set<String> evtEntities = parseEntityNames(evt.getEntities());
                if (hasIntersection(evtEntities, searchNames)) {
                    matched.add(evt);
                }
            }
            return matched;
        } catch (Exception e) {
            log.warn("[EntityDetail] 查询相关事件异常: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 查找相关案例：case_data JSONB 中包含任一搜索名称
     */
    private List<KnowledgeCase> findRelatedCases(String kbId, Set<String> searchNames) {
        if (searchNames.isEmpty()) return Collections.emptyList();
        try {
            List<KnowledgeCase> all = knowledgeCaseService.lambdaQuery()
                    .eq(KnowledgeCase::getKbId, kbId)
                    .orderByDesc(KnowledgeCase::getCreateTime)
                    .list();
            List<KnowledgeCase> matched = new ArrayList<>();
            for (KnowledgeCase c : all) {
                String caseDataStr = c.getCaseData();
                if (StringUtils.isBlank(caseDataStr)) continue;
                // 简单文本包含匹配（case_data 中的实体名称）
                for (String name : searchNames) {
                    if (caseDataStr.contains(name)) {
                        matched.add(c);
                        break;
                    }
                }
            }
            return matched;
        } catch (Exception e) {
            log.warn("[EntityDetail] 查询相关案例异常: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /** 解析事件 entities JSONB 字段为名称集合 */
    private Set<String> parseEntityNames(String entitiesJson) {
        if (StringUtils.isBlank(entitiesJson)) return Collections.emptySet();
        Set<String> names = new HashSet<>();
        try {
            // entities 可能是 ["张三","李四"] 或 [{"name":"张三"}] 格式
            JSONArray arr = JSONUtil.parseArray(entitiesJson);
            for (int i = 0; i < arr.size(); i++) {
                Object item = arr.get(i);
                if (item instanceof String) {
                    names.add((String) item);
                } else if (item instanceof JSONObject) {
                    String name = ((JSONObject) item).getStr("name");
                    if (StringUtils.isNotBlank(name)) names.add(name);
                }
            }
        } catch (Exception ignored) {
        }
        return names;
    }

    private boolean hasIntersection(Set<String> a, Set<String> b) {
        for (String s : a) {
            if (b.contains(s)) return true;
        }
        return false;
    }

    /**
     * 查找相关观点：relations->'source_entity' 或 relations->'target_entities' 包含任一搜索名称
     */
    private List<KnowledgeOpinion> findRelatedOpinions(String kbId, Set<String> searchNames) {
        if (searchNames.isEmpty()) return Collections.emptyList();
        try {
            List<KnowledgeOpinion> all = knowledgeOpinionService.lambdaQuery()
                    .eq(KnowledgeOpinion::getKbId, kbId)
                    .orderByDesc(KnowledgeOpinion::getCreateTime)
                    .list();
            List<KnowledgeOpinion> matched = new ArrayList<>();
            for (KnowledgeOpinion opn : all) {
                if (StringUtils.isBlank(opn.getRelations())) continue;
                try {
                    JSONObject relations = JSONUtil.parseObj(opn.getRelations());
                    String source = relations.getStr("source_entity");
                    if (source != null && searchNames.contains(source)) {
                        matched.add(opn);
                        continue;
                    }
                    JSONArray targets = relations.getJSONArray("target_entities");
                    if (targets != null) {
                        for (int i = 0; i < targets.size(); i++) {
                            if (searchNames.contains(targets.getStr(i))) {
                                matched.add(opn);
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
            return matched;
        } catch (Exception e) {
            log.warn("[EntityDetail] 查询相关观点异常: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
