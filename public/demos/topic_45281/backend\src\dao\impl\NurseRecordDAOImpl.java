package dao.impl;

import bean.NurseRecord;
import dao.NurseRecordDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class NurseRecordDAOImpl implements NurseRecordDAO {
    @Override
    public int insert(NurseRecord record) {
        String sql = "INSERT INTO nurse_record(inpatient_id, patient_name, content, nursing_notes, nurse_id, nurse_name, record_time, type, vital_signs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, record.getInpatientId(), record.getPatientName(), record.getContent(), record.getNursingNotes(), record.getNurseId(), record.getNurseName(), record.getRecordTime(), record.getType(), record.getVitalSigns());
    }

    @Override
    public int update(NurseRecord record) {
        String sql = "UPDATE nurse_record SET inpatient_id=?, patient_name=?, content=?, nursing_notes=?, nurse_id=?, nurse_name=?, record_time=?, type=?, vital_signs=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, record.getInpatientId(), record.getPatientName(), record.getContent(), record.getNursingNotes(), record.getNurseId(), record.getNurseName(), record.getRecordTime(), record.getType(), record.getVitalSigns(), record.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM nurse_record WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public NurseRecord findById(int id) {
        String sql = "SELECT * FROM nurse_record WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToNurseRecord(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<NurseRecord> findAll() {
        String sql = "SELECT * FROM nurse_record ORDER BY record_time DESC";
        List<NurseRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToNurseRecord(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<NurseRecord> findByInpatientId(int inpatientId) {
        String sql = "SELECT * FROM nurse_record WHERE inpatient_id=? ORDER BY record_time DESC";
        List<NurseRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, inpatientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToNurseRecord(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private NurseRecord mapToNurseRecord(java.sql.ResultSet rs) throws Exception {
        NurseRecord record = new NurseRecord();
        record.setId(rs.getInt("id"));
        record.setInpatientId(rs.getInt("inpatient_id"));
        try { record.setPatientName(rs.getString("patient_name")); } catch (Exception e) { e.printStackTrace(); }
        record.setContent(rs.getString("content"));
        try { record.setNursingNotes(rs.getString("nursing_notes")); } catch (Exception e) { e.printStackTrace(); }
        try { record.setNurseId(rs.getInt("nurse_id")); } catch (Exception e) { e.printStackTrace(); }
        record.setNurseName(rs.getString("nurse_name"));
        record.setRecordTime(rs.getTimestamp("record_time"));
        record.setType(rs.getString("type"));
        try { record.setVitalSigns(rs.getString("vital_signs")); } catch (Exception e) { e.printStackTrace(); }
        try { record.setCreateTime(rs.getTimestamp("create_time")); } catch (Exception e) { e.printStackTrace(); }
        return record;
    }
}

