package com.fridgemagic.controller;

import com.fridgemagic.entity.*;
import com.fridgemagic.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Controller
public class HomeController {

    private final AIService aiService;
    private final RecipeService recipeService;
    private final UserService userService;
    private final IngredientService ingredientService;
    private final ExpiryService expiryService;
    private final WeeklyPlanService weeklyPlanService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public HomeController(AIService aiService, RecipeService recipeService, UserService userService,
                          IngredientService ingredientService, ExpiryService expiryService,
                          WeeklyPlanService weeklyPlanService, AuditService auditService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.recipeService = recipeService;
        this.userService = userService;
        this.ingredientService = ingredientService;
        this.expiryService = expiryService;
        this.weeklyPlanService = weeklyPlanService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/")
    public String index(Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        model.addAttribute("username", userDetails.getUsername());
        model.addAttribute("hasApiKey", aiService.hasApiKey());
        List<CustomIngredient> ingredients = ingredientService.findByUserId(user.getId());
        model.addAttribute("ingredients", ingredients);
        List<IngredientExpiry> expiring = expiryService.findExpiringSoon(user.getId());
        model.addAttribute("expiring", expiring);
        return "index";
    }

    @GetMapping("/history")
    public String history(@RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "10") int size,
                          @RequestParam(required = false) String keyword,
                          Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        if (user != null) {
            if (keyword != null && !keyword.trim().isEmpty()) {
                var pageInfo = recipeService.search(user.getId(), keyword.trim(), page, size);
                model.addAttribute("pageInfo", pageInfo);
                model.addAttribute("keyword", keyword);
            } else {
                var pageInfo = recipeService.findByUserId(user.getId(), page, size);
                model.addAttribute("pageInfo", pageInfo);
            }
        }
        model.addAttribute("username", userDetails.getUsername());
        return "history";
    }

    @GetMapping("/favorites")
    public String favorites(@RequestParam(defaultValue = "1") int page,
                            @RequestParam(defaultValue = "10") int size,
                            Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        if (user != null) {
            var pageInfo = recipeService.findByUserId(user.getId(), page, size);
            model.addAttribute("pageInfo", pageInfo);
        }
        model.addAttribute("username", userDetails.getUsername());
        return "favorites";
    }

    @GetMapping("/recipe/{id}")
    public String recipeDetail(@PathVariable Long id, Model model,
                                @AuthenticationPrincipal UserDetails userDetails) {
        Recipe recipe = recipeService.findById(id);
        if (recipe == null) return "redirect:/history";
        model.addAttribute("recipe", recipe);
        model.addAttribute("username", userDetails.getUsername());
        return "recipe-detail";
    }

    @GetMapping("/profile")
    public String profile(Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        model.addAttribute("user", user);
        model.addAttribute("username", userDetails.getUsername());
        return "profile";
    }

    @PostMapping("/api/profile/update")
    @ResponseBody
    public Map<String, Object> updateProfile(@RequestBody Map<String, String> body,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        String email = body.getOrDefault("email", "");
        userService.updateProfile(user.getId(), email);
        auditService.log(user.getId(), user.getUsername(), "UPDATE_PROFILE", "更新个人资料", "127.0.0.1");
        return Map.of("success", true);
    }

    @PostMapping("/api/profile/password")
    @ResponseBody
    public Map<String, Object> changePassword(@RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        String oldPwd = body.getOrDefault("oldPassword", "");
        String newPwd = body.getOrDefault("newPassword", "");
        if (!userService.checkPassword(oldPwd, user.getPassword())) {
            return Map.of("success", false, "message", "原密码错误");
        }
        if (newPwd.length() < 6) {
            return Map.of("success", false, "message", "新密码至少6位");
        }
        userService.updatePassword(user.getId(), newPwd);
        auditService.log(user.getId(), user.getUsername(), "CHANGE_PASSWORD", "修改密码", "127.0.0.1");
        return Map.of("success", true);
    }

