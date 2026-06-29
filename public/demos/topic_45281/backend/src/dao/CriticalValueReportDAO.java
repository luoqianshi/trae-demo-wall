package dao;
import bean.CriticalValueReport;
import java.util.List;
public interface CriticalValueReportDAO {
    int insert(CriticalValueReport r);
    int update(CriticalValueReport r);
    CriticalValueReport findById(int id);
    List<CriticalValueReport> findByPatientId(int patientId);
    List<CriticalValueReport> findReports(String status, int page, int size);
}
