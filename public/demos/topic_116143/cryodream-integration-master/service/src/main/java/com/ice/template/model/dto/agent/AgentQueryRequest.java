package com.ice.template.model.dto.agent;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AgentQueryRequest extends PageRequest {

    private String id;

    private String name;

    private String status;

    private String knowledgeBaseId;

    private String workflowId;
}