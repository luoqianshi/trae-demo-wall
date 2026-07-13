import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Designer from "@/pages/Designer";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Designer />} />
      </Routes>
    </Router>
  );
}
