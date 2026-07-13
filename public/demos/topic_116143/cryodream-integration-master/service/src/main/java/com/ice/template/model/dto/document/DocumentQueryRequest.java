package com.ice.template.model.dto.document;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class DocumentQueryRequest extends PageRequest {

    private String projectId;

    private String searchText;

    private String status;
}
