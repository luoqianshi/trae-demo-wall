import type {
  Drug, Patient, Doctor, Registration, Prescription, PrescriptionItem,
  MedicalRecord, Charge, QueueItem, ApiResponse, User, LoginRequest, LoginResponse,
  InventoryLog, PrescriptionReview, QueueCall, MedicalRecordVersion, Department,
  Examination, PrescriptionExamination, Inpatient, Bed, NurseRecord, Surgery,
  AnesthesiaRecord, MedicalRecordArchive, PhysicalExam, ChargeItem, VitalSign
} from './types';

const API_BASE = '/api';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;

interface ApiResponseWrapper<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  id?: number;
  user?: any;
}

/** 带超时的 fetch */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`请求超时 (${timeoutMs / 1000}秒)`));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

async function request<T>(url: string, options?: RequestInit, retryCount = 0): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    }, REQUEST_TIMEOUT_MS);

    const rawText = await response.text();
    let json: any = null;
    if (rawText) {
      try { json = JSON.parse(rawText); } catch { json = null; }
    }

    if (!response.ok) {
      const message = json?.error || json?.message || rawText || `服务器错误 (${response.status})`;
      throw new Error(message);
    }

    if (json === null) {
      return undefined as T;
    }

    if (json.success === false) {
      throw new Error(json.error || json.message || '请求失败');
    }

    // 处理不同的响应格式
    if (Array.isArray(json)) return json as T;
    if (json.data !== undefined) return json.data as T;

    const arrayKeys = ['registrations', 'patients', 'doctors', 'prescriptions', 'medicalRecords',
                       'charges', 'users', 'departments', 'inventoryLogs', 'queueCalls', 'items',
                       'versions', 'reviews', 'drugs', 'examinations', 'prescriptionExaminations',
                       'inpatients', 'beds', 'nurseRecords', 'surgerys', 'anesthesiaRecords',
                       'medicalRecordArchives', 'physicalExams', 'vitalSigns', 'records',
                       'prescriptionsEnhanced', 'attachments', 'files', 'identities'];
    for (const key of arrayKeys) {
      if (json[key] !== undefined && Array.isArray(json[key])) {
        return json[key] as T;
      }
    }

    return json as T;
  } catch (error: any) {
    // 网络错误或超时 - 重试一次
    if (retryCount < MAX_RETRIES && error.name === 'AbortError') {
      console.warn(`[API] 请求超时，正在重试 (${retryCount + 1}/${MAX_RETRIES}): ${url}`);
      return request<T>(url, options, retryCount + 1);
    }
    throw error;
  }
}

export const drugService = {
  getAll: (keyword?: string) => 
    request<Drug[]>(`${API_BASE}/drugs${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  
  getById: (id: number) => request<Drug>(`${API_BASE}/drugs/${id}`),
  
  add: (drug: Partial<Drug>) =>
    request<ApiResponse>(`${API_BASE}/drugs`, {
      method: 'POST',
      body: JSON.stringify(drug),
    }),
  
  update: (id: number, drug: Partial<Drug>) =>
    request<ApiResponse>(`${API_BASE}/drugs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drug),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/drugs/${id}`, {
      method: 'DELETE',
    }),
};

export const patientService = {
  getAll: (keyword?: string) => 
    request<Patient[]>(`${API_BASE}/patients${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  
  getById: (id: number) => request<Patient>(`${API_BASE}/patients/${id}`),
  
  add: (patient: Partial<Patient>) =>
    request<ApiResponse>(`${API_BASE}/patients`, {
      method: 'POST',
      body: JSON.stringify(patient),
    }),

  checkDuplicate: (params: { idCard?: string; phone?: string; medicalInsuranceNo?: string; medicalRecordNo?: string; excludePatientId?: number }) => {
    const query = new URLSearchParams();
    if (params.idCard) query.append('idCard', params.idCard);
    if (params.phone) query.append('phone', params.phone);
    if (params.medicalInsuranceNo) query.append('medicalInsuranceNo', params.medicalInsuranceNo);
    if (params.medicalRecordNo) query.append('medicalRecordNo', params.medicalRecordNo);
    if (params.excludePatientId) query.append('excludePatientId', String(params.excludePatientId));
    return request<{ hasDuplicate: boolean; duplicates: any[]; count: number }>(`${API_BASE}/patient-identities/check-duplicate?${query.toString()}`);
  },
  
  update: (id: number, patient: Partial<Patient>) =>
    request<ApiResponse>(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
    }),
  
  search: (keyword: string) =>
    request<Patient[]>(`${API_BASE}/patients`, {
      method: 'POST',
      body: JSON.stringify({ keyword, _search: true }),
    }),
};

