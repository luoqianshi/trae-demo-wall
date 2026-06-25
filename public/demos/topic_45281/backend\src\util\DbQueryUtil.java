package util;

import java.sql.*;
import java.util.*;

public class DbQueryUtil {
    public static List<Map<String, Object>> executeQuery(String sql, Object... args) {
        List<Map<String, Object>> result = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, args)) {
            if (qr != null) {
                ResultSetMetaData meta = qr.getResultSet().getMetaData();
                int colCount = meta.getColumnCount();
                while (qr.getResultSet().next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= colCount; i++) {
                        row.put(meta.getColumnLabel(i), qr.getResultSet().getObject(i));
                    }
                    result.add(row);
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return result;
    }
}