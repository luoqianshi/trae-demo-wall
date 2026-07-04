package dao.impl;

import util.JDBCUtil;
import bean.MedicalRecord;
import dao.MedicalRecordDAO;
import java.util.ArrayList;
import java.util.List;

public class MedicalRecordDAOImpl implements MedicalRecordDAO {
    @Override
    public int insert(MedicalRecord record) {
        String sql = "INSERT INTO medical_record(patient_id, doctor_id, registration_id, chief_complaint, present_illness, past_history, physical_exam, diagnosis, treatment_plan, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, record.getPatientId(), record.getDoctorId(), record.getRegistrationId(), record.getChiefComplaint(), record.getPresentIllness(), record.getPastHistory(), record.getPhysicalExam(), record.getDiagnosis(), record.getTreatmentPlan(), record.getContent());
    }

    @Override
    public int update(MedicalRecord record) {
        String sql = "UPDATE medical_record SET chief_complaint = ?, present_illness = ?, past_history = ?, physical_exam = ?, diagnosis = ?, treatment_plan = ?, content = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, record.getChiefComplaint(), record.getPresentIllness(), record.getPastHistory(), record.getPhysicalExam(), record.getDiagnosis(), record.getTreatmentPlan(), record.getContent(), record.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM medical_record WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public MedicalRecord findById(int id) {
        String sql = "SELECT * FROM medical_record WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToRecord(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<MedicalRecord> findAll() {
        String sql = "SELECT * FROM medical_record";
        List<MedicalRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRecord(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<MedicalRecord> findByPatientId(int patientId) {
        String sql = "SELECT * FROM medical_record WHERE patient_id = ?";
        List<MedicalRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRecord(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<MedicalRecord> findByDoctorId(int doctorId) {
        String sql = "SELECT * FROM medical_record WHERE doctor_id = ?";
        List<MedicalRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, doctorId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToRecord(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private MedicalRecord mapToRecord(java.sql.ResultSet rs) throws Exception {
        MedicalRecord record = new MedicalRecord();
        record.setId(rs.getInt("id"));
        record.setPatientId(rs.getInt("patient_id"));
        record.setDoctorId(rs.getInt("doctor_id"));
        record.setRegistrationId(rs.getInt("registration_id"));
        record.setChiefComplaint(rs.getString("chief_complaint"));
        record.setPresentIllness(rs.getString("present_illness"));
        record.setPastHistory(rs.getString("past_history"));
        record.setPhysicalExam(rs.getString("physical_exam"));
        record.setDiagnosis(rs.getString("diagnosis"));
        record.setTreatmentPlan(rs.getString("treatment_plan"));
        record.setContent(rs.getString("content"));
        record.setCreateTime(rs.getTimestamp("create_time"));
        record.setUpdateTime(rs.getTimestamp("update_time"));
        return record;
    }
}
