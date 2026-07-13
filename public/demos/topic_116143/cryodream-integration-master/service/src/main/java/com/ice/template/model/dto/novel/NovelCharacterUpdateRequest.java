package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelCharacterUpdateRequest implements Serializable {

    private String id;
    private String name;
    private String alias;
    private String avatarUrl;
    private String identity;
    private String personality;
    private String background;
    private String appearance;
    private String catchphrase;
    private String remark;
    private String chapterIds;
    private String canvasPos;
    private String attributes;

    private static final long serialVersionUID = 1L;
}
