package com.fridgemagic.service;

import com.fridgemagic.entity.User;
import com.fridgemagic.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public User findByUsername(String username) {
        return userMapper.findByUsername(username);
    }

    public User findById(Long id) {
        return userMapper.findById(id);
    }

    public User findByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    public boolean register(String username, String password, String email) {
        User existing = userMapper.findByUsername(username);
        if (existing != null) return false;
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        return userMapper.insert(user) > 0;
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public void updatePassword(Long userId, String newPassword) {
        userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));
    }

    public void updateProfile(Long userId, String email) {
        userMapper.updateProfile(userId, email);
    }

    public void updateNutritionGoal(Long userId, Integer calorieGoal, Integer proteinGoal) {
        userMapper.updateNutritionGoal(userId, calorieGoal, proteinGoal);
    }

    public int count() {
        return userMapper.count();
    }

    public List<User> findAll(int page, int size) {
        int offset = (page - 1) * size;
        return userMapper.findAll(offset, size);
    }
}