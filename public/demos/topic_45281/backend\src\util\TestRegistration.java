package util;

import bean.Registration;
import service.RegistrationService;
import java.math.BigDecimal;

public class TestRegistration {
    public static void main(String[] args) {
        try {
            Registration reg = new Registration();
            reg.setPatientId(41);
            reg.setDoctorId(2);
            reg.setDept("外科");
            reg.setRegFee(new BigDecimal("50"));
            reg.setRegStatus("waiting");
            
            RegistrationService service = new RegistrationService();
            int result = service.register(reg);
            System.out.println("Result: " + result);
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}