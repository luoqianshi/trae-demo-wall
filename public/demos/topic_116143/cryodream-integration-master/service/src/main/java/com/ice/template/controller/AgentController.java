package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.agent.AgentAddRequest;
import com.ice.template.model.dto.agent.AgentQueryRequest;
import com.ice.template.model.dto.agent.AgentUpdateRequest;
import com.ice.template.model.entity.Agent;
import com.ice.template.model.vo.AgentVO;
import com.ice.template.service.AgentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/agent")
@Api(tags = "智能体接口")
public class AgentController {

    @Resource
    private AgentService agentService;

    @PostMapping("/add")
    @ApiOperation("新增智能体")
    public BaseResponse<String> addAgent(@RequestBody AgentAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(agentService.addAgent(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新智能体")
    public BaseResponse<Boolean> updateAgent(@RequestBody AgentUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(agentService.updateAgent(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除智能体")
    public BaseResponse<Boolean> deleteAgent(@RequestBody DeleteRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Agent agent = agentService.getById(request.getId());
        if (agent == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(agentService.removeById(request.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("根据id查询智能体")
    public BaseResponse<AgentVO> getAgentById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(agentService.getAgentById(id));
    }

    @PostMapping("/list")
    @ApiOperation("查询智能体列表")
    public BaseResponse<List<AgentVO>> listAgents(@RequestBody(required = false) AgentQueryRequest request) {
        return ResultUtils.success(agentService.listAgents(request));
    }
}