package com.ice.template.model.dto.novel;

import java.io.Serializable;
import java.util.List;
import lombok.Data;

@Data
public class NovelTimelineReorderRequest implements Serializable {

    private String novelId;
    private List<Item> items;

    @Data
    public static class Item implements Serializable {
        private String id;
        private Integer sortOrder;

        private static final long serialVersionUID = 1L;
    }

    private static final long serialVersionUID = 1L;
}
