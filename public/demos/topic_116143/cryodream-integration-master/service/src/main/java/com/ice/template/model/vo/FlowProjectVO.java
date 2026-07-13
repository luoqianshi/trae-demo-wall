package com.ice.template.model.vo;

import com.ice.template.model.entity.FlowProject;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class FlowProjectVO implements Serializable {

    private String id;

    private String name;

    private String description;

    private String icon;

    private String color;

    private String scenario;

    private String status;

    private Integer sortOrder;

    private String lastWorkflowId;

    private Integer workflowCount;

    private Date createTime;

    private Date updateTime;

    public static FlowProjectVO objToVo(FlowProject flowProject) {
        if (flowProject == null) {
            return null;
        }
        FlowProjectVO flowProjectVO = new FlowProjectVO();
        BeanUtils.copyProperties(flowProject, flowProjectVO);
        return flowProjectVO;
    }

    private static final long serialVersionUID = 1L;
}
