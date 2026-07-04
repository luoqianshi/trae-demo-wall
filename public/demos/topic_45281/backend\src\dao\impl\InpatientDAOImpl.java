package dao.impl;

import bean.Inpatient;
import dao.InpatientDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class InpatientDAOImpl implements InpatientDAO {
    @Override
    public int insert(Inpatient inpatient) {
        String sql = "INSERT INTO inpatient(inpatient_no, patient_id, patient_name, bed_id, bed_no, dept, doctor_id, doctor_name, admission_date, status, diagnosis, gender, age, deposit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, inpatient.getInpatientNo(), inpatient.getPatientId(), inpatient.getPatientName(), inpatient.getBedId(), inpatient.getBedNo(), inpatient.getDept(), inpatient.getDoctorId(), inpatient.getDoctorName(), inpatient.getAdmissionDate(), inpatient.getStatus(), inpatient.getDiagnosis(), inpatient.getGender(), inpatient.getAge(), inpatient.getDeposit());
    }

    @Override
    public int update(Inpatient inpatient) {
        String sql = "UPDATE inpatient SET inpatient_no=?, patient_id=?, patient_name=?, bed_id=?, bed_no=?, dept=?, doctor_id=?, doctor_name=?, status=?, diagnosis=?, gender=?, age=?, total_fee=?, deposit=?, remark=?, admission_date=?, discharge_date=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, inpatient.getInpatientNo(), inpatient.getPatientId(), inpatient.getPatientName(), inpatient.getBedId(), inpatient.getBedNo(), inpatient.getDept(), inpatient.getDoctorId(), inpatient.getDoctorName(), inpatient.getStatus(), inpatient.getDiagnosis(), inpatient.getGender(), inpatient.getAge(), inpatient.getTotalFee(), inpatient.getDeposit(), inpatient.getRemark(), inpatient.getAdmissionDate(), inpatient.getDischargeDate(), inpatient.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM inpatient WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Inpatient findById(int id) {
        String sql = "SELECT * FROM inpatient WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToInpatient(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Inpatient> findAll() {
        String sql = "SELECT * FROM inpatient ORDER BY admission_date DESC";
        List<Inpatient> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInpatient(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Inpatient> findByPatientId(int patientId) {
        String sql = "SELECT * FROM inpatient WHERE patient_id=? ORDER BY admission_date DESC";
        List<Inpatient> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInpatient(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Inpatient> findByDept(String dept) {
        String sql = "SELECT * FROM inpatient WHERE dept=? ORDER BY admission_date DESC";
        List<Inpatient> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInpatient(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Inpatient> findByStatus(String status) {
        String sql = "SELECT * FROM inpatient WHERE status=? ORDER BY admission_date DESC";
        List<Inpatient> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInpatient(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Inpatient mapToInpatient(java.sql.ResultSet rs) throws Exception {
        Inpatient inpatient = new Inpatient();
        inpatient.setId(rs.getInt("id"));
        try { inpatient.setInpatientNo(rs.getString("inpatient_no")); } catch (Exception e) { e.printStackTrace(); }
        inpatient.setPatientId(rs.getInt("patient_id"));
        try { inpatient.setPatientName(rs.getString("patient_name")); } catch (Exception e) { e.printStackTrace(); }
        inpatient.setBedId(rs.getInt("bed_id"));
        try { inpatient.setBedNo(rs.getString("bed_no")); } catch (Exception e) { e.printStackTrace(); }
        inpatient.setDept(rs.getString("dept"));
        inpatient.setDoctorId(rs.getInt("doctor_id"));
        try { inpatient.setDoctorName(rs.getString("doctor_name")); } catch (Exception e) { e.printStackTrace(); }
        inpatient.setAdmissionDate(rs.getTimestamp("admission_date"));
        inpatient.setDischargeDate(rs.getTimestamp("discharge_date"));
        inpatient.setStatus(rs.getString("status"));
        inpatient.setDiagnosis(rs.getString("diagnosis"));
        try { inpatient.setGender(rs.getString("gender")); } catch (Exception e) { e.printStackTrace(); }
        try { inpatient.setAge(rs.getInt("age")); } catch (Exception e) { e.printStackTrace(); }
        inpatient.setDeposit(rs.getBigDecimal("deposit"));
        inpatient.setTotalFee(rs.getBigDecimal("total_fee"));
        inpatient.setRemark(rs.getString("remark"));
        return inpatient;
    }
}

