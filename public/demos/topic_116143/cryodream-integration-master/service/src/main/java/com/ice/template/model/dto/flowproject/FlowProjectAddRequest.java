package com.ice.template.model.dto.flowproject;

import java.io.Serializable;
import lombok.Data;

@Data
public class FlowProjectAddRequest implements Serializable {

    private String name;

    private String description;

    private String icon;

    private String color;

    private String scenario;

    private static final long serialVersionUID = 1L;
}
