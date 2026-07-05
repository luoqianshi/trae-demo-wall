import { useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Library from "@/pages/Library";
import Review from "@/pages/Review";
import ReviewSession from "@/pages/ReviewSession";
import Stats from "@/pages/Stats";
import { useQuestionStore } from "@/store/useQuestionStore";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function ShellRoutes() {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/library" element={<Library />} />
        <Route path="/review" element={<Review />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const ensureSeeded = useQuestionStore((s) => s.ensureSeeded);

  // 首次进入时，如果 store 为空，灌入种子数据
  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* 全屏做题模式不套 AppShell */}
        <Route path="/review/session" element={<ReviewSession />} />
        <Route path="/*" element={<ShellRoutes />} />
      </Routes>
    </Router>
  );
}
