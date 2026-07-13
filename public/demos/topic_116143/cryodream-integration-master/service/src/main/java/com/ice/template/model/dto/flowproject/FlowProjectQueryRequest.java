package com.ice.template.model.dto.flowproject;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class FlowProjectQueryRequest extends PageRequest {

    private String id;

    private String searchText;

    private String name;

    private String status;

    private String scenario;
}
