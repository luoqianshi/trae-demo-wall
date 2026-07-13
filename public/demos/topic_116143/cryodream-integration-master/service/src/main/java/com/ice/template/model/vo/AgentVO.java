package com.ice.template.model.vo;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AgentVO {

    private String id;

    private String name;

    private String description;

    private String avatar;

    private String status;

    private String projectId;

    private String projectName;

    private String workflowId;

    private String workflowName;

    private String knowledgeBaseId;

    private String knowledgeBaseName;

    private String modelConfigId;

    private String modelConfigName;

    private CoreMemory coreMemory;

    private Date createTime;

    private Date updateTime;

    private Date lastUsedTime;

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