package com.sva.vo;

import lombok.Data;
import java.util.List;

@Data
public class FusionResultVO {
    private Long id;
    private Long projectId;
    private String fusionMode;
    private String fusionModeName;
    private String scriptOutline;
    private List<ShotSuggestionVO> shotSuggestions;
    private List<String> sourceVideos;
    private Integer status;
    private Integer progress;
    private String errorMsg;
    private String createTime;
}
