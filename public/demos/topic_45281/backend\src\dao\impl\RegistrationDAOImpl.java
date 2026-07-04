package dao.impl;

import util.JDBCUtil;
import bean.Registration;
import dao.RegistrationDAO;
import java.util.ArrayList;
import java.util.List;

public class RegistrationDAOImpl implements RegistrationDAO {
    @Override
    public int insert(Registration registration) {
        String sql = "INSERT INTO registration(patient_id, patient_name, doctor_id, doctor_name, dept, reg_fee, reg_status, queue_no, reg_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, registration.getPatientId(), registration.getPatientName(), registration.getDoctorId(), registration.getDoctorName(), registration.getDept(), registration.getRegFee(), registration.getRegStatus(), registration.getQueueNo(), registration.getRegTime());
    }

    @Override
    public int update(Registration registration) {
        String sql = "UPDATE registration SET patient_name=?, doctor_name=?, reg_status=?, dept=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, registration.getPatientName(), registration.getDoctorName(), registration.getRegStatus(), registration.getDept(), registration.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM registration WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Registration findById(int id) {
        String sql = "SELECT * FROM registration WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToRegistration(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Registration> findAll() {
        String sql = "SELECT * FROM registration";
        List<Registration> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRegistration(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Registration> findByPatientId(int patientId) {
        String sql = "SELECT * FROM registration WHERE patient_id = ?";
        List<Registration> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRegistration(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Registration> findByDoctorId(int doctorId) {
        String sql = "SELECT * FROM registration WHERE doctor_id = ?";
        List<Registration> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, doctorId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRegistration(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Registration> findByDept(String dept) {
        String sql = "SELECT * FROM registration WHERE dept = ?";
        List<Registration> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRegistration(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int countByDept(String dept) {
        String sql = "SELECT COUNT(*) FROM registration WHERE dept = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null && qr.getResultSet().next()) {
                return qr.getResultSet().getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public List<Registration> findByStatus(String status) {
        String sql = "SELECT * FROM registration WHERE reg_status = ?";
        List<Registration> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRegistration(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Registration mapToRegistration(java.sql.ResultSet rs) throws Exception {
        Registration registration = new Registration();
        registration.setId(rs.getInt("id"));
        registration.setPatientId(rs.getInt("patient_id"));
        try { registration.setPatientName(rs.getString("patient_name")); } catch (Exception e) { e.printStackTrace(); }
        registration.setDoctorId(rs.getInt("doctor_id"));
        try { registration.setDoctorName(rs.getString("doctor_name")); } catch (Exception e) { e.printStackTrace(); }
        registration.setDept(rs.getString("dept"));
        registration.setRegTime(rs.getTimestamp("reg_time"));
        registration.setRegFee(rs.getBigDecimal("reg_fee"));
        registration.setRegStatus(rs.getString("reg_status"));
        registration.setQueueNo(rs.getString("queue_no"));
        registration.setCreateTime(rs.getTimestamp("reg_time"));
        try { registration.setMedicalRecordNo(rs.getString("medical_record_no")); } catch (Exception e) { /* column may not exist */ }
        return registration;
    }
}

