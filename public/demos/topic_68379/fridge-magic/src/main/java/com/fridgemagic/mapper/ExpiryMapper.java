package com.fridgemagic.mapper;

import com.fridgemagic.entity.IngredientExpiry;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ExpiryMapper {
    List<IngredientExpiry> findByUserId(@Param("userId") Long userId);
    int insert(IngredientExpiry expiry);
    int delete(@Param("id") Long id, @Param("userId") Long userId);
    List<IngredientExpiry> findExpiringSoon(@Param("userId") Long userId, @Param("days") int days);
    int markNotified(@Param("id") Long id);
}