package com.ice.template.model.dto.aimusic;

import java.io.Serializable;
import lombok.Data;

@Data
public class AiMusicAudioQueryRequest implements Serializable {

    private String id;

    private String projectId;

    private long current = 1;

    private long pageSize = 50;

    private static final long serialVersionUID = 1L;
}
