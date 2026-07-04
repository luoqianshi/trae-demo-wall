export interface Drug {
  id: number;
  name: string;
  spec: string;
  unit: string;
  price: number;
  stock: number;
  stockWarn: number;
  expireDate: string;
  createTime?: string;
  updateTime?: string;
  remark?: string;
}

export interface Patient {
  id: number;
  hospitalId?: string;
  medicalRecordNo: string;
  outpatientNo?: string;
  inpatientNo?: string;
  name: string;
  gender: string;
  age: number;
  birthDate?: string;
  idCard?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  maritalStatus?: string;
  insuranceType?: string;
  medicalInsuranceNo?: string;
  contractUnit?: string;
  insuranceSelfRatio?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  allergyHistory?: string;
  drugAdverseHistory?: string;
  infectiousDiseaseHistory?: string;
  specialDiseaseFlag?: number;
  createTime?: string;
  updateTime?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  createTime?: string;
}

export interface Doctor {
  id: number;
  workNo: string;
  name: string;
  dept: string;
  title: string;
  role?: string;
  createTime?: string;
}

export interface User {
  id: number;
  loginName: string;
  userType: 'DOCTOR' | 'PATIENT' | 'ADMIN';
  status: string;
  name?: string;
  role?: string;
  dept?: string;
  username?: string;
  relateId?: number;
  doctorInfo?: {
    id: number;
    workNo: string;
    name: string;
    dept: string;
    title: string;
  };
  patientInfo?: {
    id: number;
    hospitalId: string;
    name: string;
    gender: string;
  };
  adminInfo?: {
    roleName: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

export interface LoginRequest {
  loginName: string;
  password: string;
  userType: string;
}

export interface LoginResponse {
  success: boolean;
  account?: User;
  user?: User;
  error?: string;
}

export interface Registration {
  id: number;
  patientId: number;
  doctorId: number;
  dept: string;
  regTime: string;
  regFee: number;
  regStatus: string;
  queueNo?: string;
  patientName?: string;
  doctorName?: string;
  createTime?: string;
}

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  drugId: number;
  num: number;
  drugPrice: number;
  usage?: string;
  days?: number;
  drugName?: string;
  drugSpec?: string;
}

export interface Prescription {
  id: number;
  patientId: number;
  doctorId: number;
  registrationId: number;
  totalPrice: number;
  createTime: string;
  status: string;
  items?: PrescriptionItem[];
  patientName?: string;
  doctorName?: string;
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName?: string;
  registrationId: number;
  chiefComplaint?: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  content?: string;
  createTime?: string;
  updateTime?: string;
}

export interface Charge {
  id: number;
  patientId: number;
  chargeType: string;
  relateId: number;
  totalFee: number;
  chargeTime: string;
  operator?: string;
  paymentType?: string;
  status: string;
  patientName?: string;
  createTime?: string;
  items?: ChargeItem[];
}

export interface ChargeItem {
  id: number;
  chargeId: number;
  itemType: 'registration' | 'prescription' | 'examination' | 'surgery';
  relateId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QueueItem {
  id: number;
  patientId: number;
  patientName?: string;
  gender?: string;
  age?: number;
  queueNo?: string;
  callStatus: 'waiting' | 'calling' | 'finished' | 'completed' | 'missed' | 'passed';
  dept: string;
  doctorId: number;
  doctorName?: string;
  registrationId?: number;
  allergyHistory?: string;
  createTime?: string;
}

export interface InventoryLog {
  id: number;
  drugId: number;
  drugName?: string;
  changeType: 'in' | 'out';
  changeNum: number;
  beforeStock: number;
  afterStock: number;
  operator?: string;
  reason?: string;
  createTime?: string;
}

export interface PrescriptionReview {
  id: number;
  prescriptionId: number;
  reviewType: string;
  autoWarn: string;
  warnContent?: string;
  reviewer?: string;
  reviewOpinion?: string;
  rectifyStatus: string;
  reviewTime?: string;
}

export interface QueueCall {
  id: number;
  registrationId: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  dept: string;
  queueNo: string;
  status: 'waiting' | 'calling' | 'completed' | 'missed';
  callTime?: string;
  createTime?: string;
}

export interface MedicalRecordVersion {
  id: number;
  recordId: number;
  content: string;
  updateTime: string;
  operatorId?: number;
}

export interface Examination {
  id: number;
  name: string;
  category: 'lab' | 'image';
  price: number;
  dept?: string;
  remark?: string;
  createTime?: string;
}

export interface PrescriptionExamination {
  id: number;
  prescriptionId: number;
  examinationId: number;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  result?: string;
  createTime?: string;
  examinationName?: string;
  category?: string;
  price?: number;
  totalPrice?: number;
  dept?: string;
  remark?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  id?: number;
}

export interface Inpatient {
  id: number;
  inpatientNo?: string;
  patientId: number;
  patientName?: string;
  gender?: string;
  age?: number;
  bedNo: string;
  dept: string;
  doctorId: number;
  doctorName?: string;
  admissionDate: string;
  dischargeDate?: string;
  diagnosis?: string;
  status: 'admitted' | 'discharged';
  totalFee?: number;
  deposit?: number;
  createTime?: string;
}

export interface Bed {
  id: number;
  bedNo: string;
  dept: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  type?: 'normal' | 'special' | 'intensive';
  patientName?: string;
  patientId?: number;
  dailyFee?: number;
  createTime?: string;
}

export interface VitalSign {
  id: number;
  inpatientId: number;
  temperature: number;
  pulse: number;
  bloodPressureHigh: number;
  bloodPressureLow: number;
  oxygenSaturation: number;
  respiration: number;
  recordTime: string;
  nurseName?: string;
}

export interface NurseRecord {
  id: number;
  inpatientId: number;
  patientName?: string;
  vitalSigns: {
    temperature?: number;
    pulse?: number;
    bloodPressure?: string;
    respiration?: number;
    oxygenSaturation?: number;
  };
  nursingNotes: string;
  nurseId: number;
  nurseName?: string;
  recordTime: string;
  createTime?: string;
}

export interface Surgery {
  id: number;
  patientId: number;
  patientName?: string;
  surgeryName: string;
  surgeryType: string;
  dept: string;
  doctorId: number;
  doctorName?: string;
  surgeryDate: string;
  surgeryTime?: string;
  surgeryRoom: string;
  surgeonName?: string;
  anesthesiaType: string;
  anesthesiaDoctor?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  diagnosis?: string;
  duration?: number;
  remark?: string;
  surgeryFee?: number;
  anesthesiaFee?: number;
  createTime?: string;
}

export interface AnesthesiaRecord {
  id: number;
  surgeryId: number;
  patientId: number;
  patientName?: string;
  anesthesiaType: string;
  anesthesiaDrugs: string;
  vitalSignsDuring: string;
  duration: number;
  anesthesiologistId: number;
  anesthesiologistName?: string;
  recordTime: string;
  createTime?: string;
}

export interface MedicalRecordArchive {
  id: number;
  patientId: number;
  patientName?: string;
  recordId: number;
  icdCode?: string;
  icdName?: string;
  status: 'pending' | 'archived' | 'completed';
  qualityScore?: number;
  archiver?: string;
  archiveTime?: string;
  createTime?: string;
}

export interface PhysicalExam {
  id: number;
  patientId: number;
  patientName?: string;
  examDate: string;
  examItems: {
    name: string;
    result: string;
    unit?: string;
    reference?: string;
  }[];
  totalFee: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  conclusion?: string;
  doctorId?: number;
  doctorName?: string;
  createTime?: string;
}

export interface FileAsset {
  id: number;
  fileUuid: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  fileSha256?: string;
  category: string;
  ownerType?: string;
  ownerId?: number;
  uploadedBy?: number;
  uploadedAt?: string;
  deleted?: number;
}

export interface ClinicalAttachment {
  id: number;
  patientId: number;
  visitId?: number;
  recordId?: number;
  fileId: number;
  attachmentType: string;
  remark?: string;
  createdAt?: string;
  file?: FileAsset;
}

export interface PatientIdentity {
  id: number;
  patientId: number;
  identityType: string;
  identityNo: string;
  verified?: number;
  primaryFlag?: number;
  status?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: number;
  operatorId?: number;
  operatorName?: string;
  action: string;
  targetType?: string;
  targetId?: number;
  patientId?: number;
  moduleName?: string;
  requestIp?: string;
  success?: number;
  summary?: string;
  beforeValue?: string;
  afterValue?: string;
  createdAt?: string;
}
