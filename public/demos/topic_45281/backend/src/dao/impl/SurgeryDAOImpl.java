package dao.impl;

import bean.Surgery;
import dao.SurgeryDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class SurgeryDAOImpl implements SurgeryDAO {
    @Override
    public int insert(Surgery surgery) {
        String sql = "INSERT INTO surgery(patient_id, patient_name, surgery_name, surgery_type, dept, doctor_id, doctor_name, surgery_room, surgery_time, surgery_date, surgeon_name, anesthesia_type, anesthesia_doctor, status, diagnosis, remark, duration, surgery_fee, anesthesia_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, surgery.getPatientId(), surgery.getPatientName(), surgery.getSurgeryName(), surgery.getSurgeryType(), surgery.getDept(), surgery.getDoctorId(), surgery.getDoctorName(), surgery.getSurgeryRoom(), surgery.getSurgeryTime(), surgery.getSurgeryDate(), surgery.getSurgeonName(), surgery.getAnesthesiaType(), surgery.getAnesthesiaDoctor(), surgery.getStatus(), surgery.getDiagnosis(), surgery.getRemark(), surgery.getDuration(), surgery.getSurgeryFee(), surgery.getAnesthesiaFee());
    }

    @Override
    public int update(Surgery surgery) {
        String sql = "UPDATE surgery SET patient_id=?, patient_name=?, surgery_name=?, surgery_type=?, dept=?, doctor_id=?, doctor_name=?, surgery_room=?, surgery_time=?, surgery_date=?, surgeon_name=?, anesthesia_type=?, anesthesia_doctor=?, status=?, diagnosis=?, remark=?, duration=?, surgery_fee=?, anesthesia_fee=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, surgery.getPatientId(), surgery.getPatientName(), surgery.getSurgeryName(), surgery.getSurgeryType(), surgery.getDept(), surgery.getDoctorId(), surgery.getDoctorName(), surgery.getSurgeryRoom(), surgery.getSurgeryTime(), surgery.getSurgeryDate(), surgery.getSurgeonName(), surgery.getAnesthesiaType(), surgery.getAnesthesiaDoctor(), surgery.getStatus(), surgery.getDiagnosis(), surgery.getRemark(), surgery.getDuration(), surgery.getSurgeryFee(), surgery.getAnesthesiaFee(), surgery.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM surgery WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Surgery findById(int id) {
        String sql = "SELECT * FROM surgery WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToSurgery(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Surgery> findAll() {
        String sql = "SELECT * FROM surgery ORDER BY surgery_time DESC";
        List<Surgery> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToSurgery(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Surgery> findByPatientId(int patientId) {
        String sql = "SELECT * FROM surgery WHERE patient_id=? ORDER BY surgery_time DESC";
        List<Surgery> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToSurgery(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Surgery> findByStatus(String status) {
        String sql = "SELECT * FROM surgery WHERE status=? ORDER BY surgery_time DESC";
        List<Surgery> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToSurgery(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Surgery> findByDept(String dept) {
        String sql = "SELECT * FROM surgery WHERE dept=? ORDER BY surgery_time DESC";
        List<Surgery> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToSurgery(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Surgery mapToSurgery(java.sql.ResultSet rs) throws Exception {
        Surgery s = new Surgery();
        s.setId(rs.getInt("id"));
        s.setPatientId(rs.getInt("patient_id"));
        s.setPatientName(rs.getString("patient_name"));
        s.setSurgeryName(rs.getString("surgery_name"));
        s.setSurgeryType(rs.getString("surgery_type"));
        s.setDept(rs.getString("dept"));
        s.setDoctorId(rs.getInt("doctor_id"));
        s.setDoctorName(rs.getString("doctor_name"));
        s.setSurgeryRoom(rs.getString("surgery_room"));
        s.setSurgeryTime(rs.getTimestamp("surgery_time"));
        s.setSurgeryDate(rs.getDate("surgery_date"));
        s.setSurgeonName(rs.getString("surgeon_name"));
        s.setAnesthesiaType(rs.getString("anesthesia_type"));
        s.setAnesthesiaDoctor(rs.getString("anesthesia_doctor"));
        s.setStatus(rs.getString("status"));
        s.setDiagnosis(rs.getString("diagnosis"));
        s.setRemark(rs.getString("remark"));
        s.setDuration(rs.getInt("duration"));
        s.setSurgeryFee(rs.getBigDecimal("surgery_fee"));
        s.setAnesthesiaFee(rs.getBigDecimal("anesthesia_fee"));
        try { s.setCreateTime(rs.getTimestamp("create_time")); } catch (Exception e) { e.printStackTrace(); }
        return s;
    }
}

