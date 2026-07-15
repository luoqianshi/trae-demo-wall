package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.User;
import com.sva.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "用户管理")
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public R<Map<String, Object>> getCurrentUser(@RequestAttribute("userId") Long userId) {
        User user = userService.getById(userId);
        if (user == null) {
            return R.fail(404, "用户不存在");
        }
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        result.put("avatar", user.getAvatar());
        result.put("email", user.getEmail());
        result.put("role", user.getRole());
        return R.ok(result);
    }
}
