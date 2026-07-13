package com.ice.template.model.dto.agent;

import lombok.Data;

import java.util.List;

@Data
public class AgentAddRequest {

    private String name;

    private String description;

    private String avatar;

    private String projectId;

    private String workflowId;

    private String knowledgeBaseId;

    private String modelConfigId;

    private CoreMemory coreMemory;

    @Data
    public static class CoreMemory {
        private String name;
        private String description;
        private String role;
        private String instructions;
        private String personality;
        private List<String> constraints;
    }
}