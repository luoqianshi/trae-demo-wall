package com.ice.template.model.dto.flowproject;

import java.io.Serializable;
import lombok.Data;

@Data
public class FlowProjectUpdateRequest implements Serializable {

    private String id;

    private String name;

    private String description;

    private String icon;

    private String color;

    private String scenario;

    private String status;

    private Integer sortOrder;

    private String lastWorkflowId;

    private static final long serialVersionUID = 1L;
}
