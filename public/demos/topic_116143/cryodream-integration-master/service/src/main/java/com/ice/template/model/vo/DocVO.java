package com.ice.template.model.vo;

import com.ice.template.model.entity.Doc;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class DocVO implements Serializable {

    private String id;

    private String projectId;

    private String title;

    private String content;

    private String format;

    private String tags;

    private String status;

    private Date createTime;

    private Date updateTime;

    public static DocVO objToVo(Doc doc) {
        if (doc == null) {
            return null;
        }
        DocVO docVO = new DocVO();
        BeanUtils.copyProperties(doc, docVO);
        return docVO;
    }

    private static final long serialVersionUID = 1L;
}
