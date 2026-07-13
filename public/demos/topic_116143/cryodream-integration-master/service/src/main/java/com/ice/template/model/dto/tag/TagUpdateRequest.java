package com.ice.template.model.dto.tag;

import java.io.Serializable;
import lombok.Data;

@Data
public class TagUpdateRequest implements Serializable {

    private String id;

    private String categoryId;

    private String name;

    private String color;

    private Integer sort;

    private static final long serialVersionUID = 1L;
}
