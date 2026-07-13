package com.ice.template.model.dto.knowledge;

import java.io.Serializable;
import lombok.Data;

@Data
public class DocumentAddRequest implements Serializable {

    private String kbId;

    private String title;

    private String fileType;

    private String filePath;

    private Long fileSize;

    private String rawText;

    private String ingestionMode;

    private static final long serialVersionUID = 1L;
}
