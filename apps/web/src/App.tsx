/**
 * LiveCanvas AI - Main App Component
 *
 * Handles routing and provides global context
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { Board } from "./pages/Board";
import { SettingsProvider } from "./hooks/useSettings";

export function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirects to a new board */}
          <Route
            path="/"
            element={<Navigate to={`/board/${nanoid(10)}`} replace />}
          />

          {/* Board page */}
          <Route path="/board/:id" element={<Board />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="error-page">
                <h1>404 - Not Found</h1>
                <a href="/">Go to home</a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
