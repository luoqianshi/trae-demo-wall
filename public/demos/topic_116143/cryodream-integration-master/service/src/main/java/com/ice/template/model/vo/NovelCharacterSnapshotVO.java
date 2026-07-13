package com.ice.template.model.vo;

import com.ice.template.model.entity.NovelCharacterSnapshot;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class NovelCharacterSnapshotVO implements Serializable {

    private String id;
    private String novelId;
    private String characterId;
    private String eventId;
    private String label;
    private String attributes;
    private String note;
    private Integer sortOrder;
    private Date createTime;
    private Date updateTime;

    public static NovelCharacterSnapshotVO objToVo(NovelCharacterSnapshot s) {
        if (s == null) {
            return null;
        }
        NovelCharacterSnapshotVO vo = new NovelCharacterSnapshotVO();
        BeanUtils.copyProperties(s, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
