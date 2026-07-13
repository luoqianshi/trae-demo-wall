package com.ice.template.model.vo.flow;

import java.io.Serializable;
import lombok.Data;

@Data
public class FlowRunMessageVO implements Serializable {

    private String role;

    private String content;

    private static final long serialVersionUID = 1L;
}
