/**
 * useSettings Hook
 *
 * Manages user settings stored in localStorage
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { Settings, ProviderType } from "@live-canvas/protocols";

const STORAGE_KEY = "livecanvas-settings";

const defaultSettings: Settings = {
  provider: "openai",
  apiKey: "",
  userName: "",
  userColor: "",
};

// Generate a random color for new users
function generateUserColor(): string {
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#ffe66d",
    "#95e1d3",
    "#f38181",
    "#a8d8ea",
    "#aa96da",
    "#fcbad3",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate a random name for new users
function generateUserName(): string {
  const adjectives = [
    "Happy",
    "Swift",
    "Bright",
    "Cool",
    "Calm",
    "Bold",
    "Keen",
  ];
  const nouns = [
    "Architect",
    "Designer",
    "Builder",
    "Maker",
    "Creator",
    "Thinker",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  hasApiKey: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultSettings,
          ...parsed,
          // Ensure user has name and color
          userName: parsed.userName || generateUserName(),
          userColor: parsed.userColor || generateUserColor(),
        };
      }
    } catch {
      // Ignore parse errors
    }

    return {
      ...defaultSettings,
      userName: generateUserName(),
      userColor: generateUserColor(),
    };
  });

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const hasApiKey = Boolean(settings.apiKey);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, hasApiKey }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export type { ProviderType };
