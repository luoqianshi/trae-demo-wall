package service;

import bean.Doctor;
import dao.DoctorDAO;
import dao.impl.DoctorDAOImpl;
import java.util.List;

public class DoctorService {
    private DoctorDAO doctorDAO = new DoctorDAOImpl();

    public int addDoctor(Doctor doctor) {
        return doctorDAO.insert(doctor);
    }

    public int updateDoctor(Doctor doctor) {
        return doctorDAO.update(doctor);
    }

    public int deleteDoctor(int id) {
        return doctorDAO.delete(id);
    }

    public Doctor getDoctorById(int id) {
        return doctorDAO.findById(id);
    }

    public List<Doctor> getAllDoctors() {
        return doctorDAO.findAll();
    }

    public List<Doctor> getDoctorsByDept(String dept) {
        return doctorDAO.findByDept(dept);
    }

    public List<Doctor> searchDoctors(String keyword) {
        return doctorDAO.findByKeyword(keyword);
    }
}
