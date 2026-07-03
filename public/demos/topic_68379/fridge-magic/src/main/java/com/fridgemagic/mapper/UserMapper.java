package com.fridgemagic.mapper;

import com.fridgemagic.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserMapper {
    User findByUsername(String username);
    User findById(Long id);
    User findByEmail(@Param("email") String email);
    int insert(User user);
    int updatePassword(@Param("id") Long id, @Param("password") String password);
    int updateProfile(@Param("id") Long id, @Param("email") String email);
    int updateNutritionGoal(@Param("id") Long id, @Param("calorieGoal") Integer calorieGoal, @Param("proteinGoal") Integer proteinGoal);
    int count();
    List<User> findAll(@Param("offset") int offset, @Param("limit") int limit);
}