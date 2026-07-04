package dao;

import bean.ClinicalAttachment;
import java.util.List;

public interface ClinicalAttachmentDAO {
    int insert(ClinicalAttachment attachment);
    List<ClinicalAttachment> findByPatient(long patientId, Long visitId, Long recordId, String attachmentType);
    int delete(long id);
}
