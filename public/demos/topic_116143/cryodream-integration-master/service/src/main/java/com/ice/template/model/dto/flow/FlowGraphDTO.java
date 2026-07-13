package com.ice.template.model.dto.flow;

import java.io.Serializable;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class FlowGraphDTO implements Serializable {

    private List<FlowNodeDTO> nodes;

    private List<FlowEdgeDTO> edges;

    private Map<String, Object> viewport;

    private static final long serialVersionUID = 1L;
}
