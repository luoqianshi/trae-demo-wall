package com.ice.template.model.vo;

import com.ice.template.model.entity.NovelCharacter;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelCharacterVO implements Serializable {

    private String id;
    private String novelId;
    private String name;
    private String alias;
    private String avatarUrl;
    private String identity;
    private String personality;
    private String background;
    private String appearance;
    private String catchphrase;
    private String remark;
    private String chapterIds;
    private String canvasPos;
    private String attributes;
    private Date createTime;
    private Date updateTime;

    public static NovelCharacterVO objToVo(NovelCharacter c) {
        if (c == null) {
            return null;
        }
        NovelCharacterVO vo = new NovelCharacterVO();
        BeanUtils.copyProperties(c, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
