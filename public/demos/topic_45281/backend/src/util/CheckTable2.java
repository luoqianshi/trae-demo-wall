package util;

import java.sql.*;

public class CheckTable2 {
    public static void main(String[] args) {
        String[] tables = {"triage_queue", "outpatient_medical_record", "queue_call_log", "queue_display", "appointment"};
        try {
            Connection conn = JDBCUtil.getConnection();
            DatabaseMetaData meta = conn.getMetaData();
            for (String table : tables) {
                ResultSet rs = meta.getTables(null, null, table, null);
                System.out.println(table + ": " + (rs.next() ? "EXISTS" : "NOT FOUND"));
                rs.close();
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}