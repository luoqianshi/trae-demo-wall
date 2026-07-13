package com.ice.template.model.dto.knowledgebase;

import java.io.Serializable;
import lombok.Data;

@Data
public class KnowledgeBaseAddRequest implements Serializable {

    private String projectId;

    private String name;

    private String description;

    private String domain;

    private String embeddingModelId;

    private static final long serialVersionUID = 1L;
}
