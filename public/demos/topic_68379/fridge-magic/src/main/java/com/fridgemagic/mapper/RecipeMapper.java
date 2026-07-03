package com.fridgemagic.mapper;

import com.fridgemagic.entity.Recipe;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RecipeMapper {
    int insert(Recipe recipe);
    Recipe findById(@Param("id") Long id);
    List<Recipe> findByUserId(@Param("userId") Long userId);
    List<Recipe> searchByUserId(@Param("userId") Long userId, @Param("keyword") String keyword);
    int updateFavorite(@Param("id") Long id, @Param("isFavorite") Integer isFavorite);
    int updateRating(@Param("id") Long id, @Param("rating") Integer rating);
    int deleteById(@Param("id") Long id);
    int countByUserId(@Param("userId") Long userId);
    List<Recipe> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
}