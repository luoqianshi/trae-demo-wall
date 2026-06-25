import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Toaster } from "./components/ui/EnhancedToaster";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Toaster />
    <App />
  </ErrorBoundary>
);
