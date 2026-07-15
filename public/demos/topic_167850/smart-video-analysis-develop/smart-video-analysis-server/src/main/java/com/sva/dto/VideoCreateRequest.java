package com.sva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoCreateRequest {

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotBlank(message = "文件名不能为空")
    private String filename;

    @NotBlank(message = "存储路径不能为空")
    private String storagePath;

    @NotBlank(message = "Bucket名不能为空")
    private String bucketName;

    private Long fileSize;
}
