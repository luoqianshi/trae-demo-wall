package bean;
import java.sql.Timestamp;

public class ClinicalPathway {
    private int id; private String pathwayCode; private String pathwayName;
    private String diseaseIcd; private String diseaseName;
    private String version = "V1.0"; private Integer targetDays;
    private String department; private String entryCriteria; private String exclusionCriteria;
    private String variationTypes; private String status = "启用";
    private Integer creatorId; private String creatorName;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getPathwayCode() { return pathwayCode; } public void setPathwayCode(String pathwayCode) { this.pathwayCode = pathwayCode; }
    public String getPathwayName() { return pathwayName; } public void setPathwayName(String pathwayName) { this.pathwayName = pathwayName; }
    public String getDiseaseIcd() { return diseaseIcd; } public void setDiseaseIcd(String diseaseIcd) { this.diseaseIcd = diseaseIcd; }
    public String getDiseaseName() { return diseaseName; } public void setDiseaseName(String diseaseName) { this.diseaseName = diseaseName; }
    public String getVersion() { return version; } public void setVersion(String version) { this.version = version; }
    public Integer getTargetDays() { return targetDays; } public void setTargetDays(Integer targetDays) { this.targetDays = targetDays; }
    public String getDepartment() { return department; } public void setDepartment(String department) { this.department = department; }
    public String getEntryCriteria() { return entryCriteria; } public void setEntryCriteria(String entryCriteria) { this.entryCriteria = entryCriteria; }
    public String getExclusionCriteria() { return exclusionCriteria; } public void setExclusionCriteria(String exclusionCriteria) { this.exclusionCriteria = exclusionCriteria; }
    public String getVariationTypes() { return variationTypes; } public void setVariationTypes(String variationTypes) { this.variationTypes = variationTypes; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Integer getCreatorId() { return creatorId; } public void setCreatorId(Integer creatorId) { this.creatorId = creatorId; }
    public String getCreatorName() { return creatorName; } public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
