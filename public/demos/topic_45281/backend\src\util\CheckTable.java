package util;

import java.sql.*;

public class CheckTable {
    public static void main(String[] args) {
        try {
            Connection conn = JDBCUtil.getConnection();
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet rs = meta.getTables(null, null, "queue_calls", null);
            if (rs.next()) {
                System.out.println("queue_calls EXISTS");
            } else {
                System.out.println("queue_calls NOT FOUND - creating...");
                Statement stmt = conn.createStatement();
                stmt.execute("CREATE TABLE `queue_calls` (" +
                    "`id` int NOT NULL AUTO_INCREMENT," +
                    "`registration_id` int NOT NULL," +
                    "`patient_id` int NOT NULL," +
                    "`patient_name` varchar(50) DEFAULT NULL," +
                    "`doctor_id` int NOT NULL," +
                    "`doctor_name` varchar(50) DEFAULT NULL," +
                    "`dept` varchar(50) NOT NULL," +
                    "`queue_no` varchar(20) NOT NULL," +
                    "`status` varchar(20) DEFAULT 'waiting'," +
                    "`call_time` datetime DEFAULT NULL," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)," +
                    "INDEX `idx_dept`(`dept`)," +
                    "INDEX `idx_status`(`status`)," +
                    "INDEX `idx_doctor`(`doctor_id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                System.out.println("queue_calls CREATED successfully");
                stmt.close();
            }
            rs.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}