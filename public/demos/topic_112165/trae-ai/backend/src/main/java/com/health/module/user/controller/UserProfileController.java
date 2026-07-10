package com.health.module.user.controller;

import com.health.common.Result;
import com.health.module.user.dto.UserProfileDTO;
import com.health.module.user.dto.UserProfileVO;
import com.health.module.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户档案控制器，提供当前用户档案的查询与更新.
 * <p>
 * 当前用户身份从安全上下文获取，严禁前端传入 userId。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/user")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(final UserService userService) {
        this.userService = userService;
    }

    /**
     * 获取当前用户档案.
     *
     * @return 用户档案 VO
     */
    @GetMapping("/profile")
    public Result<UserProfileVO> getProfile() {
        final UserProfileVO vo = userService.getProfile();
        return Result.success(vo);
    }

    /**
     * 更新当前用户健康档案.
     *
     * @param dto 档案信息
     * @return 操作结果
     */
    @PutMapping("/profile")
    public Result<Void> updateProfile(@Valid @RequestBody final UserProfileDTO dto) {
        userService.updateProfile(dto);
        return Result.success();
    }
}
