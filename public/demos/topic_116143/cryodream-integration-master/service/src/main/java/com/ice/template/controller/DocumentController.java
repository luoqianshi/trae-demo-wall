package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.document.DocumentAddRequest;
import com.ice.template.model.dto.document.DocumentQueryRequest;
import com.ice.template.model.dto.document.DocumentUpdateRequest;
import com.ice.template.model.entity.Doc;
import com.ice.template.model.vo.DocVO;
import com.ice.template.service.DocService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/document")
@Api(tags = "文档接口")
public class DocumentController {

    @Resource
    private DocService docService;

    @PostMapping("/add")
    @ApiOperation("新建文档")
    public BaseResponse<String> addDocument(@RequestBody DocumentAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Doc doc = new Doc();
        BeanUtils.copyProperties(request, doc);
        doc.setTitle(StringUtils.defaultIfBlank(doc.getTitle(), "未命名文档"));
        doc.setFormat(StringUtils.defaultIfBlank(doc.getFormat(), "markdown"));
        doc.setStatus("draft");
        boolean result = docService.save(doc);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(doc.getId());
    }

    @PostMapping("/update")
    @ApiOperation("更新文档")
    public BaseResponse<Boolean> updateDocument(@RequestBody DocumentUpdateRequest request) {
        return ResultUtils.success(docService.updateDocument(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除文档")
    public BaseResponse<Boolean> deleteDocument(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Doc doc = docService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(doc == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(docService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("查询文档")
    public BaseResponse<DocVO> getDocument(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Doc doc = docService.getById(id);
        ThrowUtils.throwIf(doc == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(DocVO.objToVo(doc));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询文档")
    public BaseResponse<Page<DocVO>> listDocumentByPage(@RequestBody DocumentQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(docService.listByPage(request));
    }
}
