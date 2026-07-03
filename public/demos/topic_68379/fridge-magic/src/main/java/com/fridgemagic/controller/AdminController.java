package com.fridgemagic.controller;

import com.fridgemagic.entity.User;
import com.fridgemagic.service.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;
    private final RecipeService recipeService;
    private final AuditService auditService;

    public AdminController(UserService userService, RecipeService recipeService, AuditService auditService) {
        this.userService = userService;
        this.recipeService = recipeService;
        this.auditService = auditService;
    }

    @GetMapping("")
    public String dashboard(Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User u = userService.findByUsername(userDetails.getUsername());
        if (u == null || !"ADMIN".equals(u.getRole())) return "redirect:/";
        model.addAttribute("userCount", userService.count());
        model.addAttribute("recipeCount", recipeService.countByUserId(u.getId()));
        model.addAttribute("auditCount", auditService.count());
        model.addAttribute("username", userDetails.getUsername());
        return "admin";
    }

    @GetMapping("/users")
    public String users(@RequestParam(defaultValue = "1") int page, Model model,
                         @AuthenticationPrincipal UserDetails userDetails) {
        User u = userService.findByUsername(userDetails.getUsername());
        if (u == null || !"ADMIN".equals(u.getRole())) return "redirect:/";
        model.addAttribute("users", userService.findAll(page, 20));
        model.addAttribute("username", userDetails.getUsername());
        return "admin-users";
    }

    @GetMapping("/logs")
    public String logs(@RequestParam(defaultValue = "1") int page, Model model,
                        @AuthenticationPrincipal UserDetails userDetails) {
        User u = userService.findByUsername(userDetails.getUsername());
        if (u == null || !"ADMIN".equals(u.getRole())) return "redirect:/";
        model.addAttribute("logs", auditService.findAll(page, 20));
        model.addAttribute("username", userDetails.getUsername());
        return "admin-logs";
    }
}