import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class ExecuteSQL {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.jdbc.Driver");
        String url = "jdbc:mysql://localhost:3306/hospital_db?useSSL=false&characterEncoding=utf8&allowMultiQueries=true";
        String user = "root";
        String password = "123456";
        String sqlFile = args.length > 0 ? args[0] : "backend/sql/his_standard_upgrade_clean3.sql";

        String sql = new String(Files.readAllBytes(Paths.get(sqlFile)), "UTF-8");
        String[] statements = sql.split(";");

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            int count = 0;
            for (String s : statements) {
                String trimmed = s.trim();
                if (trimmed.isEmpty() || trimmed.equalsIgnoreCase("DELIMITER") || trimmed.startsWith("DELIMITER")) continue;
                try {
                    stmt.execute(trimmed);
                    count++;
                } catch (Exception e) {
                    System.out.println("Error executing: " + trimmed.substring(0, Math.min(50, trimmed.length())) + "... -> " + e.getMessage());
                }
            }
            System.out.println("Executed " + count + " statements successfully.");
        }
    }
}