    @PostMapping("/api/profile/nutrition-goal")
    @ResponseBody
    public Map<String, Object> updateNutritionGoal(@RequestBody Map<String, Integer> body,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        userService.updateNutritionGoal(user.getId(), body.get("calorieGoal"), body.get("proteinGoal"));
        return Map.of("success", true);
    }

    @GetMapping("/weekly-plan")
    public String weeklyPlan(@RequestParam(required = false) String weekStart,
                              Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        if (weekStart == null) {
            weekStart = java.time.LocalDate.now().with(java.time.DayOfWeek.MONDAY).toString();
        }
        List<WeeklyPlan> plans = weeklyPlanService.findByUserIdAndWeek(user.getId(), weekStart);
        // 构建 planMap: key="day-meal", value=recipeName
        Map<String, String> planMap = new java.util.HashMap<>();
        for (WeeklyPlan p : plans) {
            planMap.put(p.getDayOfWeek() + "-" + p.getMealType(), p.getRecipeName());
        }
        model.addAttribute("planMap", planMap);
        model.addAttribute("weekStart", weekStart);
        model.addAttribute("username", userDetails.getUsername());
        return "weekly-plan";
    }

    @GetMapping("/expiry")
    public String expiry(Model model, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        List<IngredientExpiry> items = expiryService.findByUserId(user.getId());
        List<IngredientExpiry> expiring = expiryService.findExpiringSoon(user.getId());
        model.addAttribute("items", items);
        model.addAttribute("expiring", expiring);
        model.addAttribute("username", userDetails.getUsername());
        return "expiry";
    }

    @PostMapping("/api/generate")
    @ResponseBody
    public Map<String, Object> generate(@RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> result = new HashMap<>();
        try {
            String ingredients = (String) body.getOrDefault("ingredients", "");
            String preference = (String) body.getOrDefault("preference", "");
            int count = body.containsKey("count") ? ((Number) body.get("count")).intValue() : 3;

            if (ingredients.isEmpty()) {
                result.put("success", false); result.put("message", "请输入食材"); return result;
            }

            List<Map<String, Object>> recipes = aiService.generateRecipes(ingredients, preference, count);
            result.put("success", true); result.put("recipes", recipes);

            User user = userService.findByUsername(userDetails.getUsername());
            if (user != null) {
                for (Map<String, Object> r : recipes) {
                    Recipe recipe = new Recipe();
                    recipe.setUserId(user.getId());
                    recipe.setName((String) r.get("name"));
                    recipe.setDifficulty((String) r.get("difficulty"));
                    recipe.setCookTime((String) r.get("time"));
                    recipe.setSteps(objectMapper.writeValueAsString(r.get("steps")));
                    recipe.setNutrition(objectMapper.writeValueAsString(r.get("nutrition")));
                    recipe.setExtraIngredients(objectMapper.writeValueAsString(r.get("extraIngredients")));
                    recipe.setIngredientsInput(ingredients);
                    recipe.setPreference(preference);
                    recipeService.save(recipe);
                    r.put("id", recipe.getId()); r.put("isFavorite", 0);
                }
            }
            auditService.log(user != null ? user.getId() : null, userDetails.getUsername(),
                    "GENERATE_RECIPE", "生成" + count + "道菜谱，食材：" + ingredients, "127.0.0.1");
        } catch (Exception e) {
            result.put("success", false); result.put("message", e.getMessage());
        }
        return result;
    }

    @PostMapping("/api/recipe/{id}/favorite")
    @ResponseBody
    public Map<String, Object> toggleFavorite(@PathVariable Long id,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        if (user != null) {
            recipeService.toggleFavorite(id, user.getId());
            auditService.log(user.getId(), user.getUsername(), "TOGGLE_FAVORITE", "收藏/取消收藏菜谱#" + id, "127.0.0.1");
            return Map.of("success", true);
        }
        return Map.of("success", false, "message", "用户不存在");
    }

