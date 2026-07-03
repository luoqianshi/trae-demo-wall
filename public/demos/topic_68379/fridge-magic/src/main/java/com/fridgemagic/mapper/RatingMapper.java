package com.fridgemagic.mapper;

import com.fridgemagic.entity.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RatingMapper {
    int insert(RecipeRating rating);
    RecipeRating findByUserAndRecipe(@Param("userId") Long userId, @Param("recipeId") Long recipeId);
    Double avgRating(@Param("recipeId") Long recipeId);
}