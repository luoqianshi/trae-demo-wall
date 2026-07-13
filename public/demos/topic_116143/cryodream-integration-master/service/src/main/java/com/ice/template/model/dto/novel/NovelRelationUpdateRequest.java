package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelRelationUpdateRequest implements Serializable {

    private String id;
    private String relationType;
    private String description;

    private static final long serialVersionUID = 1L;
}
