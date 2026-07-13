package com.ice.template.model.dto.document;

import java.io.Serializable;
import lombok.Data;

@Data
public class DocumentUpdateRequest implements Serializable {

    private String id;

    private String title;

    private String content;

    private String tags;

    private String status;

    private static final long serialVersionUID = 1L;
}
