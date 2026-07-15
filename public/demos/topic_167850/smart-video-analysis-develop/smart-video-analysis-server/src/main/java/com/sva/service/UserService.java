package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.User;

public interface UserService extends IService<User> {

    User getByUsername(String username);

    boolean register(String username, String password, String email);

    String login(String username, String password);

    String refreshToken(Long userId);
}
