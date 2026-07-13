package com.health.common;

import lombok.Getter;

import java.util.Collections;
import java.util.List;

/**
 * 分页查询响应体。
 *
 * @param <T> 列表元素类型
 */
@Getter
public class PageResult<T> {

    /** 当前页码 */
    private final long page;

    /** 每页条数 */
    private final long size;

    /** 总条数 */
    private final long total;

    /** 总页数 */
    private final long pages;

    /** 数据列表 */
    private final List<T> records;

    public PageResult(final long page, final long size, final long total, final List<T> records) {
        this.page = page;
        this.size = size;
        this.total = total;
        // 总页数 = 总条数 / 每页条数，向上取整
        this.pages = size <= 0 ? 0 : (total + size - 1) / size;
        this.records = records == null ? Collections.emptyList() : records;
    }
}
