import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AuthRoutes";
import "./index.css";
import { AuthProvider } from "@/context/AutoContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
