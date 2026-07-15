package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.User;
import com.sva.mapper.UserMapper;
import com.sva.service.UserService;
import com.sva.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public User getByUsername(String username) {
        return getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
    }

    @Override
    public boolean register(String username, String password, String email) {
        if (getByUsername(username) != null) {
            throw new BusinessException(400, "用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setNickname(username);
        user.setEmail(email);
        user.setRole("USER");
        user.setStatus(1);
        return save(user);
    }

    @Override
    public String login(String username, String password) {
        User user = getByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new BusinessException(403, "账号已被禁用");
        }
        return jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
    }

    @Override
    public String refreshToken(Long userId) {
        User user = getById(userId);
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }
        return jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
    }
}
