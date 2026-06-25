package util;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestInsertChinese {
    public static void main(String[] args) {
        try {
            Connection conn = JDBCUtil.getConnection();
            
            // Test direct insert
            String testStr = "已挂号";
            System.out.println("Test string: '" + testStr + "', bytes: " + testStr.getBytes("UTF-8").length);
            
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("INSERT INTO registration(patient_id, patient_name, doctor_id, doctor_name, dept, reg_fee, reg_status, queue_no, reg_time) VALUES (41, 'Test', 2, 'Test', '外科', 50, '已挂号', 'QTEST', NOW())");
            stmt.close();
            
            // Check the inserted data
            stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT id, reg_status, HEX(reg_status) as hex_status, LENGTH(reg_status) as len FROM registration WHERE queue_no='QTEST'");
            if (rs.next()) {
                String hex = rs.getString("hex_status");
                int len = rs.getInt("len");
                System.out.println("ID=" + rs.getInt("id") + ", hex=" + hex + ", len=" + len);
                // E5 B7 B2 E6 8C 82 E5 8F B7 = 已挂号 in UTF-8
                System.out.println("Expected hex: E5B7B2E68C82E58FB7");
                System.out.println("Match: " + "E5B7B2E68C82E58FB7".equalsIgnoreCase(hex));
            }
            rs.close();
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}