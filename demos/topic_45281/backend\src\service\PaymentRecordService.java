package service;

import bean.PaymentRecord;
import bean.Charge;
import dao.impl.PaymentRecordDAOImpl;
import dao.impl.ChargeDAOImpl;
import java.util.List;

public class PaymentRecordService {
    private PaymentRecordDAOImpl dao = new PaymentRecordDAOImpl();

    public int add(PaymentRecord r) {
        int id = dao.insert(r);
        if (id > 0 && ("paid".equals(r.getPaymentStatus()) || "success".equals(r.getPaymentStatus()))) {
            Charge charge = new Charge();
            charge.setPatientId(r.getPatientId());
            charge.setPatientName(r.getPatientName());
            charge.setChargeType(r.getBusinessType());
            charge.setRelateId(r.getBusinessId());
            charge.setTotalFee(r.getAmount());
            charge.setChargeTime(new java.util.Date());
            charge.setOperator(r.getCashierName());
            charge.setPaymentType(r.getPaymentMethod());
            charge.setStatus("paid");
            new ChargeDAOImpl().insert(charge);
        }
        return id;
    }

    public List<PaymentRecord> getByPatientId(int patientId) {
        return dao.findPaymentsByPatientId(patientId);
    }

    public PaymentRecord getByOrderNo(String orderNo) {
        return dao.findByOrderNo(orderNo);
    }

    public List<PaymentRecord> getAll(int page, int size) {
        return dao.findAllPayments(page, size);
    }

    public int updateStatus(String orderNo, String status) {
        int result = dao.updateStatus(orderNo, status);
        if (result > 0 && ("paid".equals(status) || "success".equals(status))) {
            PaymentRecord pr = dao.findByOrderNo(orderNo);
            if (pr != null) {
                Charge charge = new Charge();
                charge.setPatientId(pr.getPatientId());
                charge.setPatientName(pr.getPatientName());
                charge.setChargeType(pr.getBusinessType());
                charge.setRelateId(pr.getBusinessId());
                charge.setTotalFee(pr.getAmount());
                charge.setChargeTime(new java.util.Date());
                charge.setOperator(pr.getCashierName());
                charge.setPaymentType(pr.getPaymentMethod());
                charge.setStatus("paid");
                new ChargeDAOImpl().insert(charge);
            }
        }
        return result;
    }
}