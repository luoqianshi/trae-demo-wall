package util;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckTableEncoding {
    public static void main(String[] args) {
        try {
            Connection conn = JDBCUtil.getConnection();
            Statement stmt = conn.createStatement();
            
            // Check table charset
            ResultSet rs = stmt.executeQuery("SHOW CREATE TABLE registration");
            if (rs.next()) {
                System.out.println("registration table:");
                System.out.println(rs.getString(2));
            }
            rs.close();
            
            // Check column charset
            rs = stmt.executeQuery("SELECT CHARACTER_SET_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='hospital_db' AND TABLE_NAME='registration' AND COLUMN_NAME='reg_status'");
            if (rs.next()) {
                System.out.println("reg_status column: charset=" + rs.getString(1) + ", collation=" + rs.getString(2));
            }
            rs.close();
            
            // Check DB charset
            rs = stmt.executeQuery("SELECT @@character_set_database, @@collation_database");
            if (rs.next()) {
                System.out.println("DB charset: " + rs.getString(1) + ", collation: " + rs.getString(2));
            }
            rs.close();
            
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}