package com.fridgemagic.mapper;

import com.fridgemagic.entity.FavoriteRecipe;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FavoriteMapper {
    int insert(FavoriteRecipe favorite);
    int delete(@Param("userId") Long userId, @Param("recipeId") Long recipeId);
    FavoriteRecipe findByUserAndRecipe(@Param("userId") Long userId, @Param("recipeId") Long recipeId);
    List<FavoriteRecipe> findByUserId(@Param("userId") Long userId);
}