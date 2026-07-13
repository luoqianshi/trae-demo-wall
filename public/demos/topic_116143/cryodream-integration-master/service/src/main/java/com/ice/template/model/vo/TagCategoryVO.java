package com.ice.template.model.vo;

import com.ice.template.model.entity.Tag;
import com.ice.template.model.entity.TagCategory;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class TagCategoryVO implements Serializable {

    private String id;

    private String name;

    private String color;

    private Integer sort;

    private String description;

    private Date createTime;

    private Date updateTime;

    private List<TagVO> tags;

    public static TagCategoryVO objToVo(TagCategory category) {
        if (category == null) {
            return null;
        }
        TagCategoryVO vo = new TagCategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
