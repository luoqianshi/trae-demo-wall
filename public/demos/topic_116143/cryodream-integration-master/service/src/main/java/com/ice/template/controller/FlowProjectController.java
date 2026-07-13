package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.flowproject.FlowProjectAddRequest;
import com.ice.template.model.dto.flowproject.FlowProjectQueryRequest;
import com.ice.template.model.dto.flowproject.FlowProjectUpdateRequest;
import com.ice.template.model.entity.FlowProject;
import com.ice.template.model.vo.FlowProjectVO;
import com.ice.template.service.FlowProjectService;
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
@RequestMapping("/flowProject")
@Api(tags = "项目空间接口")
public class FlowProjectController {

    @Resource
    private FlowProjectService flowProjectService;

    @PostMapping("/add")
    @ApiOperation("新增项目")
    public BaseResponse<String> addFlowProject(@RequestBody FlowProjectAddRequest flowProjectAddRequest) {
        if (flowProjectAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        FlowProject flowProject = new FlowProject();
        BeanUtils.copyProperties(flowProjectAddRequest, flowProject);
        flowProject.setStatus("active");
        flowProject.setSortOrder(0);
        flowProject.setIcon(flowProject.getIcon() == null ? "FolderKanban" : flowProject.getIcon());
        flowProject.setColor(flowProject.getColor() == null ? "blue" : flowProject.getColor());
        flowProjectService.validFlowProject(flowProject, true);
        boolean result = flowProjectService.save(flowProject);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(flowProject.getId());
    }

    @PostMapping("/delete")
    @ApiOperation("删除项目")
    public BaseResponse<Boolean> deleteFlowProject(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        FlowProject oldFlowProject = flowProjectService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldFlowProject == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(flowProjectService.removeById(deleteRequest.getId()));
    }

    @PostMapping("/update")
    @ApiOperation("更新项目")
    public BaseResponse<Boolean> updateFlowProject(@RequestBody FlowProjectUpdateRequest flowProjectUpdateRequest) {
        if (flowProjectUpdateRequest == null || StringUtils.isBlank(flowProjectUpdateRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        FlowProject oldFlowProject = flowProjectService.getById(flowProjectUpdateRequest.getId());
        ThrowUtils.throwIf(oldFlowProject == null, ErrorCode.NOT_FOUND_ERROR);
        FlowProject flowProject = new FlowProject();
        BeanUtils.copyProperties(flowProjectUpdateRequest, flowProject);
        flowProjectService.validFlowProject(flowProject, false);
        return ResultUtils.success(flowProjectService.updateById(flowProject));
    }

    @GetMapping("/get")
    @ApiOperation("根据 id 查询项目")
    public BaseResponse<FlowProjectVO> getFlowProjectById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        FlowProject flowProject = flowProjectService.getById(id);
        ThrowUtils.throwIf(flowProject == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(flowProjectService.getFlowProjectVO(flowProject));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询项目")
    public BaseResponse<Page<FlowProjectVO>> listFlowProjectByPage(@RequestBody FlowProjectQueryRequest flowProjectQueryRequest) {
        if (flowProjectQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = flowProjectQueryRequest.getCurrent();
        long size = flowProjectQueryRequest.getPageSize();
        Page<FlowProject> flowProjectPage = flowProjectService.page(new Page<>(current, size), flowProjectService.getQueryWrapper(flowProjectQueryRequest));
        Page<FlowProjectVO> flowProjectVOPage = new Page<>(current, size, flowProjectPage.getTotal());
        flowProjectVOPage.setRecords(flowProjectService.getFlowProjectVOList(flowProjectPage.getRecords()));
        return ResultUtils.success(flowProjectVOPage);
    }
}
