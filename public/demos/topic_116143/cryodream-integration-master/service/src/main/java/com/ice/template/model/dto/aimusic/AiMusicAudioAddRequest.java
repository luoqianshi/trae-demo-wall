package com.ice.template.model.dto.aimusic;

import java.io.Serializable;
import lombok.Data;

@Data
public class AiMusicAudioAddRequest implements Serializable {

    private String projectId;

    private String audioUrl;

    private String title;

    private Integer durationSeconds;

    private String styleTags;

    private String lyricsSummary;

    private String paramSnapshot;

    private static final long serialVersionUID = 1L;
}
