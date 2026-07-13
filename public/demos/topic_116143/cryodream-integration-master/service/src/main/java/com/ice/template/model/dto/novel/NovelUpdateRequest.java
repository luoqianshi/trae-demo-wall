package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelUpdateRequest implements Serializable {

    private String id;
    private String title;
    private String summary;
    private String coverUrl;
    private String genre;
    private String tags;
    private String status;

    private static final long serialVersionUID = 1L;
}
