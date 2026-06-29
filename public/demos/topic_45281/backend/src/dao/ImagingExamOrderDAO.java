package dao;
import bean.ImagingExamOrder;
import java.util.List;
public interface ImagingExamOrderDAO {
    int insert(ImagingExamOrder o);
    int update(ImagingExamOrder o);
    ImagingExamOrder findById(int id);
    List<ImagingExamOrder> findExamsByPatientId(int patientId);
    List<ImagingExamOrder> findExams(String modality, String status, int page, int size);
}
