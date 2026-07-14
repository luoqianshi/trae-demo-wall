package net.dbsync.databasesync.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "database-sync")
public class DatabaseSyncConfig {
    private List<SyncPair> syncPairs;

    @Data
    public static class SyncPair {
        private String name;
        private DatabaseConfig source;
        private DatabaseConfig target;
        private List<TableConfig> tables;
    }

    @Data
    public static class DatabaseConfig {
        private String type;
        private String url;
        private String username;
        private String password;
    }

    @Data
    public static class TableConfig {
        private String table;
        private String sourceTable;
        private String targetTable;
        private String syncMode = "incremental";
        private boolean syncSchema = false;
        private IncrementalConfig incrementalConfig;
        private ZhConverterConfig zhConverterConfig;
    }

    @Data
    public static class ZhConverterConfig {
        private boolean enabled;
        private String direction; // s2t: 简体到繁体, t2s: 繁体到简体
    }

    @Data
    public static class IncrementalConfig {
        private List<String> identifierColumns;
        private String identifierExpression;
    }
}