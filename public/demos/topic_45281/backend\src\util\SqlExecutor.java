package util;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;

public class SqlExecutor {
    public static void main(String[] args) {
        String sqlFile = args.length > 0 ? args[0] : "sql/full_chain_relations.sql";
        try (Connection conn = JDBCUtil.getConnection()) {
            StringBuilder sql = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(sqlFile), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("--") || line.startsWith("SET NAMES") || line.startsWith("SET FOREIGN_KEY")) continue;
                    if (line.startsWith("IF ")) continue;
                    if (line.startsWith("END IF;")) continue;
                    sql.append(line).append("\n");
                    if (line.endsWith(";") && !line.contains("DELIMITER")) {
                        String stmtStr = sql.toString().trim();
                        sql.setLength(0);
                        if (!stmtStr.isEmpty() && stmtStr.length() > 3) {
                            try (Statement stmt = conn.createStatement()) {
                                stmt.execute(stmtStr);
                                System.out.println("[OK] " + stmtStr.substring(0, Math.min(80, stmtStr.length())) + (stmtStr.length() > 80 ? "..." : ""));
                            } catch (SQLException e) {
                                if (e.getMessage().contains("Duplicate column") || e.getMessage().contains("Duplicate key") || e.getMessage().contains("already exists")) {
                                    System.out.println("[SKIP] " + e.getMessage().substring(0, Math.min(100, e.getMessage().length())));
                                } else {
                                    System.err.println("[ERR] " + e.getMessage());
                                }
                            }
                        }
                    }
                }
            }
            System.out.println("\nSQL执行完成！");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
