package service;

import bean.Inpatient;
import bean.Bed;
import bean.Charge;
import bean.Prescription;
import dao.impl.InpatientDAOImpl;
import dao.impl.BedDAOImpl;
import dao.impl.ChargeDAOImpl;
import dao.impl.PrescriptionDAOImpl;
import dao.InpatientDAO;
import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.Map;
import java.util.LinkedHashMap;

public class InpatientService {
    private InpatientDAO inpatientDAO = new InpatientDAOImpl();

    public int add(Inpatient inpatient) {
        int id = inpatientDAO.insert(inpatient);
        if (id > 0 && inpatient.getBedId() > 0) {
            BedService bedService = new BedService();
            bedService.allocate(inpatient.getBedId(), inpatient.getPatientId(), inpatient.getPatientName());
        }
        return id;
    }

    public int update(Inpatient inpatient) {
        if ("出院".equals(inpatient.getStatus()) || "discharged".equals(inpatient.getStatus())) {
            Inpatient old = inpatientDAO.findById(inpatient.getId());
            if (old != null && old.getBedId() > 0) {
                new BedService().vacate(old.getBedId());
            }
        }
        return inpatientDAO.update(inpatient);
    }

    public int delete(int id) {
        return inpatientDAO.delete(id);
    }

    public Inpatient getById(int id) {
        return inpatientDAO.findById(id);
    }

    public List<Inpatient> getAll() {
        return inpatientDAO.findAll();
    }

    public List<Inpatient> getByPatientId(int patientId) {
        return inpatientDAO.findByPatientId(patientId);
    }

    public List<Inpatient> getByDept(String dept) {
        return inpatientDAO.findByDept(dept);
    }

    public List<Inpatient> getByStatus(String status) {
        return inpatientDAO.findByStatus(status);
    }

    public Map<String, Object> calculateSettlement(int id) {
        Inpatient inpatient = inpatientDAO.findById(id);
        if (inpatient == null) return null;

        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> details = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        List<Charge> charges = new ChargeDAOImpl().findByPatientId(inpatient.getPatientId());
        BigDecimal drugFee = BigDecimal.ZERO;
        BigDecimal examFee = BigDecimal.ZERO;
        BigDecimal regFee = BigDecimal.ZERO;
        BigDecimal otherFee = BigDecimal.ZERO;
        for (Charge c : charges) {
            if ("prescription".equals(c.getChargeType())) drugFee = drugFee.add(c.getTotalFee());
            else if ("examination".equals(c.getChargeType())) examFee = examFee.add(c.getTotalFee());
            else if ("registration".equals(c.getChargeType())) regFee = regFee.add(c.getTotalFee());
            else otherFee = otherFee.add(c.getTotalFee());
        }

        Map<String, Object> drugItem = new LinkedHashMap<>();
        drugItem.put("name", "药品费"); drugItem.put("amount", drugFee);
        details.add(drugItem); total = total.add(drugFee);

        Map<String, Object> examItem = new LinkedHashMap<>();
        examItem.put("name", "检查费"); examItem.put("amount", examFee);
        details.add(examItem); total = total.add(examFee);

        Map<String, Object> regItem = new LinkedHashMap<>();
        regItem.put("name", "挂号费"); regItem.put("amount", regFee);
        details.add(regItem); total = total.add(regFee);

        if (otherFee.compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> otherItem = new LinkedHashMap<>();
            otherItem.put("name", "其他费用"); otherItem.put("amount", otherFee);
            details.add(otherItem); total = total.add(otherFee);
        }

        BigDecimal bedFee = BigDecimal.ZERO;
        if (inpatient.getBedId() > 0) {
            Bed bed = new BedDAOImpl().findById(inpatient.getBedId());
            BigDecimal dailyFee = (bed != null && bed.getDailyFee() != null) ? bed.getDailyFee() : new BigDecimal("50.00");
            long days = 1;
            if (inpatient.getAdmissionDate() != null) {
                long diff = new java.util.Date().getTime() - inpatient.getAdmissionDate().getTime();
                days = diff / (1000 * 60 * 60 * 24);
                if (days < 1) days = 1;
            }
            bedFee = dailyFee.multiply(new BigDecimal(days));
            Map<String, Object> bedItem = new LinkedHashMap<>();
            bedItem.put("name", "床位费(" + days + "天×" + dailyFee + "元/天)");
            bedItem.put("amount", bedFee);
            details.add(bedItem);
            total = total.add(bedFee);
        }

        BigDecimal deposit = inpatient.getDeposit() != null ? inpatient.getDeposit() : BigDecimal.ZERO;
        BigDecimal balance = total.subtract(deposit);

        result.put("inpatientId", id);
        result.put("patientName", inpatient.getPatientName());
        result.put("admissionDate", inpatient.getAdmissionDate());
        result.put("details", details);
        result.put("totalFee", total);
        result.put("deposit", deposit);
        result.put("balance", balance);
        return result;
    }

    public int discharge(int id, String diagnosis) {
        Inpatient inpatient = inpatientDAO.findById(id);
        if (inpatient != null) {
            Map<String, Object> settlement = calculateSettlement(id);
            inpatient.setStatus("discharged");
            inpatient.setDischargeDate(new java.util.Date());
            inpatient.setDiagnosis(diagnosis);
            if (settlement != null) {
                inpatient.setTotalFee((BigDecimal) settlement.get("totalFee"));
            }
            return inpatientDAO.update(inpatient);
        }
        return 0;
    }
}