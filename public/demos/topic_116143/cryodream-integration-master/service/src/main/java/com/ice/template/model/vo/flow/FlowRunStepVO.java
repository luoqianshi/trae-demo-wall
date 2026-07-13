package com.ice.template.model.vo.flow;

import java.io.Serializable;
import java.util.Map;
import lombok.Data;

@Data
public class FlowRunStepVO implements Serializable {

    private String nodeId;

    private String nodeName;

    private String nodeType;

    private String status;

    private Map<String, Object> input;

    private Map<String, Object> output;

    private Long elapsedMs;

    private String errorMessage;

    private static final long serialVersionUID = 1L;
}