export const doctorService = {
  getAll: (keyword?: string) => 
    request<Doctor[]>(`${API_BASE}/doctors${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  
  getById: (id: number) => request<Doctor>(`${API_BASE}/doctors/${id}`),
  
  add: (doctor: Partial<Doctor>) =>
    request<ApiResponse>(`${API_BASE}/doctors`, {
      method: 'POST',
      body: JSON.stringify(doctor),
    }),
  
  update: (id: number, doctor: Partial<Doctor>) =>
    request<ApiResponse>(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctor),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
    }),
};

export const departmentService = {
  getAll: () => request<Department[]>(`${API_BASE}/departments`),
  
  getById: (id: number) => request<Department>(`${API_BASE}/departments/${id}`),
  
  add: (dept: Partial<Department>) =>
    request<ApiResponse>(`${API_BASE}/departments`, {
      method: 'POST',
      body: JSON.stringify(dept),
    }),
  
  update: (id: number, dept: Partial<Department>) =>
    request<ApiResponse>(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dept),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/departments/${id}`, {
      method: 'DELETE',
    }),
};

export const registrationService = {
  getAll: () => request<Registration[]>(`${API_BASE}/registrations`),
  
  add: (reg: Partial<Registration>) =>
    request<ApiResponse>(`${API_BASE}/registrations`, {
      method: 'POST',
      body: JSON.stringify(reg),
    }),
  
  update: (id: number, reg: Partial<Registration>) =>
    request<ApiResponse>(`${API_BASE}/registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reg),
    }),
  
  updateStatus: (id: number, status: string) =>
    request<ApiResponse>(`${API_BASE}/registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ regStatus: status }),
    }),
};

