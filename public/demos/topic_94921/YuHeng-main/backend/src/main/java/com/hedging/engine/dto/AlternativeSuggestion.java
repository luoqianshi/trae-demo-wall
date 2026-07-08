package com.hedging.engine.dto;

import java.util.List;

/**
 * 平替方案建议卡片
 */
public class AlternativeSuggestion {

    private String title;
    private String subtitle;
    private String cost;
    private Integer dopamine;
    private List<String> tags;
    private String desc;
    private Integer usageCount;

    public AlternativeSuggestion() {
    }

    public AlternativeSuggestion(String title, String subtitle, String cost, Integer dopamine, List<String> tags, String desc, Integer usageCount) {
        this.title = title;
        this.subtitle = subtitle;
        this.cost = cost;
        this.dopamine = dopamine;
        this.tags = tags;
        this.desc = desc;
        this.usageCount = usageCount;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getCost() {
        return cost;
    }

    public void setCost(String cost) {
        this.cost = cost;
    }

    public Integer getDopamine() {
        return dopamine;
    }

    public void setDopamine(Integer dopamine) {
        this.dopamine = dopamine;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }
}
