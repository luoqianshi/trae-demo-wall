package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.AgentMapper;
import com.ice.template.model.dto.agent.AgentAddRequest;
import com.ice.template.model.dto.agent.AgentQueryRequest;
import com.ice.template.model.dto.agent.AgentUpdateRequest;
import com.ice.template.model.entity.Agent;
import com.ice.template.model.entity.FlowProject;
import com.ice.template.model.entity.KnowledgeBase;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.entity.Workflow;
import com.ice.template.model.vo.AgentVO;
import com.ice.template.service.AgentService;
import com.ice.template.service.FlowProjectService;
import com.ice.template.service.KnowledgeBaseService;
import com.ice.template.service.ModelConfigService;
import com.ice.template.service.WorkflowService;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AgentServiceImpl extends ServiceImpl<AgentMapper, Agent> implements AgentService {

    @Resource
    private ObjectMapper objectMapper;

    @Resource
    private WorkflowService workflowService;

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private FlowProjectService flowProjectService;

    @Override
    public void validAgent(Agent agent, boolean add) {
        if (agent == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String name = agent.getName();
        if (StringUtils.isBlank(name)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "智能体名称不能为空");
        }
        if (add) {
            if (StringUtils.isNotBlank(name)) {
                LambdaQueryWrapper<Agent> queryWrapper = new LambdaQueryWrapper<>();
                queryWrapper.eq(Agent::getName, name);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "智能体名称已存在");
                }
            }
        }
    }

    @Override
    public AgentVO getAgentVO(Agent agent) {
        if (agent == null) {
            return null;
        }
        AgentVO agentVO = new AgentVO();
        BeanUtils.copyProperties(agent, agentVO);

        if (StringUtils.isNotBlank(agent.getCoreMemory())) {
            try {
                AgentVO.CoreMemory coreMemory = objectMapper.readValue(
                        agent.getCoreMemory(),
                        new TypeReference<AgentVO.CoreMemory>() {}
                );
                agentVO.setCoreMemory(coreMemory);
            } catch (JsonProcessingException e) {
                agentVO.setCoreMemory(null);
            }
        }

        return agentVO;
    }

    @Override
    public List<AgentVO> getAgentVOList(List<Agent> agentList) {
        if (agentList == null || agentList.isEmpty()) {
            return new ArrayList<>();
        }

        List<AgentVO> agentVOList = agentList.stream()
                .map(this::getAgentVO)
                .collect(Collectors.toList());

        List<String> workflowIds = agentList.stream()
                .map(Agent::getWorkflowId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());

        List<String> kbIds = agentList.stream()
                .map(Agent::getKnowledgeBaseId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());

        List<String> modelIds = agentList.stream()
                .map(Agent::getModelConfigId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());

        List<String> projectIds = agentList.stream()
                .map(Agent::getProjectId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());

        Map<String, String> workflowNameMap = getWorkflowNameMap(workflowIds);
        Map<String, String> kbNameMap = getKnowledgeBaseNameMap(kbIds);
        Map<String, String> modelNameMap = getModelConfigNameMap(modelIds);
        Map<String, String> projectNameMap = getProjectNameMap(projectIds);

        agentVOList.forEach(vo -> {
            if (StringUtils.isNotBlank(vo.getWorkflowId())) {
                vo.setWorkflowName(workflowNameMap.get(vo.getWorkflowId()));
            }
            if (StringUtils.isNotBlank(vo.getKnowledgeBaseId())) {
                vo.setKnowledgeBaseName(kbNameMap.get(vo.getKnowledgeBaseId()));
            }
            if (StringUtils.isNotBlank(vo.getModelConfigId())) {
                vo.setModelConfigName(modelNameMap.get(vo.getModelConfigId()));
            }
            if (StringUtils.isNotBlank(vo.getProjectId())) {
                vo.setProjectName(projectNameMap.get(vo.getProjectId()));
            }
        });

        return agentVOList;
    }

    private Map<String, String> getWorkflowNameMap(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<Workflow> workflows = workflowService.listByIds(ids);
        return workflows.stream()
                .collect(Collectors.toMap(Workflow::getId, Workflow::getName));
    }

    private Map<String, String> getKnowledgeBaseNameMap(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<KnowledgeBase> kbs = knowledgeBaseService.listByIds(ids);
        return kbs.stream()
                .collect(Collectors.toMap(KnowledgeBase::getId, KnowledgeBase::getName));
    }

    private Map<String, String> getModelConfigNameMap(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<ModelConfig> models = modelConfigService.listByIds(ids);
        return models.stream()
                .collect(Collectors.toMap(ModelConfig::getId, ModelConfig::getName));
    }

    private Map<String, String> getProjectNameMap(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<FlowProject> projects = flowProjectService.listByIds(ids);
        return projects.stream()
                .collect(Collectors.toMap(FlowProject::getId, FlowProject::getName));
    }

    @Override
    public String addAgent(AgentAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Agent agent = new Agent();
        BeanUtils.copyProperties(request, agent);

        agent.setName(StringUtils.defaultIfBlank(agent.getName(), "未命名智能体"));
        agent.setStatus("active");

        if (request.getCoreMemory() != null) {
            try {
                agent.setCoreMemory(objectMapper.writeValueAsString(request.getCoreMemory()));
            } catch (JsonProcessingException e) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "核心记忆序列化失败");
            }
        }

        agent.setCreateTime(new Date());
        agent.setUpdateTime(new Date());

        validAgent(agent, true);
        boolean result = this.save(agent);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return agent.getId();
    }

    @Override
    public boolean updateAgent(AgentUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Agent agent = this.getById(request.getId());
        if (agent == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }

        if (StringUtils.isNotBlank(request.getName())) {
            agent.setName(request.getName());
        }
        if (StringUtils.isNotBlank(request.getDescription())) {
            agent.setDescription(request.getDescription());
        }
        if (StringUtils.isNotBlank(request.getAvatar())) {
            agent.setAvatar(request.getAvatar());
        }
        if (StringUtils.isNotBlank(request.getStatus())) {
            agent.setStatus(request.getStatus());
        }
        if (StringUtils.isNotBlank(request.getWorkflowId())) {
            agent.setWorkflowId(request.getWorkflowId());
        }
        if (StringUtils.isNotBlank(request.getKnowledgeBaseId())) {
            agent.setKnowledgeBaseId(request.getKnowledgeBaseId());
        }
        if (StringUtils.isNotBlank(request.getModelConfigId())) {
            agent.setModelConfigId(request.getModelConfigId());
        }
        if (request.getCoreMemory() != null) {
            try {
                agent.setCoreMemory(objectMapper.writeValueAsString(request.getCoreMemory()));
            } catch (JsonProcessingException e) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "核心记忆序列化失败");
            }
        }

        agent.setUpdateTime(new Date());

        validAgent(agent, false);
        return this.updateById(agent);
    }

    @Override
    public AgentVO getAgentById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Agent agent = this.getById(id);
        if (agent == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        AgentVO vo = getAgentVO(agent);
        fillRelatedNames(vo);
        return vo;
    }

    private void fillRelatedNames(AgentVO vo) {
        if (StringUtils.isNotBlank(vo.getWorkflowId())) {
            Workflow workflow = workflowService.getById(vo.getWorkflowId());
            if (workflow != null) {
                vo.setWorkflowName(workflow.getName());
            }
        }
        if (StringUtils.isNotBlank(vo.getKnowledgeBaseId())) {
            KnowledgeBase kb = knowledgeBaseService.getById(vo.getKnowledgeBaseId());
            if (kb != null) {
                vo.setKnowledgeBaseName(kb.getName());
            }
        }
        if (StringUtils.isNotBlank(vo.getModelConfigId())) {
            ModelConfig model = modelConfigService.getById(vo.getModelConfigId());
            if (model != null) {
                vo.setModelConfigName(model.getName());
            }
        }
    }

    @Override
    public List<AgentVO> listAgents(AgentQueryRequest request) {
        if (request == null) {
            request = new AgentQueryRequest();
        }

        LambdaQueryWrapper<Agent> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(StringUtils.isNotBlank(request.getId()), Agent::getId, request.getId());
        queryWrapper.like(StringUtils.isNotBlank(request.getName()), Agent::getName, request.getName());
        queryWrapper.eq(StringUtils.isNotBlank(request.getStatus()), Agent::getStatus, request.getStatus());
        queryWrapper.eq(StringUtils.isNotBlank(request.getKnowledgeBaseId()), Agent::getKnowledgeBaseId, request.getKnowledgeBaseId());
        queryWrapper.eq(StringUtils.isNotBlank(request.getWorkflowId()), Agent::getWorkflowId, request.getWorkflowId());
        queryWrapper.orderByDesc(Agent::getCreateTime);

        List<Agent> agentList = this.list(queryWrapper);
        return getAgentVOList(agentList);
    }
}