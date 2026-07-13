package com.health.common;

import lombok.Getter;

/**
 * 业务状态码枚举。
 * <p>
 * 2xx 成功，4xx 客户端错误，5xx 服务端错误。
 * </p>
 */
@Getter
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "请求方法不支持"),

    BUSINESS_ERROR(1000, "业务处理失败"),
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_ALREADY_EXISTS(1002, "用户已存在"),
    PASSWORD_ERROR(1003, "密码错误"),
    SMS_CODE_ERROR(1004, "验证码错误或已过期"),
    SMS_CODE_TOO_FREQUENT(1005, "验证码发送过于频繁"),
    ACCOUNT_DISABLED(1006, "账号已被禁用"),
    DOCTOR_NOT_AUDITED(1007, "医生账号待审核"),

    METRIC_NOT_FOUND(2001, "健康指标不存在"),
    ALERT_LEVEL_ERROR(2002, "告警等级计算异常"),

    CONSULTATION_NOT_FOUND(3001, "问诊会话不存在"),
    CONSULTATION_CLOSED(3002, "问诊会话已关闭"),
    CONSULTATION_REPLY_LIMIT(3003, "追问次数已达上限"),
    DOCTOR_OFFLINE(3004, "医生不在线"),

    DEVICE_NOT_FOUND(4001, "设备不存在"),
    DEVICE_TOKEN_ERROR(4002, "设备鉴权失败"),
    DEVICE_ALREADY_BOUND(4003, "设备已被绑定"),

    FAMILY_MEMBER_LIMIT(5001, "家庭成员数量已达上限"),
    FAMILY_NOT_AUTHORIZED(5002, "未授权查看该成员指标"),

    POINTS_INSUFFICIENT(6001, "积分余额不足"),
    EXCHANGE_OUT_OF_STOCK(6002, "兑换商品库存不足"),

    FILE_UPLOAD_ERROR(7001, "文件上传失败"),
    FILE_TYPE_NOT_ALLOWED(7002, "文件类型不允许"),
    FILE_TOO_LARGE(7003, "文件大小超过限制"),

    SYSTEM_ERROR(5000, "系统繁忙，请稍后重试");

    /** 状态码 */
    private final int code;

    /** 提示信息 */
    private final String message;

    ResultCode(final int code, final String message) {
        this.code = code;
        this.message = message;
    }
}
