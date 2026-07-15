package com.sva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoPresignRequest {

    @NotBlank(message = "文件名不能为空")
    private String filename;

    private String contentType;

    @NotNull(message = "项目ID不能为空")
    private Long projectId;
}
