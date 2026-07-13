package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseAddRequest;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseQueryRequest;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseUpdateRequest;
import com.ice.template.model.dto.knowledge.DocumentUpdateRequest;
import com.ice.template.model.entity.KnowledgeBase;
import com.ice.template.model.vo.KnowledgeBaseVO;
import com.ice.template.service.KnowledgeBaseService;
import com.ice.template.service.KnowledgeDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/knowledgeBase")
@Api(tags = "知识库接口")
public class KnowledgeBaseController {

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @Resource
    private KnowledgeDocumentService documentService;

    @PostMapping("/add")
    @ApiOperation("新增知识库")
    public BaseResponse<String> addKnowledgeBase(@RequestBody KnowledgeBaseAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(knowledgeBaseService.addKnowledgeBase(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新知识库")
    public BaseResponse<Boolean> updateKnowledgeBase(@RequestBody KnowledgeBaseUpdateRequest request) {
        if (request == null || request.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(knowledgeBaseService.updateKnowledgeBase(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除知识库")
    public BaseResponse<Boolean> deleteKnowledgeBase(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || deleteRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeBase oldKnowledgeBase = knowledgeBaseService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldKnowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");
        return ResultUtils.success(knowledgeBaseService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("根据 id 查询知识库")
    public BaseResponse<KnowledgeBaseVO> getKnowledgeBaseById(String id) {
        if (id == null || id.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(id);
        ThrowUtils.throwIf(knowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");
        return ResultUtils.success(knowledgeBaseService.getKnowledgeBaseVO(knowledgeBase));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询知识库")
    public BaseResponse<Page<KnowledgeBaseVO>> listKnowledgeBaseByPage(@RequestBody KnowledgeBaseQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = request.getCurrent();
        long size = request.getPageSize();
        Page<KnowledgeBase> page = knowledgeBaseService.page(new Page<>(current, size),
                knowledgeBaseService.getQueryWrapper(request));
        Page<KnowledgeBaseVO> voPage = new Page<>(current, size, page.getTotal());
        voPage.setRecords(knowledgeBaseService.getKnowledgeBaseVOList(page.getRecords()));
        return ResultUtils.success(voPage);
    }

    @PostMapping("/ingest")
    @ApiOperation("执行文档入库")
    public BaseResponse<Boolean> ingestDocument(@RequestBody DocumentUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(request.getId());
        updateRequest.setStatus("processing");
        documentService.updateDocument(updateRequest);
        
        documentService.updateDocumentContent(request);
        
        updateRequest.setStatus("completed");
        updateRequest.setChunkCount(10);
        documentService.updateDocument(updateRequest);
        
        return ResultUtils.success(true);
    }
}
