package dao;
import bean.InfectiousDiseaseReport;
import java.util.List;
public interface InfectiousDiseaseReportDAO {
    int insert(InfectiousDiseaseReport r);
    int update(InfectiousDiseaseReport r);
    InfectiousDiseaseReport findById(int id);
    List<InfectiousDiseaseReport> findByPatientId(int patientId);
    List<InfectiousDiseaseReport> findReports(String diseaseCategory, String status, int page, int size);
}
