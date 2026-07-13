package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.FlowProjectMapper;
import com.ice.template.model.dto.flowproject.FlowProjectQueryRequest;
import com.ice.template.model.entity.FlowProject;
import com.ice.template.model.entity.Workflow;
import com.ice.template.model.vo.FlowProjectVO;
import com.ice.template.mapper.WorkflowMapper;
import com.ice.template.service.FlowProjectService;
import com.ice.template.utils.SqlUtils;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class FlowProjectServiceImpl extends ServiceImpl<FlowProjectMapper, FlowProject> implements FlowProjectService {

    @Resource
    private WorkflowMapper workflowMapper;

    @Override
    public void validFlowProject(FlowProject flowProject, boolean add) {
        if (flowProject == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String name = flowProject.getName();
        if (add && StringUtils.isBlank(name)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "项目名称不能为空");
        }
        if (StringUtils.isNotBlank(name) && name.length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "项目名称过长");
        }
        if (StringUtils.isNotBlank(flowProject.getDescription()) && flowProject.getDescription().length() > 1024) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "项目描述过长");
        }
    }

    @Override
    public QueryWrapper<FlowProject> getQueryWrapper(FlowProjectQueryRequest flowProjectQueryRequest) {
        QueryWrapper<FlowProject> queryWrapper = new QueryWrapper<>();
        if (flowProjectQueryRequest == null) {
            return queryWrapper;
        }
        String id = flowProjectQueryRequest.getId();
        String searchText = flowProjectQueryRequest.getSearchText();
        String name = flowProjectQueryRequest.getName();
        String status = flowProjectQueryRequest.getStatus();
        String scenario = flowProjectQueryRequest.getScenario();
        String sortField = flowProjectQueryRequest.getSortField();
        String sortOrder = flowProjectQueryRequest.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        queryWrapper.eq(StringUtils.isNotBlank(status), "status", status);
        queryWrapper.like(StringUtils.isNotBlank(scenario), "scenario", scenario);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or().like("description", searchText)
                    .or().like("scenario", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        queryWrapper.orderByAsc("sort_order");
        queryWrapper.orderByDesc("update_time");
        return queryWrapper;
    }

    @Override
    public FlowProjectVO getFlowProjectVO(FlowProject flowProject) {
        FlowProjectVO flowProjectVO = FlowProjectVO.objToVo(flowProject);
        if (flowProjectVO != null) {
            flowProjectVO.setWorkflowCount(countWorkflows(flowProject.getId()));
        }
        return flowProjectVO;
    }

    @Override
    public List<FlowProjectVO> getFlowProjectVOList(List<FlowProject> flowProjectList) {
        if (flowProjectList == null) {
            return Collections.emptyList();
        }
        return flowProjectList.stream().map(this::getFlowProjectVO).collect(Collectors.toList());
    }

    private Integer countWorkflows(String projectId) {
        if (StringUtils.isBlank(projectId)) {
            return 0;
        }
        return Math.toIntExact(workflowMapper.selectCount(new QueryWrapper<Workflow>().eq("project_id", projectId)));
    }
}
