package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.workflow.WorkflowCreateFromTemplateRequest;
import com.ice.template.model.dto.workflow.WorkflowQueryRequest;
import com.ice.template.model.dto.workflow.WorkflowSaveGraphRequest;
import com.ice.template.model.dto.workflow.WorkflowUpdateRequest;
import com.ice.template.model.entity.Workflow;
import com.ice.template.model.vo.WorkflowVO;
import java.util.List;

public interface WorkflowService extends IService<Workflow> {

    void validWorkflow(Workflow workflow, boolean add);

    String createFromTemplate(WorkflowCreateFromTemplateRequest request);

    Boolean saveGraph(WorkflowSaveGraphRequest request);

    Boolean saveAsTemplate(String workflowId);

    Boolean updateWorkflow(WorkflowUpdateRequest request);

    QueryWrapper<Workflow> getQueryWrapper(WorkflowQueryRequest workflowQueryRequest);

    WorkflowVO getWorkflowVO(Workflow workflow);

    List<WorkflowVO> getWorkflowVOList(List<Workflow> workflowList);
}
