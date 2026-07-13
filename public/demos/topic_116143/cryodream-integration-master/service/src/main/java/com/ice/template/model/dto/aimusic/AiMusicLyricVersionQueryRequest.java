package com.ice.template.model.dto.aimusic;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class AiMusicLyricVersionQueryRequest extends PageRequest {

    private String id;

    private String projectId;
}
