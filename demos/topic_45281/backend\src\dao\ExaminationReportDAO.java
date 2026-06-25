package dao;

import bean.ExaminationReport;
import java.util.List;

public interface ExaminationReportDAO {
    int insert(ExaminationReport r);
    int update(ExaminationReport r);
    List<ExaminationReport> findAll(Integer patientId, String type);
    int voidReport(int id);
    ExaminationReport findById(int id);
}