package com.health.common;

import lombok.Getter;

/**
 * 统一响应体，所有接口返回均使用此结构。
 *
 * @param <T> 业务数据类型
 */
@Getter
public class Result<T> {

    /** 业务状态码，200 表示成功 */
    private final int code;

    /** 提示信息 */
    private final String message;

    /** 业务数据 */
    private final T data;

    /** 时间戳 */
    private final long timestamp;

    private Result(final int code, final String message, final T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 成功响应（无数据）。
     */
    public static <T> Result<T> success() {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), null);
    }

    /**
     * 成功响应（带数据）。
     */
    public static <T> Result<T> success(final T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    /**
     * 成功响应（带提示与数据）。
     */
    public static <T> Result<T> success(final String message, final T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), message, data);
    }

    /**
     * 失败响应（指定错误码）。
     */
    public static <T> Result<T> fail(final ResultCode resultCode) {
        return new Result<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    /**
     * 失败响应（指定错误码与自定义提示）。
     */
    public static <T> Result<T> fail(final ResultCode resultCode, final String message) {
        return new Result<>(resultCode.getCode(), message, null);
    }

    /**
     * 失败响应（自定义错误码与提示）。
     */
    public static <T> Result<T> fail(final int code, final String message) {
        return new Result<>(code, message, null);
    }
}
