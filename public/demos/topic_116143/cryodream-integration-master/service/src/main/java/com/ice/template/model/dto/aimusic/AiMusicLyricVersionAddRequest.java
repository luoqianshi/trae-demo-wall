package com.ice.template.model.dto.aimusic;

import java.io.Serializable;
import lombok.Data;

@Data
public class AiMusicLyricVersionAddRequest implements Serializable {

    private String projectId;

    private String name;

    private String title;

    private String color;

    private String summary;

    private String content;

    private String versionNo;

    private static final long serialVersionUID = 1L;
}
