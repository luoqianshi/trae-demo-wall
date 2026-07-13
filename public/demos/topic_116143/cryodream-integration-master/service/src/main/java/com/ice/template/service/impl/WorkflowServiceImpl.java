package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.WorkflowMapper;
import com.ice.template.model.dto.workflow.WorkflowCreateFromTemplateRequest;
import com.ice.template.model.dto.workflow.WorkflowQueryRequest;
import com.ice.template.model.dto.workflow.WorkflowSaveGraphRequest;
import com.ice.template.model.dto.workflow.WorkflowUpdateRequest;
import com.ice.template.model.entity.FlowProject;
import com.ice.template.model.entity.Workflow;
import com.ice.template.model.entity.WorkflowTemplate;
import com.ice.template.model.vo.WorkflowVO;
import com.ice.template.service.FlowProjectService;
import com.ice.template.service.WorkflowService;
import com.ice.template.service.WorkflowTemplateService;
import com.ice.template.utils.SqlUtils;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class WorkflowServiceImpl extends ServiceImpl<WorkflowMapper, Workflow> implements WorkflowService {

    @Resource
    private FlowProjectService flowProjectService;

    @Resource
    private WorkflowTemplateService workflowTemplateService;

    @Override
    public void validWorkflow(Workflow workflow, boolean add) {
        if (workflow == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        if (add && workflow.getProjectId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "项目不能为空");
        }
        if (add && StringUtils.isBlank(workflow.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "工作流名称不能为空");
        }
        if (StringUtils.isNotBlank(workflow.getName()) && workflow.getName().length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "工作流名称过长");
        }
        if (StringUtils.isNotBlank(workflow.getDescription()) && workflow.getDescription().length() > 1024) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "工作流描述过长");
        }
        if (add) {
            FlowProject project = flowProjectService.getById(workflow.getProjectId());
            ThrowUtils.throwIf(project == null, ErrorCode.NOT_FOUND_ERROR, "项目不存在");
        }
    }

    @Override
    public String createFromTemplate(WorkflowCreateFromTemplateRequest request) {
        if (request == null || request.getProjectId() == null || request.getTemplateId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        // 先查系统模板表（workflow_template），找不到再查工作流表中 is_template=1 的记录
        WorkflowTemplate template = workflowTemplateService.getById(request.getTemplateId());
        String graphJson;
        String templateName;
        String templateDesc;
        String sourceTemplateId;
        if (template != null) {
            graphJson = template.getGraphJson();
            templateName = template.getName();
            templateDesc = template.getDescription();
            sourceTemplateId = template.getId();
        } else {
            Workflow templateWorkflow = this.getById(request.getTemplateId());
            ThrowUtils.throwIf(templateWorkflow == null || (templateWorkflow.getIsTemplate() == null || templateWorkflow.getIsTemplate() != 1),
                    ErrorCode.NOT_FOUND_ERROR, "模板不存在");
            graphJson = templateWorkflow.getGraphJson();
            templateName = templateWorkflow.getName();
            templateDesc = templateWorkflow.getDescription();
            sourceTemplateId = templateWorkflow.getId();
        }
        Workflow workflow = new Workflow();
        workflow.setProjectId(request.getProjectId());
        workflow.setName(StringUtils.defaultIfBlank(request.getName(), templateName));
        workflow.setDescription(StringUtils.defaultIfBlank(request.getDescription(), templateDesc));
        workflow.setStatus("draft");
        workflow.setVersion(1);
        workflow.setSourceTemplateId(sourceTemplateId);
        workflow.setGraphJson(graphJson);
        workflow.setNodeCount(0);
        workflow.setEdgeCount(0);
        workflow.setLastRunStatus("never");
        validWorkflow(workflow, true);
        boolean result = this.save(workflow);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        updateProjectLastWorkflow(workflow.getProjectId(), workflow.getId());
        return workflow.getId();
    }

    @Override
    public Boolean saveGraph(WorkflowSaveGraphRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Workflow oldWorkflow = this.getById(request.getId());
        ThrowUtils.throwIf(oldWorkflow == null, ErrorCode.NOT_FOUND_ERROR);
        Workflow workflow = new Workflow();
        workflow.setId(request.getId());
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setGraphJson(request.getGraphJson());
        workflow.setNodeCount(request.getNodeCount());
        workflow.setEdgeCount(request.getEdgeCount());
        workflow.setStatus(StringUtils.defaultIfBlank(request.getStatus(), "draft"));
        workflow.setVersion(oldWorkflow.getVersion() == null ? 1 : oldWorkflow.getVersion() + 1);
        validWorkflow(workflow, false);
        boolean result = this.updateById(workflow);
        if (result) {
            updateProjectLastWorkflow(oldWorkflow.getProjectId(), oldWorkflow.getId());
        }
        return result;
    }

    @Override
    public Boolean saveAsTemplate(String workflowId) {
        if (StringUtils.isBlank(workflowId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Workflow workflow = this.getById(workflowId);
        ThrowUtils.throwIf(workflow == null, ErrorCode.NOT_FOUND_ERROR);
        Workflow update = new Workflow();
        update.setId(workflowId);
        update.setIsTemplate(1);
        return this.updateById(update);
    }

    @Override
    public Boolean updateWorkflow(WorkflowUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Workflow oldWorkflow = this.getById(request.getId());
        ThrowUtils.throwIf(oldWorkflow == null, ErrorCode.NOT_FOUND_ERROR);
        Workflow workflow = new Workflow();
        workflow.setId(request.getId());
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setCategory(request.getCategory());
        workflow.setTags(request.getTags());
        validWorkflow(workflow, false);
        return this.updateById(workflow);
    }

    @Override
    public QueryWrapper<Workflow> getQueryWrapper(WorkflowQueryRequest workflowQueryRequest) {
        QueryWrapper<Workflow> queryWrapper = new QueryWrapper<>();
        if (workflowQueryRequest == null) {
            return queryWrapper;
        }
        String id = workflowQueryRequest.getId();
        String projectId = workflowQueryRequest.getProjectId();
        String searchText = workflowQueryRequest.getSearchText();
        String name = workflowQueryRequest.getName();
        String status = workflowQueryRequest.getStatus();
        String sortField = workflowQueryRequest.getSortField();
        String sortOrder = workflowQueryRequest.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(ObjectUtils.isNotEmpty(projectId), "project_id", projectId);
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        queryWrapper.eq(StringUtils.isNotBlank(status), "status", status);
        Integer isTemplate = workflowQueryRequest.getIsTemplate();
        queryWrapper.eq(ObjectUtils.isNotEmpty(isTemplate), "is_template", isTemplate);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or().like("description", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        queryWrapper.orderByDesc("update_time");
        return queryWrapper;
    }

    @Override
    public WorkflowVO getWorkflowVO(Workflow workflow) {
        WorkflowVO vo = WorkflowVO.objToVo(workflow);
        if (vo != null && StringUtils.isNotBlank(vo.getProjectId())) {
            FlowProject project = flowProjectService.getById(vo.getProjectId());
            if (project != null) {
                vo.setProjectName(project.getName());
            }
        }
        return vo;
    }

    @Override
    public List<WorkflowVO> getWorkflowVOList(List<Workflow> workflowList) {
        if (workflowList == null) {
            return Collections.emptyList();
        }
        // 批量获取项目名称
        Set<String> projectIds = workflowList.stream()
                .map(Workflow::getProjectId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toSet());
        Map<String, String> projectNameMap = Map.of();
        if (!projectIds.isEmpty()) {
            List<FlowProject> projects = flowProjectService.listByIds(projectIds);
            projectNameMap = projects.stream()
                    .collect(Collectors.toMap(FlowProject::getId, FlowProject::getName));
        }
        Map<String, String> finalMap = projectNameMap;
        return workflowList.stream().map(wf -> {
            WorkflowVO vo = WorkflowVO.objToVo(wf);
            if (vo != null && StringUtils.isNotBlank(vo.getProjectId())) {
                vo.setProjectName(finalMap.get(vo.getProjectId()));
            }
            return vo;
        }).collect(Collectors.toList());
    }

    private void updateProjectLastWorkflow(String projectId, String workflowId) {
        if (StringUtils.isBlank(projectId) || StringUtils.isBlank(workflowId)) {
            return;
        }
        FlowProject flowProject = new FlowProject();
        flowProject.setId(projectId);
        flowProject.setLastWorkflowId(workflowId);
        flowProjectService.updateById(flowProject);
    }
}
