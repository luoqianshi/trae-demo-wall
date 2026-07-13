package com.ice.template.model.vo;

import com.ice.template.model.entity.Tag;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class TagVO implements Serializable {

    private String id;

    private String categoryId;

    private String categoryName;

    private String categoryColor;

    private String name;

    private String color;

    private Integer sort;

    private Date createTime;

    private Date updateTime;

    public static TagVO objToVo(Tag tag) {
        if (tag == null) {
            return null;
        }
        TagVO vo = new TagVO();
        BeanUtils.copyProperties(tag, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
