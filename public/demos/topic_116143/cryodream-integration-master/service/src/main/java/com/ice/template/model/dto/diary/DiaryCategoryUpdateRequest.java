package com.ice.template.model.dto.diary;

import lombok.Data;

@Data
public class DiaryCategoryUpdateRequest {
    private String id;
    private String name;
    private String color;
    private String icon;
    private Integer sort;
}
