package bean;

import java.util.Date;

public class PrescriptionReview {
    private int id;
    private int prescriptionId;
    private String reviewType;
    private String autoWarn;
    private String warnContent;
    private String reviewer;
    private String reviewOpinion;
    private String rectifyStatus;
    private Date reviewTime;

    public PrescriptionReview() {}

    public PrescriptionReview(int id, int prescriptionId, String reviewType, String autoWarn, String warnContent, String reviewer, String reviewOpinion, String rectifyStatus, Date reviewTime) {
        this.id = id;
        this.prescriptionId = prescriptionId;
        this.reviewType = reviewType;
        this.autoWarn = autoWarn;
        this.warnContent = warnContent;
        this.reviewer = reviewer;
        this.reviewOpinion = reviewOpinion;
        this.rectifyStatus = rectifyStatus;
        this.reviewTime = reviewTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(int prescriptionId) { this.prescriptionId = prescriptionId; }

    public String getReviewType() { return reviewType; }
    public void setReviewType(String reviewType) { this.reviewType = reviewType; }

    public String getAutoWarn() { return autoWarn; }
    public void setAutoWarn(String autoWarn) { this.autoWarn = autoWarn; }

    public String getWarnContent() { return warnContent; }
    public void setWarnContent(String warnContent) { this.warnContent = warnContent; }

    public String getReviewer() { return reviewer; }
    public void setReviewer(String reviewer) { this.reviewer = reviewer; }

    public String getReviewOpinion() { return reviewOpinion; }
    public void setReviewOpinion(String reviewOpinion) { this.reviewOpinion = reviewOpinion; }

    public String getRectifyStatus() { return rectifyStatus; }
    public void setRectifyStatus(String rectifyStatus) { this.rectifyStatus = rectifyStatus; }

    public Date getReviewTime() { return reviewTime; }
    public void setReviewTime(Date reviewTime) { this.reviewTime = reviewTime; }
}
