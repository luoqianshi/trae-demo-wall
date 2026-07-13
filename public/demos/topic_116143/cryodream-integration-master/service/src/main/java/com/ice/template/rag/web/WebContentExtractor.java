package com.ice.template.rag.web;

import java.util.Optional;

/**
 * 网页正文提取器接口。
 *
 * <p>责任链中的每一级实现该接口；按 {@link #order()} 从小到大依次尝试，
 * 任一级成功提取出合格正文即返回，否则降级到下一级。</p>
 */
public interface WebContentExtractor {

    /**
     * 提取器名称（用于日志/可观测）。
     */
    String name();

    /**
     * 链中的优先级，数值越小越先执行。
     */
    int order();

    /**
     * 当前提取器是否启用（通常由配置控制）。
     */
    boolean isEnabled();

    /**
     * 尝试从 URL 提取正文。
     *
     * @param url 目标网页 URL
     * @return 成功时返回正文，失败/不合格时返回 {@link Optional#empty()}
     */
    Optional<WebContent> extract(String url);
}
