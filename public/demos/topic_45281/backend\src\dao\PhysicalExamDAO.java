package dao;

import bean.PhysicalExam;
import java.util.List;

public interface PhysicalExamDAO {
    int insert(PhysicalExam exam);
    int update(PhysicalExam exam);
    int delete(int id);
    PhysicalExam findById(int id);
    List<PhysicalExam> findAll();
    List<PhysicalExam> findByPatientId(int patientId);
    List<PhysicalExam> findByStatus(String status);
}