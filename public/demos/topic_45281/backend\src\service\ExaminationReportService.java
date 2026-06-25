package service;

import bean.ExaminationReport;
import dao.ExaminationReportDAO;
import dao.impl.ExaminationReportDAOImpl;
import java.util.List;

public class ExaminationReportService {
    private ExaminationReportDAO dao = new ExaminationReportDAOImpl();

    public int add(ExaminationReport r) { return dao.insert(r); }
    public int update(ExaminationReport r) { return dao.update(r); }
    public int voidReport(int id) { return dao.voidReport(id); }
    public ExaminationReport getById(int id) { return dao.findById(id); }
    public List<ExaminationReport> getAll(Integer patientId, String type) { return dao.findAll(patientId, type); }
}