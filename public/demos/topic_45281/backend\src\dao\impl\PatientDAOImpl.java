package dao.impl;

import util.JDBCUtil;
import bean.Patient;
import dao.PatientDAO;
import java.util.ArrayList;
import java.util.List;

public class PatientDAOImpl implements PatientDAO {
    @Override
    public int insert(Patient patient) {
        String sql = "INSERT INTO patient(hospital_id, medical_record_no, outpatient_no, inpatient_no, name, gender, age, birth_date, id_card, phone, address, occupation, marital_status, insurance_type, medical_insurance_no, contract_unit, insurance_self_ratio, emergency_contact, emergency_phone, allergy_history, drug_adverse_history, infectious_disease_history, special_disease_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql,
            patient.getHospitalId(),
            patient.getMedicalRecordNo(),
            patient.getOutpatientNo(),
            patient.getInpatientNo(),
            patient.getName(),
            patient.getGender(),
            patient.getAge(),
            patient.getBirthDate(),
            patient.getIdCard(),
            patient.getPhone(),
            patient.getAddress(),
            patient.getOccupation(),
            patient.getMaritalStatus(),
            patient.getInsuranceType(),
            patient.getMedicalInsuranceNo(),
            patient.getContractUnit(),
            patient.getInsuranceSelfRatio(),
            patient.getEmergencyContact(),
            patient.getEmergencyPhone(),
            patient.getAllergyHistory(),
            patient.getDrugAdverseHistory(),
            patient.getInfectiousDiseaseHistory(),
            patient.getSpecialDiseaseFlag()
        );
    }

    @Override
    public int update(Patient patient) {
        String sql = "UPDATE patient SET hospital_id=?, medical_record_no=?, outpatient_no=?, inpatient_no=?, name=?, gender=?, age=?, birth_date=?, id_card=?, phone=?, address=?, occupation=?, marital_status=?, insurance_type=?, medical_insurance_no=?, contract_unit=?, insurance_self_ratio=?, emergency_contact=?, emergency_phone=?, allergy_history=?, drug_adverse_history=?, infectious_disease_history=?, special_disease_flag=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql,
            patient.getHospitalId(),
            patient.getMedicalRecordNo(),
            patient.getOutpatientNo(),
            patient.getInpatientNo(),
            patient.getName(),
            patient.getGender(),
            patient.getAge(),
            patient.getBirthDate(),
            patient.getIdCard(),
            patient.getPhone(),
            patient.getAddress(),
            patient.getOccupation(),
            patient.getMaritalStatus(),
            patient.getInsuranceType(),
            patient.getMedicalInsuranceNo(),
            patient.getContractUnit(),
            patient.getInsuranceSelfRatio(),
            patient.getEmergencyContact(),
            patient.getEmergencyPhone(),
            patient.getAllergyHistory(),
            patient.getDrugAdverseHistory(),
            patient.getInfectiousDiseaseHistory(),
            patient.getSpecialDiseaseFlag(),
            patient.getId()
        );
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM patient WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Patient findById(int id) {
        String sql = "SELECT * FROM patient WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPatient(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Patient> findAll() {
        String sql = "SELECT * FROM patient ORDER BY id DESC";
        List<Patient> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPatient(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Patient> findByKeyword(String keyword) {
        String sql = "SELECT * FROM patient WHERE name LIKE ? OR phone LIKE ? OR medical_record_no LIKE ? OR id_card LIKE ? OR outpatient_no LIKE ? OR hospital_id LIKE ?";
        List<Patient> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql,
            "%" + keyword + "%", "%" + keyword + "%", "%" + keyword + "%", "%" + keyword + "%", "%" + keyword + "%", "%" + keyword + "%")) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPatient(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public Patient findByIdCard(String idCard) {
        String sql = "SELECT * FROM patient WHERE id_card = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, idCard)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPatient(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Patient findByMedicalRecordNo(String medicalRecordNo) {
        String sql = "SELECT * FROM patient WHERE medical_record_no = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, medicalRecordNo)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPatient(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public boolean canDelete(int id) {
        String sql = "SELECT COUNT(*) FROM medical_record WHERE patient_id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return qr.getResultSet().getInt(1) == 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private Patient mapToPatient(java.sql.ResultSet rs) throws Exception {
        Patient patient = new Patient();
        patient.setId(rs.getInt("id"));
        patient.setHospitalId(rs.getString("hospital_id"));
        patient.setMedicalRecordNo(rs.getString("medical_record_no"));
        patient.setOutpatientNo(rs.getString("outpatient_no"));
        patient.setInpatientNo(rs.getString("inpatient_no"));
        patient.setName(rs.getString("name"));
        patient.setGender(rs.getString("gender"));
        patient.setAge(rs.getInt("age"));
        patient.setBirthDate(rs.getDate("birth_date"));
        patient.setIdCard(rs.getString("id_card"));
        patient.setPhone(rs.getString("phone"));
        patient.setAddress(rs.getString("address"));
        patient.setOccupation(rs.getString("occupation"));
        patient.setMaritalStatus(rs.getString("marital_status"));
        patient.setInsuranceType(rs.getString("insurance_type"));
        patient.setMedicalInsuranceNo(rs.getString("medical_insurance_no"));
        patient.setContractUnit(rs.getString("contract_unit"));
        java.math.BigDecimal ratio = rs.getBigDecimal("insurance_self_ratio");
        patient.setInsuranceSelfRatio(ratio);
        patient.setEmergencyContact(rs.getString("emergency_contact"));
        patient.setEmergencyPhone(rs.getString("emergency_phone"));
        patient.setAllergyHistory(rs.getString("allergy_history"));
        patient.setDrugAdverseHistory(rs.getString("drug_adverse_history"));
        patient.setInfectiousDiseaseHistory(rs.getString("infectious_disease_history"));
        patient.setSpecialDiseaseFlag(rs.getInt("special_disease_flag"));
        patient.setCreateTime(rs.getTimestamp("create_time"));
        patient.setUpdateTime(rs.getTimestamp("update_time"));
        return patient;
    }
}
