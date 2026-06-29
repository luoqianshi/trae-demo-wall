package util;

import java.io.IOException;
import java.net.InetSocketAddress;

import com.sun.net.httpserver.HttpServer;

import constant.RouteConstants;
import handler.*;

public class HttpServerUtil {
    static HttpServer server = null;

    public static void startServer() throws IOException {
        int port = AppConfig.getServerPort();
        server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext(RouteConstants.PATIENTS, new FilterHttpHandler(new PatientHandler()));
        server.createContext(RouteConstants.DOCTORS, new FilterHttpHandler(new DoctorHandler()));
        server.createContext(RouteConstants.DRUGS, new FilterHttpHandler(new DrugHandler()));
        server.createContext(RouteConstants.CHARGES, new FilterHttpHandler(new ChargeHandler()));
        server.createContext(RouteConstants.REGISTRATIONS, new FilterHttpHandler(new RegistrationHandler()));
        server.createContext(RouteConstants.QUEUE_CALLS, new FilterHttpHandler(new QueueCallHandler()));
        server.createContext(RouteConstants.OUTPATIENT_MEDICAL_RECORDS, new FilterHttpHandler(new OutpatientMedicalRecordHandler()));
        server.createContext(RouteConstants.PRESCRIPTIONS, new FilterHttpHandler(new PrescriptionHandler()));
        server.createContext(RouteConstants.USERS, new FilterHttpHandler(new UserHandler()));
        server.createContext(RouteConstants.DEPARTMENTS, new FilterHttpHandler(new DepartmentHandler()));
        server.createContext(RouteConstants.DOCTOR_WORKSTATION, new FilterHttpHandler(new DoctorWorkstationHandler()));
        server.createContext(RouteConstants.STATISTICS, new FilterHttpHandler(new StatisticsHandler()));
        server.createContext(RouteConstants.INVENTORY_LOGS, new FilterHttpHandler(new InventoryLogHandler()));
        server.createContext(RouteConstants.PRESCRIPTION_ITEMS, new FilterHttpHandler(new PrescriptionItemHandler()));
        server.createContext(RouteConstants.PRESCRIPTION_REVIEWS, new FilterHttpHandler(new PrescriptionReviewHandler()));
        server.createContext(RouteConstants.MEDICAL_RECORD_VERSIONS, new FilterHttpHandler(new MedicalRecordVersionHandler()));
        server.createContext(RouteConstants.PHARMACY, new FilterHttpHandler(new PharmacyHandler()));
        server.createContext(RouteConstants.EXAMINATIONS, new FilterHttpHandler(new ExaminationHandler()));
        server.createContext(RouteConstants.PRESCRIPTION_EXAMINATIONS, new FilterHttpHandler(new PrescriptionExaminationHandler()));
        server.createContext(RouteConstants.INPATIENTS, new FilterHttpHandler(new InpatientHandler()));
        server.createContext(RouteConstants.NURSE_RECORDS, new FilterHttpHandler(new NurseRecordHandler()));
        server.createContext(RouteConstants.VITAL_SIGNS, new FilterHttpHandler(new VitalSignHandler()));
        server.createContext(RouteConstants.SURGERIES, new FilterHttpHandler(new SurgeryHandler()));
        server.createContext(RouteConstants.PHYSICAL_EXAMS, new FilterHttpHandler(new PhysicalExamHandler()));
        server.createContext(RouteConstants.MEDICAL_RECORD_ARCHIVES, new FilterHttpHandler(new MedicalRecordArchiveHandler()));
        server.createContext(RouteConstants.ANESTHESIA_RECORDS, new FilterHttpHandler(new AnesthesiaRecordHandler()));

        server.createContext(RouteConstants.APPOINTMENTS, new FilterHttpHandler(new AppointmentHandler()));
        server.createContext(RouteConstants.QUEUE_TICKETS, new FilterHttpHandler(new QueueTicketHandler()));
        server.createContext(RouteConstants.PAYMENTS, new FilterHttpHandler(new PaymentHandler()));
        server.createContext(RouteConstants.EVALUATIONS, new FilterHttpHandler(new EvaluationHandler()));
        server.createContext(RouteConstants.NOTIFICATIONS, new FilterHttpHandler(new NotificationHandler()));
        server.createContext(RouteConstants.COMPANIONS, new FilterHttpHandler(new CompanionHandler()));
        server.createContext(RouteConstants.PATIENT_LOCATIONS, new FilterHttpHandler(new PatientLocationHandler()));
        server.createContext(RouteConstants.PUBLIC_INFO, new FilterHttpHandler(new PublicInfoHandler()));
        server.createContext(RouteConstants.CONSULTATIONS, new FilterHttpHandler(new ConsultationHandler()));
        server.createContext(RouteConstants.MEDICAL_RECORDS, new FilterHttpHandler(new MedicalRecordHandler()));
        server.createContext(RouteConstants.PRESCRIPTIONS_ENHANCED, new FilterHttpHandler(new PrescriptionEnhancedHandler()));
        server.createContext(RouteConstants.INPATIENT_ORDERS, new FilterHttpHandler(new InpatientOrderHandler()));
        server.createContext(RouteConstants.NURSING_RECORDS, new FilterHttpHandler(new NursingRecordHandler()));
        server.createContext(RouteConstants.QUALITY_CONTROL, new FilterHttpHandler(new QualityControlHandler()));
        server.createContext(RouteConstants.PATIENT_CHAIN, new FilterHttpHandler(new PatientChainHandler()));

        server.createContext(RouteConstants.LAB_TEST_ORDERS, new FilterHttpHandler(new LabTestOrderHandler()));
        server.createContext(RouteConstants.LAB_TEST_RESULTS, new FilterHttpHandler(new LabTestResultHandler()));
        server.createContext(RouteConstants.IMAGING_EXAM_ORDERS, new FilterHttpHandler(new ImagingExamOrderHandler()));
        server.createContext(RouteConstants.IMAGING_REPORTS, new FilterHttpHandler(new ImagingReportHandler()));
        server.createContext(RouteConstants.PATHOLOGY_EXAM_ORDERS, new FilterHttpHandler(new PathologyExamOrderHandler()));
        server.createContext(RouteConstants.SURGERY_SCHEDULES, new FilterHttpHandler(new SurgeryScheduleHandler()));
        server.createContext(RouteConstants.BLOOD_TRANSFUSION_ORDERS, new FilterHttpHandler(new BloodTransfusionOrderHandler()));
        server.createContext(RouteConstants.CLINICAL_PATHWAYS, new FilterHttpHandler(new ClinicalPathwayHandler()));
        server.createContext(RouteConstants.CLINICAL_PATHWAY_INSTANCES, new FilterHttpHandler(new ClinicalPathwayInstanceHandler()));

        MedicalManagementHandler medMgtHandler = new MedicalManagementHandler();
        server.createContext(RouteConstants.PERMISSIONS, new FilterHttpHandler(medMgtHandler));
        server.createContext(RouteConstants.QUALITY_CHECKS, new FilterHttpHandler(medMgtHandler));
        server.createContext(RouteConstants.CRITICAL_VALUES, new FilterHttpHandler(medMgtHandler));
        server.createContext(RouteConstants.INFECTION_SURVEILLANCES, new FilterHttpHandler(medMgtHandler));
        server.createContext(RouteConstants.ADVERSE_EVENTS, new FilterHttpHandler(medMgtHandler));
        server.createContext(RouteConstants.INFECTIOUS_DISEASE_REPORTS, new FilterHttpHandler(medMgtHandler));

        OperationManagementHandler opsHandler = new OperationManagementHandler();
        server.createContext(RouteConstants.BEDS, new FilterHttpHandler(new BedHandler()));
        server.createContext(RouteConstants.FINANCE_CHARGES, new FilterHttpHandler(opsHandler));
        server.createContext(RouteConstants.COST_ACCOUNTINGS, new FilterHttpHandler(opsHandler));
        server.createContext(RouteConstants.PERFORMANCE_ASSESSMENTS, new FilterHttpHandler(opsHandler));
        server.createContext(RouteConstants.EQUIPMENT_ASSETS, new FilterHttpHandler(opsHandler));
        server.createContext(RouteConstants.HR_STAFF, new FilterHttpHandler(opsHandler));

        HospitalUpgradeHandler upgradeHandler = new HospitalUpgradeHandler();
        server.createContext(RouteConstants.TRIAGE_QUEUE, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.QUEUE_DISPLAY, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.INSURANCE_SETTLEMENT, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.DRUG_SUPPLIERS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.DRUG_PURCHASE_ORDERS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.DRUG_PURCHASE_ITEMS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.DRUG_TRANSFER_ORDERS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.DRUG_TRANSFER_ITEMS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.PHARMACY_WINDOWS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.DRUG_INVENTORY_LEDGER, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.FINANCE_GENERAL_LEDGER, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.FINANCE_BUDGETS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.PAYROLL, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.COST_ACCOUNTING_DETAIL, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.ORDER_EXECUTION, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.SPECIMENS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.EXAMINATION_REPORTS, new FilterHttpHandler(upgradeHandler));
        server.createContext(RouteConstants.TREATMENT_EXECUTION, new FilterHttpHandler(upgradeHandler));

        server.createContext(RouteConstants.FILES, new FilterHttpHandler(new FileHandler()));
        server.createContext(RouteConstants.CLINICAL_ATTACHMENTS, new FilterHttpHandler(new ClinicalAttachmentHandler()));
        server.createContext(RouteConstants.PATIENT_IDENTITIES, new FilterHttpHandler(new PatientIdentityHandler()));
        server.createContext(RouteConstants.AUDIT_LOGS, new FilterHttpHandler(new AuditLogHandler()));

        server.createContext(RouteConstants.AUTH, new FilterHttpHandler(new AuthHandler()));

        server.setExecutor(null);
        server.start();
        System.out.println("[Server] HTTP服务器启动成功，端口: " + port);
        System.out.println("[Server] CORS 已启用 | 请求日志已启用 | 统一错误处理已启用");
    }

    public static void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    public static void main(String[] args) {
        try { startServer(); } catch (Exception e) { e.printStackTrace(); }
    }
}
