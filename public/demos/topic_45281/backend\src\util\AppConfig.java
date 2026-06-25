package util;

import java.io.InputStream;
import java.util.Properties;

public class AppConfig {
    private static final Properties props = new Properties();

    static {
        try (InputStream is = AppConfig.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (is != null) {
                props.load(is);
                System.out.println("[Config] config.properties loaded");
            } else {
                System.out.println("[Config] config.properties not found, using defaults");
            }
        } catch (Exception e) {
            System.out.println("[Config] Failed to load config: " + e.getMessage());
        }
    }

    public static String get(String key, String defaultValue) {
        return props.getProperty(key, defaultValue);
    }

    public static int getInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(props.getProperty(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public static String getDbUrl() {
        return get("db.url", "jdbc:mysql://localhost:3306/hospital_db?useSSL=false&characterEncoding=utf8&autoReconnect=true&maxReconnects=3&connectTimeout=3000&socketTimeout=5000");
    }

    public static String getDbUser() {
        return get("db.user", "root");
    }

    public static String getDbPassword() {
        return get("db.password", "123456");
    }

    public static int getDbPoolSize() {
        return getInt("db.pool.size", 10);
    }

    public static int getServerPort() {
        return getInt("server.port", 8080);
    }
}
