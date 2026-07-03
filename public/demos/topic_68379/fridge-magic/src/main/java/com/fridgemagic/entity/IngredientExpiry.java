package com.fridgemagic.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class IngredientExpiry {
    private Long id;
    private Long userId;
    private String name;
    private LocalDate purchaseDate;
    private LocalDate expiryDate;
    private Integer notified;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public Integer getNotified() { return notified; }
    public void setNotified(Integer notified) { this.notified = notified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}