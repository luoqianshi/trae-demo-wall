import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Organize from "@/pages/Organize";
import Collection from "@/pages/Collection";
import Analytics from "@/pages/Analytics";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/organize" element={<Organize />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function NotFound() {
  return (
    <div className="bg-paper-grain flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <div className="font-display text-7xl font-semibold text-paper-300">404</div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-800">页面走丢了</h1>
        <p className="mt-2 text-ink-500">你访问的页面不存在,返回首页继续使用。</p>
        <Link to="/" className="btn-ink mt-6">
          返回首页
        </Link>
      </div>
    </div>
  );
}
