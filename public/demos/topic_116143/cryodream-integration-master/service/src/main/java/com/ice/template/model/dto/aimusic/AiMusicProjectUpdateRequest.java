package com.ice.template.model.dto.aimusic;

import java.io.Serializable;
import lombok.Data;

@Data
public class AiMusicProjectUpdateRequest implements Serializable {

    private String id;

    private String title;

    private String description;

    private String style;

    private String mood;

    private String language;

    private String status;

    private String lyricWorkflowId;

    private String musicWorkflowId;

    private String currentLyric;

    private static final long serialVersionUID = 1L;
}
