package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Prescription;
import bean.PrescriptionReview;
import service.PrescriptionReviewService;
import java.util.List;
import java.util.Map;

public class PrescriptionReviewHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/prescription-reviews".equals(path) && "GET".equals(method)) {
                    List<PrescriptionReview> reviews = new PrescriptionReviewService().getAllPrescriptionReviews();
                    sendResponse(exchange, "{\"reviews\":" + toJson(reviews) + ",\"count\":" + reviews.size() + "}");
                } else if (path.matches("/api/prescription-reviews/prescription/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int prescriptionId = Integer.parseInt(idStr);
                    List<PrescriptionReview> reviews = new PrescriptionReviewService().getPrescriptionReviewsByPrescriptionId(prescriptionId);
                    sendResponse(exchange, "{\"reviews\":" + toJson(reviews) + ",\"count\":" + reviews.size() + "}");
                } else if ("/api/prescription-reviews".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PrescriptionReview review = new PrescriptionReview();
                    if (params.get("prescriptionId") != null && !params.get("prescriptionId").isEmpty()) {
                        review.setPrescriptionId(Integer.parseInt(params.get("prescriptionId")));
                    }
                    if (params.get("reviewType") != null) review.setReviewType(params.get("reviewType"));
                    if (params.get("autoWarn") != null) review.setAutoWarn(params.get("autoWarn"));
                    if (params.get("warnContent") != null) review.setWarnContent(params.get("warnContent"));
                    if (params.get("reviewer") != null) review.setReviewer(params.get("reviewer"));
                    if (params.get("reviewOpinion") != null) review.setReviewOpinion(params.get("reviewOpinion"));
                    if (params.get("rectifyStatus") != null) review.setRectifyStatus(params.get("rectifyStatus"));
                    int result = new PrescriptionReviewService().addPrescriptionReview(review);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if ("/api/prescription-reviews".equals(path) && "PUT".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PrescriptionReview review = new PrescriptionReview();
                    if (params.get("id") != null && !params.get("id").isEmpty()) {
                        review.setId(Integer.parseInt(params.get("id")));
                    }
                    if (params.get("rectifyStatus") != null) review.setRectifyStatus(params.get("rectifyStatus"));
                    if (params.get("reviewOpinion") != null) review.setReviewOpinion(params.get("reviewOpinion"));
                    int result = new PrescriptionReviewService().updatePrescriptionReview(review);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
