/**
 * SettingsModal Component
 *
 * Modal for configuring API keys and user preferences
 */

import { useState, useCallback, FormEvent } from "react";
import { useSettings } from "../hooks/useSettings";
import type { ProviderType, GeminiVoiceName } from "@live-canvas/protocols";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();

  const [provider, setProvider] = useState<ProviderType>(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [userName, setUserName] = useState(settings.userName || "");
  const [geminiVoiceEnabled, setGeminiVoiceEnabled] = useState(
    settings.geminiVoiceEnabled ?? true
  );
  const [geminiVoiceName, setGeminiVoiceName] = useState<GeminiVoiceName>(
    settings.geminiVoiceName ?? "Aoede"
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      updateSettings({
        provider,
        apiKey,
        userName: userName || undefined,
        geminiVoiceEnabled: provider === "gemini" ? geminiVoiceEnabled : undefined,
        geminiVoiceName: provider === "gemini" ? geminiVoiceName : undefined,
      });
      onClose();
    },
    [provider, apiKey, userName, geminiVoiceEnabled, geminiVoiceName, updateSettings, onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              className="form-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name (shown to collaborators)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">AI Provider</label>
            <select
              className="form-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value as ProviderType)}
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google (Gemini)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {provider === "openai" && "OpenAI API Key"}
              {provider === "anthropic" && "Anthropic API Key"}
              {provider === "gemini" && "Google AI API Key"}
            </label>
            <input
              type="password"
              className="form-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === "openai"
                  ? "sk-..."
                  : provider === "anthropic"
                    ? "sk-ant-..."
                    : "AI..."
              }
            />
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginTop: "4px",
              }}
            >
              Your API key is stored locally in your browser and sent directly to
              the AI provider. It is never stored on our servers.
            </p>
          </div>

          {/* Voice settings - only shown for Gemini */}
          {provider === "gemini" && (
            <>
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "12px",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Voice Features (Gemini Live)
                </h4>
              </div>

              <div className="form-group">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={geminiVoiceEnabled}
                    onChange={(e) => setGeminiVoiceEnabled(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "var(--color-accent)",
                    }}
                  />
                  <span style={{ fontSize: "14px" }}>Enable Voice Control</span>
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    marginTop: "4px",
                    marginLeft: "24px",
                  }}
                >
                  Control diagrams with your voice using Gemini Live API
                </p>
              </div>

              {geminiVoiceEnabled && (
                <div className="form-group">
                  <label className="form-label">Voice</label>
                  <select
                    className="form-select"
                    value={geminiVoiceName}
                    onChange={(e) =>
                      setGeminiVoiceName(e.target.value as GeminiVoiceName)
                    }
                  >
                    <option value="Aoede">Aoede (Warm, feminine)</option>
                    <option value="Puck">Puck (Playful, neutral)</option>
                    <option value="Charon">Charon (Deep, masculine)</option>
                    <option value="Kore">Kore (Soft, feminine)</option>
                    <option value="Fenrir">Fenrir (Bold, masculine)</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border)",
            fontSize: "12px",
            color: "var(--color-text-muted)",
          }}
        >
          <p>
            <strong>Get API keys:</strong>
          </p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
            <li>
              OpenAI:{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                platform.openai.com
              </a>
            </li>
            <li>
              Anthropic:{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                console.anthropic.com
              </a>
            </li>
            <li>
              Google:{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                aistudio.google.com
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
