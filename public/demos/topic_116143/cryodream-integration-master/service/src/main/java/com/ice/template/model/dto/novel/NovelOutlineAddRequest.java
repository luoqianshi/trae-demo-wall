package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelOutlineAddRequest implements Serializable {

    private String novelId;
    private String parentId;
    private Integer level;
    private String title;
    private String summary;
    private Integer sortOrder;

    private static final long serialVersionUID = 1L;
}
