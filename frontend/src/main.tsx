import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { AppRouter } from "./router";
import { Toaster } from "./components/ui/sonner";
import { applyTheme, getInitialTheme } from "./lib/theme";
import "./index.css";

// Initialize dark/light theme immediately
applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRouter />
        <Toaster theme="dark" position="top-center" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
