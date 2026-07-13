package com.ice.template.model.dto.workflow;

import java.io.Serializable;
import lombok.Data;

@Data
public class WorkflowCreateFromTemplateRequest implements Serializable {

    private String projectId;

    private String templateId;

    private String name;

    private String description;

    private static final long serialVersionUID = 1L;
}