export const prescriptionService = {
  getAll: () => request<Prescription[]>(`${API_BASE}/prescriptions`),
  
  getById: (id: number) => request<Prescription>(`${API_BASE}/prescriptions/${id}`),
  
  add: (pres: Partial<Prescription>) =>
    request<ApiResponse>(`${API_BASE}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(pres),
    }),
  
  updateStatus: (id: number, status: string) =>
    request<ApiResponse>(`${API_BASE}/prescriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const prescriptionItemService = {
  getAll: () => request<PrescriptionItem[]>(`${API_BASE}/prescription-items`),
  
  getByPrescriptionId: (prescriptionId: number) => 
    request<PrescriptionItem[]>(`${API_BASE}/prescription-items/${prescriptionId}`),
  
  add: (item: Partial<PrescriptionItem>) =>
    request<ApiResponse>(`${API_BASE}/prescription-items`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  
  update: (item: PrescriptionItem) =>
    request<ApiResponse>(`${API_BASE}/prescription-items`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/prescription-items`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export const medicalRecordService = {
  getAll: (patientId?: number) => 
    request<MedicalRecord[]>(`${API_BASE}/medical-records${patientId ? `?patientId=${patientId}` : ''}`),
  
  getByPatientId: (patientId: number) =>
    request<MedicalRecord[]>(`${API_BASE}/medical-records?patientId=${patientId}`),
  
  add: (record: Partial<MedicalRecord>) =>
    request<ApiResponse>(`${API_BASE}/medical-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    }),
  
  update: (id: number, record: Partial<MedicalRecord>) =>
    request<ApiResponse>(`${API_BASE}/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    }),
};

export const chargeService = {
  getAll: () => request<Charge[]>(`${API_BASE}/charges`),
  
  add: (charge: Partial<Charge>) =>
    request<ApiResponse>(`${API_BASE}/charges`, {
      method: 'POST',
      body: JSON.stringify(charge),
    }),
  
  getItems: (chargeId: number) =>
    request<ChargeItem[]>(`${API_BASE}/charges/${chargeId}/items`),
  
  updateStatus: (id: number, status: string) =>
    request<ApiResponse>(`${API_BASE}/charges/status`, {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    }),
  
  refund: (chargeId: number, operator: string) =>
    request<ApiResponse>(`${API_BASE}/charges/refund`, {
      method: 'POST',
      body: JSON.stringify({ chargeId, operator }),
    }),
};

export const doctorWorkstationService = {
  getQueueByDoctor: (doctorId: number) =>
    request<QueueItem[]>(`${API_BASE}/doctor-workstation/queue/doctor/${doctorId}`),
  
  getQueueByStatus: (status: string) =>
    request<QueueItem[]>(`${API_BASE}/doctor-workstation/queue/status/${status}`),
  
  callPatient: (queueId: number) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/queue/call/${queueId}`, { method: 'POST' }),
  
  missPatient: (queueId: number) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/queue/miss/${queueId}`, { method: 'PUT' }),
  
  finishPatient: (queueId: number) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/queue/finish/${queueId}`, { method: 'POST' }),
  
  getRegistrationsByDoctor: (doctorId: number) =>
    request<Registration[]>(`${API_BASE}/doctor-workstation/registrations/doctor/${doctorId}`),
  
  getPatientDetail: (patientId: number) =>
    request<Patient>(`${API_BASE}/doctor-workstation/patient/${patientId}`),
  
  getRecordsByPatient: (patientId: number) =>
    request<MedicalRecord[]>(`${API_BASE}/medical-records?patientId=${patientId}`),
  
  getPrescriptionsByPatient: (patientId: number) =>
    request<Prescription[]>(`${API_BASE}/doctor-workstation/prescriptions/patient/${patientId}`),
  
  getPrescriptionsByDoctor: (doctorId: number) =>
    request<Prescription[]>(`${API_BASE}/doctor-workstation/prescriptions/doctor/${doctorId}`),
  
  getPrescriptionItems: (prescriptionId: number) =>
    request<PrescriptionItem[]>(`${API_BASE}/doctor-workstation/prescription-items/${prescriptionId}`),
  
  calculatePrescriptionPrice: (prescriptionId: number) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/prescription/price/${prescriptionId}`, { method: 'PUT' }),
  
  cancelPrescription: (prescriptionId: number) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/prescription/cancel/${prescriptionId}`, { method: 'PUT' }),
  
  voidPrescription: (prescriptionId: number) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/prescription/void`, {
      method: 'PUT',
      body: JSON.stringify({ id: prescriptionId }),
    }),
  
  createPrescriptionWithItems: (data: {
    patientId: number;
    doctorId: number;
    registrationId: number;
    items: string;
  }) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/prescription-with-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createRegistrationAndPrescription: (data: {
    patientId: number;
    doctorId: number;
    dept: string;
    regFee: number;
    items: string;
  }) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/create-registration-and-prescription`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createRegistrationAndRecord: (data: {
    patientId: number;
    doctorId: number;
    dept: string;
    regFee: number;
    chiefComplaint?: string;
    presentIllness?: string;
    pastHistory?: string;
    physicalExam?: string;
    diagnosis?: string;
    treatmentPlan?: string;
  }) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/create-registration-and-record`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  fullDiagnosis: (data: {
    patientId: number;
    doctorId: number;
    registrationId: number;
    medicalRecord: Partial<MedicalRecord>;
    prescription: {
      items: Array<{ drugId: number; num: number; usage: string; days: number }>;
    };
  }) =>
    request<ApiResponse>(`${API_BASE}/doctor-workstation/full-diagnosis`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkPrescription: (patientId: number, drugs: Array<{ drugId: number; num: number; days: number }>) =>
    request<{ success: boolean; safe: boolean; warnings: Array<{
      level: 'high' | 'medium' | 'low';
      type: 'allergy' | 'duplicate' | 'dosage' | 'interaction';
      drugName: string;
      message: string;
      suggestion: string;
    }> }>(`${API_BASE}/doctor-workstation/prescription/check`, {
      method: 'POST',
      body: JSON.stringify({ patientId, drugs }),
    }),
  
  getPatientHistory: (patientId: number) =>
    request<{
      success: boolean;
      records: MedicalRecord[];
      prescriptions: Prescription[];
      allergies: string[];
    }>(`${API_BASE}/doctor-workstation/patient/${patientId}/history`),
};

export const statisticsService = {
  getRegistrationStats: (startDate?: string, endDate?: string, dept?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (dept) params.append('dept', dept);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any>(`${API_BASE}/statistics/registration${query}`);
  },
  
  getChargeStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any>(`${API_BASE}/statistics/charge${query}`);
  },
  
  getDoctorWorkload: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any>(`${API_BASE}/statistics/doctor${query}`);
  },
  
  getDrugStats: () => request<any>(`${API_BASE}/statistics/drug`),
  
  getDrugWarning: () => request<any>(`${API_BASE}/drugs/warnings`),
};

export const authService = {
  login: (credentials: LoginRequest) =>
    request<LoginResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  resetPassword: (accountId: number) =>
    request<ApiResponse>(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    }),

  unlock: (accountId: number) =>
    request<ApiResponse>(`${API_BASE}/auth/unlock`, {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    }),

  getAccounts: (params?: { userType?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.userType) query.set('userType', params.userType);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<{ success: boolean; accounts: User[]; count: number }>(
      `${API_BASE}/auth/accounts${qs ? `?${qs}` : ''}`
    );
  },

  getLoginLogs: (offset = 0, limit = 50) =>
    request<{ success: boolean; logs: any[]; total: number }>(
      `${API_BASE}/auth/login-logs?offset=${offset}&limit=${limit}`
    ),

  getLoginLogsByAccount: (accountId: number) =>
    request<{ success: boolean; logs: any[]; total: number }>(
      `${API_BASE}/auth/login-logs?accountId=${accountId}`
    ),

  updateAccount: (id: number, data: { status?: string }) =>
    request<ApiResponse>(`${API_BASE}/auth/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createAccount: (data: { loginName: string; userType: string; relateId: number }) =>
    request<ApiResponse>(`${API_BASE}/auth/create-account`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const userService = {
  login: (credentials: LoginRequest) =>
    request<LoginResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  getAll: () => request<User[]>(`${API_BASE}/users`),
  
  add: (user: Partial<User> & { password: string }) =>
    request<ApiResponse>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  
  update: (user: User) =>
    request<ApiResponse>(`${API_BASE}/users`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/users`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export const inventoryLogService = {
  getAll: () => request<InventoryLog[]>(`${API_BASE}/inventory-logs`),
  
  getByDrugId: (drugId: number) =>
    request<InventoryLog[]>(`${API_BASE}/inventory-logs/drug/${drugId}`),
  
  add: (log: Partial<InventoryLog>) =>
    request<ApiResponse>(`${API_BASE}/inventory-logs`, {
      method: 'POST',
      body: JSON.stringify(log),
    }),
  
  update: (log: InventoryLog) =>
    request<ApiResponse>(`${API_BASE}/inventory-logs`, {
      method: 'PUT',
      body: JSON.stringify(log),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/inventory-logs`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export const prescriptionReviewService = {
  getAll: () => request<PrescriptionReview[]>(`${API_BASE}/prescription-reviews`),
  
  getByPrescriptionId: (prescriptionId: number) =>
    request<PrescriptionReview[]>(`${API_BASE}/prescription-reviews/prescription/${prescriptionId}`),
  
  add: (review: Partial<PrescriptionReview>) =>
    request<ApiResponse>(`${API_BASE}/prescription-reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    }),
  
  update: (review: PrescriptionReview) =>
    request<ApiResponse>(`${API_BASE}/prescription-reviews`, {
      method: 'PUT',
      body: JSON.stringify(review),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/prescription-reviews`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export const queueCallService = {
  getAll: () => request<QueueCall[]>(`${API_BASE}/queue-calls`),
  
  getByDept: (dept: string) =>
    request<QueueCall[]>(`${API_BASE}/queue-calls/dept/${dept}`),
  
  getByStatus: (status: string) =>
    request<QueueCall[]>(`${API_BASE}/queue-calls/status/${status}`),
  
  add: (call: Partial<QueueCall>) =>
    request<ApiResponse>(`${API_BASE}/queue-calls`, {
      method: 'POST',
      body: JSON.stringify(call),
    }),
  
  update: (call: QueueCall) =>
    request<ApiResponse>(`${API_BASE}/queue-calls`, {
      method: 'PUT',
      body: JSON.stringify(call),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/queue-calls`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export const medicalRecordVersionService = {
  getAll: () => request<MedicalRecordVersion[]>(`${API_BASE}/medical-record-versions`),
  
  getByRecordId: (recordId: number) =>
    request<MedicalRecordVersion[]>(`${API_BASE}/medical-record-versions/record/${recordId}`),
  
  add: (version: Partial<MedicalRecordVersion>) =>
    request<ApiResponse>(`${API_BASE}/medical-record-versions`, {
      method: 'POST',
      body: JSON.stringify(version),
    }),
  
  update: (version: MedicalRecordVersion) =>
    request<ApiResponse>(`${API_BASE}/medical-record-versions`, {
      method: 'PUT',
      body: JSON.stringify(version),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/medical-record-versions`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export const pharmacyService = {
  getPendingPrescriptions: () =>
    request<Prescription[]>(`${API_BASE}/pharmacy/pending`),

  getDispensedPrescriptions: () =>
    request<Prescription[]>(`${API_BASE}/pharmacy/dispensed`),

  getPreparedPrescriptions: () =>
    request<Prescription[]>(`${API_BASE}/pharmacy/prepared`),

  getPrescriptionItems: (prescriptionId: number) =>
    request<PrescriptionItem[]>(`${API_BASE}/pharmacy/prescription?prescriptionId=${prescriptionId}`),
  
  checkStock: (prescriptionId: number) =>
    request<{ success: boolean; canDispense: boolean; insufficientDrugs?: string[] }>(
      `${API_BASE}/pharmacy/check-stock`,
      {
        method: 'POST',
        body: JSON.stringify({ prescriptionId }),
      }
    ),
  
  dispense: (prescriptionId: number, operator: string) =>
    request<ApiResponse>(`${API_BASE}/pharmacy/dispense`, {
      method: 'POST',
      body: JSON.stringify({ prescriptionId, operator }),
    }),
};

export const examinationService = {
  getAll: (keyword?: string) =>
    request<Examination[]>(`${API_BASE}/examinations${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  
  getByCategory: (category: 'lab' | 'image') =>
    request<Examination[]>(`${API_BASE}/examinations?category=${category}`),
  
  getById: (id: number) =>
    request<Examination>(`${API_BASE}/examinations/${id}`),
  
  add: (examination: Partial<Examination>) =>
    request<ApiResponse>(`${API_BASE}/examinations`, {
      method: 'POST',
      body: JSON.stringify(examination),
    }),
  
  update: (id: number, examination: Partial<Examination>) =>
    request<ApiResponse>(`${API_BASE}/examinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(examination),
    }),
  
  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/examinations/${id}`, {
      method: 'DELETE',
    }),
};

export const prescriptionExaminationService = {
  getAll: () =>
    request<PrescriptionExamination[]>(`${API_BASE}/prescription-examinations`),

  getByPrescriptionId: (prescriptionId: number) =>
    request<PrescriptionExamination[]>(`${API_BASE}/prescription-examinations?prescriptionId=${prescriptionId}`),

  add: (pe: Partial<PrescriptionExamination>) =>
    request<ApiResponse>(`${API_BASE}/prescription-examinations`, {
      method: 'POST',
      body: JSON.stringify(pe),
    }),

  update: (id: number, data: Partial<PrescriptionExamination>) =>
    request<ApiResponse>(`${API_BASE}/prescription-examinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string) =>
    request<ApiResponse>(`${API_BASE}/prescription-examinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateResult: (id: number, result: string) =>
    request<ApiResponse>(`${API_BASE}/prescription-examinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ result }),
    }),

  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/prescription-examinations/${id}`, {
      method: 'DELETE',
    }),
};

export const inpatientService = {
  getAll: () => request<Inpatient[]>(`${API_BASE}/inpatients`),

  getById: (id: number) => request<Inpatient>(`${API_BASE}/inpatients/${id}`),

  getByPatientId: (patientId: number) =>
    request<Inpatient[]>(`${API_BASE}/inpatients?patientId=${patientId}`),

  getByDept: (dept: string) =>
    request<Inpatient[]>(`${API_BASE}/inpatients?dept=${dept}`),

  getByStatus: (status: 'admitted' | 'discharged') =>
    request<Inpatient[]>(`${API_BASE}/inpatients?status=${status}`),

  add: (inpatient: Partial<Inpatient>) =>
    request<ApiResponse>(`${API_BASE}/inpatients`, {
      method: 'POST',
      body: JSON.stringify(inpatient),
    }),

  update: (id: number, inpatient: Partial<Inpatient>) =>
    request<ApiResponse>(`${API_BASE}/inpatients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inpatient),
    }),

  discharge: (id: number, diagnosis: string) =>
    request<ApiResponse>(`${API_BASE}/inpatients/discharge/${id}`, {
      method: 'POST',
      body: JSON.stringify({ diagnosis }),
    }),

  getSettlement: (id: number) =>
    request<{
      inpatientId: number;
      patientName: string;
      admissionDate: string;
      details: { name: string; amount: number }[];
      totalFee: number;
      deposit: number;
      balance: number;
    }>(`${API_BASE}/inpatients/settlement/${id}`),
};

export const bedService = {
  getAll: () => request<Bed[]>(`${API_BASE}/beds`),

  getByDept: (dept: string) =>
    request<Bed[]>(`${API_BASE}/beds?dept=${dept}`),

  getByStatus: (status: 'vacant' | 'occupied' | 'maintenance') =>
    request<Bed[]>(`${API_BASE}/beds?status=${status}`),

  add: (bed: Partial<Bed>) =>
    request<ApiResponse>(`${API_BASE}/beds`, {
      method: 'POST',
      body: JSON.stringify(bed),
    }),

  update: (id: number, bed: Partial<Bed>) =>
    request<ApiResponse>(`${API_BASE}/beds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bed),
    }),

  allocate: (bedId: number, patientId: number, patientName: string) =>
    request<ApiResponse>(`${API_BASE}/beds/allocate/${bedId}`, {
      method: 'POST',
      body: JSON.stringify({ patientId, patientName }),
    }),

  vacate: (bedId: number) =>
    request<ApiResponse>(`${API_BASE}/beds/vacate/${bedId}`, {
      method: 'POST',
    }),
};

export const vitalSignService = {
  getAll: () => request<VitalSign[]>(`${API_BASE}/vital-signs`),

  getByInpatientId: (inpatientId: number) =>
    request<VitalSign[]>(`${API_BASE}/vital-signs?inpatientId=${inpatientId}`),

  getByPatientId: (patientId: number) =>
    request<VitalSign[]>(`${API_BASE}/vital-signs?patientId=${patientId}`),

  getLatest: (params: { patientId?: number; inpatientId?: number }) => {
    const query = params.patientId
      ? `?patientId=${params.patientId}`
      : params.inpatientId
        ? `?inpatientId=${params.inpatientId}`
        : '';
    return request<VitalSign | {}>(`${API_BASE}/vital-signs/latest${query}`);
  },

  add: (vitalSign: Partial<VitalSign>) =>
    request<ApiResponse>(`${API_BASE}/vital-signs`, {
      method: 'POST',
      body: JSON.stringify(vitalSign),
    }),

  update: (id: number, vitalSign: Partial<VitalSign>) =>
    request<ApiResponse>(`${API_BASE}/vital-signs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vitalSign),
    }),
};

