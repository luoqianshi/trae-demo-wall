package dao.impl;

import bean.MedicalRecordArchive;
import dao.MedicalRecordArchiveDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class MedicalRecordArchiveDAOImpl implements MedicalRecordArchiveDAO {
    @Override
    public int insert(MedicalRecordArchive archive) {
        String sql = "INSERT INTO medical_record_archive(medical_record_id, patient_id, patient_name, record_id, icd_code, icd_name, quality_score, archive_status, archivist, archive_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, archive.getMedicalRecordId(), archive.getPatientId(), archive.getPatientName(), archive.getRecordId(), archive.getIcdCode(), archive.getIcdName(), archive.getQualityScore(), archive.getArchiveStatus(), archive.getArchivist(), archive.getArchiveDate(), archive.getRemark());
    }

    @Override
    public int update(MedicalRecordArchive archive) {
        String sql = "UPDATE medical_record_archive SET medical_record_id=?, patient_id=?, patient_name=?, record_id=?, icd_code=?, icd_name=?, quality_score=?, archive_status=?, archivist=?, archive_date=?, remark=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, archive.getMedicalRecordId(), archive.getPatientId(), archive.getPatientName(), archive.getRecordId(), archive.getIcdCode(), archive.getIcdName(), archive.getQualityScore(), archive.getArchiveStatus(), archive.getArchivist(), archive.getArchiveDate(), archive.getRemark(), archive.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM medical_record_archive WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public MedicalRecordArchive findById(int id) {
        String sql = "SELECT * FROM medical_record_archive WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToArchive(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<MedicalRecordArchive> findAll() {
        String sql = "SELECT * FROM medical_record_archive ORDER BY create_time DESC";
        List<MedicalRecordArchive> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToArchive(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<MedicalRecordArchive> findByStatus(String status) {
        String sql = "SELECT * FROM medical_record_archive WHERE archive_status=? ORDER BY create_time DESC";
        List<MedicalRecordArchive> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToArchive(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private MedicalRecordArchive mapToArchive(java.sql.ResultSet rs) throws Exception {
        MedicalRecordArchive archive = new MedicalRecordArchive();
        archive.setId(rs.getInt("id"));
        archive.setMedicalRecordId(rs.getInt("medical_record_id"));
        try { archive.setPatientId(rs.getInt("patient_id")); } catch (Exception e) { e.printStackTrace(); }
        try { archive.setPatientName(rs.getString("patient_name")); } catch (Exception e) { e.printStackTrace(); }
        try { archive.setRecordId(rs.getInt("record_id")); } catch (Exception e) { e.printStackTrace(); }
        archive.setIcdCode(rs.getString("icd_code"));
        archive.setIcdName(rs.getString("icd_name"));
        archive.setQualityScore(rs.getInt("quality_score"));
        archive.setArchiveStatus(rs.getString("archive_status"));
        archive.setArchivist(rs.getString("archivist"));
        archive.setArchiveDate(rs.getTimestamp("archive_date"));
        archive.setCreateTime(rs.getTimestamp("create_time"));
        archive.setRemark(rs.getString("remark"));
        return archive;
    }
}

