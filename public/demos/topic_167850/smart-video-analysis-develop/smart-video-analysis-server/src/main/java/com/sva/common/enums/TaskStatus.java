package com.sva.common.enums;

import lombok.Getter;

@Getter
public enum TaskStatus {

    PENDING(0, "待处理"),
    RUNNING(1, "处理中"),
    SUCCESS(2, "成功"),
    FAILED(3, "失败"),
    CANCELLED(4, "已取消");

    private final Integer code;
    private final String desc;

    TaskStatus(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
