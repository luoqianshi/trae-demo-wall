package dao;
import bean.ClinicalPathwayInstance;
import java.util.List;
public interface ClinicalPathwayInstanceDAO {
    int insert(ClinicalPathwayInstance i);
    int update(ClinicalPathwayInstance i);
    ClinicalPathwayInstance findById(int id);
    List<ClinicalPathwayInstance> findInstancesByInpatientId(int inpatientId);
    List<ClinicalPathwayInstance> findInstances(String status, int page, int size);
}
