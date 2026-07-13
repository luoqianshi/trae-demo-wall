package com.ice.template.model.vo;

import com.ice.template.model.entity.DiaryMilestone;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class DiaryMilestoneVO implements Serializable {

    private String id;
    private String userId;
    private String title;
    private String description;
    private Date targetDate;
    private Date achievedDate;
    private String status;
    private String linkedDiaryId;
    private String color;
    private Integer sort;
    private Date createTime;
    private Date updateTime;

    public static DiaryMilestoneVO objToVo(DiaryMilestone milestone) {
        if (milestone == null) return null;
        DiaryMilestoneVO vo = new DiaryMilestoneVO();
        BeanUtils.copyProperties(milestone, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
