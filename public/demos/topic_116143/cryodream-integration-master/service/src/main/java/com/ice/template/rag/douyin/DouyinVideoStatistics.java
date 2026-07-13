package com.ice.template.rag.douyin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DouyinVideoStatistics {

    private Long diggCount;

    private Long commentCount;

    private Long collectCount;

    private Long shareCount;

    private Long playCount;
}
