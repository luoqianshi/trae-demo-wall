package com.ice.template.model.vo;

import com.ice.template.model.entity.AiMusicLyricVersion;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class AiMusicLyricVersionVO implements Serializable {

    private String id;

    private String projectId;

    private String name;

    private String title;

    private String color;

    private String summary;

    private String content;

    private String versionNo;

    private Date createTime;

    private Date updateTime;

    public static AiMusicLyricVersionVO objToVo(AiMusicLyricVersion aiMusicLyricVersion) {
        if (aiMusicLyricVersion == null) {
            return null;
        }
        AiMusicLyricVersionVO aiMusicLyricVersionVO = new AiMusicLyricVersionVO();
        BeanUtils.copyProperties(aiMusicLyricVersion, aiMusicLyricVersionVO);
        return aiMusicLyricVersionVO;
    }

    private static final long serialVersionUID = 1L;
}
