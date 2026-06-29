package dao.impl;

import bean.PharmacyWindow;
import dao.PharmacyWindowDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PharmacyWindowDAOImpl implements PharmacyWindowDAO {

    @Override public int insert(PharmacyWindow w) {
        return JDBCUtil.executeInsert("INSERT INTO pharmacy_window(window_no,window_name,window_type,dept_id,dept_name,location_desc,is_active) VALUES(?,?,?,?,?,?,1)",
            w.getWindowNo(), w.getWindowName(), w.getWindowType(), w.getDeptId(), w.getDeptName(), w.getLocationDesc());
    }
    @Override public List<PharmacyWindow> findAll(String type) {
        String sql = "SELECT * FROM pharmacy_window WHERE is_active=1";
        List<Object> args = new ArrayList<>();
        if (type != null && !type.isEmpty()) { sql += " AND window_type=?"; args.add(type); }
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("UPDATE pharmacy_window SET is_active=0 WHERE id=?", id);
    }

    private List<PharmacyWindow> queryList(String sql, Object... params) {
        List<PharmacyWindow> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private PharmacyWindow mapRow(ResultSet rs) throws SQLException {
        PharmacyWindow w = new PharmacyWindow();
        w.setId(rs.getInt("id")); w.setWindowNo(rs.getString("window_no")); w.setWindowName(rs.getString("window_name"));
        w.setWindowType(rs.getString("window_type")); w.setDeptId(rs.getInt("dept_id")); w.setDeptName(rs.getString("dept_name"));
        w.setLocationDesc(rs.getString("location_desc")); w.setIsActive(rs.getInt("is_active"));
        w.setCreateTime(rs.getTimestamp("create_time"));
        return w;
    }
}