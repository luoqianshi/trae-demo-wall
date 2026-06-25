package bean;

import java.util.Date;
import java.math.BigDecimal;

public class Patient {
    private int id;
    private String hospitalId;
    private String medicalRecordNo;
    private String outpatientNo;
    private String inpatientNo;
    private String name;
    private String gender;
    private int age;
    private Date birthDate;
    private String idCard;
    private String phone;
    private String address;
    private String occupation;
    private String maritalStatus;
    private String insuranceType;
    private String medicalInsuranceNo;
    private String contractUnit;
    private BigDecimal insuranceSelfRatio;
    private String emergencyContact;
    private String emergencyPhone;
    private String allergyHistory;
    private String drugAdverseHistory;
    private String infectiousDiseaseHistory;
    private int specialDiseaseFlag;
    private Date createTime;
    private Date updateTime;

    public Patient() {}

    public Patient(int id, String name, String gender, int age, String idCard, String phone,
                   String allergyHistory, String medicalRecordNo, Date createTime) {
        this.id = id;
        this.name = name;
        this.gender = gender;
        this.age = age;
        this.idCard = idCard;
        this.phone = phone;
        this.allergyHistory = allergyHistory;
        this.medicalRecordNo = medicalRecordNo;
        this.createTime = createTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }

    public String getMedicalRecordNo() { return medicalRecordNo; }
    public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }

    public String getOutpatientNo() { return outpatientNo; }
    public void setOutpatientNo(String outpatientNo) { this.outpatientNo = outpatientNo; }

    public String getInpatientNo() { return inpatientNo; }
    public void setInpatientNo(String inpatientNo) { this.inpatientNo = inpatientNo; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public Date getBirthDate() { return birthDate; }
    public void setBirthDate(Date birthDate) { this.birthDate = birthDate; }

    public String getIdCard() { return idCard; }
    public void setIdCard(String idCard) { this.idCard = idCard; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public String getInsuranceType() { return insuranceType; }
    public void setInsuranceType(String insuranceType) { this.insuranceType = insuranceType; }

    public String getMedicalInsuranceNo() { return medicalInsuranceNo; }
    public void setMedicalInsuranceNo(String medicalInsuranceNo) { this.medicalInsuranceNo = medicalInsuranceNo; }

    public String getContractUnit() { return contractUnit; }
    public void setContractUnit(String contractUnit) { this.contractUnit = contractUnit; }

    public BigDecimal getInsuranceSelfRatio() { return insuranceSelfRatio; }
    public void setInsuranceSelfRatio(BigDecimal insuranceSelfRatio) { this.insuranceSelfRatio = insuranceSelfRatio; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }

    public String getAllergyHistory() { return allergyHistory; }
    public void setAllergyHistory(String allergyHistory) { this.allergyHistory = allergyHistory; }

    public String getDrugAdverseHistory() { return drugAdverseHistory; }
    public void setDrugAdverseHistory(String drugAdverseHistory) { this.drugAdverseHistory = drugAdverseHistory; }

    public String getInfectiousDiseaseHistory() { return infectiousDiseaseHistory; }
    public void setInfectiousDiseaseHistory(String infectiousDiseaseHistory) { this.infectiousDiseaseHistory = infectiousDiseaseHistory; }

    public int getSpecialDiseaseFlag() { return specialDiseaseFlag; }
    public void setSpecialDiseaseFlag(int specialDiseaseFlag) { this.specialDiseaseFlag = specialDiseaseFlag; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}