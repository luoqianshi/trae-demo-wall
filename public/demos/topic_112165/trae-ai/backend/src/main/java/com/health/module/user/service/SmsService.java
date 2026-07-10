package com.health.module.user.service;

/**
 * 短信验证码服务接口.
 *
 * @author trae
 * @date 2026-07-10
 */
public interface SmsService {

    /**
     * 发送短信验证码.
     * <p>
     * 生成 6 位随机验证码，存入 Redis（5 分钟过期），检查 60 秒发送频率限制。
     * 开发环境日志打印验证码，不实际发送短信。
     * </p>
     *
     * @param phone 手机号
     */
    void sendSms(String phone);

    /**
     * 校验验证码.
     * <p>
     * 从 Redis 取验证码比对，验证成功后删除。
     * </p>
     *
     * @param phone 手机号
     * @param code  验证码
     * @return 校验是否通过
     */
    boolean verifyCode(String phone, String code);
}
