package com.ice.template.model.dto.novel;

import java.io.Serializable;
import lombok.Data;

@Data
public class NovelAddRequest implements Serializable {

    private String title;
    private String summary;
    private String coverUrl;
    private String genre;
    private String tags;

    private static final long serialVersionUID = 1L;
}
