import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children = <div /> }) => {
  const location = useLocation();

  return (
    <div data-cmp="AppLayout" className="theme-unified-page w-full flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden ml-56 relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 min-h-0 mt-14 relative bg-background">
          <div key={location.pathname} className="motion-page">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
