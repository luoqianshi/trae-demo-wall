package com.ice.template.model.vo;

import com.ice.template.model.entity.NovelRelation;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelRelationVO implements Serializable {

    private String id;
    private String novelId;
    private String sourceId;
    private String targetId;
    private String relationType;
    private String description;
    private Date createTime;

    public static NovelRelationVO objToVo(NovelRelation r) {
        if (r == null) {
            return null;
        }
        NovelRelationVO vo = new NovelRelationVO();
        BeanUtils.copyProperties(r, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
