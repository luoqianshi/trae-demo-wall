package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.workflowtemplate.WorkflowTemplateQueryRequest;
import com.ice.template.model.entity.WorkflowTemplate;
import com.ice.template.model.vo.WorkflowTemplateVO;
import com.ice.template.service.WorkflowTemplateService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.Map;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/workflowTemplate")
@Api(tags = "工作流模板接口")
public class WorkflowTemplateController {

    @Resource
    private WorkflowTemplateService workflowTemplateService;

    @GetMapping("/get")
    @ApiOperation("根据 id 查询工作流模板")
    public BaseResponse<WorkflowTemplateVO> getWorkflowTemplateById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        WorkflowTemplate workflowTemplate = workflowTemplateService.getById(id);
        ThrowUtils.throwIf(workflowTemplate == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(workflowTemplateService.getWorkflowTemplateVO(workflowTemplate));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询工作流模板")
    public BaseResponse<Page<WorkflowTemplateVO>> listWorkflowTemplateByPage(@RequestBody WorkflowTemplateQueryRequest workflowTemplateQueryRequest) {
        if (workflowTemplateQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = workflowTemplateQueryRequest.getCurrent();
        long size = workflowTemplateQueryRequest.getPageSize();
        Page<WorkflowTemplate> workflowTemplatePage = workflowTemplateService.page(new Page<>(current, size), workflowTemplateService.getQueryWrapper(workflowTemplateQueryRequest));
        Page<WorkflowTemplateVO> workflowTemplateVOPage = new Page<>(current, size, workflowTemplatePage.getTotal());
        workflowTemplateVOPage.setRecords(workflowTemplateService.getWorkflowTemplateVOList(workflowTemplatePage.getRecords()));
        return ResultUtils.success(workflowTemplateVOPage);
    }

    @PostMapping("/saveGraph")
    @ApiOperation("保存系统工作流模板的画布数据")
    public BaseResponse<Boolean> saveTemplateGraph(@RequestBody Map<String, String> request) {
        String id = request.get("id");
        String graphJson = request.get("graphJson");
        String name = request.get("name");
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模板ID不能为空");
        }
        WorkflowTemplate template = workflowTemplateService.getById(id);
        ThrowUtils.throwIf(template == null, ErrorCode.NOT_FOUND_ERROR, "模板不存在");
        if (StringUtils.isNotBlank(graphJson)) {
            template.setGraphJson(graphJson);
        }
        if (StringUtils.isNotBlank(name)) {
            template.setName(name);
        }
        boolean result = workflowTemplateService.updateById(template);
        return ResultUtils.success(result);
    }
}
