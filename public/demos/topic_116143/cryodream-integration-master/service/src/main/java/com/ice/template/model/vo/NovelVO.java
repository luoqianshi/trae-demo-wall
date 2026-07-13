package com.ice.template.model.vo;

import com.ice.template.model.entity.Novel;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelVO implements Serializable {

    private String id;
    private String title;
    private String summary;
    private String coverUrl;
    private String genre;
    private String tags;
    private Integer wordCount;
    private String status;
    private Date createTime;
    private Date updateTime;

    public static NovelVO objToVo(Novel novel) {
        if (novel == null) {
            return null;
        }
        NovelVO vo = new NovelVO();
        BeanUtils.copyProperties(novel, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
