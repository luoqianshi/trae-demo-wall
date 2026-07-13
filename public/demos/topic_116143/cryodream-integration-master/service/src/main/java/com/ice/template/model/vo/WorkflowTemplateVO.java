package com.ice.template.model.vo;

import com.ice.template.model.entity.WorkflowTemplate;
import java.io.Serializable;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;

@Data
public class WorkflowTemplateVO implements Serializable {

    private String id;

    private String name;

    private String description;

    private String category;

    private List<String> tags;

    private String coverColor;

    private String graphJson;

    private Boolean systemTemplate;

    private Date createTime;

    private Date updateTime;

    public static WorkflowTemplateVO objToVo(WorkflowTemplate workflowTemplate) {
        if (workflowTemplate == null) {
            return null;
        }
        WorkflowTemplateVO workflowTemplateVO = new WorkflowTemplateVO();
        BeanUtils.copyProperties(workflowTemplate, workflowTemplateVO);
        workflowTemplateVO.setSystemTemplate(Integer.valueOf(1).equals(workflowTemplate.getSystemTemplate()));
        workflowTemplateVO.setTags(parseTags(workflowTemplate.getTags()));
        return workflowTemplateVO;
    }

    private static List<String> parseTags(String tags) {
        if (StringUtils.isBlank(tags)) {
            return Collections.emptyList();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());
    }

    private static final long serialVersionUID = 1L;
}
