package dao.impl;

import bean.NursingRecord;
import dao.NursingRecordDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class NursingRecordDAOImpl implements NursingRecordDAO {

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
}