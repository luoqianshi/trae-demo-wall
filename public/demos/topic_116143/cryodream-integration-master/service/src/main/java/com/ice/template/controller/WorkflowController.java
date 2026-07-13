package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.workflow.WorkflowAddRequest;
import com.ice.template.model.dto.workflow.WorkflowCreateFromTemplateRequest;
import com.ice.template.model.dto.workflow.WorkflowQueryRequest;
import com.ice.template.model.dto.workflow.WorkflowSaveGraphRequest;
import com.ice.template.model.dto.workflow.WorkflowUpdateRequest;
import com.ice.template.model.dto.workflow.SaveAsTemplateRequest;
import com.ice.template.model.entity.Workflow;
import com.ice.template.model.vo.WorkflowVO;
import com.ice.template.service.WorkflowService;
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
@RequestMapping("/workflow")
@Api(tags = "工作流接口")
public class WorkflowController {

    @Resource
    private WorkflowService workflowService;

    @PostMapping("/add")
    @ApiOperation("新增工作流")
    public BaseResponse<String> addWorkflow(@RequestBody WorkflowAddRequest workflowAddRequest) {
        if (workflowAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Workflow workflow = new Workflow();
        BeanUtils.copyProperties(workflowAddRequest, workflow);
        workflow.setName(StringUtils.defaultIfBlank(workflow.getName(), "未命名工作流"));
        workflow.setStatus("draft");
        workflow.setVersion(1);
        workflow.setGraphJson(StringUtils.defaultIfBlank(workflow.getGraphJson(), "{\"nodes\":[],\"edges\":[]}"));
        workflow.setNodeCount(0);
        workflow.setEdgeCount(0);
        workflow.setLastRunStatus("never");
        workflowService.validWorkflow(workflow, true);
        boolean result = workflowService.save(workflow);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(workflow.getId());
    }

    @PostMapping("/create/fromTemplate")
    @ApiOperation("从模板创建工作流")
    public BaseResponse<String> createWorkflowFromTemplate(@RequestBody WorkflowCreateFromTemplateRequest request) {
        return ResultUtils.success(workflowService.createFromTemplate(request));
    }

    @PostMapping("/saveGraph")
    @ApiOperation("保存工作流画布")
    public BaseResponse<Boolean> saveWorkflowGraph(@RequestBody WorkflowSaveGraphRequest request) {
        return ResultUtils.success(workflowService.saveGraph(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新工作流元信息（名称、描述、分类、标签）")
    public BaseResponse<Boolean> updateWorkflow(@RequestBody WorkflowUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(workflowService.updateWorkflow(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除工作流")
    public BaseResponse<Boolean> deleteWorkflow(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Workflow oldWorkflow = workflowService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldWorkflow == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(workflowService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("根据 id 查询工作流")
    public BaseResponse<WorkflowVO> getWorkflowById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Workflow workflow = workflowService.getById(id);
        ThrowUtils.throwIf(workflow == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(workflowService.getWorkflowVO(workflow));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询工作流")
    public BaseResponse<Page<WorkflowVO>> listWorkflowByPage(@RequestBody WorkflowQueryRequest workflowQueryRequest) {
        if (workflowQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = workflowQueryRequest.getCurrent();
        long size = workflowQueryRequest.getPageSize();
        Page<Workflow> workflowPage = workflowService.page(new Page<>(current, size), workflowService.getQueryWrapper(workflowQueryRequest));
        Page<WorkflowVO> workflowVOPage = new Page<>(current, size, workflowPage.getTotal());
        workflowVOPage.setRecords(workflowService.getWorkflowVOList(workflowPage.getRecords()));
        return ResultUtils.success(workflowVOPage);
    }
}
