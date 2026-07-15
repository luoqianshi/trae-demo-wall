package com.sva.vo;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class FrameExtractVO {

    private String videoId;

    private String videoFilename;

    private List<Map<String, Object>> frames;

    private Integer total;
}
