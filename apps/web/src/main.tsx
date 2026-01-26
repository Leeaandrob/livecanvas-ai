import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Global error handler for Yjs sync errors
// These can occur when messages are corrupted in transit or document is corrupted
const isYjsError = (message: string | undefined): boolean => {
  if (!message) return false;
  return (
    message.includes("Unexpected end of array") ||
    message.includes("Unexpected end of struct") ||
    message.includes("Integer out of range") ||
    message.includes("GC collect") ||
    (message.includes("Yjs") && message.includes("error"))
  );
};

window.addEventListener("error", (event) => {
  if (isYjsError(event.message)) {
    // Suppress Yjs sync errors - they're recoverable
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true); // Use capture phase

// Also catch unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const message = event.reason?.message || String(event.reason);
  if (isYjsError(message)) {
    event.preventDefault();
    return;
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
