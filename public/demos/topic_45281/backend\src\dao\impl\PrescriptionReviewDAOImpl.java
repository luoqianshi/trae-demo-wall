package dao.impl;

import util.JDBCUtil;
import bean.PrescriptionReview;
import dao.PrescriptionReviewDAO;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionReviewDAOImpl implements PrescriptionReviewDAO {
    @Override
    public int insert(PrescriptionReview review) {
        String sql = "INSERT INTO prescription_reviews(prescription_id, review_type, auto_warn, warn_content, reviewer, review_opinion, rectify_status, review_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeUpdate(sql, review.getPrescriptionId(), review.getReviewType(), review.getAutoWarn(), review.getWarnContent(), review.getReviewer(), review.getReviewOpinion(), review.getRectifyStatus(), review.getReviewTime());
    }

    @Override
    public int update(PrescriptionReview review) {
        String sql = "UPDATE prescription_reviews SET prescription_id = ?, review_type = ?, auto_warn = ?, warn_content = ?, reviewer = ?, review_opinion = ?, rectify_status = ?, review_time = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, review.getPrescriptionId(), review.getReviewType(), review.getAutoWarn(), review.getWarnContent(), review.getReviewer(), review.getReviewOpinion(), review.getRectifyStatus(), review.getReviewTime(), review.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM prescription_reviews WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public PrescriptionReview findById(int id) {
        String sql = "SELECT * FROM prescription_reviews WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPrescriptionReview(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<PrescriptionReview> findAll() {
        String sql = "SELECT * FROM prescription_reviews ORDER BY review_time DESC";
        List<PrescriptionReview> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescriptionReview(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PrescriptionReview> findByPrescriptionId(int prescriptionId) {
        String sql = "SELECT * FROM prescription_reviews WHERE prescription_id = ? ORDER BY review_time DESC";
        List<PrescriptionReview> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, prescriptionId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescriptionReview(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PrescriptionReview> findByReviewType(String reviewType) {
        String sql = "SELECT * FROM prescription_reviews WHERE review_type = ? ORDER BY review_time DESC";
        List<PrescriptionReview> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, reviewType)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescriptionReview(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PrescriptionReview> findByRectifyStatus(String rectifyStatus) {
        String sql = "SELECT * FROM prescription_reviews WHERE rectify_status = ? ORDER BY review_time DESC";
        List<PrescriptionReview> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, rectifyStatus)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescriptionReview(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private PrescriptionReview mapToPrescriptionReview(java.sql.ResultSet rs) throws Exception {
        PrescriptionReview review = new PrescriptionReview();
        review.setId(rs.getInt("id"));
        review.setPrescriptionId(rs.getInt("prescription_id"));
        review.setReviewType(rs.getString("review_type"));
        review.setAutoWarn(rs.getString("auto_warn"));
        review.setWarnContent(rs.getString("warn_content"));
        review.setReviewer(rs.getString("reviewer"));
        review.setReviewOpinion(rs.getString("review_opinion"));
        review.setRectifyStatus(rs.getString("rectify_status"));
        review.setReviewTime(rs.getTimestamp("review_time"));
        return review;
    }
}
