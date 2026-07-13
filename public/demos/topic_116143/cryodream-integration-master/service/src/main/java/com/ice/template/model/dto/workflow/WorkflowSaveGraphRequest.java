package com.ice.template.model.dto.workflow;

import java.io.Serializable;
import lombok.Data;

@Data
public class WorkflowSaveGraphRequest implements Serializable {

    private String id;

    private String name;

    private String description;

    private String graphJson;

    private Integer nodeCount;

    private Integer edgeCount;

    private String status;

    private static final long serialVersionUID = 1L;
}
