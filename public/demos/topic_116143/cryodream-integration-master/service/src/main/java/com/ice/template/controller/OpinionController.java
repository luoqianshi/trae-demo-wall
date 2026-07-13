package com.ice.template.controller;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.KnowledgeOpinion;
import com.ice.template.service.KnowledgeOpinionService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.*;

/**
 * 观点 API（实体关系驱动）
 * 支持：观点列表、详情、按实体/立场/利益相关性筛选、CRUD
 */
@Slf4j
@RestController
@RequestMapping("/opinion")
@Api(tags = "观点库管理")
public class OpinionController {

    @Resource
    private KnowledgeOpinionService knowledgeOpinionService;

    /**
     * 观点列表（分页 + 多维筛选）
     * 支持按 source_entity / interest_alignment / stance / 关键词筛选
     */
    @GetMapping("/list")
    @ApiOperation("观点列表")
    public BaseResponse<Page<KnowledgeOpinion>> list(
            @RequestParam String kbId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String sourceEntity,
            @RequestParam(required = false) String interestAlignment,
            @RequestParam(required = false) String stance,
            @RequestParam(required = false) String keyword) {

        LambdaQueryWrapper<KnowledgeOpinion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeOpinion::getKbId, kbId);

        // source_entity 精确匹配（JSONB 字段文本查询）
        if (StringUtils.isNotBlank(sourceEntity)) {
            wrapper.apply("relations->>'source_entity' = {0}", sourceEntity);
        }
        // interest_alignment 精确匹配
        if (StringUtils.isNotBlank(interestAlignment)) {
            wrapper.apply("relations->>'interest_alignment' = {0}", interestAlignment);
        }
        // stance 数组包含
        if (StringUtils.isNotBlank(stance)) {
            wrapper.apply("context->'stance' @> {0}::jsonb", "[\"" + stance + "\"]");
        }
        // 关键词搜索（core_thesis 或 search_index）
        if (StringUtils.isNotBlank(keyword)) {
            wrapper.and(w -> w.like(KnowledgeOpinion::getCoreThesis, keyword)
                    .or().like(KnowledgeOpinion::getSearchIndex, keyword));
        }

        wrapper.orderByDesc(KnowledgeOpinion::getCreateTime);
        Page<KnowledgeOpinion> result = knowledgeOpinionService.page(new Page<>(page, pageSize), wrapper);
        return ResultUtils.success(result);
    }

    /**
     * 观点详情
     */
    @GetMapping("/detail")
    @ApiOperation("观点详情")
    public BaseResponse<KnowledgeOpinion> detail(@RequestParam String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        KnowledgeOpinion opinion = knowledgeOpinionService.getById(id);
        if (opinion == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "观点不存在");
        }
        return ResultUtils.success(opinion);
    }

    /**
     * 统计：按利益相关性分组
     */
    @GetMapping("/stats")
    @ApiOperation("观点统计")
    public BaseResponse<List<JSONObject>> stats(@RequestParam String kbId) {
        List<KnowledgeOpinion> all = knowledgeOpinionService.lambdaQuery()
                .eq(KnowledgeOpinion::getKbId, kbId)
                .list();
        Map<String, Integer> alignmentCount = new LinkedHashMap<>();
        alignmentCount.put("利益相关", 0);
        alignmentCount.put("利益无关", 0);
        alignmentCount.put("竞争抹黑", 0);
        for (KnowledgeOpinion opn : all) {
            try {
                JSONObject relations = JSONUtil.parseObj(opn.getRelations());
                String alignment = relations.getStr("interest_alignment", "未知");
                alignmentCount.merge(alignment, 1, Integer::sum);
            } catch (Exception ignored) {
            }
        }
        List<JSONObject> result = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : alignmentCount.entrySet()) {
            JSONObject obj = new JSONObject();
            obj.set("alignment", entry.getKey());
            obj.set("count", entry.getValue());
            result.add(obj);
        }
        return ResultUtils.success(result);
    }

    /**
     * 删除观点
     */
    @PostMapping("/delete")
    @ApiOperation("删除观点")
    public BaseResponse<Boolean> delete(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        return ResultUtils.success(knowledgeOpinionService.removeById(id));
    }

    /**
     * 清空知识库下所有观点
     */
    @PostMapping("/clear-data")
    @ApiOperation("清空观点数据")
    public BaseResponse<Boolean> clearData(@RequestBody Map<String, Object> request) {
        String kbId = asString(request.get("kbId"));
        if (StringUtils.isBlank(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "kbId 不能为空");
        }
        List<KnowledgeOpinion> all = knowledgeOpinionService.lambdaQuery()
                .eq(KnowledgeOpinion::getKbId, kbId)
                .list();
        List<String> ids = all.stream().map(KnowledgeOpinion::getId).toList();
        if (ids.isEmpty()) return ResultUtils.success(true);
        return ResultUtils.success(knowledgeOpinionService.removeByIds(ids));
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
