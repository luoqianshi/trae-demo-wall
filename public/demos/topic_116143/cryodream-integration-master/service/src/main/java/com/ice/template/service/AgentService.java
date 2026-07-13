package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.agent.AgentAddRequest;
import com.ice.template.model.dto.agent.AgentQueryRequest;
import com.ice.template.model.dto.agent.AgentUpdateRequest;
import com.ice.template.model.entity.Agent;
import com.ice.template.model.vo.AgentVO;

import java.util.List;

public interface AgentService extends IService<Agent> {

    void validAgent(Agent agent, boolean add);

    AgentVO getAgentVO(Agent agent);

    List<AgentVO> getAgentVOList(List<Agent> agentList);

    String addAgent(AgentAddRequest request);

    boolean updateAgent(AgentUpdateRequest request);

    AgentVO getAgentById(String id);

    List<AgentVO> listAgents(AgentQueryRequest request);
}