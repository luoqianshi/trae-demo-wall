package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelSettingUpdateRequest implements Serializable {

    private String id;
    private String category;
    private String name;
    private String brief;
    private String content;

    private static final long serialVersionUID = 1L;
}
