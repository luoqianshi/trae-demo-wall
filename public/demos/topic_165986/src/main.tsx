import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/layout/AppLayout";
import { WritePage } from "@/pages/WritePage";
import { ChatPage } from "@/pages/ChatPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MemoryPage } from "@/pages/MemoryPage";
import { useAppStore } from "@/store/appStore";
import "./index.css";

function App() {
  const { darkMode } = useAppStore();

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/write" />} />
            <Route path="write" element={<WritePage />} />
            <Route path="write/:id" element={<WritePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="memory" element={<MemoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
