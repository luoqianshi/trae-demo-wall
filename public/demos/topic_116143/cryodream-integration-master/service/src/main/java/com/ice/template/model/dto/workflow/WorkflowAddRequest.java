package com.ice.template.model.dto.workflow;

import java.io.Serializable;
import lombok.Data;

@Data
public class WorkflowAddRequest implements Serializable {

    private String projectId;

    private String name;

    private String description;

    private String graphJson;

    private String category;

    private String tags;

    private static final long serialVersionUID = 1L;
}
