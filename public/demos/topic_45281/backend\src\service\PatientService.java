package service;

import bean.Patient;
import dao.PatientDAO;
import dao.impl.PatientDAOImpl;
import util.JDBCUtil;
import java.util.List;

public class PatientService {
    private PatientDAO patientDAO = new PatientDAOImpl();

    public int addPatient(Patient patient) {
        return patientDAO.insert(patient);
    }

    public int updatePatient(Patient patient) {
        return patientDAO.update(patient);
    }

    public int deletePatient(int id) {
        new PatientIdentityService();
        JDBCUtil.executeUpdate("DELETE FROM patient_identity WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM appointment WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM anesthesia_records WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM vital_sign WHERE inpatient_id IN (SELECT id FROM inpatient WHERE patient_id = ?)", id);
        JDBCUtil.executeUpdate("DELETE FROM nurse_record WHERE inpatient_id IN (SELECT id FROM inpatient WHERE patient_id = ?)", id);
        JDBCUtil.executeUpdate("DELETE FROM inpatient WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM physical_exam WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM surgery WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM prescription_examination WHERE prescription_id IN (SELECT id FROM prescription WHERE patient_id = ?)", id);
        JDBCUtil.executeUpdate("DELETE FROM prescription_item WHERE prescription_id IN (SELECT id FROM prescription WHERE patient_id = ?)", id);
        JDBCUtil.executeUpdate("DELETE FROM outpatient_medical_record WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM charge WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM prescription WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM medical_record WHERE patient_id = ?", id);
        JDBCUtil.executeUpdate("DELETE FROM queue_calls WHERE registration_id IN (SELECT id FROM registration WHERE patient_id = ?)", id);
        JDBCUtil.executeUpdate("DELETE FROM registration WHERE patient_id = ?", id);
        return patientDAO.delete(id);
    }

    public Patient getPatientById(int id) {
        return patientDAO.findById(id);
    }

    public List<Patient> getAllPatients() {
        return patientDAO.findAll();
    }

    public List<Patient> searchPatients(String keyword) {
        return patientDAO.findByKeyword(keyword);
    }

    public Patient findByIdCard(String idCard) {
        if (idCard == null || idCard.trim().isEmpty()) return null;
        return patientDAO.findByIdCard(idCard.trim());
    }

    public Patient findByMedicalRecordNo(String medicalRecordNo) {
        if (medicalRecordNo == null || medicalRecordNo.trim().isEmpty()) return null;
        return patientDAO.findByMedicalRecordNo(medicalRecordNo.trim());
    }

    public boolean canDeletePatient(int id) {
        return patientDAO.canDelete(id);
    }
}
