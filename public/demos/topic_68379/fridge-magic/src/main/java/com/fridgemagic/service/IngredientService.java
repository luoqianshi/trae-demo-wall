package com.fridgemagic.service;

import com.fridgemagic.entity.CustomIngredient;
import com.fridgemagic.mapper.IngredientMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IngredientService {

    private final IngredientMapper ingredientMapper;

    public IngredientService(IngredientMapper ingredientMapper) {
        this.ingredientMapper = ingredientMapper;
    }

    public List<CustomIngredient> findByUserId(Long userId) {
        return ingredientMapper.findByUserId(userId);
    }

    @Transactional
    public CustomIngredient add(Long userId, String name, String emoji) {
        // 检查是否已存在
        List<CustomIngredient> existing = ingredientMapper.findByUserId(userId);
        boolean duplicate = existing.stream()
            .anyMatch(i -> i.getName().equalsIgnoreCase(name.trim()));
        if (duplicate) {
            throw new IllegalArgumentException("该食材已存在");
        }
        CustomIngredient ingredient = new CustomIngredient();
        ingredient.setUserId(userId);
        ingredient.setName(name.trim());
        ingredient.setEmoji(emoji != null ? emoji : "🥬");
        ingredientMapper.insert(ingredient);
        return ingredient;
    }

    @Transactional
    public void delete(Long id, Long userId) {
        ingredientMapper.delete(id, userId);
    }
}