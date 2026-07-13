package com.ice.template.model.dto.knowledgebase;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class KnowledgeBaseQueryRequest extends PageRequest {

    private String id;

    private String projectId;

    private String searchText;

    private String name;

    private String domain;
}
