package com.ice.template.model.dto.aimusic;

import java.io.Serializable;
import lombok.Data;

@Data
public class AiMusicProjectAddRequest implements Serializable {

    private String title;

    private String description;

    private String style;

    private String mood;

    private String language;

    private String lyricWorkflowId;

    private String musicWorkflowId;

    private String currentLyric;

    private static final long serialVersionUID = 1L;
}
