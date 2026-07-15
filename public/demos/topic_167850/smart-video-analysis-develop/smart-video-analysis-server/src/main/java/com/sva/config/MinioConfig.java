package com.sva.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MinioConfig {

    private final MinioProperties minioProperties;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(minioProperties.getEndpoint())
                .credentials(minioProperties.getAccessKey(), minioProperties.getSecretKey())
                .build();
    }

    @Bean
    public CommandLineRunner initMinioBuckets(MinioClient minioClient) {
        return args -> {
            try {
                minioProperties.getBuckets().forEach((key, bucketName) -> {
                    try {
                        boolean exists = minioClient.bucketExists(
                                BucketExistsArgs.builder().bucket(bucketName).build());
                        if (!exists) {
                            minioClient.makeBucket(
                                    MakeBucketArgs.builder().bucket(bucketName).build());
                            log.info("MinIO bucket created: {}", bucketName);
                        } else {
                            log.info("MinIO bucket already exists: {}", bucketName);
                        }
                    } catch (Exception e) {
                        log.error("Failed to check/create bucket: {}", bucketName, e);
                    }
                });
            } catch (Exception e) {
                log.error("MinIO initialization failed", e);
            }
        };
    }
}
