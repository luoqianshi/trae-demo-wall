package com.ice.template.model.dto.tag;

import java.io.Serializable;
import java.util.List;
import lombok.Data;

@Data
public class TagBindRequest implements Serializable {

    private List<String> tagIds;

    private String targetType;

    private String targetId;

    private static final long serialVersionUID = 1L;
}
