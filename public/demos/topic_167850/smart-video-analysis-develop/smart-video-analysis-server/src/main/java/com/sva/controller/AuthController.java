package com.sva.controller;

import com.sva.common.result.R;
import com.sva.dto.LoginRequest;
import com.sva.dto.RegisterRequest;
import com.sva.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证管理")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public R<Void> register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request.getUsername(), request.getPassword(), request.getEmail());
        return R.ok();
    }

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public R<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        String token = userService.login(request.getUsername(), request.getPassword());
        return R.ok(Map.of("token", token));
    }

    @Operation(summary = "刷新Token")
    @PostMapping("/refresh")
    public R<Map<String, Object>> refresh(@RequestAttribute("userId") Long userId) {
        String token = userService.refreshToken(userId);
        return R.ok(Map.of("token", token));
    }
}
