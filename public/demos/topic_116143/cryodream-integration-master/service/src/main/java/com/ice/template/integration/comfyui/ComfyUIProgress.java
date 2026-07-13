package com.ice.template.integration.comfyui;

import java.util.List;
import java.util.Map;

/**
 * ComfyUI 执行进度。
 */
public class ComfyUIProgress {

    /** running / done / error */
    private String status = "running";
    private int value = 0;
    private int max = 0;
    private String message = "";
    private List<String> urls;
    /**
     * 按 outputSlot 分组的 URL 列表（key = ComfyUI SaveXxx 节点 id）。
     * 前端拿到后按 slot 精确分派到画布上的多个下游输出节点。
     * 只在 status="done" 时才会填充。
     */
    private Map<String, List<String>> urlsBySlot;

    public ComfyUIProgress() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }

    public int getMax() {
        return max;
    }

    public void setMax(int max) {
        this.max = max;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getUrls() {
        return urls;
    }

    public void setUrls(List<String> urls) {
        this.urls = urls;
    }

    public Map<String, List<String>> getUrlsBySlot() {
        return urlsBySlot;
    }

    public void setUrlsBySlot(Map<String, List<String>> urlsBySlot) {
        this.urlsBySlot = urlsBySlot;
    }

    public int getPercent() {
        if (max <= 0) {
            return 0;
        }
        if (value >= max) {
            return 99;
        }
        return Math.max(0, Math.min(99, (int) Math.floor(value * 100.0 / max)));
    }
}
