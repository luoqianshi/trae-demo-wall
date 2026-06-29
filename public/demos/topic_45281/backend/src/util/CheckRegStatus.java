package util;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckRegStatus {
    public static void main(String[] args) {
        try {
            Connection conn = JDBCUtil.getConnection();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT id, reg_status, LENGTH(reg_status) as len FROM registration ORDER BY id DESC LIMIT 5");
            while (rs.next()) {
                int id = rs.getInt("id");
                String status = rs.getString("reg_status");
                int len = rs.getInt("len");
                System.out.println("ID=" + id + ", reg_status='" + status + "', len=" + len + ", bytes=" + (status != null ? status.getBytes("UTF-8").length : 0));
            }
            rs.close();
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}