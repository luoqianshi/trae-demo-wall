package service;

import bean.ClinicalAttachment;
import bean.FileAsset;
import dao.impl.ClinicalAttachmentDAOImpl;
import util.JDBCUtil;

import java.util.List;

public class ClinicalAttachmentService {
    private final ClinicalAttachmentDAOImpl dao = new ClinicalAttachmentDAOImpl();
    private final FileAssetService fileAssetService = new FileAssetService();

    public ClinicalAttachmentService() {
        ensureTables();
    }

    public ClinicalAttachment create(
        long patientId,
        Long visitId,
        Long recordId,
        String attachmentType,
        String remark,
        String originalName,
        String mimeType,
        byte[] bytes,
        Long uploadedBy
    ) throws Exception {
        FileAsset file = fileAssetService.save(
            originalName,
            mimeType,
            bytes,
            attachmentType == null || attachmentType.isEmpty() ? "clinical_attachment" : attachmentType,
            "patient",
            patientId,
            uploadedBy
        );

        ClinicalAttachment attachment = new ClinicalAttachment();
        attachment.setPatientId(patientId);
        attachment.setVisitId(visitId);
        attachment.setRecordId(recordId);
        attachment.setFileId(file.getId());
        attachment.setAttachmentType(attachmentType == null || attachmentType.isEmpty() ? "clinical_attachment" : attachmentType);
        attachment.setRemark(remark);
        int id = dao.insert(attachment);
        attachment.setId(id);
        attachment.setFile(file);
        return attachment;
    }

    public List<ClinicalAttachment> findByPatient(long patientId, Long visitId, Long recordId, String attachmentType) {
        return dao.findByPatient(patientId, visitId, recordId, attachmentType);
    }

    public int delete(long id) {
        return dao.delete(id);
    }

    private void ensureTables() {
        JDBCUtil.executeUpdate(
            "CREATE TABLE IF NOT EXISTS clinical_attachment (" +
            "id BIGINT PRIMARY KEY AUTO_INCREMENT," +
            "patient_id BIGINT NOT NULL," +
            "visit_id BIGINT," +
            "record_id BIGINT," +
            "file_id BIGINT NOT NULL," +
            "attachment_type VARCHAR(50) NOT NULL," +
            "remark VARCHAR(500)," +
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "INDEX idx_attachment_patient (patient_id)," +
            "INDEX idx_attachment_visit (visit_id)," +
            "INDEX idx_attachment_record (record_id)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }
}
