package com.sva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class FusionCreateRequest {

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotEmpty(message = "请选择至少2个视频")
    private List<Long> videoIds;

    @NotBlank(message = "融合模式不能为空")
    private String fusionMode;
}
