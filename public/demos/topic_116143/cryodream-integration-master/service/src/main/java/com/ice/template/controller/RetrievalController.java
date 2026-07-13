package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.rag.retrieval.HybridSearchService;
import com.ice.template.rag.retrieval.QueryRewriterService;
import com.ice.template.rag.retrieval.RetrievalResponse;
import com.ice.template.rag.retrieval.RewrittenQuery;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.Map;

/**
 * 动态检索引擎接口
 */
@RestController
@RequestMapping("/retrieval")
@Api(tags = "动态检索引擎接口")
public class RetrievalController {

    @Resource
    private QueryRewriterService queryRewriterService;

    @Resource
    private HybridSearchService hybridSearchService;

    @PostMapping("/rewriteQuery")
    @ApiOperation("意图重构：模糊提问 → 标准 JSON 查询条件")
    public BaseResponse<RewrittenQuery> rewriteQuery(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        if (StringUtils.isBlank(query)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "提问内容不能为空");
        }
        String modelConfigId = request.get("modelConfigId");
        return ResultUtils.success(queryRewriterService.rewrite(query, modelConfigId));
    }

    @PostMapping("/vectorSearch")
    @ApiOperation("向量召回：原始提问直接向量相似度检索")
    public BaseResponse<RetrievalResponse> vectorSearch(@RequestBody Map<String, Object> request) {
        String kbId = asString(request.get("kbId"));
        String query = asString(request.get("query"));
        if (StringUtils.isBlank(kbId) || StringUtils.isBlank(query)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID和提问内容不能为空");
        }
        int topK = asInt(request.get("topK"), 10);
        return ResultUtils.success(hybridSearchService.vectorSearch(kbId, query, topK));
    }

    @PostMapping("/hybridSearch")
    @ApiOperation("混合检索：意图重构 + 向量召回 + 元数据软加权融合排序")
    public BaseResponse<RetrievalResponse> hybridSearch(@RequestBody Map<String, Object> request) {
        String kbId = asString(request.get("kbId"));
        String query = asString(request.get("query"));
        if (StringUtils.isBlank(kbId) || StringUtils.isBlank(query)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID和提问内容不能为空");
        }
        String modelConfigId = asString(request.get("modelConfigId"));
        return ResultUtils.success(hybridSearchService.hybridSearch(kbId, query, modelConfigId));
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private int asInt(Object value, int defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
