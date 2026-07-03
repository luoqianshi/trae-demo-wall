package com.fridgemagic.entity;

import java.time.LocalDateTime;

public class Recipe {
    private Long id;
    private Long userId;
    private String name;
    private String difficulty;
    private String cookTime;
    private String steps;
    private String nutrition;
    private String extraIngredients;
    private String ingredientsInput;
    private String preference;
    private Integer isFavorite;
    private Integer rating;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getCookTime() { return cookTime; }
    public void setCookTime(String cookTime) { this.cookTime = cookTime; }
    public String getSteps() { return steps; }
    public void setSteps(String steps) { this.steps = steps; }
    public String getNutrition() { return nutrition; }
    public void setNutrition(String nutrition) { this.nutrition = nutrition; }
    public String getExtraIngredients() { return extraIngredients; }
    public void setExtraIngredients(String extraIngredients) { this.extraIngredients = extraIngredients; }
    public String getIngredientsInput() { return ingredientsInput; }
    public void setIngredientsInput(String ingredientsInput) { this.ingredientsInput = ingredientsInput; }
    public String getPreference() { return preference; }
    public void setPreference(String preference) { this.preference = preference; }
    public Integer getIsFavorite() { return isFavorite; }
    public void setIsFavorite(Integer isFavorite) { this.isFavorite = isFavorite; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}