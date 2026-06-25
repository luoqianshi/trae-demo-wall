package service;

import bean.Registration;
import bean.OutpatientMedicalRecord;
import bean.Patient;
import bean.Doctor;
import dao.RegistrationDAO;
import dao.impl.RegistrationDAOImpl;
import util.JDBCUtil;
import java.sql.Connection;
import java.sql.Timestamp;
import java.util.Date;
import java.util.List;

public class RegistrationService {
    private RegistrationDAO registrationDAO = new RegistrationDAOImpl();

    public int register(Registration registration) {
        hydrateRegistration(registration);
        Connection conn = null;
        try {
            conn = JDBCUtil.beginTransaction();
            int regId = JDBCUtil.executeInsert(conn,
                "INSERT INTO registration(patient_id, patient_name, doctor_id, doctor_name, dept, reg_fee, reg_status, queue_no, reg_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                registration.getPatientId(), registration.getPatientName(), registration.getDoctorId(),
                registration.getDoctorName(), registration.getDept(), registration.getRegFee(),
                registration.getRegStatus(), registration.getQueueNo(), registration.getRegTime());
            if (regId <= 0) {
                JDBCUtil.rollback(conn);
                return regId;
            }

            createOutpatientRecord(conn, regId, registration);
            if (shouldCreateQueue(registration)) {
                createQueueCall(conn, regId, registration);
                createTriageQueue(conn, regId, registration);
            }

            JDBCUtil.commit(conn);
            return regId;
        } catch (Exception e) {
            JDBCUtil.rollback(conn);
            e.printStackTrace();
            return -1;
        }
    }

    private void hydrateRegistration(Registration registration) {
        if (registration.getRegTime() == null) registration.setRegTime(new Date());
        if (registration.getRegStatus() == null || registration.getRegStatus().isEmpty()) {
            registration.setRegStatus("waiting");
        }
        if ("已挂号".equals(registration.getRegStatus())) {
            registration.setRegStatus("waiting");
        }
        if (registration.getQueueNo() == null || registration.getQueueNo().isEmpty()) {
            registration.setQueueNo("Q" + (System.currentTimeMillis() % 100000));
        }
        if ((registration.getPatientName() == null || registration.getPatientName().isEmpty()) && registration.getPatientId() > 0) {
            Patient patient = new PatientService().getPatientById(registration.getPatientId());
            if (patient != null) registration.setPatientName(patient.getName());
        }
        if ((registration.getDoctorName() == null || registration.getDoctorName().isEmpty()) && registration.getDoctorId() > 0) {
            Doctor doctor = new DoctorService().getDoctorById(registration.getDoctorId());
            if (doctor != null) registration.setDoctorName(doctor.getName());
        }
    }

    private boolean shouldCreateQueue(Registration registration) {
        String status = registration.getRegStatus();
        return "waiting".equals(status) || "paid".equals(status) || "已挂号".equals(status);
    }

    private void createOutpatientRecord(Connection conn, int registrationId, Registration registration) throws Exception {
        long now = System.currentTimeMillis();
        OutpatientMedicalRecord omr = new OutpatientMedicalRecord();
        omr.setPatientId(registration.getPatientId());
        omr.setPatientName(registration.getPatientName());
        omr.setDoctorId(registration.getDoctorId());
        omr.setDoctorName(registration.getDoctorName());
        omr.setDeptId(findDeptId(registration.getDept()));
        omr.setDeptName(registration.getDept());
        omr.setVisitDate(new java.sql.Date(now));
        omr.setVisitType("初诊");
        omr.setStatus("waiting_consult");
        omr.setCreateTime(new Timestamp(now));
        omr.setMedicalRecordNo("MR" + now);
        omr.setVisitNo("REG" + registrationId);
        JDBCUtil.executeInsert(conn,
            "INSERT INTO outpatient_medical_record(patient_id,patient_name,medical_record_no,visit_no,doctor_id,doctor_name,dept_id,dept_name,visit_date,visit_type,chief_complaint,present_illness_history,past_history,personal_history,family_history,allergy_history,physical_exam,auxiliary_exam,diagnosis,icd_code,treatment_plan,advice,next_visit_date,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            omr.getPatientId(), omr.getPatientName(), omr.getMedicalRecordNo(), omr.getVisitNo(),
            omr.getDoctorId(), omr.getDoctorName(), omr.getDeptId(), omr.getDeptName(), omr.getVisitDate(),
            omr.getVisitType(), omr.getChiefComplaint(), omr.getPresentIllnessHistory(), omr.getPastHistory(),
            omr.getPersonalHistory(), omr.getFamilyHistory(), omr.getAllergyHistory(), omr.getPhysicalExam(),
            omr.getAuxiliaryExam(), omr.getDiagnosis(), omr.getIcdCode(), omr.getTreatmentPlan(),
            omr.getAdvice(), omr.getNextVisitDate(), omr.getStatus());
    }

    private void createQueueCall(Connection conn, int registrationId, Registration registration) throws Exception {
        JDBCUtil.executeInsert(conn,
            "INSERT INTO queue_calls(registration_id, patient_id, patient_name, doctor_id, doctor_name, dept, queue_no, status, call_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            registrationId, registration.getPatientId(), registration.getPatientName(), registration.getDoctorId(),
            registration.getDoctorName(), registration.getDept(), registration.getQueueNo(), "waiting", null);
    }

    private void createTriageQueue(Connection conn, int registrationId, Registration registration) throws Exception {
        Patient patient = registration.getPatientId() > 0 ? new PatientService().getPatientById(registration.getPatientId()) : null;
        int deptId = findDeptId(registration.getDept());
        JDBCUtil.executeInsert(conn,
            "INSERT INTO triage_queue(registration_id,patient_id,patient_name,patient_gender,patient_age,dept_id,dept_name,doctor_id,doctor_name,queue_no,queue_type,priority,source,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            registrationId, registration.getPatientId(), registration.getPatientName(),
            patient != null ? patient.getGender() : "", patient != null ? patient.getAge() : 0,
            deptId, registration.getDept(), registration.getDoctorId(), registration.getDoctorName(),
            registration.getQueueNo(), "registration", 1, "门诊", "waiting");
    }

    private int findDeptId(String deptName) {
        if (deptName == null || deptName.isEmpty()) return 0;
        try {
            for (bean.Department dept : new DepartmentService().getAllDepartments()) {
                if (deptName.equals(dept.getName())) return dept.getId();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    public int updateRegistration(Registration registration) {
        return registrationDAO.update(registration);
    }

    public int cancelRegistration(int id) {
        return registrationDAO.delete(id);
    }

    public Registration getRegistrationById(int id) {
        return registrationDAO.findById(id);
    }

    public List<Registration> getAllRegistrations() {
        return registrationDAO.findAll();
    }

    public List<Registration> getRegistrationsByPatientId(int patientId) {
        return registrationDAO.findByPatientId(patientId);
    }

    public List<Registration> getRegistrationsByDoctorId(int doctorId) {
        return registrationDAO.findByDoctorId(doctorId);
    }

    public List<Registration> getRegistrationsByDept(String dept) {
        return registrationDAO.findByDept(dept);
    }

    public int countByDept(String dept) {
        return registrationDAO.countByDept(dept);
    }

    public List<Registration> getRegistrationsByStatus(String status) {
        return registrationDAO.findByStatus(status);
    }
}
