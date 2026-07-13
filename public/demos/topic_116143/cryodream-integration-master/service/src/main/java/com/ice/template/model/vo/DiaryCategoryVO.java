package com.ice.template.model.vo;

import com.ice.template.model.entity.DiaryCategory;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class DiaryCategoryVO implements Serializable {

    private String id;
    private String userId;
    private String name;
    private String color;
    private String icon;
    private Integer sort;
    private Integer isPreset;
    private Date createTime;
    private Date updateTime;

    public static DiaryCategoryVO objToVo(DiaryCategory category) {
        if (category == null) {
            return null;
        }
        DiaryCategoryVO vo = new DiaryCategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
