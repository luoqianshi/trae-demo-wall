package com.ice.template.model.dto.flow;

import java.io.Serializable;
import java.util.Map;
import lombok.Data;

@Data
public class FlowNodeDTO implements Serializable {

    private String id;

    private String type;

    private Map<String, Object> data;

    private Map<String, Object> position;

    private static final long serialVersionUID = 1L;
}
