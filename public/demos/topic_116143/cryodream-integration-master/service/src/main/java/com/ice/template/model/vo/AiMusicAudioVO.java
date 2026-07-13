package com.ice.template.model.vo;

import com.ice.template.model.entity.AiMusicAudio;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class AiMusicAudioVO implements Serializable {

    private String id;

    private String projectId;

    private String audioUrl;

    private String title;

    private Integer durationSeconds;

    private String styleTags;

    private String lyricsSummary;

    private String paramSnapshot;

    private Date createTime;

    private Date updateTime;

    public static AiMusicAudioVO objToVo(AiMusicAudio aiMusicAudio) {
        if (aiMusicAudio == null) {
            return null;
        }
        AiMusicAudioVO vo = new AiMusicAudioVO();
        BeanUtils.copyProperties(aiMusicAudio, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
