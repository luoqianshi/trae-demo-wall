package dao;

import bean.ConsultationMessage;
import java.util.List;

public interface ConsultationMessageDAO {
    int insert(ConsultationMessage m);
    List<ConsultationMessage> findByConsultationId(int consultationId);
    int markReadByConsultation(int consultationId, int userId);
}
