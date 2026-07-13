package com.ice.template.executor;

import com.ice.template.model.dto.flow.FlowEdgeDTO;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.vo.flow.FlowRunMessageVO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class FlowExecutionContext {

    private String runId;

    private String inputValue;

    private String sessionId;

    private Map<String, Map<String, Object>> nodeOutputs = new HashMap<>();

    private Map<String, String> variables = new HashMap<>();

    private Map<String, Object> outputs = new HashMap<>();

    private List<FlowRunMessageVO> messages = new ArrayList<>();

    private Long startTime;

    private String currentText;

    private String systemMessage;

    private List<FlowEdgeDTO> edges;

    private List<FlowNodeDTO> nodes;

    public void setVariable(String key, String value) {
        variables.put(key, value);
    }

    public Object getVariable(String key) {
        return variables.get(key);
    }
}
