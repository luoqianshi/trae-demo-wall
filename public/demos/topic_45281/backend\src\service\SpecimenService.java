package service;

import bean.Specimen;
import dao.SpecimenDAO;
import dao.impl.SpecimenDAOImpl;
import java.util.List;

public class SpecimenService {
    private SpecimenDAO dao = new SpecimenDAOImpl();

    public int add(Specimen s) { return dao.insert(s); }
    public int update(Specimen s) { return dao.update(s); }
    public Specimen getById(int id) { return dao.findById(id); }
    public List<Specimen> getAll(Integer patientId, String status) { return dao.findAll(patientId, status); }
    public int delete(int id) { return dao.delete(id); }
}