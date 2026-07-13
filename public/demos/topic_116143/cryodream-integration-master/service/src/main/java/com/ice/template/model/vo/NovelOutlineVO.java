package com.ice.template.model.vo;

import com.ice.template.model.entity.NovelOutline;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelOutlineVO implements Serializable {

    private String id;
    private String novelId;
    private String parentId;
    private Integer level;
    private String title;
    private String summary;
    private String content;
    private Integer sortOrder;
    private Integer wordCount;
    private Date createTime;
    private Date updateTime;

    /**
     * 树形结构下的子节点
     */
    private List<NovelOutlineVO> children = new ArrayList<>();

    public static NovelOutlineVO objToVo(NovelOutline outline) {
        if (outline == null) {
            return null;
        }
        NovelOutlineVO vo = new NovelOutlineVO();
        BeanUtils.copyProperties(outline, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
