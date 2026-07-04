package service;

import bean.SatisfactionEvaluation;
import dao.impl.SatisfactionEvaluationDAOImpl;
import java.util.List;

public class SatisfactionEvaluationService {
    private SatisfactionEvaluationDAOImpl dao = new SatisfactionEvaluationDAOImpl();

    public int add(SatisfactionEvaluation e) {
        return dao.insert(e);
    }

    public List<SatisfactionEvaluation> getAll(String type, int page, int size) {
        return dao.findAll(type, page, size);
    }

    public int reply(int id, String replyText, String replyBy) {
        return dao.reply(id, replyText, replyBy);
    }
}