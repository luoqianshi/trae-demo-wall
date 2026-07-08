import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TabBar from "@/components/TabBar";
import ToastContainer from "@/components/Toast";
import Home from "@/pages/Home";
import Recognize from "@/pages/Recognize";
import Cabinet from "@/pages/Cabinet";
import Reminders from "@/pages/Reminders";
import Family from "@/pages/Family";
import Dosage from "@/pages/Dosage";
import QA from "@/pages/QA";
import Profile from "@/pages/Profile";
import MemberDetail from "@/pages/MemberDetail";

export default function App() {
  return (
    <Router>
      <div className="phone-frame">
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recognize" element={<Recognize />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/family" element={<Family />} />
          <Route path="/dosage" element={<Dosage />} />
          <Route path="/qa" element={<QA />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/family/member/:id" element={<MemberDetail />} />
        </Routes>
        <TabBar />
      </div>
    </Router>
  );
}
