package service;

import bean.Patient;
import bean.PatientIdentity;
import dao.impl.PatientIdentityDAOImpl;
import util.JDBCUtil;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class PatientIdentityService {
    private final PatientIdentityDAOImpl dao = new PatientIdentityDAOImpl();
    private final PatientService patientService = new PatientService();

    public PatientIdentityService() {
        ensureTables();
    }

    public void syncFromPatient(Patient patient) {
        if (patient == null || patient.getId() <= 0) return;
        JDBCUtil.executeUpdate("DELETE FROM patient_identity WHERE patient_id=?", patient.getId());
        upsertIfPresent(patient.getId(), "hospital_id", patient.getHospitalId(), 1);
        upsertIfPresent(patient.getId(), "medical_record_no", patient.getMedicalRecordNo(), 1);
        upsertIfPresent(patient.getId(), "id_card", patient.getIdCard(), 1);
        upsertIfPresent(patient.getId(), "phone", patient.getPhone(), 0);
        upsertIfPresent(patient.getId(), "medical_insurance_no", patient.getMedicalInsuranceNo(), 0);
        upsertIfPresent(patient.getId(), "outpatient_no", patient.getOutpatientNo(), 0);
        upsertIfPresent(patient.getId(), "inpatient_no", patient.getInpatientNo(), 0);
    }

    public List<PatientIdentity> getByPatient(long patientId) {
        return dao.findByPatientId(patientId);
    }

    public List<Map<String, Object>> findDuplicates(String idCard, String phone, String medicalInsuranceNo, String medicalRecordNo, Long excludePatientId) {
        Map<Long, Map<String, Object>> found = new LinkedHashMap<>();
        collect(found, "id_card", idCard, excludePatientId);
        collect(found, "phone", phone, excludePatientId);
        collect(found, "medical_insurance_no", medicalInsuranceNo, excludePatientId);
        collect(found, "medical_record_no", medicalRecordNo, excludePatientId);
        collectDirect(found, "id_card", idCard, excludePatientId);
        collectDirect(found, "phone", phone, excludePatientId);
        collectDirect(found, "medical_insurance_no", medicalInsuranceNo, excludePatientId);
        collectDirect(found, "medical_record_no", medicalRecordNo, excludePatientId);
        return new ArrayList<>(found.values());
    }

    public void rebuildForAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        for (Patient patient : patients) syncFromPatient(patient);
    }

    private void collect(Map<Long, Map<String, Object>> found, String type, String value, Long excludePatientId) {
        if (value == null || value.trim().isEmpty()) return;
        List<PatientIdentity> matches = dao.findByIdentity(type, value.trim());
        for (PatientIdentity identity : matches) {
            if (excludePatientId != null && identity.getPatientId() == excludePatientId) continue;
            Patient patient = patientService.getPatientById((int) identity.getPatientId());
            if (patient == null) continue;
            Map<String, Object> row = found.get(identity.getPatientId());
            if (row == null) {
                row = new LinkedHashMap<>();
                row.put("patient", patient);
                row.put("matchedIdentities", new ArrayList<Map<String, Object>>());
                found.put(identity.getPatientId(), row);
            }
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> identities = (List<Map<String, Object>>) row.get("matchedIdentities");
            addMatchedIdentity(identities, identity.getIdentityType(), identity.getIdentityNo());
        }
    }

    private void collectDirect(Map<Long, Map<String, Object>> found, String column, String value, Long excludePatientId) {
        if (value == null || value.trim().isEmpty()) return;
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(
            "SELECT id FROM patient WHERE " + column + "=? ORDER BY id DESC LIMIT 10",
            value.trim()
        );
        try {
            if (qr != null) {
                java.sql.ResultSet rs = qr.getResultSet();
                while (rs.next()) {
                    long patientId = rs.getLong("id");
                    if (excludePatientId != null && patientId == excludePatientId) continue;
                    Patient patient = patientService.getPatientById((int) patientId);
                    if (patient == null) continue;
                    Map<String, Object> row = found.get(patientId);
                    if (row == null) {
                        row = new LinkedHashMap<>();
                        row.put("patient", patient);
                        row.put("matchedIdentities", new ArrayList<Map<String, Object>>());
                        found.put(patientId, row);
                    }
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> identities = (List<Map<String, Object>>) row.get("matchedIdentities");
                    addMatchedIdentity(identities, column, value.trim());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
    }

    private void upsertIfPresent(long patientId, String type, String no, int primaryFlag) {
        if (no == null || no.trim().isEmpty()) return;
        PatientIdentity identity = new PatientIdentity();
        identity.setPatientId(patientId);
        identity.setIdentityType(type);
        identity.setIdentityNo(no.trim());
        identity.setVerified("id_card".equals(type) ? 1 : 0);
        identity.setPrimaryFlag(primaryFlag);
        identity.setStatus("active");
        identity.setSource("his");
        dao.upsert(identity);
    }

    private void addMatchedIdentity(List<Map<String, Object>> identities, String type, String no) {
        for (Map<String, Object> existing : identities) {
            if (type.equals(existing.get("identityType")) && no.equals(existing.get("identityNo"))) {
                return;
            }
        }
        Map<String, Object> match = new LinkedHashMap<>();
        match.put("identityType", type);
        match.put("identityNo", no);
        identities.add(match);
    }

    private void ensureTables() {
        JDBCUtil.executeUpdate(
            "CREATE TABLE IF NOT EXISTS patient_identity (" +
            "id BIGINT PRIMARY KEY AUTO_INCREMENT," +
            "patient_id BIGINT NOT NULL," +
            "identity_type VARCHAR(50) NOT NULL," +
            "identity_no VARCHAR(100) NOT NULL," +
            "verified TINYINT DEFAULT 0," +
            "primary_flag TINYINT DEFAULT 0," +
            "status VARCHAR(30) DEFAULT 'active'," +
            "source VARCHAR(50) DEFAULT 'his'," +
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
            "UNIQUE KEY uk_patient_identity (patient_id, identity_type, identity_no)," +
            "INDEX idx_identity_patient (patient_id)," +
            "INDEX idx_identity_no (identity_no)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        migrateLegacyUniqueIndex();
        JDBCUtil.executeUpdate(
            "CREATE TABLE IF NOT EXISTS patient_merge_log (" +
            "id BIGINT PRIMARY KEY AUTO_INCREMENT," +
            "source_patient_id BIGINT NOT NULL," +
            "target_patient_id BIGINT NOT NULL," +
            "operator_id BIGINT," +
            "operator_name VARCHAR(100)," +
            "reason VARCHAR(500)," +
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "INDEX idx_merge_source (source_patient_id)," +
            "INDEX idx_merge_target (target_patient_id)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    private void migrateLegacyUniqueIndex() {
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(
            "SELECT COUNT(*) FROM information_schema.statistics " +
            "WHERE table_schema=DATABASE() AND table_name='patient_identity' AND index_name='uk_patient_identity' " +
            "AND column_name='patient_id'"
        );
        boolean hasPatientScopedIndex = false;
        try {
            if (qr != null && qr.getResultSet().next()) {
                hasPatientScopedIndex = qr.getResultSet().getInt(1) > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        if (!hasPatientScopedIndex) {
            JDBCUtil.executeUpdate("ALTER TABLE patient_identity DROP INDEX uk_patient_identity");
            JDBCUtil.executeUpdate("ALTER TABLE patient_identity ADD UNIQUE KEY uk_patient_identity (patient_id, identity_type, identity_no)");
        }
    }
}
