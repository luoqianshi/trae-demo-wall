package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelRelationAddRequest implements Serializable {

    private String novelId;
    private String sourceId;
    private String targetId;
    private String relationType;
    private String description;

    private static final long serialVersionUID = 1L;
}
