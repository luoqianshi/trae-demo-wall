package dao;

import bean.SatisfactionEvaluation;
import java.util.List;

public interface SatisfactionEvaluationDAO {
    int insert(SatisfactionEvaluation e);
    List<SatisfactionEvaluation> findAll(String type, int page, int size);
    int reply(int id, String replyText, String replyBy);
}
