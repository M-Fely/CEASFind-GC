import React from "react";
import { createRoot } from "react-dom/client";
import AuthPage from "./pages/AuthPage.jsx";
import "../auth.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthPage />
  </React.StrictMode>,
);
