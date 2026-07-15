package com.sva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class FrameTaskCreateRequest {

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    private Long videoId;

    @NotBlank(message = "生成模式不能为空")
    private String mode;

    private List<Map<String, Object>> sourceFrames;

    private Map<String, Object> params;
}
