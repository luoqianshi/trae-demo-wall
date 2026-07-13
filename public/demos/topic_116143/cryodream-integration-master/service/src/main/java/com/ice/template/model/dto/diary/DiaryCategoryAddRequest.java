package com.ice.template.model.dto.diary;

import lombok.Data;

@Data
public class DiaryCategoryAddRequest {
    private String name;
    private String color;
    private String icon;
    private Integer sort;
}
