package service;

import bean.PrescriptionReview;
import dao.PrescriptionReviewDAO;
import dao.impl.PrescriptionReviewDAOImpl;
import java.util.List;

public class PrescriptionReviewService {
    private PrescriptionReviewDAO prescriptionReviewDAO = new PrescriptionReviewDAOImpl();

    public int addPrescriptionReview(PrescriptionReview review) {
        return prescriptionReviewDAO.insert(review);
    }

    public int updatePrescriptionReview(PrescriptionReview review) {
        return prescriptionReviewDAO.update(review);
    }

    public int deletePrescriptionReview(int id) {
        return prescriptionReviewDAO.delete(id);
    }

    public PrescriptionReview getPrescriptionReviewById(int id) {
        return prescriptionReviewDAO.findById(id);
    }

    public List<PrescriptionReview> getAllPrescriptionReviews() {
        return prescriptionReviewDAO.findAll();
    }

    public List<PrescriptionReview> getPrescriptionReviewsByPrescriptionId(int prescriptionId) {
        return prescriptionReviewDAO.findByPrescriptionId(prescriptionId);
    }

    public List<PrescriptionReview> getPrescriptionReviewsByReviewType(String reviewType) {
        return prescriptionReviewDAO.findByReviewType(reviewType);
    }

    public List<PrescriptionReview> getPrescriptionReviewsByRectifyStatus(String rectifyStatus) {
        return prescriptionReviewDAO.findByRectifyStatus(rectifyStatus);
    }
}