export const nurseRecordService = {
  getAll: () => request<NurseRecord[]>(`${API_BASE}/nurse-records`),

  getByInpatientId: (inpatientId: number) =>
    request<NurseRecord[]>(`${API_BASE}/nurse-records?inpatientId=${inpatientId}`),

  add: (record: Partial<NurseRecord>) =>
    request<ApiResponse>(`${API_BASE}/nurse-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  update: (id: number, record: Partial<NurseRecord>) =>
    request<ApiResponse>(`${API_BASE}/nurse-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    }),
};

export const surgeryService = {
  getAll: () => request<Surgery[]>(`${API_BASE}/surgeries`),

  getById: (id: number) => request<Surgery>(`${API_BASE}/surgeries/${id}`),

  getByPatientId: (patientId: number) =>
    request<Surgery[]>(`${API_BASE}/surgeries?patientId=${patientId}`),

  getByDept: (dept: string) =>
    request<Surgery[]>(`${API_BASE}/surgeries?dept=${dept}`),

  getByStatus: (status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') =>
    request<Surgery[]>(`${API_BASE}/surgeries?status=${status}`),

  add: (surgery: Partial<Surgery>) =>
    request<ApiResponse>(`${API_BASE}/surgeries`, {
      method: 'POST',
      body: JSON.stringify(surgery),
    }),

  update: (id: number, surgery: Partial<Surgery>) =>
    request<ApiResponse>(`${API_BASE}/surgeries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(surgery),
    }),

  updateStatus: (id: number, status: string) =>
    request<ApiResponse>(`${API_BASE}/surgeries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const anesthesiaRecordService = {
  getAll: () => request<AnesthesiaRecord[]>(`${API_BASE}/anesthesia-records`),

  getBySurgeryId: (surgeryId: number) =>
    request<AnesthesiaRecord[]>(`${API_BASE}/anesthesia-records?surgeryId=${surgeryId}`),

  add: (record: Partial<AnesthesiaRecord>) =>
    request<ApiResponse>(`${API_BASE}/anesthesia-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  update: (id: number, record: Partial<AnesthesiaRecord>) =>
    request<ApiResponse>(`${API_BASE}/anesthesia-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    }),
};

export const medicalRecordArchiveService = {
  getAll: () => request<MedicalRecordArchive[]>(`${API_BASE}/medical-record-archives`),

  getByStatus: (status: 'pending' | 'archived' | 'completed') =>
    request<MedicalRecordArchive[]>(`${API_BASE}/medical-record-archives?status=${status}`),

  add: (archive: Partial<MedicalRecordArchive>) =>
    request<ApiResponse>(`${API_BASE}/medical-record-archives`, {
      method: 'POST',
      body: JSON.stringify(archive),
    }),

  update: (id: number, archive: Partial<MedicalRecordArchive>) =>
    request<ApiResponse>(`${API_BASE}/medical-record-archives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(archive),
    }),

  archive: (id: number, icdCode: string, icdName: string, qualityScore: number) =>
    request<ApiResponse>(`${API_BASE}/medical-record-archives/${id}`, {
      method: 'POST',
      body: JSON.stringify({ icdCode, icdName, qualityScore }),
    }),
};

export const physicalExamService = {
  getAll: () => request<PhysicalExam[]>(`${API_BASE}/physical-exams`),

  getById: (id: number) => request<PhysicalExam>(`${API_BASE}/physical-exams/${id}`),

  getByPatientId: (patientId: number) =>
    request<PhysicalExam[]>(`${API_BASE}/physical-exams?patientId=${patientId}`),

  getByStatus: (status: 'scheduled' | 'in_progress' | 'completed') =>
    request<PhysicalExam[]>(`${API_BASE}/physical-exams?status=${status}`),

  add: (exam: Partial<PhysicalExam>) =>
    request<ApiResponse>(`${API_BASE}/physical-exams`, {
      method: 'POST',
      body: JSON.stringify(exam),
    }),

  update: (id: number, exam: Partial<PhysicalExam>) =>
    request<ApiResponse>(`${API_BASE}/physical-exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exam),
    }),

  complete: (id: number, conclusion: string) =>
    request<ApiResponse>(`${API_BASE}/physical-exams/complete/${id}`, {
      method: 'POST',
      body: JSON.stringify({ conclusion }),
    }),
};

