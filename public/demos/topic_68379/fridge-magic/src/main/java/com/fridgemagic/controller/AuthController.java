package com.fridgemagic.controller;

import com.fridgemagic.entity.User;
import com.fridgemagic.service.AuditService;
import com.fridgemagic.service.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Controller
public class AuthController {

    private final UserService userService;
    private final AuditService auditService;

    public AuthController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
    }

    @GetMapping("/login")
    public String loginPage() { return "login"; }

    @GetMapping("/register")
    public String registerPage() { return "register"; }

    @GetMapping("/forgot-password")
    public String forgotPasswordPage() { return "forgot-password"; }

    @PostMapping("/api/register")
    @ResponseBody
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String email = body.getOrDefault("email", "");
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return Map.of("success", false, "message", "用户名和密码不能为空");
        }
        if (password.length() < 6) {
            return Map.of("success", false, "message", "密码长度至少6位");
        }
        boolean ok = userService.register(username.trim(), password, email.trim());
        if (ok) {
            auditService.log(null, username, "REGISTER", "新用户注册", "127.0.0.1");
        }
        return ok ? Map.of("success", true, "message", "注册成功")
                  : Map.of("success", false, "message", "用户名已存在");
    }

    @PostMapping("/api/forgot-password")
    @ResponseBody
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userService.findByEmail(email);
        if (user == null) {
            return Map.of("success", false, "message", "该邮箱未注册");
        }
        String newPassword = UUID.randomUUID().toString().substring(0, 8);
        userService.updatePassword(user.getId(), newPassword);
        return Map.of("success", true, "message", "新密码已发送至您的邮箱：" + newPassword + "（请登录后修改）");
    }
}