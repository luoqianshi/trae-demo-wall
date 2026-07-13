package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.constant.CommonConstant;
import com.ice.template.mapper.WorkflowTemplateMapper;
import com.ice.template.model.dto.workflowtemplate.WorkflowTemplateQueryRequest;
import com.ice.template.model.entity.WorkflowTemplate;
import com.ice.template.model.vo.WorkflowTemplateVO;
import com.ice.template.service.WorkflowTemplateService;
import com.ice.template.utils.SqlUtils;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class WorkflowTemplateServiceImpl extends ServiceImpl<WorkflowTemplateMapper, WorkflowTemplate> implements WorkflowTemplateService {

    @Override
    public QueryWrapper<WorkflowTemplate> getQueryWrapper(WorkflowTemplateQueryRequest workflowTemplateQueryRequest) {
        QueryWrapper<WorkflowTemplate> queryWrapper = new QueryWrapper<>();
        if (workflowTemplateQueryRequest == null) {
            return queryWrapper;
        }
        String id = workflowTemplateQueryRequest.getId();
        String searchText = workflowTemplateQueryRequest.getSearchText();
        String category = workflowTemplateQueryRequest.getCategory();
        Boolean systemTemplate = workflowTemplateQueryRequest.getSystemTemplate();
        String sortField = workflowTemplateQueryRequest.getSortField();
        String sortOrder = workflowTemplateQueryRequest.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(StringUtils.isNotBlank(category), "category", category);
        queryWrapper.eq(systemTemplate != null, "system_template", Boolean.TRUE.equals(systemTemplate) ? 1 : 0);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or().like("description", searchText)
                    .or().like("tags", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        queryWrapper.orderByAsc("id");
        return queryWrapper;
    }

    @Override
    public WorkflowTemplateVO getWorkflowTemplateVO(WorkflowTemplate workflowTemplate) {
        return WorkflowTemplateVO.objToVo(workflowTemplate);
    }

    @Override
    public List<WorkflowTemplateVO> getWorkflowTemplateVOList(List<WorkflowTemplate> workflowTemplateList) {
        if (workflowTemplateList == null) {
            return Collections.emptyList();
        }
        return workflowTemplateList.stream().map(WorkflowTemplateVO::objToVo).collect(Collectors.toList());
    }
}
