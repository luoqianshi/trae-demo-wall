package com.ice.template.service.impl;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.CircleCaptcha;
import com.ice.template.service.CaptchaService;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;

@Service
public class CaptchaServiceImpl implements CaptchaService {

    private static final String CAPTCHA_KEY = "captcha_key";

    private static final int CAPTCHA_WIDTH = 100;

    private static final int CAPTCHA_HEIGHT = 40;

    private static final int CAPTCHA_CODE_LENGTH = 4;

    @Override
    public String generateCaptcha(HttpServletRequest request) {
        CircleCaptcha captcha = CaptchaUtil.createCircleCaptcha(CAPTCHA_WIDTH, CAPTCHA_HEIGHT, CAPTCHA_CODE_LENGTH, 5);
        String code = captcha.getCode();
        request.getSession().setAttribute(CAPTCHA_KEY, code);
        return captcha.getImageBase64Data();
    }

    @Override
    public boolean validateCaptcha(HttpServletRequest request, String captcha) {
        Object sessionCaptcha = request.getSession().getAttribute(CAPTCHA_KEY);
        if (sessionCaptcha == null) {
            return false;
        }
        boolean result = sessionCaptcha.toString().equalsIgnoreCase(captcha);
        request.getSession().removeAttribute(CAPTCHA_KEY);
        return result;
    }
}
