package com.ice.template.model.dto.knowledge;

import java.io.Serializable;
import lombok.Data;

@Data
public class DocumentUpdateRequest implements Serializable {

    private String id;

    private String title;

    private String rawText;

    private String globalMetadata;

    private String status;

    private String ingestionMode;

    private String resolvedIngestionMode;

    private Integer chunkCount;

    private String errorMessage;

    private static final long serialVersionUID = 1L;
}
