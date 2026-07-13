package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelTimelineEventSaveRequest implements Serializable {

    private String id;
    private String novelId;
    private String title;
    private String description;
    private String timeLabel;
    private Integer sortOrder;
    private String chapterId;
    private String characterIds;
    private Integer importance;
    private String color;

    private static final long serialVersionUID = 1L;
}
