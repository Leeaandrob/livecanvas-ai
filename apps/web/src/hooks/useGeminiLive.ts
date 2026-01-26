/**
 * useGeminiLive Hook
 *
 * Manages Gemini Live API connection for voice-controlled diagram operations
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  GeminiSessionState,
  TranscriptEntry,
  ToolExecutionContext,
  GeminiVoiceName,
} from "@live-canvas/protocols";
import { GeminiLiveClient } from "../lib/gemini-live/client";
import { AudioManager } from "../lib/audio/audio-manager";
import {
  LIVECANVAS_TOOLS,
  VOICE_ASSISTANT_SYSTEM_INSTRUCTION,
  executeToolCall,
} from "../lib/gemini-live/tools";

/**
 * Extract Mermaid code blocks from text
 * Supports multiple formats:
 * - ```mermaid\n... ```
 * - ```mermaid ... ``` (with optional whitespace)
 * - ```\n... ``` (generic code blocks starting with mermaid keywords)
 */
function extractMermaidBlocks(text: string): string[] {
  const mermaidBlocks: string[] = [];
  const mermaidKeywords = "graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph";

  // First, try to match ```mermaid ... ``` blocks (with optional whitespace after mermaid)
  const mermaidTagRegex = /```mermaid[\s\n]*([\s\S]*?)```/gi;
  let match;

  while ((match = mermaidTagRegex.exec(text)) !== null) {
    let code = match[1].trim();
    if (code) {
      mermaidBlocks.push(code);
    }
  }

  // If no mermaid-tagged blocks, look for generic code blocks with mermaid content
  if (mermaidBlocks.length === 0) {
    const genericCodeBlockRegex = new RegExp(
      "```[\\s\\n]*((?:" + mermaidKeywords + ")[\\s\\S]*?)```",
      "gi"
    );

    while ((match = genericCodeBlockRegex.exec(text)) !== null) {
      const code = match[1].trim();
      if (code) {
        mermaidBlocks.push(code);
      }
    }
  }

  // If still no blocks, check if the entire text looks like Mermaid code
  if (mermaidBlocks.length === 0) {
    const trimmedText = text.trim();
    const mermaidStartRegex = new RegExp("^(" + mermaidKeywords + ")", "i");
    if (mermaidStartRegex.test(trimmedText)) {
      mermaidBlocks.push(trimmedText);
    }
  }

  return mermaidBlocks;
}

interface UseGeminiLiveOptions {
  apiKey: string;
  voiceName?: GeminiVoiceName;
  toolContext: ToolExecutionContext;
  onVoiceActivity?: (isActive: boolean, state: GeminiSessionState) => void;
  /** Debug mode: connect without tools to test basic connectivity */
  debugNoTools?: boolean;
}

interface UseGeminiLiveResult {
  // State
  sessionState: GeminiSessionState;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendTextMessage: (text: string) => void;
  clearTranscript: () => void;
}

export function useGeminiLive({
  apiKey,
  voiceName = "Aoede",
  toolContext,
  onVoiceActivity,
  debugNoTools = false,
}: UseGeminiLiveOptions): UseGeminiLiveResult {
  const [sessionState, setSessionState] =
    useState<GeminiSessionState>("disconnected");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const toolContextRef = useRef(toolContext);

  // Keep tool context ref updated
  useEffect(() => {
    toolContextRef.current = toolContext;
  }, [toolContext]);

  // Notify parent of voice activity changes
  useEffect(() => {
    const isActive =
      sessionState === "listening" ||
      sessionState === "processing" ||
      sessionState === "speaking";
    onVoiceActivity?.(isActive, sessionState);
  }, [sessionState, onVoiceActivity]);

  /**
   * Connect to Gemini Live API
   */
  const connect = useCallback(async () => {
    if (!apiKey) {
      setError("API key is required");
      return;
    }

    setError(null);

    try {
      // Create audio manager if needed
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager({
          onAudioData: (data) => {
            clientRef.current?.sendAudio(data);
          },
          onStateChange: (state) => {
            if (state === "capturing") {
              setIsListening(true);
            } else {
              setIsListening(false);
            }
          },
          onError: (err) => {
            setError(err.message);
          },
          onPlaybackStart: () => {
            setIsSpeaking(true);
          },
          onPlaybackEnd: () => {
            setIsSpeaking(false);
          },
        });
      }

      // Create client
      // In debug mode, connect without tools to test basic connectivity
      const config = debugNoTools
        ? {
            apiKey,
            voiceName,
          }
        : {
            apiKey,
            voiceName,
            systemInstruction: VOICE_ASSISTANT_SYSTEM_INSTRUCTION,
            tools: LIVECANVAS_TOOLS,
          };

      if (debugNoTools) {
        console.log("Gemini Live: Debug mode - connecting without tools/system instruction");
      }

      clientRef.current = new GeminiLiveClient(
        config,
        {
          onStateChange: (state) => {
            setSessionState(state);
            if (state === "error") {
              setError("Connection error");
            }
          },
          onTranscript: (entry) => {
            setTranscript((prev) => [...prev, entry]);

            // If this is an AI response, check for Mermaid code blocks
            if (entry.role === "assistant" && entry.content) {
              const mermaidBlocks = extractMermaidBlocks(entry.content);

              // Create diagram blocks for each Mermaid code found
              // Use setTimeout to defer Yjs operations and avoid sync conflicts
              if (mermaidBlocks.length > 0) {
                setTimeout(() => {
                  for (const mermaidCode of mermaidBlocks) {
                    try {
                      const block = toolContextRef.current.addBlock(mermaidCode);
                      toolContextRef.current.selectBlock(block.id);
                    } catch (err) {
                      console.error("Failed to create diagram from response:", err);
                    }
                  }
                }, 100);
              }
            }
          },
          onAudioData: (data) => {
            audioManagerRef.current?.queueAudio(data);
          },
          onToolCall: async (_id, name, args) => {
            const result = await executeToolCall(
              name,
              args,
              toolContextRef.current
            );
            // Convert ToolResult to Record<string, unknown>
            return {
              success: result.success,
              message: result.message,
              ...(result.data ? { data: result.data } : {}),
            };
          },
          onError: (err) => {
            setError(err.message);
          },
        }
      );

      await clientRef.current.connect();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect"
      );
      setSessionState("error");
    }
  }, [apiKey, voiceName, debugNoTools]);

  /**
   * Disconnect from Gemini Live API
   */
  const disconnect = useCallback(() => {
    audioManagerRef.current?.stopCapture();
    audioManagerRef.current?.clearPlaybackQueue();
    clientRef.current?.disconnect();

    setIsListening(false);
    setIsSpeaking(false);
    setSessionState("disconnected");
  }, []);

  /**
   * Start listening (capture microphone)
   */
  const startListening = useCallback(async () => {
    if (!clientRef.current?.isReady) {
      setError("Not connected to Gemini Live");
      return;
    }

    try {
      await audioManagerRef.current?.startCapture();
      setSessionState("listening");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start microphone"
      );
    }
  }, []);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    audioManagerRef.current?.stopCapture();
    if (
      sessionState === "listening" &&
      clientRef.current?.sessionState === "connected"
    ) {
      setSessionState("connected");
    }
  }, [sessionState]);

  /**
   * Send a text message
   */
  const sendTextMessage = useCallback((text: string) => {
    if (!clientRef.current?.isReady) {
      setError("Not connected to Gemini Live");
      return;
    }

    clientRef.current.sendText(text);
  }, []);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioManagerRef.current?.dispose();
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    sessionState,
    isListening,
    isSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage,
    clearTranscript,
  };
}
