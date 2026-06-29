package service;

import bean.Examination;
import bean.PrescriptionExamination;
import dao.ExaminationDAO;
import dao.PrescriptionExaminationDAO;
import dao.impl.ExaminationDAOImpl;
import dao.impl.PrescriptionExaminationDAOImpl;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PrescriptionExaminationService {
    private PrescriptionExaminationDAO peDAO = new PrescriptionExaminationDAOImpl();
    private ExaminationDAO examinationDAO = new ExaminationDAOImpl();

    public int addPrescriptionExamination(PrescriptionExamination pe) {
        return peDAO.insert(pe);
    }

    public int updatePrescriptionExamination(PrescriptionExamination pe) {
        return peDAO.update(pe);
    }

    public int deletePrescriptionExamination(int id) {
        return peDAO.delete(id);
    }

    public PrescriptionExamination getById(int id) {
        return peDAO.findById(id);
    }

    public List<PrescriptionExamination> getAll() {
        List<PrescriptionExamination> list = peDAO.findAll();
        for (PrescriptionExamination pe : list) {
            if (pe.getExaminationName() == null || pe.getPrice() == null) {
                Examination exam = examinationDAO.findById(pe.getExaminationId());
                if (exam != null) {
                    if (pe.getExaminationName() == null) pe.setExaminationName(exam.getName());
                    if (pe.getCategory() == null) pe.setCategory(exam.getCategory());
                    if (pe.getPrice() == null) pe.setPrice(exam.getPrice());
                    if (pe.getTotalPrice() == null && exam.getPrice() != null) {
                        pe.setTotalPrice(exam.getPrice().multiply(new BigDecimal(pe.getQuantity())));
                    }
                    if (pe.getDept() == null) pe.setDept(exam.getDept());
                    peDAO.update(pe);
                }
            }
        }
        return list;
    }

    public List<PrescriptionExamination> getByPrescriptionId(int prescriptionId) {
        List<PrescriptionExamination> list = peDAO.findByPrescriptionId(prescriptionId);
        for (PrescriptionExamination pe : list) {
            if (pe.getExaminationName() == null || pe.getPrice() == null) {
                Examination exam = examinationDAO.findById(pe.getExaminationId());
                if (exam != null) {
                    if (pe.getExaminationName() == null) pe.setExaminationName(exam.getName());
                    if (pe.getCategory() == null) pe.setCategory(exam.getCategory());
                    if (pe.getPrice() == null) pe.setPrice(exam.getPrice());
                    if (pe.getTotalPrice() == null && exam.getPrice() != null) {
                        pe.setTotalPrice(exam.getPrice().multiply(new BigDecimal(pe.getQuantity())));
                    }
                    if (pe.getDept() == null) pe.setDept(exam.getDept());
                    peDAO.update(pe);
                }
            }
        }
        return list;
    }

    public int deleteByPrescriptionId(int prescriptionId) {
        return peDAO.deleteByPrescriptionId(prescriptionId);
    }

    public List<Map<String, Object>> getExaminationsWithDetails(int prescriptionId) {
        List<PrescriptionExamination> peList = peDAO.findByPrescriptionId(prescriptionId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (PrescriptionExamination pe : peList) {
            Examination exam = examinationDAO.findById(pe.getExaminationId());
            if (exam != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", pe.getId());
                item.put("prescriptionId", pe.getPrescriptionId());
                item.put("examinationId", pe.getExaminationId());
                item.put("examinationName", exam.getName());
                item.put("category", exam.getCategory());
                item.put("price", exam.getPrice());
                item.put("quantity", pe.getQuantity());
                item.put("totalPrice", exam.getPrice().multiply(new BigDecimal(pe.getQuantity())));
                item.put("status", pe.getStatus());
                item.put("result", pe.getResult());
                item.put("dept", exam.getDept());
                item.put("remark", exam.getRemark());
                item.put("createTime", pe.getCreateTime());
                result.add(item);
            }
        }
        return result;
    }

    public BigDecimal calculateTotalPrice(int prescriptionId) {
        List<Map<String, Object>> items = getExaminationsWithDetails(prescriptionId);
        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> item : items) {
            BigDecimal itemTotal = (BigDecimal) item.get("totalPrice");
            if (itemTotal != null) {
                total = total.add(itemTotal);
            }
        }
        return total;
    }

    public int updateStatus(int id, String status) {
        PrescriptionExamination pe = peDAO.findById(id);
        if (pe != null) {
            pe.setStatus(status);
            return peDAO.update(pe);
        }
        return 0;
    }

    public int updateResult(int id, String result) {
        PrescriptionExamination pe = peDAO.findById(id);
        if (pe != null) {
            pe.setResult(result);
            pe.setStatus("completed");
            return peDAO.update(pe);
        }
        return 0;
    }
}
