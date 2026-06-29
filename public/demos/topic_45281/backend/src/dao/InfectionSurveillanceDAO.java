package dao;
import bean.InfectionSurveillance;
import java.util.List;
public interface InfectionSurveillanceDAO {
    int insert(InfectionSurveillance s);
    int update(InfectionSurveillance s);
    InfectionSurveillance findById(int id);
    List<InfectionSurveillance> findByDeptId(int deptId);
    List<InfectionSurveillance> findSurveillances(String infectionType, String status, int page, int size);
}
