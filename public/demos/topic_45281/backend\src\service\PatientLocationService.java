package service;

import bean.PatientLocation;
import dao.impl.PatientLocationDAOImpl;
import java.util.List;

public class PatientLocationService {
    private PatientLocationDAOImpl dao = new PatientLocationDAOImpl();

    public int add(PatientLocation l) {
        return dao.insert(l);
    }

    public List<PatientLocation> getByPatientId(int patientId) {
        return dao.findByLocPatientId(patientId);
    }

    public int checkOut(int id) {
        return dao.checkOut(id);
    }
}