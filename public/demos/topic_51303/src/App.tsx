import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAppStore } from "@/store/app";
import Toast from "@/components/Toast";
import Home from "@/pages/Home";
import AIAssistant from "@/pages/AIAssistant";
import Archive from "@/pages/Archive";
import Profile from "@/pages/Profile";
import DiagnosisResult from "@/pages/DiagnosisResult";
import AlertList from "@/pages/AlertList";
import HistoryChart from "@/pages/HistoryChart";
import MultiShed from "@/pages/MultiShed";
import Classroom from "@/pages/Classroom";
import DeviceDetail from "@/pages/DeviceDetail";
import BatchDetail from "@/pages/BatchDetail";
import AlertSettings from "@/pages/AlertSettings";

export default function App() {
  const toast = useAppStore((s) => s.toast);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/diagnosis/:id" element={<DiagnosisResult />} />
        <Route path="/alerts" element={<AlertList />} />
        <Route path="/chart/:metric" element={<HistoryChart />} />
        <Route path="/multi-shed" element={<MultiShed />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/device/:id" element={<DeviceDetail />} />
        <Route path="/batch/:id" element={<BatchDetail />} />
        <Route path="/alert-settings" element={<AlertSettings />} />
      </Routes>
      <Toast message={toast.message} visible={toast.visible} id={toast.id} />
    </Router>
  );
}
