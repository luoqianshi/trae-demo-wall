package service;

import bean.ConsultationMessage;
import dao.ConsultationMessageDAO;
import dao.impl.ConsultationMessageDAOImpl;
import java.util.List;

public class ConsultationMessageService {
    private ConsultationMessageDAO dao = new ConsultationMessageDAOImpl();

    public int add(ConsultationMessage m) {
        return dao.insert(m);
    }

    public List<ConsultationMessage> getByConsultationId(int consultationId) {
        return dao.findByConsultationId(consultationId);
    }

    public int markRead(int consultationId, int userId) {
        return dao.markReadByConsultation(consultationId, userId);
    }
}