package com.ice.template.model.vo;

import com.ice.template.model.entity.Workflow;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class WorkflowVO implements Serializable {

    private String id;

    private String projectId;

    private String projectName;

    private String name;

    private String description;

    private String status;

    private Integer version;

    private String sourceTemplateId;

    private String graphJson;

    private Integer nodeCount;

    private Integer edgeCount;

    private String lastRunStatus;

    private Integer isTemplate;

    private String category;

    private String tags;

    private Date createTime;

    private Date updateTime;

    public static WorkflowVO objToVo(Workflow workflow) {
        if (workflow == null) {
            return null;
        }
        WorkflowVO workflowVO = new WorkflowVO();
        BeanUtils.copyProperties(workflow, workflowVO);
        return workflowVO;
    }

    private static final long serialVersionUID = 1L;
}
