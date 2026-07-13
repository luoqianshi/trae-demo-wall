package com.ice.template.model.dto.document;

import java.io.Serializable;
import lombok.Data;

@Data
public class DocumentAddRequest implements Serializable {

    private String projectId;

    private String title;

    private String content;

    private String format;

    private String tags;

    private static final long serialVersionUID = 1L;
}
