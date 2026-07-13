package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelOutlineUpdateRequest implements Serializable {

    private String id;
    private String title;
    private String summary;
    private String content;
    private Integer sortOrder;

    private static final long serialVersionUID = 1L;
}
