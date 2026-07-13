package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.flowproject.FlowProjectQueryRequest;
import com.ice.template.model.entity.FlowProject;
import com.ice.template.model.vo.FlowProjectVO;
import java.util.List;

public interface FlowProjectService extends IService<FlowProject> {

    void validFlowProject(FlowProject flowProject, boolean add);

    QueryWrapper<FlowProject> getQueryWrapper(FlowProjectQueryRequest flowProjectQueryRequest);

    FlowProjectVO getFlowProjectVO(FlowProject flowProject);

    List<FlowProjectVO> getFlowProjectVOList(List<FlowProject> flowProjectList);
}
