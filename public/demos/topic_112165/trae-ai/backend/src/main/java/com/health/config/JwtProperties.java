package com.health.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 配置属性，从 application.yml 中 app.jwt 读取。
 * <p>
 * 密钥等敏感配置禁止硬编码，统一走配置注入。
 * </p>
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** JWT 签名密钥 */
    private String secret;

    /** Token 有效期（小时） */
    private int expiration;

    /** 请求头名称 */
    private String header;

    /** Token 前缀 */
    private String prefix;
}
