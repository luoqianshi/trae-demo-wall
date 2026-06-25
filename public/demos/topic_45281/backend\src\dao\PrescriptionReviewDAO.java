package dao;

import bean.PrescriptionReview;
import java.util.List;

public interface PrescriptionReviewDAO {
    int insert(PrescriptionReview review);
    int update(PrescriptionReview review);
    int delete(int id);
    PrescriptionReview findById(int id);
    List<PrescriptionReview> findAll();
    List<PrescriptionReview> findByPrescriptionId(int prescriptionId);
    List<PrescriptionReview> findByReviewType(String reviewType);
    List<PrescriptionReview> findByRectifyStatus(String rectifyStatus);
}
