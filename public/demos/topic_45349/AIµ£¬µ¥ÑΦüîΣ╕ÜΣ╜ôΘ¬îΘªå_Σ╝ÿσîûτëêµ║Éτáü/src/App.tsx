import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Input from "@/pages/Input";
import Results from "@/pages/Results";
import Experience from "@/pages/Experience";
import Roadmap from "@/pages/Roadmap";
import Report from "@/pages/Report";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/input" element={<Input />} />
          <Route path="/results" element={<Results />} />
          <Route path="/experience/:careerId" element={<Experience />} />
          <Route path="/roadmap/:careerId" element={<Roadmap />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
