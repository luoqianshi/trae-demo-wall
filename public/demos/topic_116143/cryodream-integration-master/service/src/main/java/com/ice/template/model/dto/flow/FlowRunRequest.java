package com.ice.template.model.dto.flow;

import java.io.Serializable;
import lombok.Data;

@Data
public class FlowRunRequest implements Serializable {

    private String flowId;

    private String inputValue;

    private String startNodeId;

    private String sessionId;

    private FlowGraphDTO flow;

    private static final long serialVersionUID = 1L;
}
