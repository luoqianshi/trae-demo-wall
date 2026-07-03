package com.fridgemagic.mapper;

import com.fridgemagic.entity.CustomIngredient;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface IngredientMapper {
    List<CustomIngredient> findByUserId(@Param("userId") Long userId);
    int insert(CustomIngredient ingredient);
    int delete(@Param("id") Long id, @Param("userId") Long userId);
}