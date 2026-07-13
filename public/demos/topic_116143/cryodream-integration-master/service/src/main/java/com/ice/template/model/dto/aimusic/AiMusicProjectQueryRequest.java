package com.ice.template.model.dto.aimusic;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class AiMusicProjectQueryRequest extends PageRequest {

    private String id;

    private String searchText;

    private String title;

    private String style;

    private String mood;

    private String language;

    private String status;
}
