package service;

import bean.Bed;
import dao.impl.BedDAOImpl;
import dao.BedDAO;
import java.util.List;

public class BedService {
    private BedDAO bedDAO = new BedDAOImpl();

    public int add(Bed bed) {
        return bedDAO.insert(bed);
    }

    public int update(Bed bed) {
        return bedDAO.update(bed);
    }

    public int delete(int id) {
        return bedDAO.delete(id);
    }

    public int deleteAll() {
        return bedDAO.deleteAll();
    }

    public int deleteById(int id) {
        return bedDAO.delete(id);
    }

    public Bed getById(int id) {
        return bedDAO.findById(id);
    }

    public List<Bed> getAll() {
        return bedDAO.findAll();
    }

    public List<Bed> getByDept(String dept) {
        return bedDAO.findByDept(dept);
    }

    public List<Bed> getByStatus(String status) {
        return bedDAO.findByStatus(status);
    }

    public int allocate(int bedId, int patientId, String patientName) {
        Bed bed = bedDAO.findById(bedId);
        if (bed != null) {
            bed.setStatus("occupied");
            bed.setCurrentPatientId(patientId);
            bed.setCurrentPatientName(patientName);
            return bedDAO.update(bed);
        }
        return 0;
    }

    public int vacate(int bedId) {
        Bed bed = bedDAO.findById(bedId);
        if (bed != null) {
            bed.setStatus("vacant");
            bed.setCurrentPatientId(0);
            bed.setCurrentPatientName(null);
            return bedDAO.update(bed);
        }
        return 0;
    }
}