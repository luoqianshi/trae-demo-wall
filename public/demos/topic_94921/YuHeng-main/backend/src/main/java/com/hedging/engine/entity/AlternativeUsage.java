package com.hedging.engine.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * 用户采用平替方案记录
 */
@Entity
public class AlternativeUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 方案标题
    @Column(nullable = false)
    private String title;

    // 投票/采用者 IP
    @Column(nullable = false, length = 64)
    private String ipAddress;

    // 采用时间
    private LocalDateTime usedAt;

    public AlternativeUsage() {
    }

    public AlternativeUsage(String title, String ipAddress) {
        this.title = title;
        this.ipAddress = ipAddress;
        this.usedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
}
