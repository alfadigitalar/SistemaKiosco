import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { mockApi } from "./api/mockApi";

// Inyectar Mock API si no estamos en Electron (Vercel/Web)
if (!window.api) {
  console.log("⚠️ Modo Web detectado - Usando Mock API");
  window.api = mockApi;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
