package com.ice.template.model.vo;

import com.ice.template.model.entity.Diary;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class DiaryVO implements Serializable {

    private String id;
    private String userId;
    private String title;
    private String content;
    private String summary;
    private String shortSummary;
    private String category;
    private String mood;
    private Integer moodScore;
    private String audioUrl;
    private Integer audioDurationSec;
    private Integer wordCount;
    private String aiAnalysisStatus;
    private Date diaryDate;
    private Date createTime;
    private Date updateTime;
    /** 关联标签列表（由 TagRelation 查出） */
    private List<String> tags;

    public static DiaryVO objToVo(Diary diary) {
        if (diary == null) {
            return null;
        }
        DiaryVO vo = new DiaryVO();
        BeanUtils.copyProperties(diary, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
