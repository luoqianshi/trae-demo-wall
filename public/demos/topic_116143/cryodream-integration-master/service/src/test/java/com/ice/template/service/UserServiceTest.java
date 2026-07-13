package com.ice.template.service;

import javax.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 用户服务测试
 *
 *
 */
@SpringBootTest
public class UserServiceTest {

    @Resource
    private UserService userService;

    @Test
    void userRegister() {
        String userAccount = "ice";
        String userPassword = "";
        String checkPassword = "123456";
        String userPhone = "13800138000";
        String userEmail = "test@example.com";
        try {
            String result = userService.userRegister(userAccount, userPassword, checkPassword, userPhone, userEmail);
            Assertions.assertNull(result);
            userAccount = "yu";
            result = userService.userRegister(userAccount, userPassword, checkPassword, userPhone, userEmail);
            Assertions.assertNull(result);
        } catch (Exception e) {

        }
    }
}
