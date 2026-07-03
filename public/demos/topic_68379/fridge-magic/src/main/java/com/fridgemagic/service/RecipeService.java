package com.fridgemagic.service;

import com.fridgemagic.entity.Recipe;
import com.fridgemagic.mapper.RecipeMapper;
import com.fridgemagic.mapper.RatingMapper;
import com.fridgemagic.entity.RecipeRating;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecipeService {

    private final RecipeMapper recipeMapper;
    private final RatingMapper ratingMapper;

    public RecipeService(RecipeMapper recipeMapper, RatingMapper ratingMapper) {
        this.recipeMapper = recipeMapper;
        this.ratingMapper = ratingMapper;
    }

    @Transactional
    public Recipe save(Recipe recipe) {
        recipeMapper.insert(recipe);
        return recipe;
    }

    public Recipe findById(Long id) {
        return recipeMapper.findById(id);
    }

    public PageInfo<Recipe> findByUserId(Long userId, int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Recipe> list = recipeMapper.findByUserId(userId);
        return new PageInfo<>(list);
    }

    public PageInfo<Recipe> search(Long userId, String keyword, int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Recipe> list = recipeMapper.searchByUserId(userId, keyword);
        return new PageInfo<>(list);
    }

    @Transactional
    public void toggleFavorite(Long recipeId, Long userId) {
        Recipe recipe = recipeMapper.findById(recipeId);
        if (recipe != null && recipe.getUserId().equals(userId)) {
            int newVal = (recipe.getIsFavorite() != null && recipe.getIsFavorite() == 1) ? 0 : 1;
            recipeMapper.updateFavorite(recipeId, newVal);
        }
    }

    @Transactional
    public void rate(Long recipeId, Long userId, int rating) {
        RecipeRating existing = ratingMapper.findByUserAndRecipe(userId, recipeId);
        if (existing != null) {
            existing.setRating(rating);
        }
        RecipeRating r = new RecipeRating();
        r.setUserId(userId);
        r.setRecipeId(recipeId);
        r.setRating(rating);
        ratingMapper.insert(r);
        Double avg = ratingMapper.avgRating(recipeId);
        if (avg != null) {
            recipeMapper.updateRating(recipeId, (int) Math.round(avg));
        }
    }

    @Transactional
    public void delete(Long recipeId, Long userId) {
        Recipe recipe = recipeMapper.findById(recipeId);
        if (recipe != null && recipe.getUserId().equals(userId)) {
            recipeMapper.deleteById(recipeId);
        }
    }

    public int countByUserId(Long userId) {
        return recipeMapper.countByUserId(userId);
    }

    public PageInfo<Recipe> findAll(int pageNum, int pageSize) {
        // For admin dashboard
        int offset = (pageNum - 1) * pageSize;
        List<Recipe> list = recipeMapper.findAll(offset, pageSize);
        PageInfo<Recipe> pi = new PageInfo<>(list);
        pi.setTotal(recipeMapper.countAll());
        return pi;
    }
}