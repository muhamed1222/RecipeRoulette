import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { WebApp } from "./components/webapp/WebApp";

// Check if we're in Telegram WebApp context
const isWebApp = window.location.pathname.startsWith('/webapp');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isWebApp ? <WebApp /> : <App />}
  </React.StrictMode>,
);