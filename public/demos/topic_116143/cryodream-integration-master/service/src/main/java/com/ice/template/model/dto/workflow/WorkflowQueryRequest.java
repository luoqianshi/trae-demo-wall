package com.ice.template.model.dto.workflow;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class WorkflowQueryRequest extends PageRequest {

    private String id;

    private String projectId;

    private String searchText;

    private String name;

    private String status;

    private Integer isTemplate;

    private String category;
}
