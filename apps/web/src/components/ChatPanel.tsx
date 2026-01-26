/**
 * ChatPanel Component
 *
 * Side panel for AI commands and chat history
 * Supports both generating new diagrams and modifying selected diagrams
 */

import { useState, useCallback, KeyboardEvent, useRef, useEffect } from "react";
import type { ChatMessage } from "../types";
import type { MermaidBlock } from "@live-canvas/protocols";
import { nanoid } from "nanoid";

interface ChatPanelProps {
  isLoading: boolean;
  selectedBlock: MermaidBlock | null;
  onGenerate: (prompt: string) => Promise<string | null>;
  onModify: (mermaid: string, instructions: string) => Promise<string | null>;
  onAddBlock: (code: string) => void;
  onUpdateBlock: (id: string, code: string) => void;
}

export function ChatPanel({
  isLoading,
  selectedBlock,
  onGenerate,
  onModify,
  onAddBlock,
  onUpdateBlock,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: selectedBlock
        ? `[Modifying selected diagram] ${prompt}`
        : prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    let result: string | null = null;

    if (selectedBlock) {
      // Modify existing diagram
      result = await onModify(selectedBlock.code, prompt);

      if (result) {
        // Update the existing block
        onUpdateBlock(selectedBlock.id, result);

        const assistantMessage: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: "Diagram modified successfully.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: "Failed to modify diagram. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } else {
      // Generate new diagram
      result = await onGenerate(prompt);

      if (result) {
        const assistantMessage: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: "Generated diagram from your description.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Add block to canvas
        onAddBlock(result);
      } else {
        const errorMessage: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: "Failed to generate diagram. Please check your API key and try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  }, [input, isLoading, selectedBlock, onGenerate, onModify, onAddBlock, onUpdateBlock]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Get placeholder and button text based on context
  const placeholder = selectedBlock
    ? "Describe the changes you want to make..."
    : "Describe the diagram you want to create...";

  const buttonText = selectedBlock
    ? isLoading
      ? "Modifying..."
      : "Modify Diagram"
    : isLoading
      ? "Generating..."
      : "Generate Diagram";

  const emptyStateText = selectedBlock
    ? {
        title: "Diagram selected",
        description: 'Describe what changes you want to make, e.g., "Add a database node" or "Change the flow to include error handling"',
      }
    : {
        title: "Describe the diagram you want to create.",
        description: 'Example: "A payment processing system with gateway, processor, and bank integration"',
      };

  return (
    <div className="chat-panel">
      <div className="chat-header">AI Assistant</div>

      {/* Selected block indicator */}
      {selectedBlock && (
        <div className="selected-block-indicator">
          <span className="indicator-icon">&#9998;</span>
          <span className="indicator-text">Editing selected diagram</span>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
              padding: "20px",
            }}
          >
            <p>{emptyStateText.title}</p>
            <p style={{ fontSize: "13px", marginTop: "8px" }}>
              {emptyStateText.description}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isLoading}
        />
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "8px" }}
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
        >
          {isLoading && <span className="spinner" />}
          {buttonText}
        </button>
      </div>
    </div>
  );
}
