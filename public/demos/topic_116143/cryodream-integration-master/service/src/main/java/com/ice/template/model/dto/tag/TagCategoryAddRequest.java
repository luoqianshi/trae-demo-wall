package com.ice.template.model.dto.tag;

import java.io.Serializable;
import lombok.Data;

@Data
public class TagCategoryAddRequest implements Serializable {

    private String name;

    private String color;

    private Integer sort;

    private String description;

    private static final long serialVersionUID = 1L;
}
