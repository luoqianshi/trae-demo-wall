package dao;
import bean.ClinicalPathway;
import java.util.List;
public interface ClinicalPathwayDAO {
    int insert(ClinicalPathway p);
    int update(ClinicalPathway p);
    ClinicalPathway findById(int id);
    List<ClinicalPathway> findPathways(String status, int page, int size);
}
