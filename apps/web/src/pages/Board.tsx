/**
 * Board Page
 *
 * Main board page that combines all components
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import type { MermaidBlock, Position, ToolExecutionContext } from "@live-canvas/protocols";

import { useYjs } from "../hooks/useYjs";
import { useBoard } from "../hooks/useBoard";
import { useAwareness } from "../hooks/useAwareness";
import { useAIAgent } from "../hooks/useAIAgent";
import { useSettings } from "../hooks/useSettings";
import { useGeminiLive } from "../hooks/useGeminiLive";

import { Canvas } from "../components/Canvas";
import { Toolbar } from "../components/Toolbar";
import { ChatPanel } from "../components/ChatPanel";
import { AIResponse } from "../components/AIResponse";
import { BlockEditor } from "../components/BlockEditor";
import { SettingsModal } from "../components/SettingsModal";
import { PresenceList } from "../components/Presence";
import { VoicePanel } from "../components/VoicePanel";

import { initMermaid } from "../lib/mermaid";

export function Board() {
  const { id: boardId } = useParams<{ id: string }>();
  const { settings, hasApiKey } = useSettings();

  // Initialize Mermaid on mount
  useEffect(() => {
    initMermaid();
  }, []);

  // Yjs and collaboration
  const { doc, provider, connected } = useYjs(boardId || "default");
  const { blocks, addBlock, updateBlock, deleteBlock, getBlock } = useBoard(doc);
  const { users, localUser, aiCursor, updateCursor, broadcastVoiceActivity } = useAwareness(provider);

  // AI features
  const {
    isLoading: aiLoading,
    response: aiResponse,
    error: aiError,
    analyze,
    refactor,
    generate,
    modify,
    fixSyntax,
    clearResponse,
  } = useAIAgent();

  // UI state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  // Get selected block
  const selectedBlock = selectedBlockId ? getBlock(selectedBlockId) : null;
  const editingBlock = editingBlockId ? getBlock(editingBlockId) : null;

  // Tool execution context for Gemini Live
  const toolContext: ToolExecutionContext = useMemo(
    () => ({
      addBlock: (code?: string) => {
        const block = addBlock(code);
        return { id: block.id };
      },
      updateBlock: (id: string, updates: { code: string }) => {
        updateBlock(id, updates);
      },
      deleteBlock,
      getBlock: (id: string) => {
        const block = getBlock(id);
        return block ? { id: block.id, code: block.code } : undefined;
      },
      getAllBlocks: () => blocks.map((b) => ({ id: b.id, code: b.code })),
      selectBlock: setSelectedBlockId,
      selectedBlockId,
    }),
    [addBlock, updateBlock, deleteBlock, getBlock, blocks, selectedBlockId]
  );

  // Gemini Live voice integration
  const isGeminiWithVoice =
    settings.provider === "gemini" && settings.geminiVoiceEnabled !== false;

  const {
    sessionState: voiceSessionState,
    isListening: voiceIsListening,
    isSpeaking: voiceIsSpeaking,
    transcript: voiceTranscript,
    error: voiceError,
    connect: connectVoice,
    disconnect: disconnectVoice,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    sendTextMessage: sendVoiceText,
    clearTranscript: clearVoiceTranscript,
  } = useGeminiLive({
    apiKey: settings.apiKey,
    voiceName: settings.geminiVoiceName,
    toolContext,
    onVoiceActivity: broadcastVoiceActivity,
  });

  // Show settings on first load if no API key
  useEffect(() => {
    if (!hasApiKey) {
      setSettingsOpen(true);
    }
  }, [hasApiKey]);

  // Handle adding a new block
  const handleAddBlock = useCallback(
    (position?: Position) => {
      const block = addBlock(undefined, position);
      setSelectedBlockId(block.id);
    },
    [addBlock]
  );

  // Handle adding block with specific code (from AI generation)
  const handleAddBlockWithCode = useCallback(
    (code: string) => {
      const block = addBlock(code);
      setSelectedBlockId(block.id);
    },
    [addBlock]
  );

  // Handle analyzing selected block
  const handleAnalyze = useCallback(() => {
    if (selectedBlock) {
      analyze(selectedBlock.code, boardId);
    }
  }, [selectedBlock, analyze, boardId]);

  // Handle refactoring selected block
  const handleRefactor = useCallback(() => {
    if (selectedBlock) {
      refactor(selectedBlock.code, boardId);
    }
  }, [selectedBlock, refactor, boardId]);

  // Handle applying AI-suggested changes
  const handleApplyPatch = useCallback(
    (mermaid: string) => {
      if (selectedBlockId) {
        updateBlock(selectedBlockId, { code: mermaid });
        clearResponse();
      }
    },
    [selectedBlockId, updateBlock, clearResponse]
  );

  // Handle fix syntax
  const handleFixSyntax = useCallback(
    async (code: string): Promise<string | null> => {
      return fixSyntax(code, boardId);
    },
    [fixSyntax, boardId]
  );

  // Handle generating new diagram
  const handleGenerate = useCallback(
    async (prompt: string): Promise<string | null> => {
      return generate(prompt, boardId);
    },
    [generate, boardId]
  );

  // Handle modifying existing diagram
  const handleModify = useCallback(
    async (mermaid: string, instructions: string): Promise<string | null> => {
      return modify(mermaid, instructions, boardId);
    },
    [modify, boardId]
  );

  // Handle updating block code (for ChatPanel modify flow)
  const handleUpdateBlockCode = useCallback(
    (id: string, code: string) => {
      updateBlock(id, { code });
    },
    [updateBlock]
  );

  // Handle deleting selected block
  const handleDeleteBlock = useCallback(() => {
    if (selectedBlockId) {
      deleteBlock(selectedBlockId);
      setSelectedBlockId(null);
    }
  }, [selectedBlockId, deleteBlock]);

  // Handle block update
  const handleUpdateBlock = useCallback(
    (id: string, updates: Partial<MermaidBlock>) => {
      updateBlock(id, updates);
    },
    [updateBlock]
  );

  // Handle editor code change
  const handleEditorChange = useCallback(
    (code: string) => {
      if (editingBlockId) {
        updateBlock(editingBlockId, { code });
      }
    },
    [editingBlockId, updateBlock]
  );

  return (
    <div className="board-layout">
      <div className="main-content">
        {/* Toolbar */}
        <Toolbar
          boardId={boardId || ""}
          connected={connected}
          hasSelectedBlock={!!selectedBlock}
          isLoading={aiLoading}
          onAddBlock={() => handleAddBlock()}
          onAnalyze={handleAnalyze}
          onRefactor={handleRefactor}
          onOpenSettings={() => setSettingsOpen(true)}
          onDeleteBlock={selectedBlock ? handleDeleteBlock : undefined}
        />

        {/* Presence indicator */}
        <div
          style={{
            position: "absolute",
            top: "var(--toolbar-height)",
            right: "calc(var(--sidebar-width) + 16px)",
            zIndex: 100,
          }}
        >
          <PresenceList users={users} localUser={localUser} />
        </div>

        {/* Canvas */}
        <Canvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onUpdateBlock={handleUpdateBlock}
          onEditBlock={setEditingBlockId}
          onAddBlock={handleAddBlock}
          onFixSyntax={handleFixSyntax}
          users={users}
          aiCursor={aiCursor}
          onCursorMove={updateCursor}
        />

        {/* AI Response panel */}
        {(aiResponse || aiError || aiLoading) && (
          <AIResponse
            response={aiResponse}
            error={aiError}
            isLoading={aiLoading}
            onApplyPatch={selectedBlock ? handleApplyPatch : undefined}
            onClose={clearResponse}
          />
        )}

        {/* Block Editor overlay */}
        {editingBlock && (
          <BlockEditor
            code={editingBlock.code}
            position={{
              x: editingBlock.position.x,
              y: editingBlock.position.y + editingBlock.size.height + 8,
            }}
            onChange={handleEditorChange}
            onClose={() => setEditingBlockId(null)}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        {/* Sidebar tabs for switching between chat and voice */}
        {isGeminiWithVoice && (
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${!showVoicePanel ? "active" : ""}`}
              onClick={() => setShowVoicePanel(false)}
            >
              Chat
            </button>
            <button
              className={`sidebar-tab ${showVoicePanel ? "active" : ""}`}
              onClick={() => setShowVoicePanel(true)}
            >
              Voice
              {voiceSessionState !== "disconnected" && (
                <span className="voice-indicator" />
              )}
            </button>
          </div>
        )}

        {/* Show Voice Panel or Chat Panel */}
        {showVoicePanel && isGeminiWithVoice ? (
          <VoicePanel
            sessionState={voiceSessionState}
            isListening={voiceIsListening}
            isSpeaking={voiceIsSpeaking}
            transcript={voiceTranscript}
            error={voiceError}
            onConnect={connectVoice}
            onDisconnect={disconnectVoice}
            onStartListening={startVoiceListening}
            onStopListening={stopVoiceListening}
            onSendText={sendVoiceText}
            onClearTranscript={clearVoiceTranscript}
          />
        ) : (
          <ChatPanel
            isLoading={aiLoading}
            selectedBlock={selectedBlock || null}
            onGenerate={handleGenerate}
            onModify={handleModify}
            onAddBlock={handleAddBlockWithCode}
            onUpdateBlock={handleUpdateBlockCode}
          />
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
