package com.health.module.user.service.impl;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.user.service.SmsService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 短信验证码服务实现.
 * <p>
 * 验证码存储于 Redis，开发环境通过 debug 日志输出验证码，不实际发送短信。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class SmsServiceImpl implements SmsService {

    /** 日志对象必须为 private static final. */
    private static final Logger logger = LoggerFactory.getLogger(SmsServiceImpl.class);

    /** Redis 验证码 key 前缀，完整 key 为 sms:code:{phone}. */
    private static final String SMS_CODE_KEY_PREFIX = "sms:code:";

    /** Redis 发送频率限制 key 前缀，完整 key 为 sms:limit:{phone}. */
    private static final String SMS_LIMIT_KEY_PREFIX = "sms:limit:";

    private final StringRedisTemplate stringRedisTemplate;

    /** 验证码长度，从配置读取. */
    private final int codeLength;

    /** 验证码过期时间（分钟），从配置读取. */
    private final int expireMinutes;

    /** 发送频率限制（秒），从配置读取. */
    private final int sendInterval;

    public SmsServiceImpl(
            final StringRedisTemplate stringRedisTemplate,
            @Value("${app.sms.code-length}") final int codeLength,
            @Value("${app.sms.expire-minutes}") final int expireMinutes,
            @Value("${app.sms.send-interval}") final int sendInterval) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.codeLength = codeLength;
        this.expireMinutes = expireMinutes;
        this.sendInterval = sendInterval;
    }

    @Override
    public void sendSms(final String phone) {
        // 检查发送频率限制
        final String limitKey = SMS_LIMIT_KEY_PREFIX + phone;
        final Boolean hasLimit = stringRedisTemplate.hasKey(limitKey);
        if (Boolean.TRUE.equals(hasLimit)) {
            throw new BusinessException(ResultCode.SMS_CODE_TOO_FREQUENT);
        }

        // 生成随机验证码
        final String code = generateCode();

        // 存入 Redis，设置过期时间
        final String codeKey = SMS_CODE_KEY_PREFIX + phone;
        stringRedisTemplate.opsForValue().set(codeKey, code, expireMinutes, TimeUnit.MINUTES);

        // 设置发送频率限制
        stringRedisTemplate.opsForValue().set(limitKey, "1", sendInterval, TimeUnit.SECONDS);

        logger.info("短信验证码已发送: phone={}", phone);
        // 开发环境通过 debug 级别打印验证码内容（生产环境关闭 debug 即可不输出）
        logger.debug("验证码内容: phone={}, code={}", phone, code);
    }

    @Override
    public boolean verifyCode(final String phone, final String code) {
        if (StringUtils.isBlank(code)) {
            return false;
        }

        final String codeKey = SMS_CODE_KEY_PREFIX + phone;
        final String storedCode = stringRedisTemplate.opsForValue().get(codeKey);
        if (StringUtils.isBlank(storedCode)) {
            return false;
        }

        final boolean matched = code.equals(storedCode);
        if (matched) {
            // 验证成功后删除验证码，防止重复使用
            stringRedisTemplate.delete(codeKey);
        }

        return matched;
    }

    /**
     * 生成指定位数的随机数字验证码.
     *
     * @return 验证码字符串
     */
    private String generateCode() {
        return ThreadLocalRandom.current()
                .ints(codeLength, 0, 10)
                .mapToObj(String::valueOf)
                .collect(Collectors.joining());
    }
}
