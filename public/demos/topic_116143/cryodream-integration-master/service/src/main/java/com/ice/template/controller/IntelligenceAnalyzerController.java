package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.AnalysisHistory;
import com.ice.template.rag.generation.AnalysisResponse;
import com.ice.template.rag.generation.IntelligenceAnalyzerService;
import com.ice.template.service.AnalysisHistoryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

/**
 * 研判生成接口
 */
@RestController
@RequestMapping("/generation")
@Api(tags = "研判生成接口")
public class IntelligenceAnalyzerController {

    @Resource
    private IntelligenceAnalyzerService intelligenceAnalyzerService;

    @Resource
    private AnalysisHistoryService analysisHistoryService;

    @PostMapping("/analyze")
    @ApiOperation("研判生成：检索召回 + 单次 LLM 生成分层研判简报 + 真实溯源锚点")
    public BaseResponse<AnalysisResponse> analyze(@RequestBody Map<String, Object> request) {
        String kbId = asString(request.get("kbId"));
        String query = asString(request.get("query"));
        if (StringUtils.isBlank(kbId) || StringUtils.isBlank(query)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID和提问内容不能为空");
        }
        String modelConfigId = asString(request.get("modelConfigId"));
        return ResultUtils.success(intelligenceAnalyzerService.analyze(kbId, query, modelConfigId));
    }

    @GetMapping("/history")
    @ApiOperation("查询研判历史（按知识库，时间倒序）")
    public BaseResponse<List<AnalysisHistory>> history(String kbId, Integer limit) {
        return ResultUtils.success(analysisHistoryService.listHistory(kbId, limit == null ? 50 : limit));
    }

    @GetMapping("/history/get")
    @ApiOperation("查询单条研判历史详情")
    public BaseResponse<AnalysisHistory> historyDetail(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "历史记录ID不能为空");
        }
        AnalysisHistory history = analysisHistoryService.getById(id);
        if (history == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "研判历史不存在");
        }
        return ResultUtils.success(history);
    }

    @PostMapping("/history/delete")
    @ApiOperation("删除研判历史")
    public BaseResponse<Boolean> deleteHistory(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "历史记录ID不能为空");
        }
        return ResultUtils.success(analysisHistoryService.removeById(id));
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
