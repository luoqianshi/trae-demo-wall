package com.ice.template.executor;

import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class FlowNodeExecuteResult {

    private String outputText;

    private Map<String, Object> input = new HashMap<>();

    private Map<String, Object> output = new HashMap<>();

    public static FlowNodeExecuteResult of(String outputText) {
        FlowNodeExecuteResult result = new FlowNodeExecuteResult();
        result.setOutputText(outputText);
        result.getOutput().put("text", outputText);
        return result;
    }
}
