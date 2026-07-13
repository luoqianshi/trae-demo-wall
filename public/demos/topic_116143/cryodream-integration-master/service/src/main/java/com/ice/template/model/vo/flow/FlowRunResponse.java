package com.ice.template.model.vo.flow;

import java.io.Serializable;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class FlowRunResponse implements Serializable {

    private String runId;

    private String status;

    private String outputText;

    private Map<String, Object> outputs;

    private List<FlowRunMessageVO> messages;

    private List<FlowRunStepVO> steps;

    private String errorMessage;

    private static final long serialVersionUID = 1L;
}
