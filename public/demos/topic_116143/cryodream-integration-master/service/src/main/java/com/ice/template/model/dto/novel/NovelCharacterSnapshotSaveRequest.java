package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelCharacterSnapshotSaveRequest implements Serializable {

    private String id;
    private String novelId;
    private String characterId;
    private String eventId;
    private String label;
    private String attributes;
    private String note;
    private Integer sortOrder;

    private static final long serialVersionUID = 1L;
}
