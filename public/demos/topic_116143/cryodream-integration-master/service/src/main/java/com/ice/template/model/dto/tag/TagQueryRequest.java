package com.ice.template.model.dto.tag;

import java.io.Serializable;
import lombok.Data;

@Data
public class TagQueryRequest implements Serializable {

    private long current;

    private long pageSize;

    private String categoryId;

    private String name;

    private String searchText;

    private static final long serialVersionUID = 1L;
}
