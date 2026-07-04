package dao;
import bean.PerformanceAssessment;
import java.util.List;
public interface PerformanceAssessmentDAO {
    int insert(PerformanceAssessment p);
    int update(PerformanceAssessment p);
    PerformanceAssessment findById(int id);
    List<PerformanceAssessment> findByStaffId(int staffId);
    List<PerformanceAssessment> findAssessments(String assessPeriod, String status, int page, int size);
}