// ========== 医院信息系统标准化升级 - 新业务模块 ==========

export const triageQueueService = {
  getAll: (params?: { deptId?: number; doctorId?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.deptId) query.append('deptId', String(params.deptId));
    if (params?.doctorId) query.append('doctorId', String(params.doctorId));
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/triage-queue${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/triage-queue`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/triage-queue`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const queueDisplayService = {
  getAll: (deptId?: number) => {
    const qs = deptId ? `?deptId=${deptId}` : '';
    return request<any[]>(`${API_BASE}/queue-display${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/queue-display`, { method: 'POST', body: JSON.stringify(data) }),
};

export const insuranceSettlementService = {
  getAll: (patientId?: number) => {
    const qs = patientId ? `?patientId=${patientId}` : '';
    return request<any[]>(`${API_BASE}/insurance-settlement${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/insurance-settlement`, { method: 'POST', body: JSON.stringify(data) }),
};

export const drugSupplierService = {
  getAll: (keyword?: string) => {
    const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    return request<any[]>(`${API_BASE}/drug-suppliers${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-suppliers`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-suppliers`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const drugPurchaseOrderService = {
  getAll: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<any[]>(`${API_BASE}/drug-purchase-orders${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-purchase-orders`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-purchase-orders`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const drugPurchaseItemService = {
  getAll: (purchaseId?: number) => {
    const qs = purchaseId ? `?purchaseId=${purchaseId}` : '';
    return request<any[]>(`${API_BASE}/drug-purchase-items${qs}`);
  },
  add: (items: any[]) =>
    request<ApiResponse>(`${API_BASE}/drug-purchase-items`, { method: 'POST', body: JSON.stringify(items) }),
};

export const drugTransferOrderService = {
  getAll: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<any[]>(`${API_BASE}/drug-transfer-orders${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-transfer-orders`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-transfer-orders`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const drugTransferItemService = {
  getAll: (transferId?: number) => {
    const qs = transferId ? `?transferId=${transferId}` : '';
    return request<any[]>(`${API_BASE}/drug-transfer-items${qs}`);
  },
  add: (items: any[]) =>
    request<ApiResponse>(`${API_BASE}/drug-transfer-items`, { method: 'POST', body: JSON.stringify(items) }),
};

export const pharmacyWindowService = {
  getAll: (type?: string) => {
    const qs = type ? `?type=${type}` : '';
    return request<any[]>(`${API_BASE}/pharmacy-windows${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/pharmacy-windows`, { method: 'POST', body: JSON.stringify(data) }),
};

export const drugInventoryLedgerService = {
  getAll: (params?: { warehouse?: string; drugName?: string }) => {
    const query = new URLSearchParams();
    if (params?.warehouse) query.append('warehouse', params.warehouse);
    if (params?.drugName) query.append('drugName', params.drugName);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/drug-inventory-ledger${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-inventory-ledger`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/drug-inventory-ledger`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const financeGeneralLedgerService = {
  getAll: (params?: { period?: string; subject?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.subject) query.append('subject', params.subject);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/finance-general-ledger${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/finance-general-ledger`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/finance-general-ledger`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const financeBudgetService = {
  getAll: (params?: { year?: string; deptId?: number }) => {
    const query = new URLSearchParams();
    if (params?.year) query.append('year', params.year);
    if (params?.deptId) query.append('deptId', String(params.deptId));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/finance-budgets${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/finance-budgets`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/finance-budgets`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const payrollService = {
  getAll: (params?: { period?: string; deptId?: number }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.deptId) query.append('deptId', String(params.deptId));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/payroll${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/payroll`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/payroll`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const costAccountingDetailService = {
  getAll: (params?: { period?: string; deptId?: number }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.deptId) query.append('deptId', String(params.deptId));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/cost-accounting-detail${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/cost-accounting-detail`, { method: 'POST', body: JSON.stringify(data) }),
};

export const orderExecutionService = {
  getAll: (params?: { patientId?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.append('patientId', String(params.patientId));
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/order-execution${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/order-execution`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/order-execution`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const specimenService = {
  getAll: (params?: { patientId?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.append('patientId', String(params.patientId));
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/specimens${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/specimens`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/specimens`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const examinationReportService = {
  getAll: (params?: { patientId?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.append('patientId', String(params.patientId));
    if (params?.type) query.append('type', params.type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/examination-reports${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/examination-reports`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/examination-reports`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const treatmentExecutionService = {
  getAll: (params?: { patientId?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.append('patientId', String(params.patientId));
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`${API_BASE}/treatment-execution${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/treatment-execution`, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) =>
    request<ApiResponse>(`${API_BASE}/treatment-execution`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const clinicalAttachmentService = {
  getByPatient: (params: { patientId: number; visitId?: number; recordId?: number; attachmentType?: string }) => {
    const query = new URLSearchParams();
    query.append('patientId', String(params.patientId));
    if (params.visitId) query.append('visitId', String(params.visitId));
    if (params.recordId) query.append('recordId', String(params.recordId));
    if (params.attachmentType) query.append('attachmentType', params.attachmentType);
    return request<any[]>(`${API_BASE}/clinical-attachments?${query.toString()}`);
  },

  upload: async (data: {
    file: File;
    patientId: number;
    visitId?: number;
    recordId?: number;
    attachmentType: string;
    remark?: string;
    uploadedBy?: number;
  }) => {
    const form = new FormData();
    form.append('file', data.file);
    form.append('patientId', String(data.patientId));
    form.append('attachmentType', data.attachmentType);
    if (data.visitId) form.append('visitId', String(data.visitId));
    if (data.recordId) form.append('recordId', String(data.recordId));
    if (data.remark) form.append('remark', data.remark);
    if (data.uploadedBy) form.append('uploadedBy', String(data.uploadedBy));

    const response = await fetch(`${API_BASE}/clinical-attachments`, {
      method: 'POST',
      body: form,
    });
    const json = await response.json();
    if (!response.ok || json.success === false) {
      throw new Error(json.error || json.message || '附件上传失败');
    }
    return json;
  },

  delete: (id: number) =>
    request<ApiResponse>(`${API_BASE}/clinical-attachments/${id}`, { method: 'DELETE' }),

  fileUrl: (fileUuid: string) => `${API_BASE}/files/${fileUuid}`,
};

export const auditLogService = {
  getAll: (params?: { patientId?: number; action?: string; targetType?: string; targetId?: number; moduleName?: string; keyword?: string; offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.append('patientId', String(params.patientId));
    if (params?.action) query.append('action', params.action);
    if (params?.targetType) query.append('targetType', params.targetType);
    if (params?.targetId) query.append('targetId', String(params.targetId));
    if (params?.moduleName) query.append('moduleName', params.moduleName);
    if (params?.keyword) query.append('keyword', params.keyword);
    query.append('offset', String(params?.offset ?? 0));
    query.append('limit', String(params?.limit ?? 50));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ logs: any[]; total: number; offset: number; limit: number }>(`${API_BASE}/audit-logs${qs}`);
  },
  add: (data: any) =>
    request<ApiResponse>(`${API_BASE}/audit-logs`, { method: 'POST', body: JSON.stringify(data) }),
};
