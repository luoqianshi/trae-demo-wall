package com.health.config;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 配置。
 * <p>
 * 配置分页插件与自动填充（created_at / updated_at）。
 * </p>
 */
@Configuration
public class MyBatisPlusConfig {

    /**
     * 分页插件，所有列表查询均依赖此插件实现 limit。
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        final MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        return interceptor;
    }

    /**
     * 自动填充处理器，插入时填充 created_at / updated_at，更新时填充 updated_at。
     */
    @Component
    public static class AutoFillMetaObjectHandler implements MetaObjectHandler {

        @Override
        public void insertFill(final MetaObject metaObject) {
            final LocalDateTime now = LocalDateTime.now();
            this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, now);
            this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, now);
        }

        @Override
        public void updateFill(final MetaObject metaObject) {
            this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
        }
    }

    /**
     * 字段填充策略常量，供实体注解引用。
     */
    public static final String CREATED_AT = "createdAt";
    public static final String UPDATED_AT = "updatedAt";
}
