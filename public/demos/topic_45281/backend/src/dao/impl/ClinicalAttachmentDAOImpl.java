package dao.impl;

import bean.ClinicalAttachment;
import dao.ClinicalAttachmentDAO;
import util.JDBCUtil;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClinicalAttachmentDAOImpl implements ClinicalAttachmentDAO {
    @Override
    public int insert(ClinicalAttachment attachment) {
        return JDBCUtil.executeInsert(
            "INSERT INTO clinical_attachment(patient_id,visit_id,record_id,file_id,attachment_type,remark) VALUES(?,?,?,?,?,?)",
            attachment.getPatientId(), attachment.getVisitId(), attachment.getRecordId(), attachment.getFileId(),
            attachment.getAttachmentType(), attachment.getRemark()
        );
    }

    @Override
    public List<ClinicalAttachment> findByPatient(long patientId, Long visitId, Long recordId, String attachmentType) {
        List<ClinicalAttachment> list = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
            "SELECT ca.*,fa.id AS fa_id,fa.file_uuid,fa.original_name,fa.storage_path,fa.mime_type,fa.file_size,fa.file_sha256,fa.category,fa.owner_type,fa.owner_id,fa.uploaded_by,fa.uploaded_at,fa.deleted " +
            "FROM clinical_attachment ca JOIN file_asset fa ON ca.file_id=fa.id " +
            "WHERE ca.patient_id=? AND fa.deleted=0"
        );
        params.add(patientId);
        if (visitId != null) {
            sql.append(" AND ca.visit_id=?");
            params.add(visitId);
        }
        if (recordId != null) {
            sql.append(" AND ca.record_id=?");
            params.add(recordId);
        }
        if (attachmentType != null && !attachmentType.isEmpty()) {
            sql.append(" AND ca.attachment_type=?");
            params.add(attachmentType);
        }
        sql.append(" ORDER BY ca.created_at DESC");

        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql.toString(), params.toArray());
        try {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) list.add(map(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return list;
    }

    @Override
    public int delete(long id) {
        return JDBCUtil.executeUpdate("DELETE FROM clinical_attachment WHERE id=?", id);
    }

    private ClinicalAttachment map(ResultSet rs) throws SQLException {
        ClinicalAttachment a = new ClinicalAttachment();
        a.setId(rs.getLong("id"));
        a.setPatientId(rs.getLong("patient_id"));
        long visitId = rs.getLong("visit_id");
        a.setVisitId(rs.wasNull() ? null : visitId);
        long recordId = rs.getLong("record_id");
        a.setRecordId(rs.wasNull() ? null : recordId);
        a.setFileId(rs.getLong("file_id"));
        a.setAttachmentType(rs.getString("attachment_type"));
        a.setRemark(rs.getString("remark"));
        a.setCreatedAt(rs.getTimestamp("created_at"));
        a.setFile(FileAssetDAOImpl.mapAliased(rs));
        return a;
    }
}
