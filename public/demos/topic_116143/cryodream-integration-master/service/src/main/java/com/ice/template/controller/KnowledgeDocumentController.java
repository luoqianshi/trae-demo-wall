package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.knowledge.DocumentAddRequest;
import com.ice.template.model.dto.knowledge.DocumentQueryRequest;
import com.ice.template.model.dto.knowledge.DocumentUpdateRequest;
import com.ice.template.model.entity.KnowledgeDocument;
import com.ice.template.model.vo.KnowledgeDocumentVO;
import com.ice.template.service.KnowledgeDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/knowledge-document")
@Api(tags = "知识库文档接口")
public class KnowledgeDocumentController {

    @Resource
    private KnowledgeDocumentService documentService;

    @PostMapping("/add")
    @ApiOperation("新增文档")
    public BaseResponse<String> addDocument(@RequestBody DocumentAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(documentService.addDocument(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新文档")
    public BaseResponse<Boolean> updateDocument(@RequestBody DocumentUpdateRequest request) {
        if (request == null || request.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(documentService.updateDocument(request));
    }

    @PostMapping("/updateContent")
    @ApiOperation("更新文档内容")
    public BaseResponse<Boolean> updateDocumentContent(@RequestBody DocumentUpdateRequest request) {
        if (request == null || request.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(documentService.updateDocumentContent(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除文档")
    public BaseResponse<Boolean> deleteDocument(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || deleteRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeDocument oldDocument = documentService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldDocument == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        return ResultUtils.success(documentService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("根据 id 查询文档")
    public BaseResponse<KnowledgeDocumentVO> getDocumentById(String id) {
        if (id == null || id.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeDocument document = documentService.getById(id);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        return ResultUtils.success(documentService.getKnowledgeDocumentVO(document));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询文档")
    public BaseResponse<Page<KnowledgeDocumentVO>> listDocumentByPage(@RequestBody DocumentQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = request.getCurrent();
        long size = request.getPageSize();
        Page<KnowledgeDocument> page = documentService.page(new Page<>(current, size),
                documentService.getQueryWrapper(request));
        Page<KnowledgeDocumentVO> voPage = new Page<>(current, size, page.getTotal());
        voPage.setRecords(documentService.getKnowledgeDocumentVOList(page.getRecords()));
        return ResultUtils.success(voPage);
    }
}
