package com.ice.template.rag.douyin;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DouyinVideoInfo {

    private String awemeId;

    private String desc;

    private String videoUrl;

    private String videoCover;

    private Long duration;

    private Long createTime;

    private Boolean imagePost;

    private List<String> imageUrls;

    private DouyinAuthorInfo author;

    private DouyinVideoStatistics statistics;

    private String rawData;
}
