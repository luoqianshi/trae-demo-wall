package com.ice.template.model.vo;

import com.ice.template.model.entity.NovelTimelineEvent;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelTimelineEventVO implements Serializable {

    private String id;
    private String novelId;
    private String title;
    private String description;
    private String timeLabel;
    private Integer sortOrder;
    private String chapterId;
    private String characterIds;
    private Integer importance;
    private String color;
    private Date createTime;
    private Date updateTime;

    public static NovelTimelineEventVO objToVo(NovelTimelineEvent e) {
        if (e == null) {
            return null;
        }
        NovelTimelineEventVO vo = new NovelTimelineEventVO();
        BeanUtils.copyProperties(e, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
