package service;

import bean.Appointment;
import dao.AppointmentDAO;
import dao.impl.AppointmentDAOImpl;
import java.util.List;

public class AppointmentService {
    private AppointmentDAO dao = new AppointmentDAOImpl();

    public int addAppointment(Appointment a) {
        if (a.getAppointmentNo() == null || a.getAppointmentNo().isEmpty()) {
            a.setAppointmentNo("APT" + System.currentTimeMillis());
        }
        return dao.insert(a);
    }

    public boolean cancelAppointment(int id, String reason) {
        Appointment a = dao.findById(id);
        if (a != null) {
            a.setStatus("已取消");
            a.setCancelReason(reason);
            return dao.update(a) > 0;
        }
        return false;
    }

    public boolean checkIn(int id) {
        Appointment a = dao.findById(id);
        if (a != null && "已预约".equals(a.getStatus())) {
            a.setStatus("已取号");
            a.setIsPaid(1);
            return dao.update(a) > 0;
        }
        return false;
    }

    public boolean completeAppointment(int id) {
        Appointment a = dao.findById(id);
        if (a != null) {
            a.setStatus("已就诊");
            return dao.update(a) > 0;
        }
        return false;
    }

    public List<Appointment> getPatientAppointments(int patientId) { return dao.findByPatientId(patientId); }
    public List<Appointment> getDoctorSchedule(int doctorId, String date) { return dao.findByDoctorIdAndDate(doctorId, date); }
    public List<Appointment> getAll(String status, int page, int size) { return dao.findAll(status, page, size); }
    public int countByStatus(String status) { return dao.countByStatus(status); }
}
