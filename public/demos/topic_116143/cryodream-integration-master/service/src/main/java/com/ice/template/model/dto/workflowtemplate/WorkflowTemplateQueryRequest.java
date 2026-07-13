package com.ice.template.model.dto.workflowtemplate;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class WorkflowTemplateQueryRequest extends PageRequest {

    private String id;

    private String searchText;

    private String category;

    private Boolean systemTemplate;
}
