package com.ice.template.model.dto.flow;

import java.io.Serializable;
import java.util.Map;
import lombok.Data;

@Data
public class FlowEdgeDTO implements Serializable {

    private String id;

    private String source;

    private String target;

    private String sourceHandle;

    private String targetHandle;

    private Map<String, Object> data;

    private static final long serialVersionUID = 1L;
}
