package com.hedging.engine.dto;

/**
 * 平替方案排行榜项
 */
public class AlternativeRankingItem {

    private String title;
    private Integer usageCount;

    public AlternativeRankingItem() {
    }

    public AlternativeRankingItem(String title, Integer usageCount) {
        this.title = title;
        this.usageCount = usageCount;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }
}
