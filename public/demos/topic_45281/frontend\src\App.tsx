import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import InfoMaintenance from "./pages/InfoMaintenance";
import OutpatientManagement from "./pages/OutpatientManagement";
import DoctorWorkstation from "./pages/DoctorWorkstation";
import StatisticsQuery from "./pages/StatisticsQuery";
import ChargeManagement from "./pages/ChargeManagement";
import PharmacyDispense from "./pages/PharmacyDispense";
import DepartmentManagement from "./pages/DepartmentManagement";
import InpatientManagement from "./pages/InpatientManagement";
import NurseWorkstation from "./pages/NurseWorkstation";
import SurgeryAnesthesiaManagement from "./pages/SurgeryAnesthesiaManagement";
import MedicalRecordArchiveManagement from "./pages/MedicalRecordArchiveManagement";
import PhysicalExamManagement from "./pages/PhysicalExamManagement";
import HuiminService from "./pages/HuiminService";
import MedicalCoreService from "./pages/MedicalCoreService";
import MedicalExtendedService from "./pages/MedicalExtendedService";
import MedicalManagementService from "./pages/MedicalManagementService";
import OperationManagementService from "./pages/OperationManagementService";
import PatientChainView from "./pages/PatientChainView";
import AppointmentRegistration from "./pages/AppointmentRegistration";
import DrugManagement from "./pages/DrugManagement";
import FinancialManagement from "./pages/FinancialManagement";
import OrderExecutionTracking from "./pages/OrderExecutionTracking";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/info-maintenance" element={<InfoMaintenance />} />
                  <Route path="/outpatient-management" element={<OutpatientManagement />} />
                  <Route path="/huimin-service" element={<HuiminService />} />
                  <Route path="/medical-core" element={<MedicalCoreService />} />
                  <Route path="/medical-extended" element={<MedicalExtendedService />} />
                  <Route path="/medical-management" element={<MedicalManagementService />} />
                  <Route path="/operation-management" element={<OperationManagementService />} />
                  <Route path="/patient-chain" element={<PatientChainView />} />
                  <Route path="/doctor-workstation" element={<DoctorWorkstation />} />
                  <Route path="/charge-management" element={<ChargeManagement />} />
                  <Route path="/pharmacy-dispense" element={<PharmacyDispense />} />
                  <Route path="/department-management" element={<DepartmentManagement />} />
                  <Route path="/statistics-query" element={<StatisticsQuery />} />
                  <Route path="/inpatient-management" element={<InpatientManagement />} />
                  <Route path="/nurse-workstation" element={<NurseWorkstation />} />
                  <Route path="/surgery-anesthesia" element={<SurgeryAnesthesiaManagement />} />
                  <Route path="/medical-record-archive" element={<MedicalRecordArchiveManagement />} />
                  <Route path="/physical-exam" element={<PhysicalExamManagement />} />
                  <Route path="/appointment-registration" element={<AppointmentRegistration />} />
                  <Route path="/drug-management" element={<DrugManagement />} />
                  <Route path="/financial-management" element={<FinancialManagement />} />
                  <Route path="/order-execution-tracking" element={<OrderExecutionTracking />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
