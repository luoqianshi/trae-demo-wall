package com.ice.template.model.dto.novel;

import java.io.Serializable;
import java.util.List;
import lombok.Data;

/**
 * 大纲拖拽重排序请求：批量更新每个节点的 parentId 与 sortOrder
 */
@Data
public class NovelOutlineReorderRequest implements Serializable {

    private String novelId;
    private List<Item> items;

    @Data
    public static class Item implements Serializable {
        private String id;
        private String parentId;
        private Integer sortOrder;
        private Integer level;

        private static final long serialVersionUID = 1L;
    }

    private static final long serialVersionUID = 1L;
}
