package net.dbsync.databasesync.datasource;

import net.dbsync.databasesync.config.DatabaseSyncConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;

@Slf4j
public class DataSourceFactory {

    public static DataSource createDataSource(DatabaseSyncConfig.DatabaseConfig config) {
        HikariConfig hikariConfig = new HikariConfig();
        
        // 处理SQL Server SSL连接问题
        String url = config.getUrl();
        if (config.getType().toLowerCase().equals("sqlserver")) {
            log.info("Original SQL Server URL: {}", url);
            url = handleSqlServerUrl(url);
            log.info("Modified SQL Server URL: {}", url);
        }
        
        hikariConfig.setJdbcUrl(url);
        hikariConfig.setUsername(config.getUsername());
        hikariConfig.setPassword(config.getPassword());
        
        // 根据数据库类型设置驱动类名
        String driverClassName = getDriverClassName(config.getType());
        if (driverClassName != null) {
            hikariConfig.setDriverClassName(driverClassName);
        }
        
        // 连接池配置
        hikariConfig.setMaximumPoolSize(10);
        hikariConfig.setMinimumIdle(5);
        hikariConfig.setConnectionTimeout(30000);
        hikariConfig.setIdleTimeout(600000);
        hikariConfig.setMaxLifetime(1800000);
        
        // 添加连接测试配置
        hikariConfig.setConnectionTestQuery("SELECT 1");
        
        log.info("Creating data source for {}: {}", config.getType(), url);
        return new HikariDataSource(hikariConfig);
    }

    private static String handleSqlServerUrl(String url) {
        // SQL Server JDBC URL使用分号作为参数分隔符
        StringBuilder urlBuilder = new StringBuilder(url);
        
        // 添加SSL参数 - 使用分号分隔符
        if (!url.contains("encrypt=")) {
            urlBuilder.append(";encrypt=false");
        }
        
        // 添加信任服务器证书参数
        if (!url.contains("trustServerCertificate=")) {
            urlBuilder.append(";trustServerCertificate=true");
        }
        
        // 添加禁用主机名验证参数
        if (!url.contains("hostNameInCertificate=")) {
            urlBuilder.append(";hostNameInCertificate=*");
        }
        
        // 添加登录超时参数
        if (!url.contains("loginTimeout=")) {
            urlBuilder.append(";loginTimeout=30");
        }
        
        // 添加其他可能需要的参数
        if (!url.contains("sendStringParametersAsUnicode=")) {
            urlBuilder.append(";sendStringParametersAsUnicode=false");
        }
        
        return urlBuilder.toString();
    }

    private static String getDriverClassName(String dbType) {
        return switch (dbType.toLowerCase()) {
            case "mysql" -> "com.mysql.cj.jdbc.Driver";
            case "postgresql" -> "org.postgresql.Driver";
            case "oracle" -> "oracle.jdbc.OracleDriver";
            case "sqlserver" -> "com.microsoft.sqlserver.jdbc.SQLServerDriver";
            default -> null;
        };
    }
}
