import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Predict from "@/pages/Predict";
import Record from "@/pages/Record";
import Records from "@/pages/Records";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/record" element={<Record />} />
        <Route path="/records" element={<Records />} />
      </Routes>
    </Router>
  );
}
