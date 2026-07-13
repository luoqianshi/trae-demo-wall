package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelSettingAddRequest implements Serializable {

    private String novelId;
    private String category;
    private String name;
    private String brief;
    private String content;

    private static final long serialVersionUID = 1L;
}
