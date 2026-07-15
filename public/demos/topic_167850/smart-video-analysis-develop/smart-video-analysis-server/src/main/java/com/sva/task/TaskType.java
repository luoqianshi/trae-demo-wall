package com.sva.task;

import lombok.Getter;

@Getter
public enum TaskType {

    VIDEO_ANALYSIS(1, "视频解析");

    private final Integer code;
    private final String desc;

    TaskType(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