    @PostMapping("/api/recipe/{id}/rate")
    @ResponseBody
    public Map<String, Object> rateRecipe(@PathVariable Long id, @RequestBody Map<String, Integer> body,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        if (user != null) {
            recipeService.rate(id, user.getId(), body.get("rating"));
            return Map.of("success", true);
        }
        return Map.of("success", false, "message", "用户不存在");
    }

    @DeleteMapping("/api/recipe/{id}")
    @ResponseBody
    public Map<String, Object> deleteRecipe(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        if (user != null) {
            recipeService.delete(id, user.getId());
            auditService.log(user.getId(), user.getUsername(), "DELETE_RECIPE", "删除菜谱#" + id, "127.0.0.1");
            return Map.of("success", true);
        }
        return Map.of("success", false, "message", "用户不存在");
    }

    @PostMapping("/api/ingredient/add")
    @ResponseBody
    public Map<String, Object> addIngredient(@RequestBody Map<String, String> body,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        try {
            CustomIngredient ing = ingredientService.add(user.getId(), body.get("name"), body.get("emoji"));
            return Map.of("success", true, "id", ing.getId());
        } catch (IllegalArgumentException e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }

    @DeleteMapping("/api/ingredient/{id}")
    @ResponseBody
    public Map<String, Object> deleteIngredient(@PathVariable Long id,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        ingredientService.delete(id, user.getId());
        return Map.of("success", true);
    }

    @PostMapping("/api/expiry/add")
    @ResponseBody
    public Map<String, Object> addExpiry(@RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        IngredientExpiry expiry = expiryService.add(user.getId(), body.get("name"),
                body.get("purchaseDate"), body.get("expiryDate"));
        return Map.of("success", true, "id", expiry.getId());
    }

    @DeleteMapping("/api/expiry/{id}")
    @ResponseBody
    public Map<String, Object> deleteExpiry(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        expiryService.delete(id, user.getId());
        return Map.of("success", true);
    }

    @PostMapping("/api/weekly-plan/save")
    @ResponseBody
    public Map<String, Object> saveWeeklyPlan(@RequestBody Map<String, Object> body,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        String weekStart = (String) body.get("weekStart");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> planList = (List<Map<String, Object>>) body.get("plans");
        List<WeeklyPlan> plans = new ArrayList<>();
        for (Map<String, Object> p : planList) {
            WeeklyPlan wp = new WeeklyPlan();
            wp.setDayOfWeek(((Number) p.get("dayOfWeek")).intValue());
            wp.setMealType((String) p.get("mealType"));
            wp.setRecipeId(p.get("recipeId") != null ? ((Number) p.get("recipeId")).longValue() : null);
            wp.setRecipeName((String) p.get("recipeName"));
            plans.add(wp);
        }
        weeklyPlanService.savePlan(user.getId(), weekStart, plans);
        return Map.of("success", true);
    }

    @GetMapping("/api/health")
    @ResponseBody
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok"); result.put("hasApiKey", aiService.hasApiKey());
        return result;
    }

    @PostMapping("/api/recognize")
    @ResponseBody
    public Map<String, Object> recognizeImage(@RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> result = new HashMap<>();
        try {
            String imageBase64 = body.get("image");
            if (imageBase64 == null || imageBase64.isEmpty()) {
                result.put("success", false);
                result.put("message", "未收到图片数据");
                return result;
            }
            // 去掉可能的 data:image/xxx;base64, 前缀
            if (imageBase64.contains(",")) {
                imageBase64 = imageBase64.substring(imageBase64.indexOf(",") + 1);
            }
            String ingredients = aiService.identifyIngredients(imageBase64);
            result.put("success", true);
            result.put("ingredients", ingredients);
            User user = userService.findByUsername(userDetails.getUsername());
            if (user != null) {
                auditService.log(user.getId(), user.getUsername(), "RECOGNIZE_IMAGE", "图片识别食材：" + ingredients, "127.0.0.1");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "识别失败：" + e.getMessage());
        }
        return result;
    }
}