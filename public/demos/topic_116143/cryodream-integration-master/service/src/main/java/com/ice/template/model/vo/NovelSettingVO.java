package com.ice.template.model.vo;

import com.ice.template.model.entity.NovelSetting;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelSettingVO implements Serializable {

    private String id;
    private String novelId;
    private String category;
    private String name;
    private String brief;
    private String content;
    private Date createTime;
    private Date updateTime;

    public static NovelSettingVO objToVo(NovelSetting s) {
        if (s == null) {
            return null;
        }
        NovelSettingVO vo = new NovelSettingVO();
        BeanUtils.copyProperties(s, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
