package com.ice.template.model.vo;

import com.ice.template.model.entity.AiMusicProject;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class AiMusicProjectVO implements Serializable {

    private String id;

    private String title;

    private String description;

    private String style;

    private String mood;

    private String language;

    private String status;

    private String lyricWorkflowId;

    private String musicWorkflowId;

    private String currentLyric;

    private Date createTime;

    private Date updateTime;

    public static AiMusicProjectVO objToVo(AiMusicProject aiMusicProject) {
        if (aiMusicProject == null) {
            return null;
        }
        AiMusicProjectVO aiMusicProjectVO = new AiMusicProjectVO();
        BeanUtils.copyProperties(aiMusicProject, aiMusicProjectVO);
        return aiMusicProjectVO;
    }

    private static final long serialVersionUID = 1L;
}
