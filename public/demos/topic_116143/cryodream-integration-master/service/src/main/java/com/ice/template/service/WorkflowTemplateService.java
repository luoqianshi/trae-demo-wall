package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.workflowtemplate.WorkflowTemplateQueryRequest;
import com.ice.template.model.entity.WorkflowTemplate;
import com.ice.template.model.vo.WorkflowTemplateVO;
import java.util.List;

public interface WorkflowTemplateService extends IService<WorkflowTemplate> {

    QueryWrapper<WorkflowTemplate> getQueryWrapper(WorkflowTemplateQueryRequest workflowTemplateQueryRequest);

    WorkflowTemplateVO getWorkflowTemplateVO(WorkflowTemplate workflowTemplate);

    List<WorkflowTemplateVO> getWorkflowTemplateVOList(List<WorkflowTemplate> workflowTemplateList);
}
