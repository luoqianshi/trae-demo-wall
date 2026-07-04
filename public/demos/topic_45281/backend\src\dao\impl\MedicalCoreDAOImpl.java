package dao.impl;
import bean.*;
import dao.*;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class MedicalCoreDAOImpl implements
    OutpatientMedicalRecordDAO, PrescriptionEnhancedDAO, InpatientOrderDAO,
    NursingRecordDAO, MedicalQualityControlDAO {

    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet, T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) {
                    T item = mapper.apply(rs);
                    if (item != null) {
                        list.add(item);
                    }
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(OutpatientMedicalRecord r) {
        return JDBCUtil.executeInsert("INSERT INTO outpatient_medical_record(patient_id,patient_name,medical_record_no,visit_no,doctor_id,doctor_name,dept_id,dept_name,visit_date,visit_type,chief_complaint,present_illness_history,past_history,personal_history,family_history,allergy_history,physical_exam,auxiliary_exam,diagnosis,icd_code,treatment_plan,advice,next_visit_date,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            r.getPatientId(), r.getPatientName(), r.getMedicalRecordNo(), r.getVisitNo(), r.getDoctorId(), r.getDoctorName(),
            r.getDeptId(), r.getDeptName(), r.getVisitDate(), r.getVisitType() != null ? r.getVisitType() : "初诊",
            r.getChiefComplaint(), r.getPresentIllnessHistory(), r.getPastHistory(), r.getPersonalHistory(),
            r.getFamilyHistory(), r.getAllergyHistory(), r.getPhysicalExam(), r.getAuxiliaryExam(),
            r.getDiagnosis(), r.getIcdCode(), r.getTreatmentPlan(), r.getAdvice(), r.getNextVisitDate(),
            r.getStatus() != null ? r.getStatus() : "进行中");
    }
    @Override public int update(OutpatientMedicalRecord r) {
        return JDBCUtil.executeUpdate("UPDATE outpatient_medical_record SET chief_complaint=?,present_illness_history=?,past_history=?,personal_history=?,family_history=?,allergy_history=?,physical_exam=?,auxiliary_exam=?,diagnosis=?,icd_code=?,treatment_plan=?,advice=?,next_visit_date=?,status=? WHERE id=?",
            r.getChiefComplaint(), r.getPresentIllnessHistory(), r.getPastHistory(), r.getPersonalHistory(),
            r.getFamilyHistory(), r.getAllergyHistory(), r.getPhysicalExam(), r.getAuxiliaryExam(),
            r.getDiagnosis(), r.getIcdCode(), r.getTreatmentPlan(), r.getAdvice(), r.getNextVisitDate(),
            r.getStatus(), r.getId());
    }
    @Override public OutpatientMedicalRecord findById(int id) {
        List<OutpatientMedicalRecord> list = queryList("SELECT * FROM outpatient_medical_record WHERE id=?", this::mapOMR, id);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<OutpatientMedicalRecord> findByPatientId(int patientId) {
        return queryList("SELECT * FROM outpatient_medical_record WHERE patient_id=? ORDER BY visit_date DESC", this::mapOMR, patientId);
    }
    @Override public List<OutpatientMedicalRecord> findByDoctorId(int doctorId) {
        return queryList("SELECT * FROM outpatient_medical_record WHERE doctor_id=? ORDER BY visit_date DESC", this::mapOMR, doctorId);
    }
    @Override public List<OutpatientMedicalRecord> findAll(String status, int page, int size) {
        String sql = "SELECT * FROM outpatient_medical_record";
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) { sql += " WHERE status=?"; params.add(status); }
        sql += " ORDER BY visit_date DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapOMR, params.toArray());
    }

    @Override public int insert(PrescriptionEnhanced p) {
        return JDBCUtil.executeInsert("INSERT INTO prescription_enhanced(prescription_no,patient_id,patient_name,medical_record_no,visit_no,doctor_id,doctor_name,dept_id,dept_name,prescription_type,diagnosis,prescription_date,total_amount,status,is_emergency,is_chronic,valid_days) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            p.getPrescriptionNo(), p.getPatientId(), p.getPatientName(), p.getMedicalRecordNo(),
            p.getVisitNo(), p.getDoctorId(), p.getDoctorName(), p.getDeptId(), p.getDeptName(),
            p.getPrescriptionType() != null ? p.getPrescriptionType() : "西药", p.getDiagnosis(),
            p.getPrescriptionDate(), p.getTotalAmount(), p.getStatus() != null ? p.getStatus() : "待审核",
            p.getIsEmergency(), p.getIsChronic(), p.getValidDays());
    }
    @Override public int update(PrescriptionEnhanced p) {
        return JDBCUtil.executeUpdate("UPDATE prescription_enhanced SET status=?,reviewer_id=?,reviewer_name=?,review_time=?,review_opinion=?,dispenser_id=?,dispenser_name=?,dispense_time=?,total_amount=? WHERE id=?",
            p.getStatus(), p.getReviewerId(), p.getReviewerName(), p.getReviewTime(), p.getReviewOpinion(),
            p.getDispenserId(), p.getDispenserName(), p.getDispenseTime(), p.getTotalAmount(), p.getId());
    }
    @Override public PrescriptionEnhanced findByPrescriptionNo(String no) {
        List<PrescriptionEnhanced> list = queryList("SELECT * FROM prescription_enhanced WHERE prescription_no=?", this::mapPE, no);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<PrescriptionEnhanced> findPrescriptionsByPatientId(int patientId) {
        return queryList("SELECT * FROM prescription_enhanced WHERE patient_id=? ORDER BY prescription_date DESC", this::mapPE, patientId);
    }
    @Override public List<PrescriptionEnhanced> findAllPrescriptions(String status, int page, int size) {
        String sql = "SELECT * FROM prescription_enhanced";
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) { sql += " WHERE status=?"; params.add(status); }
        sql += " ORDER BY prescription_date DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapPE, params.toArray());
    }

    @Override public int insert(InpatientOrder o) {
        return JDBCUtil.executeInsert("INSERT INTO inpatient_order(inpatient_id,patient_id,patient_name,admission_no,bed_no,order_group_no,order_type,category,order_content,drug_id,drug_name,dosage,dosage_unit,frequency,route,quantity,unit,start_time,stop_time,stop_doctor_id,stop_doctor_name,stop_reason,doctor_id,doctor_name,nurse_id,nurse_name,execute_time,status,reviewer_id,reviewer_name,review_time,priority,is_prn,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            o.getInpatientId(), o.getPatientId(), o.getPatientName(), o.getAdmissionNo(), o.getBedNo(),
            o.getOrderGroupNo(), o.getOrderType(), o.getCategory(), o.getOrderContent(),
            o.getDrugId(), o.getDrugName(), o.getDosage(), o.getDosageUnit(), o.getFrequency(),
            o.getRoute(), o.getQuantity(), o.getUnit(), o.getStartTime(), o.getStopTime(),
            o.getStopDoctorId(), o.getStopDoctorName(), o.getStopReason(), o.getDoctorId(),
            o.getDoctorName(), o.getNurseId(), o.getNurseName(), o.getExecuteTime(),
            o.getStatus() != null ? o.getStatus() : "待审核", o.getReviewerId(), o.getReviewerName(),
            o.getReviewTime(), o.getPriority() != null ? o.getPriority() : "普通", o.getIsPrn(), o.getRemark());
    }
    @Override public int update(InpatientOrder o) {
        return JDBCUtil.executeUpdate("UPDATE inpatient_order SET status=?,stop_time=?,stop_doctor_id=?,stop_doctor_name=?,stop_reason=?,nurse_id=?,nurse_name=?,execute_time=?,reviewer_id=?,reviewer_name=?,review_time=? WHERE id=?",
            o.getStatus(), o.getStopTime(), o.getStopDoctorId(), o.getStopDoctorName(), o.getStopReason(),
            o.getNurseId(), o.getNurseName(), o.getExecuteTime(), o.getReviewerId(), o.getReviewerName(),
            o.getReviewTime(), o.getId());
    }
    @Override public InpatientOrder findOrderById(int id) {
        List<InpatientOrder> list = queryList("SELECT * FROM inpatient_order WHERE id=?", this::mapIO, id);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<InpatientOrder> findByInpatientId(int inpatientId) {
        return queryList("SELECT * FROM inpatient_order WHERE inpatient_id=? AND status NOT IN('已停止','已作废') ORDER BY start_time DESC", this::mapIO, inpatientId);
    }
    @Override public List<InpatientOrder> findAllOrders(String type, String status, int page, int size) {
        String sql = "SELECT * FROM inpatient_order WHERE 1=1";
        List<Object> params = new ArrayList<>();
        if (type != null && !type.isEmpty()) { sql += " AND order_type=?"; params.add(type); }
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; params.add(status); }
        sql += " ORDER BY start_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapIO, params.toArray());
    }

    @Override public int insert(NursingRecord n) {
        return JDBCUtil.executeInsert("INSERT INTO nursing_record(inpatient_id,patient_id,patient_name,admission_no,bed_no,record_type,record_time,record_level,nurse_id,nurse_name,vital_signs,consciousness,diet,intake_amount,output_amount,condition_description,nursing_measures,health_education,fall_risk_score,pressure_injury_risk_score,pain_score,adl_score,signature) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            n.getInpatientId(), n.getPatientId(), n.getPatientName(), n.getAdmissionNo(), n.getBedNo(),
            n.getRecordType(), n.getRecordTime(), n.getRecordLevel() != null ? n.getRecordLevel() : "一级护理",
            n.getNurseId(), n.getNurseName(), n.getVitalSigns(), n.getConsciousness(), n.getDiet(),
            n.getIntakeAmount(), n.getOutputAmount(), n.getConditionDescription(), n.getNursingMeasures(),
            n.getHealthEducation(), n.getFallRiskScore(), n.getPressureInjuryRiskScore(),
            n.getPainScore(), n.getAdlScore(), n.getSignature());
    }
    @Override public NursingRecord findNursingById(int id) {
        List<NursingRecord> list = queryList("SELECT * FROM nursing_record WHERE id=?", this::mapNR, id);
        return list.isEmpty() ? null : list.get(0);
    }
    public int deleteNursing(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM nursing_record WHERE id=?", id);
    }
    @Override public List<NursingRecord> findByNursingInpatientId(int inpatientId) {
        return queryList("SELECT * FROM nursing_record WHERE inpatient_id=? ORDER BY record_time DESC", this::mapNR, inpatientId);
    }
    @Override public List<NursingRecord> findAllNursingRecords(String type, int page, int size) {
        String sql = "SELECT * FROM nursing_record";
        List<Object> params = new ArrayList<>();
        if (type != null && !type.isEmpty()) { sql += " WHERE record_type=?"; params.add(type); }
        sql += " ORDER BY record_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapNR, params.toArray());
    }

    @Override public int insert(MedicalQualityControl q) {
        return JDBCUtil.executeInsert("INSERT INTO medical_quality_control(qc_type,target_type,target_id,target_no,patient_id,patient_name,doctor_id,doctor_name,dept_id,dept_name,qc_item,qc_standard,actual_value,standard_value,result,score,full_score,problem_description,suggestion,qc_person_id,qc_person_name,qc_time,rectify_deadline,rectify_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            q.getQcType(), q.getTargetType(), q.getTargetId(), q.getTargetNo(), q.getPatientId(),
            q.getPatientName(), q.getDoctorId(), q.getDoctorName(), q.getDeptId(), q.getDeptName(),
            q.getQcItem(), q.getQcStandard(), q.getActualValue(), q.getStandardValue(),
            q.getResult(), q.getScore(), q.getFullScore(), q.getProblemDescription(),
            q.getSuggestion(), q.getQcPersonId(), q.getQcPersonName(), q.getQcTime(),
            q.getRectifyDeadline(), q.getRectifyStatus() != null ? q.getRectifyStatus() : "待整改");
    }
    @Override public int updateQC(MedicalQualityControl q) {
        return JDBCUtil.executeUpdate("UPDATE medical_quality_control SET result=?,score=?,problem_description=?,suggestion=?,rectify_status=?,rectify_result=?,verify_person_id=?,verify_person_name=?,verify_time=? WHERE id=?",
            q.getResult(), q.getScore(), q.getProblemDescription(), q.getSuggestion(),
            q.getRectifyStatus(), q.getRectifyResult(), q.getVerifyPersonId(), q.getVerifyPersonName(),
            q.getVerifyTime(), q.getId());
    }
    @Override public MedicalQualityControl findQCById(int id) {
        List<MedicalQualityControl> list = queryList("SELECT * FROM medical_quality_control WHERE id=?", this::mapMQC, id);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<MedicalQualityControl> findAllQCRecords(String targetType, String result, int page, int size) {
        String sql = "SELECT * FROM medical_quality_control WHERE 1=1";
        List<Object> params = new ArrayList<>();
        if (targetType != null && !targetType.isEmpty()) { sql += " AND target_type=?"; params.add(targetType); }
        if (result != null && !result.isEmpty()) { sql += " AND result=?"; params.add(result); }
        sql += " ORDER BY qc_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapMQC, params.toArray());
    }

    private OutpatientMedicalRecord mapOMR(ResultSet rs) {
        try {
            OutpatientMedicalRecord r = new OutpatientMedicalRecord();
            r.setId(rs.getInt("id")); r.setPatientId(rs.getInt("patient_id")); r.setPatientName(rs.getString("patient_name"));
            r.setMedicalRecordNo(rs.getString("medical_record_no")); r.setVisitNo(rs.getString("visit_no"));
            r.setDoctorId(rs.getInt("doctor_id")); r.setDoctorName(rs.getString("doctor_name"));
            r.setDeptId(rs.getInt("dept_id")); r.setDeptName(rs.getString("dept_name"));
            r.setVisitDate(rs.getDate("visit_date")); r.setVisitType(rs.getString("visit_type"));
            r.setChiefComplaint(rs.getString("chief_complaint")); r.setPresentIllnessHistory(rs.getString("present_illness_history"));
            r.setPastHistory(rs.getString("past_history")); r.setPersonalHistory(rs.getString("personal_history"));
            r.setFamilyHistory(rs.getString("family_history")); r.setAllergyHistory(rs.getString("allergy_history"));
            r.setPhysicalExam(rs.getString("physical_exam")); r.setAuxiliaryExam(rs.getString("auxiliary_exam"));
            r.setDiagnosis(rs.getString("diagnosis")); r.setIcdCode(rs.getString("icd_code"));
            r.setTreatmentPlan(rs.getString("treatment_plan")); r.setAdvice(rs.getString("advice"));
            r.setNextVisitDate(rs.getDate("next_visit_date")); r.setStatus(rs.getString("status"));
            r.setCreateTime(rs.getTimestamp("create_time")); r.setUpdateTime(rs.getTimestamp("update_time"));
            return r;
        } catch (SQLException e) { return null; }
    }
    private PrescriptionEnhanced mapPE(ResultSet rs) {
        try {
            PrescriptionEnhanced p = new PrescriptionEnhanced();
            p.setId(rs.getInt("id")); p.setPrescriptionNo(rs.getString("prescription_no"));
            p.setPatientId(rs.getInt("patient_id")); p.setPatientName(rs.getString("patient_name"));
            p.setMedicalRecordNo(rs.getString("medical_record_no")); p.setVisitNo(rs.getString("visit_no"));
            p.setDoctorId(rs.getInt("doctor_id")); p.setDoctorName(rs.getString("doctor_name"));
            p.setDeptId(rs.getInt("dept_id")); p.setDeptName(rs.getString("dept_name"));
            p.setPrescriptionType(rs.getString("prescription_type")); p.setDiagnosis(rs.getString("diagnosis"));
            p.setPrescriptionDate(rs.getTimestamp("prescription_date")); p.setTotalAmount(rs.getBigDecimal("total_amount"));
            p.setStatus(rs.getString("status")); p.setReviewerId(rs.getObject("reviewer_id") != null ? rs.getInt("reviewer_id") : null);
            p.setReviewerName(rs.getString("reviewer_name")); p.setReviewTime(rs.getTimestamp("review_time"));
            p.setReviewOpinion(rs.getString("review_opinion")); p.setDispenserId(rs.getObject("dispenser_id") != null ? rs.getInt("dispenser_id") : null);
            p.setDispenserName(rs.getString("dispenser_name")); p.setDispenseTime(rs.getTimestamp("dispense_time"));
            p.setIsEmergency(rs.getInt("is_emergency")); p.setIsChronic(rs.getInt("is_chronic"));
            p.setValidDays(rs.getInt("valid_days"));
            p.setCreateTime(rs.getTimestamp("create_time")); p.setUpdateTime(rs.getTimestamp("update_time"));
            return p;
        } catch (SQLException e) { return null; }
    }
    private InpatientOrder mapIO(ResultSet rs) {
        try {
            InpatientOrder o = new InpatientOrder();
            o.setId(rs.getInt("id")); o.setInpatientId(rs.getInt("inpatient_id")); o.setPatientId(rs.getInt("patient_id"));
            o.setPatientName(rs.getString("patient_name")); o.setAdmissionNo(rs.getString("admission_no"));
            o.setBedNo(rs.getString("bed_no")); o.setOrderGroupNo(rs.getString("order_group_no"));
            o.setOrderType(rs.getString("order_type")); o.setCategory(rs.getString("category"));
            o.setOrderContent(rs.getString("order_content")); o.setDrugId(rs.getObject("drug_id") != null ? rs.getInt("drug_id") : null);
            o.setDrugName(rs.getString("drug_name")); o.setDosage(rs.getString("dosage"));
            o.setDosageUnit(rs.getString("dosage_unit")); o.setFrequency(rs.getString("frequency"));
            o.setRoute(rs.getString("route")); o.setQuantity(rs.getObject("quantity") != null ? rs.getInt("quantity") : null);
            o.setUnit(rs.getString("unit")); o.setStartTime(rs.getTimestamp("start_time"));
            o.setStopTime(rs.getTimestamp("stop_time")); o.setStopDoctorId(rs.getObject("stop_doctor_id") != null ? rs.getInt("stop_doctor_id") : null);
            o.setStopDoctorName(rs.getString("stop_doctor_name")); o.setStopReason(rs.getString("stop_reason"));
            o.setDoctorId(rs.getInt("doctor_id")); o.setDoctorName(rs.getString("doctor_name"));
            o.setNurseId(rs.getObject("nurse_id") != null ? rs.getInt("nurse_id") : null);
            o.setNurseName(rs.getString("nurse_name")); o.setExecuteTime(rs.getTimestamp("execute_time"));
            o.setStatus(rs.getString("status")); o.setReviewerId(rs.getObject("reviewer_id") != null ? rs.getInt("reviewer_id") : null);
            o.setReviewerName(rs.getString("reviewer_name")); o.setReviewTime(rs.getTimestamp("review_time"));
            o.setPriority(rs.getString("priority")); o.setIsPrn(rs.getInt("is_prn"));
            o.setRemark(rs.getString("remark"));
            o.setCreateTime(rs.getTimestamp("create_time")); o.setUpdateTime(rs.getTimestamp("update_time"));
            return o;
        } catch (SQLException e) { return null; }
    }
    private NursingRecord mapNR(ResultSet rs) {
        try {
            NursingRecord n = new NursingRecord();
            n.setId(rs.getInt("id")); n.setInpatientId(rs.getInt("inpatient_id")); n.setPatientId(rs.getInt("patient_id"));
            n.setPatientName(rs.getString("patient_name")); n.setAdmissionNo(rs.getString("admission_no"));
            n.setBedNo(rs.getString("bed_no")); n.setRecordType(rs.getString("record_type"));
            n.setRecordTime(rs.getTimestamp("record_time")); n.setRecordLevel(rs.getString("record_level"));
            n.setNurseId(rs.getInt("nurse_id")); n.setNurseName(rs.getString("nurse_name"));
            n.setVitalSigns(rs.getString("vital_signs")); n.setConsciousness(rs.getString("consciousness"));
            n.setDiet(rs.getString("diet")); n.setIntakeAmount(rs.getBigDecimal("intake_amount"));
            n.setOutputAmount(rs.getBigDecimal("output_amount")); n.setConditionDescription(rs.getString("condition_description"));
            n.setNursingMeasures(rs.getString("nursing_measures")); n.setHealthEducation(rs.getString("health_education"));
            n.setFallRiskScore(rs.getObject("fall_risk_score") != null ? rs.getInt("fall_risk_score") : null);
            n.setPressureInjuryRiskScore(rs.getObject("pressure_injury_risk_score") != null ? rs.getInt("pressure_injury_risk_score") : null);
            n.setPainScore(rs.getObject("pain_score") != null ? rs.getInt("pain_score") : null);
            n.setAdlScore(rs.getObject("adl_score") != null ? rs.getInt("adl_score") : null);
            n.setSignature(rs.getString("signature")); n.setElectronicSignature(rs.getString("electronic_signature"));
            n.setCreateTime(rs.getTimestamp("create_time")); n.setUpdateTime(rs.getTimestamp("update_time"));
            return n;
        } catch (SQLException e) { return null; }
    }
    private MedicalQualityControl mapMQC(ResultSet rs) {
        try {
            MedicalQualityControl q = new MedicalQualityControl();
            q.setId(rs.getInt("id")); q.setQcType(rs.getString("qc_type")); q.setTargetType(rs.getString("target_type"));
            q.setTargetId(rs.getInt("target_id")); q.setTargetNo(rs.getString("target_no"));
            q.setPatientId(rs.getObject("patient_id") != null ? rs.getInt("patient_id") : null);
            q.setPatientName(rs.getString("patient_name")); q.setDoctorId(rs.getObject("doctor_id") != null ? rs.getInt("doctor_id") : null);
            q.setDoctorName(rs.getString("doctor_name")); q.setDeptId(rs.getObject("dept_id") != null ? rs.getInt("dept_id") : null);
            q.setDeptName(rs.getString("dept_name")); q.setQcItem(rs.getString("qc_item"));
            q.setQcStandard(rs.getString("qc_standard")); q.setActualValue(rs.getString("actual_value"));
            q.setStandardValue(rs.getString("standard_value")); q.setResult(rs.getString("result"));
            q.setScore(rs.getObject("score") != null ? rs.getInt("score") : null); q.setFullScore(rs.getInt("full_score"));
            q.setProblemDescription(rs.getString("problem_description")); q.setSuggestion(rs.getString("suggestion"));
            q.setQcPersonId(rs.getInt("qc_person_id")); q.setQcPersonName(rs.getString("qc_person_name"));
            q.setQcTime(rs.getTimestamp("qc_time")); q.setRectifyDeadline(rs.getDate("rectify_deadline"));
            q.setRectifyStatus(rs.getString("rectify_status")); q.setRectifyResult(rs.getString("rectify_result"));
            q.setVerifyPersonId(rs.getObject("verify_person_id") != null ? rs.getInt("verify_person_id") : null);
            q.setVerifyPersonName(rs.getString("verify_person_name")); q.setVerifyTime(rs.getTimestamp("verify_time"));
            q.setCreateTime(rs.getTimestamp("create_time")); q.setUpdateTime(rs.getTimestamp("update_time"));
            return q;
        } catch (SQLException e) { return null; }
    }
}

