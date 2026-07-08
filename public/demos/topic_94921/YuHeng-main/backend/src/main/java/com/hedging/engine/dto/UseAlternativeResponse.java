package com.hedging.engine.dto;

/**
 * 采用平替方案响应
 */
public class UseAlternativeResponse {

    private boolean accepted;
    private String title;
    private Long currentCount;
    private String message;

    public UseAlternativeResponse() {
    }

    public UseAlternativeResponse(boolean accepted, String title, Long currentCount, String message) {
        this.accepted = accepted;
        this.title = title;
        this.currentCount = currentCount;
        this.message = message;
    }

    public boolean isAccepted() {
        return accepted;
    }

    public void setAccepted(boolean accepted) {
        this.accepted = accepted;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Long getCurrentCount() {
        return currentCount;
    }

    public void setCurrentCount(Long currentCount) {
        this.currentCount = currentCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
