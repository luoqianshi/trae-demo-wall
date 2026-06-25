package dao;
import bean.ImagingReport;
import java.util.List;
public interface ImagingReportDAO {
    int insert(ImagingReport r);
    int update(ImagingReport r);
    ImagingReport findById(int id);
    List<ImagingReport> findByExamId(int examId);
}
