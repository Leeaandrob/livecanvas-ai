/**
 * VoicePanel Component
 *
 * UI for voice interaction with Gemini Live API
 */

import { useState, useCallback, useRef, useEffect, FormEvent } from "react";
import type { GeminiSessionState, TranscriptEntry } from "@live-canvas/protocols";

interface VoicePanelProps {
  sessionState: GeminiSessionState;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  error: string | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  onStartListening: () => Promise<void>;
  onStopListening: () => void;
  onSendText: (text: string) => void;
  onClearTranscript: () => void;
}

export function VoicePanel({
  sessionState,
  isListening,
  isSpeaking,
  transcript,
  error,
  onConnect,
  onDisconnect,
  onStartListening,
  onStopListening,
  onSendText,
  onClearTranscript,
}: VoicePanelProps) {
  const [textInput, setTextInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } finally {
      setIsConnecting(false);
    }
  }, [onConnect]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  }, [isListening, onStartListening, onStopListening]);

  const handleTextSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (textInput.trim()) {
        onSendText(textInput.trim());
        setTextInput("");
      }
    },
    [textInput, onSendText]
  );

  const isConnected =
    sessionState === "connected" ||
    sessionState === "listening" ||
    sessionState === "processing" ||
    sessionState === "speaking";

  const statusText = getStatusText(sessionState, isListening, isSpeaking);
  const statusClass = getStatusClass(sessionState);

  return (
    <div className="voice-panel">
      {/* Header */}
      <div className="voice-panel-header">
        <h3 className="voice-panel-title">Voice Assistant</h3>
        <div className={`voice-status ${statusClass}`}>
          <span className="voice-status-dot" />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Connection controls */}
      {!isConnected ? (
        <div className="voice-connect-section">
          <p className="voice-connect-text">
            Connect to control diagrams with your voice
          </p>
          <button
            className="btn btn-primary voice-connect-btn"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="spinner" />
                Connecting...
              </>
            ) : (
              <>
                <MicIcon />
                Enable Voice
              </>
            )}
          </button>
          {error && <p className="voice-error">{error}</p>}
        </div>
      ) : (
        <>
          {/* Microphone button */}
          <div className="voice-mic-section">
            <button
              className={`voice-mic-btn ${isListening ? "listening" : ""} ${isSpeaking ? "speaking" : ""}`}
              onClick={handleMicClick}
              disabled={sessionState === "processing" || isSpeaking}
            >
              <MicIcon />
              {isListening && <span className="mic-pulse" />}
            </button>
            <p className="voice-mic-hint">
              {isListening
                ? "Listening... Click to stop"
                : isSpeaking
                  ? "AI is speaking..."
                  : sessionState === "processing"
                    ? "Processing..."
                    : "Click to speak"}
            </p>
          </div>

          {/* Waveform visualizer placeholder */}
          {(isListening || isSpeaking) && (
            <div className="voice-waveform">
              <div className="waveform-bar" style={{ animationDelay: "0s" }} />
              <div className="waveform-bar" style={{ animationDelay: "0.1s" }} />
              <div className="waveform-bar" style={{ animationDelay: "0.2s" }} />
              <div className="waveform-bar" style={{ animationDelay: "0.3s" }} />
              <div className="waveform-bar" style={{ animationDelay: "0.4s" }} />
            </div>
          )}

          {/* Text input fallback */}
          <form className="voice-text-form" onSubmit={handleTextSubmit}>
            <input
              type="text"
              className="voice-text-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a message..."
              disabled={sessionState === "processing" || isSpeaking}
            />
            <button
              type="submit"
              className="voice-text-submit"
              disabled={!textInput.trim() || sessionState === "processing" || isSpeaking}
            >
              <SendIcon />
            </button>
          </form>

          {/* Transcript */}
          <div className="voice-transcript">
            <div className="voice-transcript-header">
              <span>Conversation</span>
              {transcript.length > 0 && (
                <button
                  className="voice-transcript-clear"
                  onClick={onClearTranscript}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="voice-transcript-list">
              {transcript.length === 0 ? (
                <p className="voice-transcript-empty">
                  Start speaking to begin a conversation
                </p>
              ) : (
                transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`voice-transcript-entry ${entry.role}`}
                  >
                    <span className="transcript-role">
                      {entry.role === "user" ? "You" : "AI"}
                    </span>
                    <p className="transcript-content">{entry.content}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Disconnect button */}
          <button
            className="btn btn-secondary voice-disconnect-btn"
            onClick={onDisconnect}
          >
            Disconnect
          </button>

          {/* Error display */}
          {error && <p className="voice-error">{error}</p>}
        </>
      )}
    </div>
  );
}

function getStatusText(
  state: GeminiSessionState,
  isListening: boolean,
  isSpeaking: boolean
): string {
  if (isSpeaking) return "Speaking";
  if (isListening) return "Listening";

  switch (state) {
    case "disconnected":
      return "Disconnected";
    case "connecting":
      return "Connecting";
    case "connected":
      return "Ready";
    case "listening":
      return "Listening";
    case "processing":
      return "Thinking";
    case "speaking":
      return "Speaking";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

function getStatusClass(state: GeminiSessionState): string {
  switch (state) {
    case "connected":
    case "listening":
    case "speaking":
      return "connected";
    case "connecting":
    case "processing":
      return "connecting";
    case "disconnected":
      return "disconnected";
    case "error":
      return "error";
    default:
      return "";
  }
}

function MicIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mic-icon"
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
