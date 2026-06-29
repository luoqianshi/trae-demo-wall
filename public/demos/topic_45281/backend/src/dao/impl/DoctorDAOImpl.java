package dao.impl;

import util.JDBCUtil;
import bean.Doctor;
import dao.DoctorDAO;
import java.util.ArrayList;
import java.util.List;

public class DoctorDAOImpl implements DoctorDAO {
    @Override
    public int insert(Doctor doctor) {
        String sql = "INSERT INTO doctor(work_no, name, dept, department_id, title, role) VALUES (?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, doctor.getWorkNo(), doctor.getName(), doctor.getDept(), doctor.getDepartmentId(), doctor.getTitle(), doctor.getRole());
    }

    @Override
    public int update(Doctor doctor) {
        String sql = "UPDATE doctor SET work_no = ?, name = ?, dept = ?, department_id = ?, title = ?, role = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, doctor.getWorkNo(), doctor.getName(), doctor.getDept(), doctor.getDepartmentId(), doctor.getTitle(), doctor.getRole(), doctor.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM doctor WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Doctor findById(int id) {
        String sql = "SELECT * FROM doctor WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToDoctor(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Doctor> findAll() {
        String sql = "SELECT * FROM doctor";
        List<Doctor> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDoctor(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Doctor> findByDept(String dept) {
        String sql = "SELECT * FROM doctor WHERE dept = ?";
        List<Doctor> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDoctor(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Doctor> findByKeyword(String keyword) {
        String sql = "SELECT * FROM doctor WHERE name LIKE ? OR dept LIKE ? OR title LIKE ? OR work_no LIKE ?";
        List<Doctor> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, "%" + keyword + "%", "%" + keyword + "%", "%" + keyword + "%", "%" + keyword + "%")) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDoctor(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public Doctor findByWorkNo(String workNo) {
        String sql = "SELECT * FROM doctor WHERE work_no = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, workNo)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToDoctor(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private Doctor mapToDoctor(java.sql.ResultSet rs) throws Exception {
        Doctor doctor = new Doctor();
        doctor.setId(rs.getInt("id"));
        doctor.setWorkNo(rs.getString("work_no"));
        doctor.setName(rs.getString("name"));
        doctor.setDept(rs.getString("dept"));
        Object deptIdObj = rs.getObject("department_id");
        if (deptIdObj != null) doctor.setDepartmentId(((Number) deptIdObj).intValue());
        doctor.setTitle(rs.getString("title"));
        doctor.setRole(rs.getString("role"));
        doctor.setCreateTime(rs.getTimestamp("create_time"));
        return doctor;
    }
}
