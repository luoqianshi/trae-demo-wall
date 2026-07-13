package com.ice.template.config;

import lombok.Data;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "neo4j")
public class Neo4jConfig {

    private String uri = "bolt://localhost:7687";
    private String username = "neo4j";
    private String password = "neo4j_password";
    private int maxConnectionPoolSize = 50;
    private long connectionTimeoutMs = 30000;

    @Bean(destroyMethod = "close")
    public Driver neo4jDriver() {
        return GraphDatabase.driver(uri, AuthTokens.basic(username, password),
                org.neo4j.driver.Config.builder()
                        .withMaxConnectionPoolSize(maxConnectionPoolSize)
                        .withConnectionTimeout(connectionTimeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS)
                        .build());
    }
}
