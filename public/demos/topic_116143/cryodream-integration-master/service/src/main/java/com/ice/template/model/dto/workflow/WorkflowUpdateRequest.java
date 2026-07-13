package com.ice.template.model.dto.workflow;

import java.io.Serializable;
import lombok.Data;

/**
 * 更新工作流元信息请求（名称、描述、分类、标签）
 */
@Data
public class WorkflowUpdateRequest implements Serializable {

    private String id;

    private String name;

    private String description;

    private String category;

    private String tags;

    private static final long serialVersionUID = 1L;
}
