package com.health.common;

import lombok.Getter;

/**
 * 业务异常，用于在业务逻辑中抛出可预期的错误。
 * <p>
 * 携带 {@link ResultCode} 以便全局异常处理器统一处理。
 * </p>
 */
@Getter
public class BusinessException extends RuntimeException {

    /** 业务状态码 */
    private final ResultCode resultCode;

    public BusinessException(final ResultCode resultCode) {
        super(resultCode.getMessage());
        this.resultCode = resultCode;
    }

    public BusinessException(final ResultCode resultCode, final String message) {
        super(message);
        this.resultCode = resultCode;
    }

    public BusinessException(final ResultCode resultCode, final String message, final Throwable cause) {
        // 包装异常时必须保留原始 cause，避免丢失堆栈
        super(message, cause);
        this.resultCode = resultCode;
    }
}
