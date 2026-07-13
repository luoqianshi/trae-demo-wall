package com.health;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 个人身体状况监控系统启动类。
 * <p>
 * 启用定时任务调度，用于设备数据定时同步等场景。
 * </p>
 */
@SpringBootApplication
@MapperScan("com.health.module.**.mapper")
@EnableScheduling
public class HealthApplication {

    public static void main(final String[] args) {
        SpringApplication.run(HealthApplication.class, args);
    }
}
