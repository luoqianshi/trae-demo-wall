package dao;

import bean.PaymentRecord;
import java.util.List;

public interface PaymentRecordDAO {
    int insert(PaymentRecord r);
    PaymentRecord findByOrderNo(String orderNo);
    List<PaymentRecord> findPaymentsByPatientId(int patientId);
    List<PaymentRecord> findAllPayments(int page, int size);
    int updateStatus(String orderNo, String status);
}
