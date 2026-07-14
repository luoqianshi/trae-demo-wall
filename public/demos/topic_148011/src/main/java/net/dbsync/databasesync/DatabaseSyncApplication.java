package net.dbsync.databasesync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class DatabaseSyncApplication {

    public static void main(String[] args) {
        // 添加JVM系统属性来禁用SSL验证，解决SQL Server连接问题
        System.setProperty("javax.net.ssl.trustStore", "NONE");
        System.setProperty("javax.net.ssl.trustStoreType", "JKS");
        System.setProperty("javax.net.ssl.trustStorePassword", "changeit");
        System.setProperty("javax.net.ssl.keyStore", "NONE");
        System.setProperty("javax.net.ssl.keyStoreType", "JKS");
        System.setProperty("javax.net.ssl.keyStorePassword", "changeit");
        System.setProperty("javax.net.ssl.keyAlias", "localhost");
        System.setProperty("javax.net.ssl.keyPassword", "changeit");
        System.setProperty("com.sun.net.ssl.checkRevocation", "false");
        System.setProperty("sun.security.ssl.allowUnsafeRenegotiation", "true");
        System.setProperty("jsse.enableSNIExtension", "false");
        
        SpringApplication.run(DatabaseSyncApplication.class, args);
    }

}