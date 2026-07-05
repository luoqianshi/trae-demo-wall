// 路由配置

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Recognition from "@/pages/Recognition";
import Tutor from "@/pages/Tutor";
import Cad from "@/pages/Cad";
import Templates from "@/pages/Templates";
import { useStore } from "@/store/useStore";

function ProtectedLayout() {
  const user = useStore((s) => s.user);
  const init = useStore((s) => s.init);

  useEffect(() => {
    if (!user) init();
  }, [user, init]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/recognition" element={<Recognition />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/cad" element={<Cad />} />
          <Route path="/templates" element={<Templates />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
