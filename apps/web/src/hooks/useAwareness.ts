/**
 * useAwareness Hook
 *
 * Manages user presence and cursor tracking via Yjs Awareness
 */

import { useEffect, useState, useCallback } from "react";
import { WebsocketProvider } from "y-websocket";
import type { Position, UserPresence, AIVoiceState, GeminiSessionState } from "@live-canvas/protocols";
import { useSettings } from "./useSettings";

interface AICursorState {
  position: Position | null;
  state: "thinking" | "idle";
}

interface UseAwarenessResult {
  users: UserPresence[];
  localUser: UserPresence | null;
  aiCursor: AICursorState;
  aiVoiceState: AIVoiceState | null;
  updateCursor: (position: Position | null) => void;
  broadcastVoiceActivity: (isActive: boolean, state: GeminiSessionState) => void;
}

export function useAwareness(
  provider: WebsocketProvider | null
): UseAwarenessResult {
  const { settings } = useSettings();
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [localUser, setLocalUser] = useState<UserPresence | null>(null);
  const [aiCursor, setAiCursor] = useState<AICursorState>({
    position: null,
    state: "idle",
  });
  const [aiVoiceState, setAiVoiceState] = useState<AIVoiceState | null>(null);

  // Initialize local user awareness
  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;
    const clientId = awareness.clientID.toString();

    // Set local user state
    const user: UserPresence = {
      id: clientId,
      name: settings.userName || "Anonymous",
      color: settings.userColor || "#888888",
      cursor: null,
    };

    awareness.setLocalStateField("user", user);
    setLocalUser(user);

    // Listen for awareness changes
    const handleChange = () => {
      const states = Array.from(awareness.getStates().values());
      const userList: UserPresence[] = states
        .filter((state) => state.user)
        .map((state) => state.user as UserPresence)
        .filter((u) => u.id !== clientId); // Exclude self

      setUsers(userList);
    };

    awareness.on("change", handleChange);
    handleChange(); // Initial sync

    return () => {
      awareness.off("change", handleChange);
    };
  }, [provider, settings.userName, settings.userColor]);

  // Listen for AI cursor and voice activity messages via WebSocket
  useEffect(() => {
    if (!provider) return;

    const ws = provider.ws;
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "ai-cursor") {
            setAiCursor({
              position: message.position,
              state: message.state,
            });
          } else if (message.type === "ai-voice-activity") {
            setAiVoiceState({
              isActive: message.isActive,
              state: message.state,
              userName: message.userName,
            });
          }
        } catch {
          // Not JSON, ignore
        }
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [provider]);

  // Broadcast voice activity to other users
  const broadcastVoiceActivity = useCallback(
    (isActive: boolean, state: GeminiSessionState) => {
      if (!provider?.ws || provider.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const message = {
        type: "ai-voice-activity",
        isActive,
        state,
        userName: settings.userName || "Anonymous",
      };

      provider.ws.send(JSON.stringify(message));
    },
    [provider, settings.userName]
  );

  // Update cursor position
  const updateCursor = useCallback(
    (position: Position | null) => {
      if (!provider) return;

      const awareness = provider.awareness;
      const currentState = awareness.getLocalState();

      if (currentState?.user) {
        awareness.setLocalStateField("user", {
          ...currentState.user,
          cursor: position,
        });

        if (localUser) {
          setLocalUser({ ...localUser, cursor: position });
        }
      }
    },
    [provider, localUser]
  );

  return { users, localUser, aiCursor, aiVoiceState, updateCursor, broadcastVoiceActivity };
}
