package com.ice.template.controller;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ResultUtils;
import com.ice.template.model.entity.KnowledgeCase;
import com.ice.template.rag.Vectorizer;
import com.ice.template.service.KnowledgeCaseService;
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
 * 案例库 API
 * 支持：案例列表查询、混合检索（JSONB过滤+向量搜索）、统计、清空
 */
@Slf4j
@RestController
@RequestMapping("/case")
public class CaseController {

    @Resource
    private KnowledgeCaseService knowledgeCaseService;

    @Resource
    private Vectorizer vectorizer;

    @Resource
    private DataSource dataSource;

    /**
     * 获取案例列表（分页 + 筛选）
     */
    @GetMapping("/list")
    public BaseResponse<Page<KnowledgeCase>> listCases(
            @RequestParam String kbId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String businessModel,
            @RequestParam(required = false) Integer minAuthenticity) {

        LambdaQueryWrapper<KnowledgeCase> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeCase::getKbId, kbId);
        wrapper.orderByDesc(KnowledgeCase::getCreateTime);

        Page<KnowledgeCase> result = knowledgeCaseService.page(new Page<>(page, pageSize), wrapper);
        return ResultUtils.success(result);
    }

    /**
     * 混合检索案例（JSONB过滤 + 向量搜索）
     * 第一步：JSONB @> 操作符硬性过滤（行业、商业模式、可信度）
     * 第二步：在过滤结果中做向量相似度搜索
     */
    @GetMapping("/search")
    public BaseResponse<List<KnowledgeCase>> searchCases(
            @RequestParam String kbId,
            @RequestParam String query,
            @RequestParam(required = false) List<String> industry,
            @RequestParam(required = false) List<String> businessModel,
            @RequestParam(required = false) Integer minAuthenticity,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            // 1. 构建 JSONB 过滤条件
            StringBuilder whereClause = new StringBuilder("WHERE kb_id = ? AND is_delete = 0");
            List<Object> params = new ArrayList<>();
            params.add(kbId);

            if (industry != null && !industry.isEmpty()) {
                whereClause.append(" AND case_data->'context'->'industry' @> ?");
                params.add("[\"" + String.join("\",\"", industry) + "\"]");
            }
            if (businessModel != null && !businessModel.isEmpty()) {
                whereClause.append(" AND case_data->'context'->'business_model' @> ?");
                params.add("[\"" + String.join("\",\"", businessModel) + "\"]");
            }
            if (minAuthenticity != null) {
                whereClause.append(" AND (case_data->'credibility'->>'authenticity_score')::int >= ?");
                params.add(minAuthenticity);
            }

            // 2. 对 query 做向量化
            String queryEmbedding = vectorizer.vectorize(query, null);

            if (StringUtils.isNotBlank(queryEmbedding)) {
                // 向量搜索模式：在过滤结果中做相似度搜索
                whereClause.append(" AND source_doc_id IN (SELECT parent_id FROM knowledge_chunk WHERE kb_id = ? AND chunk_level = 'case' AND embedding IS NOT NULL AND is_delete = 0 ORDER BY embedding <=> ? LIMIT ?)");
                params.add(kbId);
                params.add(queryEmbedding);
                params.add(limit);
            }

            // 3. 执行查询
            String sql = "SELECT * FROM knowledge_cases " + whereClause + " ORDER BY create_time DESC LIMIT ?";
            params.add(limit);

            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }
                List<KnowledgeCase> cases = new ArrayList<>();
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        KnowledgeCase kc = new KnowledgeCase();
                        kc.setId(rs.getString("id"));
                        kc.setKbId(rs.getString("kb_id"));
                        kc.setSourceDocId(rs.getString("source_doc_id"));
                        kc.setCaseData(rs.getString("case_data"));
                        kc.setSearchIndex(rs.getString("search_index"));
                        cases.add(kc);
                    }
                }
                return ResultUtils.success(cases);
            }
        } catch (Exception e) {
            log.error("[searchCases] 检索失败: {}", e.getMessage());
            // 降级：关键词搜索
            LambdaQueryWrapper<KnowledgeCase> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(KnowledgeCase::getKbId, kbId);
            wrapper.like(KnowledgeCase::getSearchIndex, query);
            wrapper.orderByDesc(KnowledgeCase::getCreateTime);
            wrapper.last("LIMIT " + limit);
            return ResultUtils.success(knowledgeCaseService.list(wrapper));
        }
    }

    /**
     * 获取案例的完整数据（含 source_doc_id 回溯原文）
     */
    @GetMapping("/detail")
    public BaseResponse<JSONObject> getCaseDetail(@RequestParam String caseId) {
        KnowledgeCase kc = knowledgeCaseService.getById(caseId);
        if (kc == null) {
            return ResultUtils.success(null);
        }
        JSONObject result = new JSONObject();
        result.set("id", kc.getId());
        result.set("kbId", kc.getKbId());
        result.set("sourceDocId", kc.getSourceDocId());
        result.set("searchIndex", kc.getSearchIndex());
        result.set("createTime", kc.getCreateTime());

        // 解析 case_data
        if (StringUtils.isNotBlank(kc.getCaseData())) {
            try {
                JSONObject caseData = JSONUtil.parseObj(kc.getCaseData());
                result.set("caseData", caseData);
            } catch (Exception e) {
                result.set("caseData", kc.getCaseData());
            }
        }
        return ResultUtils.success(result);
    }

    /**
     * 获取统计数据
     */
    @GetMapping("/stats")
    public BaseResponse<JSONObject> getStats(@RequestParam String kbId) {
        LambdaQueryWrapper<KnowledgeCase> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeCase::getKbId, kbId);
        List<KnowledgeCase> cases = knowledgeCaseService.list(wrapper);

        JSONObject stats = new JSONObject();
        stats.set("total", cases.size());

        // 按行业统计（从 case_data 提取）
        Map<String, Integer> industryCount = new HashMap<>();
        int totalAuthenticity = 0;
        int countWithAuth = 0;
        for (KnowledgeCase kc : cases) {
            try {
                JSONObject data = JSONUtil.parseObj(kc.getCaseData());
                JSONObject ctx = data.getJSONObject("context");
                if (ctx != null) {
                    JSONArray industries = ctx.getJSONArray("industry");
                    if (industries != null) {
                        for (int i = 0; i < industries.size(); i++) {
                            industryCount.merge(industries.getStr(i), 1, Integer::sum);
                        }
                    }
                }
                JSONObject cred = data.getJSONObject("credibility");
                if (cred != null) {
                    totalAuthenticity += cred.getInt("authenticity_score", 0);
                    countWithAuth++;
                }
            } catch (Exception e) { /* ignore */ }
        }
        stats.set("byIndustry", industryCount);
        stats.set("avgAuthenticity", countWithAuth > 0 ? Math.round((double) totalAuthenticity / countWithAuth * 10) / 10.0 : 0);

        return ResultUtils.success(stats);
    }

    /**
     * 清空知识库的案例数据
     */
    @PostMapping("/clear-data")
    public BaseResponse<Boolean> clearData(@RequestParam String kbId) {
        LambdaQueryWrapper<KnowledgeCase> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeCase::getKbId, kbId);
        long count = knowledgeCaseService.count(wrapper);
        knowledgeCaseService.remove(wrapper);
        log.info("[clearData] 清空知识库案例数据: kbId={}, count={}", kbId, count);
        return ResultUtils.success(true);
    }
}
