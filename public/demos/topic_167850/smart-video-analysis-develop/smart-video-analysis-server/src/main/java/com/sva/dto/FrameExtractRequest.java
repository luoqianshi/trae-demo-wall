package com.sva.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class FrameExtractRequest {

    @NotNull(message = "视频ID不能为空")
    private Long videoId;

    private Long startMs;

    private Long endMs;

    private List<Integer> frameIndexes;

    private Integer intervalMs;
}
