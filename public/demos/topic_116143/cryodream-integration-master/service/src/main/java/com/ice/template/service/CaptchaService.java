package com.ice.template.service;

import javax.servlet.http.HttpServletRequest;

public interface CaptchaService {

    String generateCaptcha(HttpServletRequest request);

    boolean validateCaptcha(HttpServletRequest request, String captcha);
}
