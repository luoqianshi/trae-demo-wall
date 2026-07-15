package com.sva;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.sva.mapper")
@EnableAsync
public class SvaApplication {

    public static void main(String[] args) {
        SpringApplication.run(SvaApplication.class, args);
    }
}
