package dao;

import bean.PatientIdentity;
import java.util.List;

public interface PatientIdentityDAO {
    int upsert(PatientIdentity identity);
    List<PatientIdentity> findByPatientId(long patientId);
    List<PatientIdentity> findByIdentity(String identityType, String identityNo);
    int moveToPatient(long fromPatientId, long toPatientId);
}
